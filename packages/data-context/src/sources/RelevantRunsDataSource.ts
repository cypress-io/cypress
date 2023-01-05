import { gql } from '@urql/core'
import { print } from 'graphql'
import debugLib from 'debug'
import { chain, compact } from 'lodash'

import type { DataContext } from '../DataContext'
import type { Query } from '../gen/graphcache-config.gen'

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
        }

      }
    }
  }
`
const RELEVANT_RUN_UPDATE_OPERATION = print(RELEVANT_RUN_OPERATION_DOC)

type RelevantRunReturn = {
  current?: number
  next?: number
}

export const EMPTY_RETURN: RelevantRunReturn = { current: undefined, next: undefined }

/**
 * DataSource to encapsulate querying Cypress Cloud for runs that match a list of local Git commit shas
 */
export class RelevantRunsDataSource {
  private _currentRun: number | undefined

  constructor (private ctx: DataContext) {}

  /**
   * Pulls runs from the current Cypress Cloud account and determines which runs are considered:
   * - "current" the most recent completed run, or if not found, the most recent running run
   * - "next" the most recent running run if a completed run is found
   * @param shas list of Git commit shas to query the Cloud with for matching runs
   */
  async getRelevantRuns (shas: string[]): Promise<RelevantRunReturn> {
    if (shas.length === 0) {
      return EMPTY_RETURN
    }

    const projectSlug = await this.ctx.project.projectId()

    if (!projectSlug) {
      debug('No project detected')

      return EMPTY_RETURN
    }

    debug(`Fetching runs for ${projectSlug} and ${shas.length} shas`)

    const result = await this.ctx.cloud.executeRemoteGraphQL<Pick<Query, 'cloudProjectBySlug'>>({
      fieldName: 'cloudProjectBySlug',
      operationDoc: RELEVANT_RUN_OPERATION_DOC,
      operation: RELEVANT_RUN_UPDATE_OPERATION,
      operationVariables: {
        projectSlug,
        shas,
      },
      requestPolicy: 'network-only', // we never want to hit local cache for this request
    })

    debug(`Result returned type ${result.data}`)

    if (result.data?.cloudProjectBySlug?.__typename === 'CloudProject') {
      const runs = result.data.cloudProjectBySlug.runsByCommitShas?.map((run) => {
        if (run?.runNumber && run?.status) {
          return {
            runNumber: run.runNumber,
            status: run.status,
          }
        }

        return undefined
      }) || []

      const compactedRuns = compact(runs)

      debug(`Found ${compactedRuns.length} runs for ${projectSlug} and ${shas.length} shas`)

      const hasStoredCurrentRunThatIsStillValid = this._currentRun !== undefined && compactedRuns.some((run) => run.runNumber === this._currentRun)

      const firstNonRunningRun = chain(compactedRuns).filter((run) => run.status !== 'RUNNING').map((run) => run.runNumber).first().value()
      const firstRunningRun = compactedRuns[0]?.status === 'RUNNING' ? compactedRuns[0].runNumber : undefined

      let currentRun
      let nextRun

      if (hasStoredCurrentRunThatIsStillValid) {
        // continue to use the cached current run
        // the next run is the first running run if it exists
        currentRun = this._currentRun
        nextRun = firstRunningRun
      } else if (firstNonRunningRun) {
        // if a non running run is found
        // use it has the current run
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
      this._currentRun = currentRun

      return {
        current: currentRun,
        next: nextRun,
      }
    }

    return EMPTY_RETURN
  }

  /**
   * Clear the cached current run to allow the data source to pick the next completed run as the current
   */
  moveToNext () {
    debug('Moving to next relevant run')
    this._currentRun = undefined
  }
}
