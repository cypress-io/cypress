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

export class RelevantRunsDataSource {
  private _currentRun: number | undefined

  constructor (private ctx: DataContext) {}

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

      debug(`Found ${runs.length} runs for ${projectSlug} and ${shas.length} shas`)

      const hasStoredCurrentRunThatIsStillValid = this._currentRun !== undefined && compactedRuns.some((run) => run.runNumber === this._currentRun)

      const firstNonRunningRun = chain(compactedRuns).filter((run) => run.status !== 'RUNNING').map((run) => run.runNumber).first().value()
      const firstRunningRun = chain(compactedRuns).filter((run) => run.status === 'RUNNING').map((run) => run.runNumber).first().value()

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

  moveToNext () {
    debug('Moving to next relevant run')
    this._currentRun = undefined
  }
}
