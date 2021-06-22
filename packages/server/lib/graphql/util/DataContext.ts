import type { ProjectBase } from '@packages/server-ct'
import path from 'path'
import DataLoader from 'dataloader'
import gql from 'graphql-tag'

import { AppOptionsData } from '../entities'
import { DashboardProject } from '../entities/DashboardProject'
import cache from '../../cache'

export class DataContext {
  private static _projects?: Promise<ProjectBase<any>[]>
  private static _options?: AppOptionsData

  constructor (readonly options: AppOptionsData) {}

  dashboardProjectLoader = new DataLoader<string, DashboardProject>((projectIds) => {
    // return fetch('https://dashboard.cypress.io/graphql', {
    //   body: gql`
    //     query CypressTestRunner_DashboardProjects($projectIds: [String!]!) {
    //       projectsByIds(projectIds: $projectIds) {
    //         name
    //         status
    //       }
    //     }
    //   `,
    //   headers: {
    //     authorization: `Bearer ${this.options.authKey}`
    //   }
    // })
  })

  /**
   * This serves as the in-memory cache of all data related to the application
   */
  static forHttp () {
    if (!this._options) {
      throw new Error('Must issue a graphql request via the IPC before using in graphiql')
    }

    return this.getInstance(this._options)
  }

  static getInstance (options: AppOptionsData) {
    if (!this._options) {
      this._options = options
    }

    return new DataContext(options)
  }

  /**
   * If there's a DataContext instance, this can be used to tear it down
   */
  static teardown () {
    //
  }

  get cache () {
    return cache
  }

  get authToken (): string | null | Promise<string | null> {
    return null
  }

  get unwrapNodeId () {
    return DataContext.unwrapNodeId
  }

  get projects () {
    return DataContext._projects ?? []
  }

  static addProject (projectPath: string) {

  }

  relative (target: string) {
    return path.relative(this.options.cwd, target)
  }

  /**
 * Takes a node id from the
 * @param id
 * @param possibleType
 */
  static unwrapNodeId (id: string, possibleType: string | string[]) {
    const [typeName, ...rest] = id.split(':')
    const _id = rest.join(':')

    const possibleTypeArr = Array.isArray(possibleType) ? possibleType : [possibleType]

    if (possibleTypeArr.includes(typeName)) {
      return _id
    }

    throw new Error(`Invalid node id, expected ${possibleType}, saw ${typeName}`)
  }

  remoteGraphQL (operation: DocumentType) {
    // return fetch('https://dashboard.cypress.io/graphql', {
    //   body: print(operation)
    // })
  }
}
