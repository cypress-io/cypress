// @ts-ignore
import pkg from '@packages/root'
import debugLib from 'debug'
import { cacheExchange, Cache } from '@urql/exchange-graphcache'
import fetch, { Response } from 'cross-fetch'

import type { DataContext } from '..'
import getenv from 'getenv'
import { DocumentNode, ExecutionResult, GraphQLResolveInfo, OperationTypeNode, print } from 'graphql'
import {
  createClient,
  dedupExchange,
  fetchExchange,
  Client,
  OperationResult,
  stringifyVariables,
  RequestPolicy,
} from '@urql/core'
import _ from 'lodash'
import type { core } from 'nexus'
import { delegateToSchema } from '@graphql-tools/delegate'
import { urqlCacheKeys } from '../util/urqlCacheKeys'
import { urqlSchema } from '../gen/urql-introspection.gen'
import type { AuthenticatedUserShape } from '../data'
import { pathToArray } from 'graphql/jsutils/Path'

export type CloudDataResponse = ExecutionResult & Partial<OperationResult> & { executing?: Promise<ExecutionResult & Partial<OperationResult>> }

const debug = debugLib('cypress:data-context:sources:CloudDataSource')
const cloudEnv = getenv('CYPRESS_INTERNAL_CLOUD_ENV', process.env.CYPRESS_INTERNAL_ENV || 'development') as keyof typeof REMOTE_SCHEMA_URLS

