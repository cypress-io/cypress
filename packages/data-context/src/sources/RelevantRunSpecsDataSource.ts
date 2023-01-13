import { gql } from '@urql/core'
import { print } from 'graphql'
import debugLib from 'debug'
import { isEqual } from 'lodash'

import type { DataContext } from '../DataContext'
import type { CloudSpecStatus, Query, RelevantRun, CurrentProjectRelevantRunSpecs, CloudSpecRun, CloudRun } from '../gen/graphcache-config.gen'
import { Poller } from '../polling'

const debug = debugLib('cypress:data-context:sources:RelevantRunSpecsDataSource')

const RELEVANT_RUN_SPEC_OPERATION_DOC = gql`
  query RelevantRunsDataSource_latestRunUpdateSpecData(
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
          specs {
            id
            status
          }
        }
        next: runByNumber(runNumber: $nextRunNumber) @include(if: $hasNext) {
          id
          specs {
            id
            status
          }
        }
      }
    }
    pollingIntervals {
      runByNumber
    }
  }
`
const RELEVANT_RUN_SPEC_UPDATE_OPERATION = print(RELEVANT_RUN_SPEC_OPERATION_DOC)

export const SPECS_EMPTY_RETURN: CurrentProjectRelevantRunSpecs = { }

const INCOMPLETE_STATUSES: CloudSpecStatus[] = ['RUNNING', 'UNCLAIMED']

/**
 * DataSource to encapsulate querying Cypress Cloud for runs that match a list of local Git commit shas
 */
export class RelevantRunSpecsDataSource {
  #pollingInterval: number = 30
  #cached: CurrentProjectRelevantRunSpecs = {
    current: {},
    next: {},
  }

  #poller?: Poller<'relevantRunSpecChange'>

  constructor (private ctx: DataContext) {}

  get specs () {
    return this.#cached
  }

  #calculateSpecMetadata (specs: CloudSpecRun[]) {
    return {
      totalSpecs: specs.length,
      completedSpecs: specs.map((spec) => spec.status || 'UNCLAIMED').filter((status) => !INCOMPLETE_STATUSES.includes(status)).length,
    }
  }

  /**
   * Pulls runs from the current Cypress Cloud account and determines which runs are considered:
   * - "current" the most recent completed run, or if not found, the most recent running run
   * - "next" the most recent running run if a completed run is found
   * @param shas list of Git commit shas to query the Cloud with for matching runs
   */
  async getRelevantRunSpecs (runs: RelevantRun): Promise<CurrentProjectRelevantRunSpecs> {
    const projectSlug = await this.ctx.project.projectId()

    if (!projectSlug) {
      debug('No project detected')

      return SPECS_EMPTY_RETURN
    }

    debug(`Fetching specs for ${projectSlug} and ${runs}`)

    type CloudResult = { cloudProjectBySlug: { __typename: string, current?: CloudRun, next?: CloudRun } } & Pick<Query, 'pollingIntervals'>

    const result = await this.ctx.cloud.executeRemoteGraphQL<CloudResult>({
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
      //TODO Handle error
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
      return {
        current: {
          ...this.#calculateSpecMetadata(cloudProject?.current?.specs || []),
          runNumber: runs.current,
        },
        next: {
          ...this.#calculateSpecMetadata(cloudProject?.next?.specs || []),
          runNumber: runs.next,
        },
      }
    }

    return SPECS_EMPTY_RETURN
  }

  pollForSpecs () {
    debug(`pollForSpecs called`)
    if (!this.#poller) {
      this.#poller = new Poller(this.ctx, 'relevantRunSpecChange', this.#pollingInterval, async () => {
        const runs = this.ctx.relevantRuns.runs

        debug('Polling for specs for runs', runs)

        if (!runs.current && !runs.next) {
          return
        }

        const specs = await this.getRelevantRunSpecs(runs)

        debug(`Spec data is `, specs)

        //only emit a new value if it changes
        if (!isEqual(specs, this.#cached)) {
          this.#cached = specs
          this.ctx.emitter.relevantRunSpecChange()
        }
      })
    }

    return this.#poller.start(this.#cached)
  }
}
