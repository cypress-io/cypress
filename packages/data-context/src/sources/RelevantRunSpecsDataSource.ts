import { gql } from '@urql/core'
import { print } from 'graphql'
import debugLib from 'debug'
import { isEqual } from 'lodash'

import type { DataContext } from '../DataContext'
import type { Query, RelevantRun, CurrentProjectRelevantRunSpecs, CloudRun } from '../gen/graphcache-config.gen'
import { Poller } from '../polling'
import type { CloudRunStatus } from '@packages/graphql/src/gen/cloud-source-types.gen'

const debug = debugLib('cypress:data-context:sources:RelevantRunSpecsDataSource')

const RELEVANT_RUN_SPEC_OPERATION_DOC = gql`
  fragment RelevantRunSpecsDataSource_Runs on CloudRun {
    id
    runNumber
    status
    completedInstanceCount
    totalInstanceCount
    totalTests
    scheduledToCompleteAt
  }

  query RelevantRunSpecsDataSource_Specs(
    $projectSlug: String!
    $currentRunNumber: Int!
    $hasCurrent: Boolean!
    $nextRunNumber: Int!
    $hasNext: Boolean!
  ) {
    cloudProjectBySlug(slug: $projectSlug) {
      __typename
      ... on CloudProject {
        id
        current: runByNumber(runNumber: $currentRunNumber) @include(if: $hasCurrent) {
          id
          ...RelevantRunSpecsDataSource_Runs
        }
        next: runByNumber(runNumber: $nextRunNumber) @include(if: $hasNext) {
          id
          ...RelevantRunSpecsDataSource_Runs
        }
      }
    }
    pollingIntervals {
      runByNumber
    }
  }
`
const RELEVANT_RUN_SPEC_UPDATE_OPERATION = print(RELEVANT_RUN_SPEC_OPERATION_DOC)

export const SPECS_EMPTY_RETURN: RunSpecReturn = {
  runSpecs: {},
  statuses: {},
  testCounts: {},
}

export type RunSpecReturn = {
  runSpecs: CurrentProjectRelevantRunSpecs
  statuses: {
    current?: CloudRunStatus
    all?: CloudRunStatus[]
  }
  testCounts: {
    current?: number
    all?: number[]
  }
}

//Not ideal typing for this return since the query is not fetching all the fields, but better than nothing
export type RelevantRunSpecsCloudResult = { cloudProjectBySlug: { __typename?: string, current?: Partial<CloudRun>, next?: Partial<CloudRun> } } & Pick<Query, 'pollingIntervals'>

/**
 * DataSource to encapsulate querying Cypress Cloud for runs that match a list of local Git commit shas
 */
