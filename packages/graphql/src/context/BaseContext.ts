import { delegateToSchema } from '@graphql-tools/delegate'
import type { LaunchArgs, OpenProjectLaunchOptions } from '@packages/types'
import type { GraphQLResolveInfo, GraphQLSchema } from 'graphql'
import type { BaseActions } from '../actions/BaseActions'
import { App, Wizard, NavigationMenu, Project } from '../entities'
import type { NexusGenObjects } from '../gen/nxs.gen'

export interface AuthenticatedUser {
  name?: string
  email?: string
  authToken?: string
}

/**
 * The "Base Context" is the class type that we will use to encapsulate the server state.
 * It will be implemented by ServerContext (real state) and TestContext (client state).
 *
 * This allows us to re-use the entire GraphQL server definition client side for testing,
 * without the need to endlessly mock things.
 */
export abstract class BaseContext {
  protected _authenticatedUser: AuthenticatedUser | null = null
  protected abstract _remoteSchema: GraphQLSchema

  get authenticatedUser () {
    return this._authenticatedUser ?? null
  }

  setAuthenticatedUser (authUser: AuthenticatedUser | null) {
    this._authenticatedUser = authUser

    return this
  }

  abstract readonly actions: BaseActions
  abstract localProjects: Project[]

  constructor (private _launchArgs: LaunchArgs, private _launchOptions: OpenProjectLaunchOptions) {}

  app = new App(this)
  wizard = new Wizard(this)
  navigationMenu = new NavigationMenu()

  abstract delegateToRemoteQueryBatched(info: GraphQLResolveInfo): NexusGenObjects['Query'] | null

  delegateToRemoteQuery (info: GraphQLResolveInfo, rootValue = {}): NexusGenObjects['Query'] | null {
    try {
      return delegateToSchema({
        schema: this._remoteSchema,
        info,
        context: this,
        rootValue,
      }) as any
    } catch (e) {
      // eslint-disable-next-line
      console.error(e)
    }

    return null as any
  }

  get activeProject () {
    return this.app.activeProject
  }

  get launchArgs () {
    return this._launchArgs
  }

  get launchOptions () {
    return this._launchOptions
  }

  isFirstOpen = false
}
