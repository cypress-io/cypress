import { gql } from '@urql/core'
import { print } from 'graphql'
import debugLib from 'debug'
import { isEqual, takeWhile } from 'lodash'

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

  #runsPoller?: Poller<'relevantRunChange', RelevantRun, { name: RelevantRunLocationEnum}>

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
      operation: RELEVANT_RUN_UPDATE_OPERATION,
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
    }).map((run) => {
      return {
        runNumber: run.runNumber!,
        status: run.status!,
        sha: run.commitInfo?.sha!,
      }
    }) || []

    debug(`Found ${runs.length} runs for ${projectSlug} and ${shas.length} shas. Runs %o`, runs)

    let firstShaWithCompletedRun: string

    const relevantRuns: RelevantRunInfo[] = takeWhile(runs, (run) => {
      if (firstShaWithCompletedRun === undefined && run.status !== 'RUNNING') {
        firstShaWithCompletedRun = run.sha
      }

      return run.status === 'RUNNING' || run.sha === firstShaWithCompletedRun
    })

    // If there is a selected run that is no longer considered relevant,
    // make sure to still add it to the list of run
    const selectedRunNumber = this.#cachedRuns.selectedRunNumber
    const relevantRunsHasSelectedRun = relevantRuns.some((run) => run.runNumber === selectedRunNumber)
    const allRunsHasSelectedRun = runs.some((run) => run.runNumber === selectedRunNumber)

    if (selectedRunNumber && allRunsHasSelectedRun && !relevantRunsHasSelectedRun) {
      const selectedRun = runs.find((run) => run.runNumber === selectedRunNumber)

      if (selectedRun) {
        relevantRuns.push(selectedRun)
      }
    }

    debug('All runs %o', relevantRuns)

    return relevantRuns
  }

  /**
   * Clear the cached current run to allow the data source to pick the next completed run as the current
   */
  async moveToRun (runNumber: number, shas: string[]) {
    debug('Moving to next relevant run')

    const isValidRunNumber = this.#cachedRuns.all.some((run) => run.runNumber === runNumber)

    if (isValidRunNumber) {
      this.#cachedRuns = {
        ...this.#cachedRuns,
        selectedRunNumber: runNumber,
      }
    }

    await this.checkRelevantRuns(shas, true)
  }

  /**
   * Wraps the call to `getRelevantRuns` and allows for control of the cached values as well as
   * emitting a `relevantRunChange` event if the new values differ from the cached values.  This is
   * used by the poller created in the `pollForRuns` method as well as when a Git branch change is detected
   * @param shas string[] - list of Git commit shas to use to query Cypress Cloud for runs
   */
  async checkRelevantRuns (shas: string[], preserveSelectedRun: boolean = false) {
    const runs = await this.getRelevantRuns(shas)

    let selectedRun
    const firstNonRunningRun = runs.find((run) => run.status !== 'RUNNING')
    const firstRun = runs[0]

    if (this.#cachedRuns.selectedRunNumber) {
      selectedRun = runs.find((run) => run.runNumber === this.#cachedRuns.selectedRunNumber)

      const selectedRunIsOlderShaThanLatest = selectedRun && firstNonRunningRun && shas.indexOf(selectedRun?.sha) > shas.indexOf(firstNonRunningRun?.sha)

      if (selectedRunIsOlderShaThanLatest && !preserveSelectedRun) {
        selectedRun = firstNonRunningRun
      }
    } else if (firstNonRunningRun) {
      selectedRun = firstNonRunningRun
    } else if (firstRun) {
      selectedRun = firstRun
    }

    const commitsAhead = selectedRun?.sha ? shas.indexOf(selectedRun.sha) : -1

    debug(`Selected run: %o commitsHead: %o`, selectedRun, commitsAhead)

    //only emit a new value if it changes
    if (!isEqual(runs, this.#cachedRuns)) {
      debug('Runs changed %o', runs)

      //TODO is the right thing to invalidate?  Can we just invalidate the runsByCommitShas field?
      const projectSlug = await this.ctx.project.projectId()

      await this.ctx.cloud.invalidate('Query', 'cloudProjectBySlug', { slug: projectSlug })

      this.#cachedRuns = {
        all: runs,
        commitsAhead,
        selectedRunNumber: selectedRun?.runNumber,
      }

      this.ctx.emitter.relevantRunChange(this.#cachedRuns)
    }
  }

  pollForRuns (location: RelevantRunLocationEnum) {
    if (!this.#runsPoller) {
      this.#runsPoller = new Poller<'relevantRunChange', RelevantRun, { name: RelevantRunLocationEnum }>(this.ctx, 'relevantRunChange', this.#pollingInterval, async (subscriptions) => {
        const preserveSelectedRun = subscriptions.some((sub) => sub.meta?.name === 'DEBUG')

        await this.checkRelevantRuns(this.ctx.git?.currentHashes || [], preserveSelectedRun)
      })
    }

    return this.#runsPoller.start({ initialValue: this.#cachedRuns, meta: { name: location } })
  }
}
