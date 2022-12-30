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

const EMPTY_RETURN: RelevantRunReturn = { current: undefined, next: undefined }

export class RelevantRunsDataSource {
  constructor (private ctx: DataContext) {}

  async getRelevantRuns (shas: string[]): Promise<RelevantRunReturn> {
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

      return {
        current: chain(compactedRuns).filter((run) => run.status !== 'RUNNING').map((run) => run.runNumber).first().value(),
        next: chain(compactedRuns).filter((run) => run.status === 'RUNNING').map((run) => run.runNumber).first().value(),
      }
    }

    return EMPTY_RETURN
  }
}
