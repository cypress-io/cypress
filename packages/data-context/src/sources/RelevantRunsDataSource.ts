import { gql } from '@urql/core'
import { print } from 'graphql'
import debugLib from 'debug'
import { isEqual } from 'lodash'

import type { DataContext } from '../DataContext'
import type { Query, RelevantRun, RelevantRunInfo, RelevantRunLocationEnum } from '../gen/graphcache-config.gen'
import { Poller } from '../polling'
import type { CloudRun } from '@packages/graphql/src/gen/cloud-source-types.gen'

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

export const RUNS_EMPTY_RETURN: RelevantRun = { commitsAhead: -1, all: [] }

/**
 * DataSource to encapsulate querying Cypress Cloud for runs that match a list of local Git commit shas
 */
export class RelevantRunsDataSource {
  #pollingInterval: number = 30
  #cachedRuns: RelevantRun = RUNS_EMPTY_RETURN

  /**
   * All runs that are currently RUNNING.
   * We poll these every N seconds in RelevantRunSpecsDataSource, and remove
   * the runNumber from the set once it is no longer RUNNING.
   */
  runningRuns: Set<number> = new Set()

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
  async getRelevantRuns (shas: string[]): Promise<RelevantRun> {
    if (shas.length === 0) {
      debug('Called with no shas')

      return RUNS_EMPTY_RETURN
    }

    const projectSlug = await this.ctx.project.projectId()

    if (!projectSlug) {
      debug('No project detected')

      return RUNS_EMPTY_RETURN
    }

    debug(`Fetching runs for ${projectSlug} and ${shas.length} shas. shas are %o`, shas)

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

    if (cloudProject?.__typename !== 'CloudProject') {
      debug('Returning empty')

      return RUNS_EMPTY_RETURN
    }

    type SimpleRun = Required<Pick<CloudRun, 'runNumber' | 'status'>>

    const runs = (cloudProject.runsByCommitShas ?? []).reduce<SimpleRun[]>((acc, run) => {
      if (run?.runNumber && run?.status && run.commitInfo?.sha) {
        return acc.concat({
          runNumber: run.runNumber,
          status: run.status,
        })
      }

      return acc
    }, [])

    debug(`Found ${runs.length} runs for ${projectSlug} and ${shas.length} shas. Runs %o`, runs)

    const latestRun = cloudProject.runsByCommitShas?.[0] ?? undefined

    let allRuns: Array<RelevantRunInfo> = []

    let foundAllRelevantRuns = false

    for (const run of cloudProject.runsByCommitShas ?? []) {
      if (foundAllRelevantRuns) {
        continue
      }

      if (!run || !run?.runNumber || !run?.commitInfo?.sha) {
        continue
      }

      if (!allRuns.find((x) => x.sha)) {
        allRuns.push({
          sha: run.commitInfo.sha,
          runNumber: run.runNumber,
        })
      }

      if (run.status !== 'RUNNING') {
        foundAllRelevantRuns = true
      }
    }

    const commitsAhead = latestRun?.commitInfo?.sha ? shas.indexOf(latestRun.commitInfo.sha) : -1

    debug(`Current run: %o next run: %o current commit sha: %s commitsHead: %o`, latestRun, commitsAhead)

    debug('All runs %o', allRuns)

    return {
      commitsAhead,
      all: allRuns,
    }
  }

  /**
   * Wraps the call to `getRelevantRuns` and allows for control of the cached values as well as
   * emitting a `relevantRunChange` event if the new values differ from the cached values.  This is
   * used by the poller created in the `pollForRuns` method as well as when a Git branch change is detected
   * @param shas string[] - list of Git commit shas to use to query Cypress Cloud for runs
   */
  async checkRelevantRuns (shas: string[]) {
    const runs = await this.getRelevantRuns(shas)

    debug(`got relevant runs: %o`, runs)

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
        await this.checkRelevantRuns(this.ctx.git?.currentHashes || [])
      })
    }

    return this.#runsPoller.start({ initialValue: this.#cachedRuns, meta: { name: location } })
  }
}
