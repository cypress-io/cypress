import type { DataContext } from '..'
import pDefer from 'p-defer'
import getenv from 'getenv'
import { pipe, subscribe } from 'wonka'
import type { DocumentNode } from 'graphql'
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

const cloudEnv = getenv('CYPRESS_INTERNAL_CLOUD_ENV', process.env.CYPRESS_INTERNAL_ENV || 'development') as keyof typeof REMOTE_SCHEMA_URLS

const REMOTE_SCHEMA_URLS = {
  staging: 'https://dashboard-staging.cypress.io',
  development: 'http://localhost:3000',
  production: 'https://dashboard.cypress.io',
}

export interface CloudExecuteRemote {
  query: string
  document: DocumentNode
  variables: any
}

export class CloudDataSource {
  private _urqlClient: Client

  constructor (private ctx: DataContext) {
    this._urqlClient = createClient({
      url: `${REMOTE_SCHEMA_URLS[cloudEnv]}/test-runner-graphql`,
      exchanges: [
        dedupExchange,
        cacheExchange,
        fetchExchange,
      ],
      fetch: this.ctx.util.fetch,
    })
  }

  async executeRemoteGraphQL (config: CloudExecuteRemote): Promise<Partial<OperationResult>> {
    if (!this.ctx.user) {
      return { data: null }
    }

    const dfd = pDefer<OperationResult>()

    const executingQuery = this._urqlClient.executeQuery(createRequest(config.document, config.variables), {
      fetch: this.ctx.util.fetch,
      requestPolicy: 'cache-and-network',
      fetchOptions: {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `bearer ${this.ctx.user.authToken}`,
        },
      },
    })

    let resolvedData: OperationResult | undefined = undefined

    const pipeline = pipe(
      executingQuery,
      subscribe((res) => {
        if (!resolvedData) {
          resolvedData = res
          dfd.resolve(res)
        } else if (!_.isEqual(resolvedData.data, res.data) || !_.isEqual(resolvedData.error, res.error)) {
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
}
