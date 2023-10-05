import { gql } from '@urql/core'
import debugLib from 'debug'
import { isEqual, take, takeWhile } from 'lodash'

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
          totalFailed
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

export const RUNS_EMPTY_RETURN: RelevantRun = { commitsAhead: -1, all: [], latest: [] }

/**
 * DataSource to encapsulate querying Cypress Cloud for runs that match a list of local Git commit shas
 */
export class RelevantRunsDataSource {
  #pollingInterval: number = 30
  #cached: RelevantRun = RUNS_EMPTY_RETURN

  #runsPoller?: Poller<'relevantRunChange', RelevantRun, { name: RelevantRunLocationEnum}>

  constructor (private ctx: DataContext) {}

  get cache () {
    return this.#cached
  }

  /**
   * Pulls runs from the current Cypress Cloud account and determines which runs are considered:
   * - "current" the most recent completed run, or if not found, the most recent running run
   * - "next" the most recent running run if a completed run is found
   * @param shas list of Git commit shas to query the Cloud with for matching runs
   * @param preserveCurrentRun [default false] if true, will attempt to keep the current cached run
   */
  async getRelevantRuns (shas: string[]): Promise<RelevantRunInfo[]> {
    if (shas.length === 0) {
      debug('Called with no shas')

      return []
    }

    const projectSlug = await this.ctx.project.projectId()

    if (!projectSlug) {
      debug('No project detected')

      return []
    }

    debug(`Fetching runs for ${projectSlug} and ${shas.length} shas`)

    //Not ideal typing for this return since the query is not fetching all the fields, but better than nothing
    const result = await this.ctx.cloud.executeRemoteGraphQL<Pick<Query, 'cloudProjectBySlug'> & Pick<Query, 'pollingIntervals'>>({
      fieldName: 'cloudProjectBySlug',
      operationDoc: RELEVANT_RUN_OPERATION_DOC,
      operationVariables: {
        projectSlug,
        shas,
      },
      requestPolicy: 'network-only', // we never want to hit local cache for this request
    })

    if (result.error) {
      debug(`Error fetching relevant runs for project ${projectSlug}`, result.error)

      return []
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

      return []
    }

    const runs = cloudProject.runsByCommitShas?.filter((run): run is CloudRun => {
      return run != null && !!run.runNumber && !!run.status && !!run.commitInfo?.sha
    }).map((run): RelevantRunInfo => {
      return {
        runId: run.id,
        runNumber: run.runNumber!,
        status: run.status!,
        sha: run.commitInfo?.sha!,
        totalFailed: run.totalFailed || 0,
      }
    }) || []

    debug(`Found ${runs.length} runs for ${projectSlug} and ${shas.length} shas. Runs %o`, runs)

    return runs
  }

  /**
   * Clear the cached current run to allow the data source to pick the next completed run as the current
   */
  async moveToRun (runNumber: number, shas: string[]) {
    debug('Moving to next relevant run')

    const run = this.#cached.all.find((run) => run.runNumber === runNumber)

    if (run) {
      //filter relevant runs in case moving causes the previously selected run to no longer be relevant
      const relevantRuns = this.#takeRelevantRuns(this.#cached.all)
      const latestRuns = this.#cached.latest

      await this.#emitRelevantRunsIfChanged({ relevantRuns, selectedRun: run, shas, latestRuns })
    }
  }

  #calculateSelectedRun (runs: RelevantRunInfo[], shas: string[], preserveSelectedRun: boolean) {
    let selectedRun
    const firstNonRunningRun = runs.find((run) => run.status !== 'RUNNING')
    const firstRun = runs[0]

    if (this.#cached.selectedRunNumber) {
      selectedRun = runs.find((run) => run.runNumber === this.#cached.selectedRunNumber)

      const selectedRunIsOlderShaThanLatest = selectedRun && firstNonRunningRun && shas.indexOf(selectedRun?.sha) > shas.indexOf(firstNonRunningRun?.sha)

      debug('selected run check: run %o', selectedRun, selectedRunIsOlderShaThanLatest, preserveSelectedRun)
      if (selectedRunIsOlderShaThanLatest && !preserveSelectedRun) {
        selectedRun = firstNonRunningRun
      }
    } else if (firstNonRunningRun) {
      selectedRun = firstNonRunningRun
    } else if (firstRun) {
      selectedRun = firstRun
    }

    return selectedRun
  }

