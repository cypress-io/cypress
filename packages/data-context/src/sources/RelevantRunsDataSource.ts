import { gql } from '@urql/core'
import { print } from 'graphql'
import debugLib from 'debug'
import { chain, compact, isEqual } from 'lodash'

import type { DataContext } from '../DataContext'
import type { Query, RelevantRun } from '../gen/graphcache-config.gen'
import { Poller } from '../polling'

const debug = debugLib('cypress:data-context:sources:RelevantRunsDataSource')

const RELEVANT_RUN_OPERATION_DOC = gql`
  query RelevantRunsDataSource_latestRunUpdateSpecData(
    $projectSlug: String!
    $shas: [String!]!
  ) {
    cloudProjectBySlug(slug: $projectSlug) {
      __typename
      ... on CloudProject {
        id
        runsByCommitShas(commitShas: $shas, runLimit: 100) {
          id
          runNumber
          status
          commitInfo {
            sha
          }
        }
      }
    }
    pollingIntervals {
      runsByCommitShas
    }
  }
`
const RELEVANT_RUN_UPDATE_OPERATION = print(RELEVANT_RUN_OPERATION_DOC)

export const EMPTY_RETURN: RelevantRun = { current: undefined, next: undefined, commitsAhead: -1 }

/**
 * DataSource to encapsulate querying Cypress Cloud for runs that match a list of local Git commit shas
 */
export class RelevantRunsDataSource {
  #pollingInterval: number = 30
  #currentRun?: number
  #currentCommitSha?: string
  #cachedRuns: RelevantRun = EMPTY_RETURN

  #runsPoller?: Poller<'relevantRunChange'>

  constructor (private ctx: DataContext) {}

  get runs () {
    return this.#cachedRuns
  }

  /**
   * Pulls runs from the current Cypress Cloud account and determines which runs are considered:
   * - "current" the most recent completed run, or if not found, the most recent running run
   * - "next" the most recent running run if a completed run is found
   * @param shas list of Git commit shas to query the Cloud with for matching runs
   */
  async getRelevantRuns (shas: string[]): Promise<RelevantRun> {
    if (shas.length === 0) {
      debug('Called with no shas')

      return EMPTY_RETURN
    }

    const projectSlug = await this.ctx.project.projectId()

    if (!projectSlug) {
      debug('No project detected')

      return EMPTY_RETURN
    }

    debug(`Fetching runs for ${projectSlug} and ${shas.length} shas`)

    const result = await this.ctx.cloud.executeRemoteGraphQL<Pick<Query, 'cloudProjectBySlug'> & Pick<Query, 'pollingIntervals'>>({
      fieldName: 'cloudProjectBySlug',
      operationDoc: RELEVANT_RUN_OPERATION_DOC,
      operation: RELEVANT_RUN_UPDATE_OPERATION,
      operationVariables: {
        projectSlug,
        shas,
      },
      requestPolicy: 'network-only', // we never want to hit local cache for this request
    })

    const cloudProject = result.data?.cloudProjectBySlug
    const pollingInterval = result.data?.pollingIntervals?.runsByCommitShas

    debug(`Result returned - type: ${cloudProject?.__typename} pollingInterval: ${pollingInterval}`)

    if (pollingInterval) {
      this.#pollingInterval = pollingInterval
      if (this.#runsPoller) {
        this.#runsPoller.interval = this.#pollingInterval
      }
    }

    if (cloudProject?.__typename === 'CloudProject') {
      const runs = cloudProject.runsByCommitShas?.map((run) => {
        if (run?.runNumber && run?.status && run.commitInfo?.sha) {
          return {
            runNumber: run.runNumber,
            status: run.status,
            commitSha: run.commitInfo.sha,
          }
        }

        return undefined
      }) || []

      const compactedRuns = compact(runs)

      debug(`Found ${compactedRuns.length} runs for ${projectSlug} and ${shas.length} shas`)

      const hasStoredCurrentRunThatIsStillValid = this.#currentRun !== undefined && compactedRuns.some((run) => run.runNumber === this.#currentRun)

      //Using lodash chain here to allow for lazy evaluation of the array that will return the `first` match quickly
      const firstNonRunningRun = chain(compactedRuns).filter((run) => run.status !== 'RUNNING').map((run) => run.runNumber).first().value()
      const firstRunningRun = compactedRuns[0]?.status === 'RUNNING' ? compactedRuns[0].runNumber : undefined

      let currentRun
      let nextRun

      if (hasStoredCurrentRunThatIsStillValid) {
        // continue to use the cached current run
        // the next run is the first running run if it exists or the firstNonRunningRun
        currentRun = this.#currentRun
        nextRun = firstRunningRun
        if (!nextRun && firstNonRunningRun !== currentRun) {
          nextRun = firstNonRunningRun
        }
      } else if (firstNonRunningRun) {
        // if a non running run is found
        // use it as the current run
        // the next run is the first running run if it exists
        currentRun = firstNonRunningRun
        nextRun = firstRunningRun
      } else if (firstRunningRun) {
        // if no non running run is found, and a first running run is found
        // use it as the current run
        // the next run will not be set
        currentRun = firstRunningRun
        nextRun = undefined
      }

      //cache the current run
      this.#currentRun = currentRun

      this.#currentCommitSha = compactedRuns.find((run) => run.runNumber === this.#currentRun)?.commitSha
      const commitsAhead = shas.indexOf(this.#currentCommitSha || '')

      debug(`Current commit sha: ${this.#currentCommitSha} commitsBehind: ${commitsAhead}`)

      return {
        current: currentRun,
        next: nextRun,
        commitsAhead,
      }
    }

    return EMPTY_RETURN
  }

  /**
   * Clear the cached current run to allow the data source to pick the next completed run as the current
   */
  moveToNext () {
    debug('Moving to next relevant run')
    this.#currentRun = undefined
    this.#currentCommitSha = undefined

    return this.getRelevantRuns(this.ctx.git?.currentHashes || [])
  }

  pollForRuns () {
    if (!this.#runsPoller) {
      this.#runsPoller = new Poller(this.ctx, 'relevantRunChange', this.#pollingInterval, async () => {
        const runs = await this.getRelevantRuns(this.ctx.git?.currentHashes || [])

        //only emit a new value if it changes
        if (!isEqual(runs, this.#cachedRuns)) {
          this.#cachedRuns = runs
          this.ctx.emitter.relevantRunChange(runs)
        }
      })
    }

    return this.#runsPoller.start(this.#cachedRuns)
  }
}
