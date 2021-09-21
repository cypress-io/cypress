import { delegateToSchema } from '@graphql-tools/delegate'
import { batchDelegateToSchema } from '@graphql-tools/batch-delegate'
import type { LaunchArgs, OpenProjectLaunchOptions } from '@packages/types'
import type { GraphQLResolveInfo, GraphQLSchema } from 'graphql'
import type { BaseActions } from '../actions/BaseActions'
import { App, Wizard, NavigationMenu } from '../entities'
import type { NexusGenObjects } from '../gen/nxs.gen'
import type { Query as CloudQuery } from '../gen/cloud-source-types.gen'
import type { NxsQueryResult } from 'nexus-decorators'
import type { IProjectSource } from '../sources'

export interface AuthenticatedUser {
  name?: string
  email?: string
  authToken?: string
}

type PotentialFields = Exclude<keyof CloudQuery, '__typename'>

interface FieldArgMapping {
  cloudProjectsBySlugs: string
}

type KnownBatchFields = PotentialFields & keyof FieldArgMapping

const FieldConfig: Record<KnownBatchFields, string> = {
  cloudProjectsBySlugs: 'slugs',
}

export interface DelegateToRemoteQueryBatchedConfig<F extends KnownBatchFields> {
  fieldName: F
  info: GraphQLResolveInfo
  rootValue?: object
  key?: FieldArgMapping[F]
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

  constructor (private _launchArgs: LaunchArgs, private _launchOptions: OpenProjectLaunchOptions) {}

  app = new App(this)
  wizard = new Wizard(this)
  navigationMenu = new NavigationMenu()

  cloudProjectsBySlug (slug: string, info: GraphQLResolveInfo) {
    return this.delegateToRemoteQueryBatched({
      info,
      key: slug,
      fieldName: 'cloudProjectsBySlugs',
    })
  }

  delegateToRemoteQueryBatched<T extends KnownBatchFields> (config: DelegateToRemoteQueryBatchedConfig<T>): NxsQueryResult<T> | null {
    try {
      return batchDelegateToSchema({
        schema: this._remoteSchema,
        info: config.info,
        context: this,
        rootValue: config.rootValue ?? {},
        operation: 'query',
        fieldName: config.fieldName,
        key: config.key,
        argsFromKeys: (keys) => ({ [FieldConfig[config.fieldName]]: keys }),
      })
    } catch (e) {
      this.logError(e)

      return null
    }
  }

  async delegateToRemoteQuery <T extends keyof NexusGenObjects> (info: GraphQLResolveInfo, rootValue = {}): Promise<NexusGenObjects[T] | null> {
    try {
      return delegateToSchema({
        schema: this._remoteSchema,
        info,
        context: this,
        rootValue,
      })
    } catch (e) {
      this.logError(e)

      return null
    }
  }

  get launchArgs () {
    return this._launchArgs
  }

  get launchOptions () {
    return this._launchOptions
  }

  abstract get project(): IProjectSource

  logError (e: unknown) {
    // TODO(tim): handle this consistently
    // eslint-disable-next-line no-console
    console.error(e)
  }

  isFirstOpen = false
}
