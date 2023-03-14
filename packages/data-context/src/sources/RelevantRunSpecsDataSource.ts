import { gql } from '@urql/core'
import { print } from 'graphql'
import debugLib from 'debug'

import type { DataContext } from '../DataContext'
import type { Query, CloudRun, RelevantRunSpecs } from '../gen/graphcache-config.gen'
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
    $commitShas: [String!]!
    $hasRuns: Boolean!
  ) {
    cloudProjectBySlug(slug: $projectSlug) {
      __typename
      ... on CloudProject {
        id
        runsByCommitShas(commitShas: $commitShas) @include(if: $hasRuns) {
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
  // runSpecs: {
  // },
  // statuses: {},
  // testCounts: {},
}

export type RunSpecReturn = {
  runSpecs?: RelevantRunSpecs
  status?: CloudRunStatus
  // testCounts?: number
}

// RelevantRunSpecsDataSource_Runs
//Not ideal typing for this return since the query is not fetching all the fields, but better than nothing
export type RelevantRunSpecsCloudResult = {
  cloudProjectBySlug: {
    __typename?: string
    runsByCommitShas?: (
      Array<Partial<CloudRun & Partial<{
        id: string
        runNumber: number
        status: CloudRunStatus
        completedInstanceCount: number
        totalInstanceCount: number
        totalTests: number
        scheduledToCompleteAt: number

      }>>>
    )
  }
} & Pick<Query, 'pollingIntervals'>

/**
 * DataSource to encapsulate querying Cypress Cloud for runs that match a list of local Git commit shas
 */
export class RelevantRunSpecsDataSource {
  #pollingInterval: number = 15
  #cached = new Map<number, RunSpecReturn>()

  #poller?: Poller<'relevantRunSpecChange', never>

  constructor (private ctx: DataContext) {}

  specs (runNumber: number): RunSpecReturn {
    return this.#cached.get(runNumber) ?? {
      // runSpecs: CurrentProjectRelevantRunSpecs
      // statuses: {
      //   current?: CloudRunStatus
      //   all?: CloudRunStatus[]
      // }
      // testCounts: {
      //   current?: number
      //   all?: number[]
      // }
    }
  }

  /**
   * Pulls the specs that matches a set of runs.
   * @param runs - array of shas to poll for.
   * TODO: This should be runNumbers, but we cannot query for multiple runNumbers.
   * TODO: Add that to cloud? Or, for loop on runNumber($runNumber) ...
   */
  async getRelevantRunSpecs (runShas: string[]): Promise<void> {
    const projectSlug = await this.ctx.project.projectId()

    if (!projectSlug) {
      debug('No project detected')

      return
      // return SPECS_EMPTY_RETURN
    }

    debug(`Fetching specs for ${projectSlug} and %o`, runShas)

    const result = await this.ctx.cloud.executeRemoteGraphQL<RelevantRunSpecsCloudResult>({
      fieldName: 'cloudProjectBySlug',
      operationDoc: RELEVANT_RUN_SPEC_OPERATION_DOC,
      operation: RELEVANT_RUN_SPEC_UPDATE_OPERATION,
      operationVariables: {
        projectSlug,
        commitShas: runShas, // runs.current || -1,
        hasRuns: runShas.length > 0, // !!runs.current && runs.current > 0,
      },
      requestPolicy: 'network-only', // we never want to hit local cache for this request
    })

    if (result.error) {
      debug(`Error when fetching relevant runs for all runs: %o: error -> %s`, runShas, result.error)

      return // SPECS_EMPTY_RETURN
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
      return // SPECS_EMPTY_RETURN
    }

    // const runSpecsToReturn: RunSpecReturn = {
    // runSpecs: {},
    // statuses: {},
    // testCounts: {},
    // }

    // const { current } = cloudProject
    // cloudProject.

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

    for (const data of result.data?.cloudProjectBySlug?.runsByCommitShas ?? []) {
      const info = data && formatCloudRunInfo(data)

      if (!info) {
        continue
      }

      const cacheData: RunSpecReturn = {
        status: data.status,
        runSpecs: info,
      }

      debug(`Caching for runNumber %i: %o`, info.runNumber, cacheData)

      this.#cached.set(info.runNumber, cacheData)
    }

    // const runSpecsToReturn: RunSpecReturn = { }
    // if (current && current.status && current.totalTests !== null) {
    //   runSpecsToReturn.runSpecs.current = formatCloudRunInfo(current)
    //   runSpecsToReturn.statuses.current = current.status
    //   runSpecsToReturn.testCounts.current = current.totalTests
    // }

    // return runSpecsToReturn
  }

  pollForSpecs () {
    debug(`pollForSpecs called`)
    //TODO Get spec counts before poll starts
    if (!this.#poller) {
      this.#poller = new Poller(this.ctx, 'relevantRunSpecChange', this.#pollingInterval, async () => {
        debug('Polling for specs for runs: %o', this.ctx.relevantRuns.runs.all)

        if (!this.ctx.relevantRuns.runs.all.length) {
          return
        }

        const specs = await this.getRelevantRunSpecs(this.ctx.relevantRuns.runs.all)

        debug(`Spec data is `, specs)

        this.ctx.emitter.relevantRunSpecChange()

        // const wasWatchingCurrentProject = this.#cached.statuses.current === 'RUNNING'
        // const specInfoChanged = !isEqual(specs.runSpecs, this.#cached.runSpecs)
        // const statusesChanged = !isEqual(specs.statuses, this.#cached.statuses)
        // const testCountsChanged = !isEqual(specs.testCounts, this.#cached.testCounts)

        // this.#cached = specs

        //only emit a new value if it changes
        // if (specInfoChanged) {
        //   debug('Spec info changed')
        //   this.ctx.emitter.relevantRunSpecChange()
        // }

        //if statuses change, then let debug page know to refresh runs
        // if (statusesChanged || testCountsChanged) {
        //   debug(`Watched values changed: statuses[${statusesChanged}] testCounts[${testCountsChanged}]`)
        //   const projectSlug = await this.ctx.project.projectId()

        //   if (projectSlug && wasWatchingCurrentProject) {
        //     debug(`Invalidate cloudProjectBySlug ${projectSlug}`)
        //     await this.ctx.cloud.invalidate('Query', 'cloudProjectBySlug', { slug: projectSlug })
        //   }

        //   if (statusesChanged) {
        //     //statuses changed so make sure to check relevant runs again
        //     //this would happen automatically the next time the RelevantRunsDataSource
        //     //poll occurs, but could result in an out-of-sync state until then
        //     await this.ctx.relevantRuns.checkRelevantRuns(this.ctx.git?.currentHashes || [])
        //   } else {
        //     //if statuses did not change, no need to recheck the relevant runs
        //     //just emit the ones we already have
        //     this.ctx.emitter.relevantRunChange(runs)
        //   }
        // }
        // const runs: RelevantRun = {
        //   all: []
        // }

        // this.ctx.emitter.relevantRunChange(runs)
      })
    }

    return this.#poller.start()
  }
}
