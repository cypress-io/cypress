// @ts-ignore
import pkg from '@packages/root'
import debugLib from 'debug'
import DataLoader from 'dataloader'
import { createBatchingExecutor } from '@graphql-tools/batch-execute'
import { cacheExchange, Cache } from '@urql/exchange-graphcache'
import fetch, { Response } from 'cross-fetch'
import crypto from 'crypto'

import type { DataContext } from '..'
import getenv from 'getenv'
import { print, DocumentNode, ExecutionResult, GraphQLResolveInfo, OperationTypeNode, visit, OperationDefinitionNode } from 'graphql'
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

export type CloudDataResponse<T = any> = ExecutionResult<T> & Partial<OperationResult<T | null>> & { executing?: Promise<ExecutionResult<T> & Partial<OperationResult<T | null>>> }

const debug = debugLib('cypress:data-context:sources:CloudDataSource')
const cloudEnv = getenv('CYPRESS_INTERNAL_CLOUD_ENV', process.env.CYPRESS_INTERNAL_ENV || 'development') as keyof typeof REMOTE_SCHEMA_URLS

const REMOTE_SCHEMA_URLS = {
  staging: 'https://cloud-staging.cypress.io',
  development: 'http://localhost:3000',
  production: 'https://cloud.cypress.io',
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type StartsWith<T, Prefix extends string> = T extends `${Prefix}${infer _U}` ? T : never
type CloudQueryField = StartsWith<keyof NexusGen['fieldTypes']['Query'], 'cloud'>

export interface CloudExecuteQuery {
  operationHash?: string
  operationDoc: DocumentNode
  operationVariables: any
}

export interface CloudExecuteRemote extends CloudExecuteQuery {
  fieldName: string
  shouldBatch?: boolean
  operationType?: OperationTypeNode
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
  /**
   * Triggered when we have an initial stale response that is not fulfilled
   * by an additional fetch to the server. This means we've gotten into a bad state
   * and we need to clear both the server & client side cache
   */
  invalidateClientUrqlCache(): void
  headers?: {
    getMachineId: Promise<string | null>
  }
}

/**
 * The CloudDataSource manages the interaction with the remote GraphQL server
 * It maintains a normalized cache of all data we have seen from the cloud and
 * ensures the data is kept up-to-date as it changes
 */
export class CloudDataSource {
  #cloudUrqlClient: Client
  #lastCache?: string
  #batchExecutor: ReturnType<typeof createBatchingExecutor>
  #batchExecutorBatcher: DataLoader<CloudExecuteRemote, OperationResult>

  constructor (private params: CloudDataSourceParams) {
    this.#cloudUrqlClient = this.reset()
    this.#batchExecutor = createBatchingExecutor((config) => {
      return this.#executeQuery(namedExecutionDocument(config.document), config.variables)
    }, { maxBatchSize: 20 })

    this.#batchExecutorBatcher = this.#makeBatchExecutionBatcher()
  }

  get #user () {
    return this.params.getUser()
  }

  async #additionalHeaders () {
    return {
      'Authorization': this.#user ? `bearer ${this.#user.authToken}` : '',
      'x-cypress-version': pkg.version,
      'x-machine-id': await this.params.headers?.getMachineId || '',
    }
  }

  reset () {
    return this.#cloudUrqlClient = createClient({
      url: `${this.getCloudUrl(cloudEnv)}/test-runner-graphql`,
      exchanges: [
        dedupExchange,
        cacheExchange({
          // @ts-ignore
          schema: urqlSchema,
          ...urqlCacheKeys,
          updates: {
            Mutation: {
              _cloudCacheInvalidate: (parent, { args }: {args: Parameters<Cache['invalidate']>}, cache, info) => {
                cache.invalidate(...args)
              },
              _showUrqlCache: (parent, { args }: {args: Parameters<Cache['invalidate']>}, cache, info) => {
                this.#lastCache = JSON.stringify(cache, function replacer (key, value) {
                  if (value instanceof Map) {
                    const reducer = (obj: any, mapKey: any) => {
                      obj[mapKey] = value.get(mapKey)

                      return obj
                    }

                    return [...value.keys()].sort().reduce(reducer, {})
                  }

                  if (value instanceof Set) {
                    return [...value].sort()
                  }

                  return value
                })
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
            ...await this.#additionalHeaders(),
          },
        })
      },
    })
  }

  delegateCloudField <F extends CloudQueryField> (params: CloudExecuteDelegateFieldParams<F>) {
    return delegateToSchema({
      operation: 'query',
      schema: params.ctx.config.schemaCloud,
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
    const operation = print(config.operationDoc)

    return `${config.operationHash ?? this.#sha1(operation)}-${stringifyVariables(config.operationVariables)}`
  }

  #sha1 (str: string) {
    return crypto.createHash('sha1').update(str).digest('hex')
  }

  #formatWithErrors = async (data: OperationResult<any, any>) => {
    // If we receive a 401 from Cypress Cloud, we need to logout the user
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

    const query = config.shouldBatch
      ? this.#batchExecutorBatcher.load(config)
      : this.#executeQuery(config.operationDoc, config.operationVariables)

    loading = query.then(this.#formatWithErrors)
    .then(async (op) => {
      this.#pendingPromises.delete(stableKey)

      // If we have an initial result, by this point we expect that the query should be fully resolved in the cache.
      // If it's not, it means that we need to clear the cache on the client/server, otherwise it's going to fall into
      // an infinite loop trying to resolve the stale data. This likely only happens in contrived test cases, but
      // it's good to handle regardless.
      if (initialResult) {
        const eagerResult = this.readFromCache(config)

        if (eagerResult?.stale) {
          debug('Has initial result with stale eagerResult', op.data, eagerResult.data)
          await this.invalidate({ __typename: 'Query' })
          this.params.invalidateClientUrqlCache()

          return op
        }
      }

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

  #executeQuery (operationDoc: DocumentNode, operationVariables: object = {}) {
    debug(`Executing remote dashboard request %s, %j`, print(operationDoc), operationVariables)

    return this.#cloudUrqlClient.query(operationDoc, operationVariables, { requestPolicy: 'network-only' }).toPromise()
  }

  isResolving (config: CloudExecuteQuery) {
    const stableKey = this.#hashRemoteRequest(config)

    return Boolean(this.#pendingPromises.get(stableKey))
  }

  hasResolved (config: CloudExecuteQuery) {
    const eagerResult = this.#cloudUrqlClient.readQuery(config.operationDoc, config.operationVariables)

    return Boolean(eagerResult)
  }

  readFromCache (config: CloudExecuteQuery) {
    return this.#cloudUrqlClient.readQuery(config.operationDoc, config.operationVariables)
  }

  /**
   * Executes the query against a remote schema. Keeps an urql client for the normalized caching,
   * so we can respond quickly on first-load if we have data. Since this is ultimately being used
   * as a remote request mechanism for a stitched schema, we reject the promise if we see any errors.
   */
  executeRemoteGraphQL <T = any> (config: CloudExecuteRemote): Promise<CloudDataResponse<T>> | CloudDataResponse<T> {
    // We do not want unauthenticated requests to hit the remote schema
    if (!this.#user) {
      return { data: null }
    }

    if (config.operationType === 'mutation') {
      return this.#cloudUrqlClient.mutation(config.operationDoc, config.operationVariables).toPromise().then(this.#formatWithErrors)
    }

    // First, we check the cache to see if we have the data to fulfill this query
    const eagerResult = this.readFromCache(config)

    // If we do have a synchronous result, return it, and determine if we want to check for
    // updates to this field
    if (eagerResult && config.requestPolicy !== 'network-only') {
      debug(`eagerResult found stale? %s, %s, %o`, eagerResult.stale, config.requestPolicy, eagerResult.data)

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
          // Not urgent, but a nice-to-have, replace this with an exchange to
          // be more explicit about filtering out this request, rather than looking at headers
          // in the in the "fetch" exchange
          INTERNAL_REQUEST: JSON.stringify({ data: { _cloudCacheInvalidate: true } }),
        },
      },
    }).toPromise()
  }

  async getCache () {
    await this.#cloudUrqlClient.mutation(`
      mutation Internal_showUrqlCache { 
        _showUrqlCache
      }
    `, { }, {
      fetchOptions: {
        headers: {
          // Same note as above on the "invalidate", we could make this a bit clearer
          INTERNAL_REQUEST: JSON.stringify({ data: { _cloudCacheInvalidate: true } }),
        },
      },
    }).toPromise()

    return JSON.parse(this.#lastCache ?? '')
  }

  getCloudUrl (env: keyof typeof REMOTE_SCHEMA_URLS) {
    return REMOTE_SCHEMA_URLS[env]
  }

  /**
   * Creates a non-caching batch-loader, used to aggregate multiple remote GraphQL
   * requests and rewrite them into a single query issued against the remote server.
   * https://www.graphql-tools.com/docs/batch-execution
   */
  #makeBatchExecutionBatcher () {
    return new DataLoader<CloudExecuteRemote, any>(async (toBatch) => {
      return Promise.allSettled(toBatch.map((b) => {
        return this.#batchExecutor({
          operationType: 'query',
          document: b.operationDoc,
          variables: b.operationVariables,
        })
      })).then((val) => val.map((v) => v.status === 'fulfilled' ? v.value : this.#ensureError(v.reason)))
    }, {
      cache: false,
    })
  }

  #ensureError (val: any): Error {
    return val instanceof Error ? val : new Error(val)
  }
}

/**
 * Adds "batchExecutionQuery" to the query that we generate from the batch loader,
 * useful to key off of in the tests.
 */
function namedExecutionDocument (document: DocumentNode) {
  let hasReplaced = false

  return visit(document, {
    enter () {
      if (hasReplaced) {
        return false
      }

      return
    },
    OperationDefinition (op) {
      if (op.name) {
        return op
      }

      hasReplaced = true

      const selectionSet = new Set()

      op.selectionSet.selections.forEach((s) => {
        if (s.kind === 'Field') {
          selectionSet.add(s.name.value)
        }
      })

      let operationName = 'batchTestRunnerExecutionQuery'

      if (selectionSet.size > 0) {
        operationName = `${operationName}_${Array.from(selectionSet).sort().join('_')}`
      }

      const namedOperationNode: OperationDefinitionNode = {
        ...op,
        name: {
          kind: 'Name',
          value: operationName,
        },
      }

      return namedOperationNode
    },
  })
}