const REMOTE_SCHEMA_URLS = {
  staging: 'https://dashboard-staging.cypress.io',
  development: 'http://localhost:3000',
  production: 'https://dashboard.cypress.io',
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type StartsWith<T, Prefix extends string> = T extends `${Prefix}${infer _U}` ? T : never
type CloudQueryField = StartsWith<keyof NexusGen['fieldTypes']['Query'], 'cloud'>

export interface CloudExecuteQuery {
  document: DocumentNode
  variables: any
}

export interface CloudExecuteRemote extends CloudExecuteQuery {
  operationType: OperationTypeNode
  requestPolicy?: RequestPolicy
  onUpdatedResult?: (data: any) => any
}

export interface CloudExecuteDelegateFieldParams<F extends CloudQueryField> {
  field: F
  args: core.ArgsValue<'Query', F>
  ctx: DataContext
  info: GraphQLResolveInfo
}

export interface CloudDataSourceParams {
  fetch: typeof fetch
  getUser(): AuthenticatedUserShape | null
  logout(): void
}

/**
 * The CloudDataSource manages the interaction with the remote GraphQL server
 * It maintains a normalized cache of all data we have seen from the cloud and
 * ensures the data is kept up-to-date as it changes
 */
export class CloudDataSource {
  #cloudUrqlClient: Client

  constructor (private params: CloudDataSourceParams) {
    this.#cloudUrqlClient = this.reset()
  }

  get #user () {
    return this.params.getUser()
  }

  get #additionalHeaders () {
    return {
      'Authorization': this.#user ? `bearer ${this.#user.authToken}` : '',
      'x-cypress-version': pkg.version,
    }
  }

  reset () {
    return this.#cloudUrqlClient = createClient({
      url: `${REMOTE_SCHEMA_URLS[cloudEnv]}/test-runner-graphql`,
      exchanges: [
        dedupExchange,
        cacheExchange({
          // @ts-ignore
          schema: urqlSchema,
          ...urqlCacheKeys,
          resolvers: {},
          updates: {
            Mutation: {
              _cloudCacheInvalidate: (parent, { args }: {args: Parameters<Cache['invalidate']>}, cache, info) => {
                cache.invalidate(...args)
              },
            },
          },
        }),
        fetchExchange,
      ],
      // Set this way so we can intercept the fetch on the context for testing
      fetch: async (uri, init) => {
        const internalResponse = _.get(init, 'headers.INTERNAL_REQUEST')

        if (internalResponse) {
          return Promise.resolve(new Response(internalResponse, { status: 200 }))
        }

        return this.params.fetch(uri, {
          ...init,
          headers: {
            ...init?.headers,
            ...this.#additionalHeaders,
          },
        })
      },
    })
  }

  isLoadingRemote (config: CloudExecuteRemote) {
    return Boolean(this.#pendingPromises.get(this.#hashRemoteRequest(config)))
  }

  delegateCloudField <F extends CloudQueryField> (params: CloudExecuteDelegateFieldParams<F>) {
    return delegateToSchema({
      operation: 'query',
      schema: params.ctx.schemaCloud,
      fieldName: params.field,
      fieldNodes: params.info.fieldNodes,
      info: params.info,
      args: params.args,
      context: params.ctx,
      operationName: this.makeOperationName(params.info),
    })
  }

  makeOperationName (info: GraphQLResolveInfo) {
    return `${info.operation.name?.value ?? 'Anonymous'}_${pathToArray(info.path).map((p) => typeof p === 'number' ? 'idx' : p).join('_')}`
  }

  #pendingPromises = new Map<string, Promise<OperationResult>>()

  #hashRemoteRequest (config: CloudExecuteQuery) {
    return `${print(config.document)}-${stringifyVariables(config.variables)}`
  }

  #formatWithErrors = async (data: OperationResult<any, any>) => {
    // If we receive a 401 from the dashboard, we need to logout the user
    if (data.error?.response?.status === 401) {
      await this.params.logout()
    }

    if (data.error && data.operation.kind === 'mutation') {
      await this.invalidate({ __typename: 'Query' })
    }

    return {
      ...data,
      errors: data.error?.graphQLErrors,
    }
  }
  #maybeQueueDeferredExecute (config: CloudExecuteRemote, initialResult?: OperationResult) {
    const stableKey = this.#hashRemoteRequest(config)

    let loading = this.#pendingPromises.get(stableKey)

    if (loading) {
      return loading
    }

    loading = this.#cloudUrqlClient.query(config.document, config.variables, { requestPolicy: 'network-only' }).toPromise().then(this.#formatWithErrors)
    .then((op) => {
      this.#pendingPromises.delete(stableKey)

      if (initialResult && !_.isEqual(op.data, initialResult.data)) {
        debug('Different Query Value %j, %j', op.data, initialResult.data)

        if (typeof config.onUpdatedResult === 'function') {
          config.onUpdatedResult(op.data)
        }

        return op
      }

      return op
    })

    this.#pendingPromises.set(stableKey, loading)

    return loading
  }

  isResolving (config: CloudExecuteQuery) {
    const stableKey = this.#hashRemoteRequest(config)

    return Boolean(this.#pendingPromises.get(stableKey))
  }

  hasResolved (config: CloudExecuteQuery) {
    const eagerResult = this.#cloudUrqlClient.readQuery(config.document, config.variables)

    return Boolean(eagerResult)
  }

  /**
   * Executes the query against a remote schema. Keeps an urql client for the normalized caching,
   * so we can respond quickly on first-load if we have data. Since this is ultimately being used
   * as a remote request mechanism for a stitched schema, we reject the promise if we see any errors.
   */
  executeRemoteGraphQL (config: CloudExecuteRemote): Promise<CloudDataResponse> | CloudDataResponse {
    // We do not want unauthenticated requests to hit the remote schema
    if (!this.#user) {
      return { data: null }
    }

    if (config.operationType === 'mutation') {
      return this.#cloudUrqlClient.mutation(config.document, config.variables).toPromise().then(this.#formatWithErrors)
    }

    // First, we check the cache to see if we have the data to fulfill this query
    const eagerResult = this.#cloudUrqlClient.readQuery(config.document, config.variables)

    // If we do have a synchronous result, return it, and determine if we want to check for
    // updates to this field
    if (eagerResult && config.requestPolicy !== 'network-only') {
      debug(`eagerResult found stale? %s, %o`, eagerResult.stale, eagerResult.data)

      // If we have some of the fields, but not the full thing, return what we do have and follow up
      // with an update we send to the client.
      if (eagerResult?.stale || config.requestPolicy === 'cache-and-network') {
        return { ...eagerResult, executing: this.#maybeQueueDeferredExecute(config, eagerResult) }
      }

      return eagerResult
    }

    // If we don't have a result here, queue this for execution if we haven't already,
    // and resolve with null
    return this.#maybeQueueDeferredExecute(config)
  }

  // Invalidate individual fields in the GraphQL by hitting a "fake"
  // mutation and calling cache.invalidate on the internal cache
  // https://formidable.com/open-source/urql/docs/api/graphcache/#invalidate
  invalidate (...args: Parameters<Cache['invalidate']>) {
    return this.#cloudUrqlClient.mutation(`
      mutation Internal_cloudCacheInvalidate($args: JSON) { 
        _cloudCacheInvalidate(args: $args) 
      }
    `, { args }, {
      fetchOptions: {
        headers: {
          // TODO: replace this with an exhange to filter out this request
          INTERNAL_REQUEST: JSON.stringify({ data: { _cloudCacheInvalidate: true } }),
        },
      },
    }).toPromise()
  }
}