export class RelevantRunSpecsDataSource {
  #pollingInterval: number = 15
  #cached: RunSpecReturn = {
    runSpecs: {},
    statuses: {},
    testCounts: {},
  }

  #poller?: Poller<'relevantRunSpecChange', never>

  constructor (private ctx: DataContext) {}

  get specs () {
    return this.#cached.runSpecs
  }

  /**
   * Pulls the specs that match the relevant run.
   * @param runs - the current and (optionally) next relevant run
   */
  async getRelevantRunSpecs (runs: RelevantRun): Promise<RunSpecReturn> {
    const projectSlug = await this.ctx.project.projectId()

    if (!projectSlug) {
      debug('No project detected')

      return SPECS_EMPTY_RETURN
    }

    debug(`Fetching specs for ${projectSlug} and %o`, runs)

    const result = await this.ctx.cloud.executeRemoteGraphQL<RelevantRunSpecsCloudResult>({
      fieldName: 'cloudProjectBySlug',
      operationDoc: RELEVANT_RUN_SPEC_OPERATION_DOC,
      operation: RELEVANT_RUN_SPEC_UPDATE_OPERATION,
      operationVariables: {
        projectSlug,
        currentRunNumber: runs.current || -1,
        hasCurrent: !!runs.current && runs.current > 0,
      },
      requestPolicy: 'network-only', // we never want to hit local cache for this request
    })

    if (result.error) {
      debug(`Error when fetching relevant runs for current run: %o and all: %o: error -> %s`, runs.current, runs.all, result.error)

      return SPECS_EMPTY_RETURN
    }

    const cloudProject = result.data?.cloudProjectBySlug
    const pollingInterval = result.data?.pollingIntervals?.runByNumber

    debug(`Result returned - type: ${cloudProject?.__typename} pollingInterval: ${pollingInterval}`)

    if (pollingInterval) {
      this.#pollingInterval = pollingInterval
      if (this.#poller) {
        this.#poller.interval = this.#pollingInterval
      }
    }

    function isValidNumber (value: unknown): value is number {
      return Number.isFinite(value)
    }

    if (cloudProject?.__typename !== 'CloudProject') {
      return SPECS_EMPTY_RETURN
    }

    const runSpecsToReturn: RunSpecReturn = {
      runSpecs: {},
      statuses: {},
      testCounts: {},
    }

    const { current } = cloudProject

    const formatCloudRunInfo = (cloudRunDetails: Partial<CloudRun>) => {
      const { runNumber, totalInstanceCount, completedInstanceCount } = cloudRunDetails

      if (runNumber && isValidNumber(totalInstanceCount) && isValidNumber(completedInstanceCount)) {
        return {
          totalSpecs: totalInstanceCount,
          completedSpecs: completedInstanceCount,
          runNumber,
          scheduledToCompleteAt: cloudRunDetails.scheduledToCompleteAt,
        }
      }

      return undefined
    }

    if (current && current.status && current.totalTests !== null) {
      runSpecsToReturn.runSpecs.current = formatCloudRunInfo(current)
      runSpecsToReturn.statuses.current = current.status
      runSpecsToReturn.testCounts.current = current.totalTests
    }

    // if (next && next.status && next.totalTests !== null) {
    //   runSpecsToReturn.runSpecs.next = formatCloudRunInfo(next)
    //   runSpecsToReturn.statuses.next = next.status
    //   runSpecsToReturn.testCounts.next = next.totalTests
    // }

    return runSpecsToReturn
  }

  pollForSpecs () {
    debug(`pollForSpecs called`)
    //TODO Get spec counts before poll starts
    if (!this.#poller) {
      this.#poller = new Poller(this.ctx, 'relevantRunSpecChange', this.#pollingInterval, async () => {
        const runs = this.ctx.relevantRuns.runs

        debug('Polling for specs for runs %o', runs)

        if (!runs.current) {
          return
        }

        const specs = await this.getRelevantRunSpecs(runs)

        debug(`Spec data is `, specs)

        const wasWatchingCurrentProject = this.#cached.statuses.current === 'RUNNING'
        const specInfoChanged = !isEqual(specs.runSpecs, this.#cached.runSpecs)
        const statusesChanged = !isEqual(specs.statuses, this.#cached.statuses)
        const testCountsChanged = !isEqual(specs.testCounts, this.#cached.testCounts)

        this.#cached = specs

        //only emit a new value if it changes
        if (specInfoChanged) {
          debug('Spec info changed')
          this.ctx.emitter.relevantRunSpecChange()
        }

        //if statuses change, then let debug page know to refresh runs
        if (statusesChanged || testCountsChanged) {
          debug(`Watched values changed: statuses[${statusesChanged}] testCounts[${testCountsChanged}]`)
          const projectSlug = await this.ctx.project.projectId()

          if (projectSlug && wasWatchingCurrentProject) {
            debug(`Invalidate cloudProjectBySlug ${projectSlug}`)
            await this.ctx.cloud.invalidate('Query', 'cloudProjectBySlug', { slug: projectSlug })
          }

          if (statusesChanged) {
            //statuses changed so make sure to check relevant runs again
            //this would happen automatically the next time the RelevantRunsDataSource
            //poll occurs, but could result in an out-of-sync state until then
            await this.ctx.relevantRuns.checkRelevantRuns(this.ctx.git?.currentHashes || [])
          } else {
            //if statuses did not change, no need to recheck the relevant runs
            //just emit the ones we already have
            this.ctx.emitter.relevantRunChange(runs)
          }
        }
      })
    }

    return this.#poller.start()
  }
}