  /**
   * Wraps the call to `getRelevantRuns` and allows for control of the cached values as well as
   * emitting a `relevantRunChange` event if the new values differ from the cached values.  This is
   * used by the poller created in the `pollForRuns` method as well as when a Git branch change is detected
   * @param shas string[] - list of Git commit shas to use to query Cypress Cloud for runs
   */
  async checkRelevantRuns (shas: string[], preserveSelectedRun: boolean = false) {
    const runs = await this.getRelevantRuns(shas)

    const selectedRun = this.#calculateSelectedRun(runs, shas, preserveSelectedRun)

    const relevantRuns: RelevantRunInfo[] = this.#takeRelevantRuns(runs)

    const latestRuns: RelevantRunInfo[] = this.#takeLatestRuns(runs)

    // If there is a selected run that is no longer considered relevant,
    // make sure to still add it to the list of runs
    const selectedRunNumber = selectedRun?.runNumber
    const relevantRunsHasSelectedRun = relevantRuns.some((run) => run.runNumber === selectedRunNumber)
    const allRunsHasSelectedRun = runs.some((run) => run.runNumber === selectedRunNumber)

    debug('readd selected run check', selectedRunNumber, relevantRunsHasSelectedRun, allRunsHasSelectedRun)
    if (selectedRunNumber && allRunsHasSelectedRun && !relevantRunsHasSelectedRun) {
      const selectedRun = runs.find((run) => run.runNumber === selectedRunNumber)

      if (selectedRun) {
        relevantRuns.push(selectedRun)
      }
    }

    await this.#emitRelevantRunsIfChanged({ relevantRuns, selectedRun, shas, latestRuns })
  }

  #takeRelevantRuns (runs: RelevantRunInfo[]) {
    let firstShaWithCompletedRun: string

    const relevantRuns: RelevantRunInfo[] = takeWhile(runs, (run) => {
      if (firstShaWithCompletedRun === undefined && run.status !== 'RUNNING') {
        firstShaWithCompletedRun = run.sha
      }

      return run.status === 'RUNNING' || run.sha === firstShaWithCompletedRun
    })

    debug('relevant runs after take', relevantRuns)

    return relevantRuns
  }

  #takeLatestRuns (runs: RelevantRunInfo[]) {
    const latestRuns = take(runs, 100)

    debug('latest runs after take', latestRuns)

    return latestRuns
  }

  async #emitRelevantRunsIfChanged ({ relevantRuns, selectedRun, shas, latestRuns }: {
    relevantRuns: RelevantRunInfo[]
    selectedRun: RelevantRunInfo | undefined
    shas: string[]
    latestRuns: RelevantRunInfo[]
  }) {
    const commitsAhead = selectedRun?.sha ? shas.indexOf(selectedRun.sha) : -1

    const toCache: RelevantRun = {
      all: relevantRuns,
      latest: latestRuns,
      commitsAhead,
      selectedRunNumber: selectedRun?.runNumber,
    }

    if (this.ctx.git?.currentCommitInfo) {
      toCache.currentCommitInfo = {
        sha: this.ctx.git.currentCommitInfo.hash,
        message: this.ctx.git.currentCommitInfo.message,
      }

      debug('Setting current commit info %o', toCache.currentCommitInfo)
    }

    debug(`New values %o`, toCache)

    //only emit a new value if something changes
    if (!isEqual(toCache, this.#cached)) {
      debug('Values changed')

      debug('current cache: %o, new values: %o', this.#cached, toCache)

      //TODO is the right thing to invalidate?  Can we just invalidate the runsByCommitShas field?
      const projectSlug = await this.ctx.project.projectId()

      await this.ctx.cloud.invalidate('Query', 'cloudProjectBySlug', { slug: projectSlug })

      // If the cache is empty, then we're just starting up. Don't send notifications
      if (this.#cached.all[0] && toCache.all[0] && !isEqual(toCache.all[0], this.#cached.all[0])) {
        this.ctx.actions.notification.maybeSendRunNotification(this.#cached.all[0], toCache.all[0])
      }

      this.#cached = {
        ...toCache,
      }

      this.ctx.emitter.relevantRunChange(this.#cached)
    }
  }

  pollForRuns (location: RelevantRunLocationEnum) {
    if (!this.#runsPoller) {
      this.#runsPoller = new Poller<'relevantRunChange', RelevantRun, { name: RelevantRunLocationEnum }>(this.ctx, 'relevantRunChange', this.#pollingInterval, async (subscriptions) => {
        const preserveSelectedRun = subscriptions.some((sub) => sub.meta?.name === 'DEBUG')

        await this.checkRelevantRuns(this.ctx.git?.currentHashes || [], preserveSelectedRun)
      })
    }

    return this.#runsPoller.start({ initialValue: this.#cached, meta: { name: location } })
  }
}
