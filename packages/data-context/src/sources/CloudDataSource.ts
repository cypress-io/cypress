// @ts-ignore
import pkg from '@packages/root'
import debugLib from 'debug'

import type { DataContext } from '..'
import pDefer from 'p-defer'
import getenv from 'getenv'
import { pipe, subscribe, toPromise, take } from 'wonka'
import type { DocumentNode, OperationTypeNode } from 'graphql'
import {
  createClient,
  cacheExchange,
  dedupExchange,
  fetchExchange,
  Client,
  createRequest,
  OperationResult,
} from '@urql/core'
import _ from 'lodash'
import { getError } from '@packages/errors'
import type { RemoteExecutionRoot } from '@packages/graphql'

const debug = debugLib('cypress:data-context:CloudDataSource')
const cloudEnv = getenv('CYPRESS_INTERNAL_CLOUD_ENV', process.env.CYPRESS_INTERNAL_ENV || 'development') as keyof typeof REMOTE_SCHEMA_URLS

const REMOTE_SCHEMA_URLS = {
  staging: 'https://dashboard-staging.cypress.io',
  development: 'http://localhost:3000',
  production: 'https://dashboard.cypress.io',
}

export interface CloudExecuteRemote extends RemoteExecutionRoot {
  operationType: OperationTypeNode
  query: string
  document?: DocumentNode
  variables: any
}

export class CloudDataSource {
  private _cloudUrqlClient: Client

  constructor (private ctx: DataContext) {
    this._cloudUrqlClient = this.reset()
  }

  reset () {
    return this._cloudUrqlClient = createClient({
      url: `${REMOTE_SCHEMA_URLS[cloudEnv]}/test-runner-graphql`,
      exchanges: [
        dedupExchange,
        cacheExchange,
        fetchExchange,
      ],
      // Set this way so we can intercept the fetch on the context for testing
      fetch: (...args) => {
        return this.ctx.util.fetch(...args)
      },
    })
  }

  /**
   * Executes the schema against a remote query. Keeps an urql client for the normalized caching,
   * so we can respond quickly on first-load if we have data. Since this is ultimately being used
   * as a remote request mechanism for a stitched schema, we reject the promise if we see any errors.
   */
  async executeRemoteGraphQL (config: CloudExecuteRemote): Promise<Partial<OperationResult>> {
    // TODO(tim): remove this when we start doing remote requests to public APIs
    if (!this.ctx.user) {
      return { data: null }
    }

    const requestPolicy = config.requestPolicy ?? 'cache-first'

    const isQuery = config.operationType !== 'mutation'

    const executeCall = isQuery ? 'executeQuery' : 'executeMutation'

    const executingQuery = this._cloudUrqlClient[executeCall](createRequest(config.query, config.variables), {
      fetch: this.ctx.util.fetch,
      requestPolicy,
      fetchOptions: {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `bearer ${this.ctx.user.authToken}`,
          'x-cypress-version': pkg.version,
        },
      },
    })

    if (requestPolicy === 'cache-and-network' && isQuery) {
      let resolvedData: OperationResult | undefined = undefined
      const dfd = pDefer<OperationResult>()
      const pipeline = pipe(
        executingQuery,
        subscribe((res) => {
          debug('executeRemoteGraphQL subscribe res %o', res)

          if (!resolvedData) {
            resolvedData = res

            // Ignore the error when there's no internet connection
            if (res.error?.networkError) {
              debug('executeRemoteGraphQL network error', res.error)
              dfd.resolve({ ...res, error: undefined, data: null })
            } else if (res.error) {
              dfd.reject(res.error)
            } else {
              dfd.resolve(res)
            }
          } else if ((!_.isEqual(resolvedData.data, res.data) || !_.isEqual(resolvedData.error, res.error)) && !res.error?.networkError) {
            if (res.error) {
              this.ctx.coreData.dashboardGraphQLError = {
                cypressError: getError('DASHBOARD_GRAPHQL_ERROR', res.error),
              }
            } else {
              this.ctx.coreData.dashboardGraphQLError = null
            }

            if (config.onCacheUpdate) {
              config.onCacheUpdate()
            } else {
              // TODO(tim): send a signal to the frontend so when it refetches it does 'cache-only' request,
              // since we know we're up-to-date
              this.ctx.emitter.toApp()
              this.ctx.emitter.toLaunchpad()
            }
          }

          if (!res.stale) {
            pipeline.unsubscribe()
          }
        }),
      )

      return dfd.promise
    }

    // take(1) completes the stream immediately after the first value was emitted
    // avoiding it to hang forever on query operations
    // https://github.com/FormidableLabs/urql/issues/298
    return pipe(executingQuery, take(1), toPromise).then((data) => {
      debug('executeRemoteGraphQL toPromise res %o', data)

      if (data.error) {
        throw data.error
      }

      return data
    })
  }
}
