import { gql } from '@urql/core'
import { print } from 'graphql'
import debugLib from 'debug'
import { isEqual } from 'lodash'

import type { DataContext } from '../DataContext'
import type { CloudSpecStatus, Query, RelevantRun, CurrentProjectRelevantRunSpecs, CloudSpecRun, CloudRun, CloudRunGroup, CloudRunGroupStatusEnum } from '../gen/graphcache-config.gen'
import { Poller } from '../polling'
import type { CloudRunStatus } from '@packages/graphql/src/gen/cloud-source-types.gen'

const debug = debugLib('cypress:data-context:sources:RelevantRunSpecsDataSource')

const RELEVANT_RUN_SPEC_OPERATION_DOC = gql`
  fragment RelevantRunSpecsDataSource_Runs on CloudRun {
    id
    runNumber
    status
    specs {
      id
      status
      groupIds
    }
    groups {
      id
      status
    }
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
}

const INCOMPLETE_STATUSES: CloudSpecStatus[] = ['RUNNING', 'UNCLAIMED']

export type RunSpecReturn = {
  runSpecs: CurrentProjectRelevantRunSpecs
  statuses: {
    current?: CloudRunStatus
    next?: CloudRunStatus
  }
}

//Not ideal typing for this return since the query is not fetching all the fields, but better than nothing
export type RelevantRunSpecsCloudResult = { cloudProjectBySlug: { __typename?: string, current?: Partial<CloudRun>, next?: Partial<CloudRun> } } & Pick<Query, 'pollingIntervals'>

/**
 * DataSource to encapsulate querying Cypress Cloud for runs that match a list of local Git commit shas
 */
export class RelevantRunSpecsDataSource {
  #pollingInterval: number = 30
  #cached: RunSpecReturn = {
    runSpecs: {},
    statuses: {},
  }

  #poller?: Poller<'relevantRunSpecChange'>

  constructor (private ctx: DataContext) {}

  get specs () {
    return this.#cached.runSpecs
  }

  #calculateSpecMetadata (specs: CloudSpecRun[], groups: CloudRunGroup[]) {
    //mimic logic in Cloud to sum up the count of groups per spec to give the total spec counts
    const countGroupsForSpecs = (specs: CloudSpecRun[]) => {
      return specs.map((spec) => spec.groupIds?.length || 0).reduce((acc, curr) => acc += curr, 0)
    }

    const groupStatusById = groups.reduce<Record<string, CloudRunGroupStatusEnum>>((acc, curr) => {
      acc[curr.id] = curr.status

      return acc
    }, {})

    return {
      totalSpecs: countGroupsForSpecs(specs),
      completedSpecs:
      specs.flatMap((spec) => spec.groupIds) // pull out the group ids
      .filter((groupId): groupId is string => !!groupId) //make sure there are no undefined values
      .map((groupId) => groupStatusById[groupId]) //find the status for that group
      .filter((status) => !INCOMPLETE_STATUSES.includes(status || 'UNCLAIMED')) //filter to only "complete" statuses
      .length, //count them
    }
  }

  /**
   * Pulls runs from the current Cypress Cloud account and determines which runs are considered:
   * - "current" the most recent completed run, or if not found, the most recent running run
   * - "next" the most recent running run if a completed run is found
   * @param shas list of Git commit shas to query the Cloud with for matching runs
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
        nextRunNumber: runs.next || -1,
        hasNext: !!runs.next && runs.next > 0,
      },
      requestPolicy: 'network-only', // we never want to hit local cache for this request
    })

    if (result.error) {
      debug(`Error when fetching relevant runs for runs ${runs.current} and ${runs.next}`, result.error)
      throw result.error
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

    if (cloudProject?.__typename === 'CloudProject') {
      const runSpecsToReturn: RunSpecReturn = {
        runSpecs: {},
        statuses: {},
      }

      if (cloudProject.current && cloudProject.current.runNumber && cloudProject.current.status) {
        runSpecsToReturn.runSpecs.current = {
          ...this.#calculateSpecMetadata(cloudProject.current.specs || [], cloudProject.current.groups || []),
          runNumber: cloudProject.current.runNumber,
        }

        runSpecsToReturn.statuses.current = cloudProject.current.status
      }

      if (cloudProject.next && cloudProject.next.runNumber && cloudProject.next.status) {
        runSpecsToReturn.runSpecs.next = {
          ...this.#calculateSpecMetadata(cloudProject.next.specs || [], cloudProject.next.groups || []),
          runNumber: cloudProject.next.runNumber,
        }

        runSpecsToReturn.statuses.next = cloudProject.next.status
      }

      return runSpecsToReturn
    }

    return SPECS_EMPTY_RETURN
  }

  pollForSpecs () {
    debug(`pollForSpecs called`)
    if (!this.#poller) {
      this.#poller = new Poller(this.ctx, 'relevantRunSpecChange', this.#pollingInterval, async () => {
        const runs = this.ctx.relevantRuns.runs

        debug('Polling for specs for runs %o', runs)

        if (!runs.current && !runs.next) {
          return
        }

        const specs = await this.getRelevantRunSpecs(runs)

        debug(`Spec data is `, specs)

        const specCountsChanged = !isEqual(specs.runSpecs, this.#cached.runSpecs)
        const statusesChanged = !isEqual(specs.statuses, this.#cached.statuses)

        this.#cached = specs

        //only emit a new value if it changes
        if (specCountsChanged) {
          this.ctx.emitter.relevantRunSpecChange()
        }

        //if statuses change, then let debug page know to refresh runs
        if (statusesChanged) {
          debug('Run statuses changed')
          this.ctx.emitter.relevantRunChange(runs)
        }
      })
    }

    return this.#poller.start(this.#cached)
  }
}
