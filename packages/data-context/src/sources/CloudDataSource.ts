import type { DataContext } from '..'
import pDefer from 'p-defer'
import getenv from 'getenv'
import { pipe, subscribe, toPromise } from 'wonka'
import type { DocumentNode } from 'graphql'
import {
  createClient,
  cacheExchange,
  dedupExchange,
  fetchExchange,
  Client,
  createRequest,
  OperationResult,
  RequestPolicy,
} from '@urql/core'
import _ from 'lodash'

const cloudEnv = getenv('CYPRESS_INTERNAL_CLOUD_ENV', process.env.CYPRESS_INTERNAL_ENV || 'development') as keyof typeof REMOTE_SCHEMA_URLS

const REMOTE_SCHEMA_URLS = {
  staging: 'https://dashboard-staging.cypress.io',
  development: 'http://localhost:3000',
  production: 'https://dashboard.cypress.io',
}

export interface CloudExecuteRemote {
  query: string
  document?: DocumentNode
  variables: any
  requestPolicy?: RequestPolicy
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
      fetch: this.ctx.util.fetch,
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

    const requestPolicy = config.requestPolicy ?? 'cache-and-network'

    const executingQuery = this._cloudUrqlClient.executeQuery(createRequest(config.query, config.variables), {
      fetch: this.ctx.util.fetch,
      requestPolicy,
      fetchOptions: {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `bearer ${this.ctx.user.authToken}`,
        },
      },
    })

    if (requestPolicy === 'cache-and-network') {
      let resolvedData: OperationResult | undefined = undefined
      const dfd = pDefer<OperationResult>()
      const pipeline = pipe(
        executingQuery,
        subscribe((res) => {
          this.ctx.debug('executeRemoteGraphQL subscribe res %o', res)

          if (!resolvedData) {
            resolvedData = res
            if (res.error) {
              dfd.reject(res.error)
            } else {
              dfd.resolve(res)
            }
          } else if (!_.isEqual(resolvedData.data, res.data) || !_.isEqual(resolvedData.error, res.error)) {
            if (res.error) {
              this.ctx.coreData.baseError = {
                title: res.error.graphQLErrors[0]?.originalError?.name,
                message: res.error.message,
                stack: res.error.stack,
              }
            } else {
              this.ctx.coreData.baseError = null
            }

            // TODO(tim): send a signal to the frontend so when it refetches it does 'cache-only' request,
            // since we know we're up-to-date
            this.ctx.deref.emitter.toApp()
            this.ctx.deref.emitter.toLaunchpad()
          }

          if (!res.stale) {
            pipeline.unsubscribe()
          }
        }),
      )

      return dfd.promise
    }

    return pipe(executingQuery, toPromise).then((data) => {
      this.ctx.debug('executeRemoteGraphQL toPromise res %o', data)

      if (data.error) {
        throw data.error
      }

      return data
    })
  }
}
