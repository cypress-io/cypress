import { gql } from '@urql/core'
import { print } from 'graphql'
import debugLib from 'debug'
import { compact, isEqual } from 'lodash'

import type { DataContext } from '../DataContext'
import type { Query, RelevantRun, RelevantRunLocationEnum } from '../gen/graphcache-config.gen'
import { Poller } from '../polling'

const debug = debugLib('cypress:data-context:sources:RelevantRunsDataSource')

const RELEVANT_RUN_OPERATION_DOC = gql`
  query RelevantRunsDataSource_RunsByCommitShas(
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

export const RUNS_EMPTY_RETURN: RelevantRun = { current: undefined, next: undefined, commitsAhead: -1, all: [] }


/**
 * DataSource to encapsulate querying Cypress Cloud for runs that match a list of local Git commit shas
 */
export class RelevantRunsDataSource {
  #pollingInterval: number = 30
  #currentRun?: number
  #currentCommitSha?: string
  #cachedRuns: RelevantRun = RUNS_EMPTY_RETURN

  #runsPoller?: Poller<'relevantRunChange', { name: RelevantRunLocationEnum}>

  constructor (private ctx: DataContext) {}

  get runs () {
    return this.#cachedRuns
  }

  /**
   * Pulls runs from the current Cypress Cloud account and determines which runs are considered:
   * - "current" the most recent completed run, or if not found, the most recent running run
   * - "next" the most recent running run if a completed run is found
   * @param shas list of Git commit shas to query the Cloud with for matching runs
   * @param preserveCurrentRun [default false] if true, will attempt to keep the current cached run
   */
  async getRelevantRuns (shas: string[], preserveCurrentRun: boolean = false): Promise<RelevantRun> {
    if (shas.length === 0) {
      debug('Called with no shas')

      return RUNS_EMPTY_RETURN
    }

    const projectSlug = await this.ctx.project.projectId()

    if (!projectSlug) {
      debug('No project detected')

      return RUNS_EMPTY_RETURN
    }

    debug(`Fetching runs for ${projectSlug} and ${shas.length} shas`)

    //Not ideal typing for this return since the query is not fetching all the fields, but better than nothing
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

    if (result.error) {
      debug(`Error fetching relevant runs for project ${projectSlug}`, result.error)

      return RUNS_EMPTY_RETURN
    }

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

      const currentCachedRun = compactedRuns.find((run) => run.runNumber === this.#currentRun)
      const hasStoredCurrentRunThatIsStillValid = currentCachedRun !== undefined

      //Using lodash chain here to allow for lazy evaluation of the array that will return the `first` match quickly
      const firstNonRunningRun = compactedRuns.find((run) => run.status !== 'RUNNING')
      const firstRunningRun = compactedRuns[0]?.status === 'RUNNING' ? compactedRuns[0] : undefined

      const shouldCurrentCachedRunBePreserved = preserveCurrentRun
      || hasStoredCurrentRunThatIsStillValid && (currentCachedRun.status === 'RUNNING' || firstNonRunningRun !== undefined && currentCachedRun.runNumber > firstNonRunningRun?.runNumber)

      let currentRun
      let nextRun

      if (shouldCurrentCachedRunBePreserved) {
        // continue to use the cached current run
        // the next run is the first running run if it exists or the firstNonRunningRun
        currentRun = this.#currentRun
        if (firstRunningRun?.runNumber !== currentRun) {
          nextRun = firstRunningRun?.runNumber
        }

        if (!nextRun && firstNonRunningRun?.runNumber !== currentRun) {
          nextRun = firstNonRunningRun?.runNumber
        }
      } else if (firstNonRunningRun) {
        // if a non running run is found
        // use it as the current run
        // the next run is the first running run if it exists
        currentRun = firstNonRunningRun.runNumber
        nextRun = firstRunningRun?.runNumber
      } else if (firstRunningRun) {
        // if no non running run is found, and a first running run is found
        // use it as the current run
        // the next run will not be set
        currentRun = firstRunningRun.runNumber
        nextRun = undefined
      }

      let allRuns: string[] = ["fea0b14c3902050ee7962a60e01b0d53d336d589", "f5a499232263f6e6a6aac77ce05ea09cf4b4aad8"]

      // let foundAllRelevantRuns = false

      // for (const run of cloudProject.runsByCommitShas ?? []) {
      //   if (foundAllRelevantRuns) {
      //     continue
      //   }

      //   if (!run || !run?.commitInfo?.sha) {
      //     continue
      //   }

      //   if (run.status === 'RUNNING') {
      //     allRuns.push(run.commitInfo.sha)
      //   } else {
      //     allRuns.push(run.commitInfo.sha)
      //     foundAllRelevantRuns = true
      //   }
      // }

      //cache the current run
      this.#currentRun = currentRun

      this.#currentCommitSha = compactedRuns.find((run) => run.runNumber === this.#currentRun)?.commitSha
      const commitsAhead = shas.indexOf(this.#currentCommitSha || '')

      debug(`Current run: ${currentRun} next run: ${nextRun} current commit sha: ${this.#currentCommitSha} commitsHead: ${commitsAhead}`)

      return {
        current: currentRun,
        next: nextRun,
        commitsAhead,
        all: allRuns,
      }
    }

    debug('Returning empty')

    return RUNS_EMPTY_RETURN
  }

  /**
   * Clear the cached current run to allow the data source to pick the next completed run as the current
   */
  async moveToRun (runNumber: number, shas: string[]) {
    debug('Moving to next relevant run')

    await this.checkRelevantRuns(shas, true, runNumber)
  }

  /**
   * Wraps the call to `getRelevantRuns` and allows for control of the cached values as well as
   * emitting a `relevantRunChange` event if the new values differ from the cached values.  This is
   * used by the poller created in the `pollForRuns` method as well as when a Git branch change is detected
   * @param shas string[] - list of Git commit shas to use to query Cypress Cloud for runs
   * @param preserveCurrentRun [default false] if true, will attempt to keep the current cached run
   * @param attemptedRunNumber number - if passed, will set the current run number to that explicit value
   */
  async checkRelevantRuns (shas: string[], preserveCurrentRun: boolean = false, attemptedRunNumber: number | undefined = undefined) {
    debug(`check relevant runs with ${shas.length} shas and clear cache set to ${preserveCurrentRun}`)
    if (attemptedRunNumber) {
      this.#currentRun = attemptedRunNumber
    }

    const runs = await this.getRelevantRuns(shas, preserveCurrentRun)

    //only emit a new value if it changes
    if (!isEqual(runs, this.#cachedRuns)) {
      debug('Runs changed %o', runs)
      this.#cachedRuns = runs
      this.ctx.emitter.relevantRunChange(runs)
    }
  }

  pollForRuns (location: RelevantRunLocationEnum) {
    if (!this.#runsPoller) {
      this.#runsPoller = new Poller<'relevantRunChange', { name: RelevantRunLocationEnum }>(this.ctx, 'relevantRunChange', this.#pollingInterval, async () => {
        // clear the cached run if there is not a current subscription from the DEBUG page
        const preserveCurrentRun = this.#runsPoller?.subscriptions.some((sub) => sub.meta?.name === 'DEBUG')

        await this.checkRelevantRuns(this.ctx.git?.currentHashes || [], preserveCurrentRun)
      })
    }

    return this.#runsPoller.start({ initialValue: this.#cachedRuns, meta: { name: location } })
  }
}
