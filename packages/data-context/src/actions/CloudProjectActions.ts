import type { DataContext } from '..'
import type { CoreDataShape } from '../data'
import type { Query } from '../gen/graphcache-config.gen'
import { gql } from '@urql/core'
import debugLib from 'debug'

const debug = debugLib('cypress:data-context:CloudProjectActions')

const CLOUD_PROJECT_INFO_OPERATION_DOC = gql`
  query CloudActions_CloudProjectInfo ($projectSlug: String!) {
    cloudProjectBySlug(slug: $projectSlug) {
      __typename
      ... on CloudProject {
        id
        name
      }
    }
  }`

export class CloudProjectActions {
  constructor (private ctx: DataContext) {}

  /**
   * Clear out any data relating to the cloud project.
   * Used when changing projects (eg via global mode) to ensure stale data is not shown.
   */
  clearCloudProject () {
    this.ctx.update((d) => {
      d.cloudProject = {}
    })
  }

  /**
   * Fetches basic information about an associated Cloud project.
   * Tries to use cached data, and falls back to fetching the data
   * from the remote endpoint.
   */
  async fetchMetadata (): Promise<CoreDataShape['cloudProject']['metadata'] | undefined> {
    const projectSlug = await this.ctx.project.projectId()

    const result = await this.ctx.cloud.executeRemoteGraphQL<Pick<Query, 'cloudProjectBySlug'>>({
      fieldName: 'cloudProjectBySlug',
      operationDoc: CLOUD_PROJECT_INFO_OPERATION_DOC,
      operationVariables: {
        projectSlug,
      },
      requestPolicy: 'network-only',
    })

    if (result.data?.cloudProjectBySlug?.__typename !== 'CloudProject') {
      debug('Returning empty')

      return
    }

    const { name, id } = result.data.cloudProjectBySlug

    this.ctx.update((cd) => {
      cd.cloudProject.metadata = {
        name, id,
      }
    })

    return this.ctx.coreData.cloudProject.metadata
  }
}
