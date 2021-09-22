import { delegateToSchema } from '@graphql-tools/delegate'
import { batchDelegateToSchema } from '@graphql-tools/batch-delegate'
import type { LaunchArgs, OpenProjectLaunchOptions } from '@packages/types'
import type { GraphQLResolveInfo } from 'graphql'
import type { BaseActions } from '../actions/BaseActions'
import type { NexusGenObjects } from '../gen/nxs.gen'
import type { Query as CloudQuery } from '../gen/cloud-source-types.gen'
import { coreDataShape } from './coreDataShape'
import { remoteSchemaWrapped } from '..'

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

type ArrVal<T> = T extends Array<infer U> ? U : never

/**
 * The "Base Context" is the class type that we will use to encapsulate the server state.
 * It will be implemented by ServerContext (real state) and TestContext (client state).
 *
 * This allows us to re-use the entire GraphQL server definition client side for testing,
 * without the need to endlessly mock things.
 */
export class BaseContext {
  protected _authenticatedUser: AuthenticatedUser | null = null

  get coreData () {
    return coreDataShape
  }

  makeId<T extends EntityName> (typeName: T, nodeString: string) {
    return Buffer.from(`${typeName}:${nodeString}`).toString('base64')
  }

  assertNonNull<T> (val: T | null | undefined): T {
    if (val == null) {
      throw new Error(`Expected val to be non-null. This should never happen`)
    }

    return val as T
  }

  get authenticatedUser () {
    return this._authenticatedUser ?? null
  }

  setAuthenticatedUser (authUser: AuthenticatedUser | null) {
    this._authenticatedUser = authUser

    return this
  }

  readonly actions: BaseActions
  localProjects: Project[]

  constructor (private _launchArgs: LaunchArgs, private _launchOptions: OpenProjectLaunchOptions) {}

  get app () {
    return this.coreData.app
  }

  get wizard () {
    return this.coreData.wizard
  }

  cloudProjectBySlug (slug: string, info: GraphQLResolveInfo) {
    return this.delegateToRemoteQueryBatched({
      info,
      key: slug,
      fieldName: 'cloudProjectsBySlugs',
    })
  }

  delegateToRemoteQueryBatched<T extends KnownBatchFields> (config: DelegateToRemoteQueryBatchedConfig<T>): ArrVal<CloudQuery[T]> | null {
    try {
      return batchDelegateToSchema({
        schema: remoteSchemaWrapped,
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
        schema: remoteSchemaWrapped,
        info,
        context: this,
        rootValue,
      })
    } catch (e) {
      this.logError(e)

      return null
    }
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

  logError (e: unknown) {
    // TODO(tim): handle this consistently
    // eslint-disable-next-line no-console
    console.error(e)
  }
}
