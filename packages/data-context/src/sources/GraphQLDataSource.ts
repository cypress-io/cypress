import { createClient, Client, dedupExchange, ssrExchange } from '@urql/core'
import { cacheExchange } from '@urql/exchange-graphcache'
import { executeExchange } from '@urql/exchange-execute'
import { GraphQLSchema, introspectionFromSchema } from 'graphql'
import type { DataContext } from '../DataContext'
import type * as allOperations from '../gen/all-operations.gen'
import { urqlCacheKeys } from '../util/urqlCacheKeys'

// Filter out non-Query shapes
type AllQueries<T> = {
  [K in keyof T]: T[K] extends { __resultType?: infer U }
    ? U extends { __typename?: 'Query' }
      ? K
      : never
    : never
}[keyof T]

export class GraphQLDataSource {
  private _urqlClient: Client
  private _ssr: ReturnType<typeof ssrExchange>

  constructor (private ctx: DataContext, private schema: GraphQLSchema) {
    this._ssr = ssrExchange({ isClient: false })
    this._urqlClient = this.makeClient()
  }

  resetClient () {
    this._urqlClient = this.makeClient()
  }

  private _allQueries?: typeof allOperations

  executeQuery (document: AllQueries<typeof allOperations>, variables: Record<string, any>) {
    // Late require'd to avoid erroring if codegen hasn't run (for legacy Cypress workflow)
    const allQueries = (this._allQueries ??= require('../gen/all-operations.gen'))

    if (!allQueries[document]) {
      throw new Error(`Trying to execute unknown operation ${document}, needs to be one of: [${Object.keys(allQueries).join(', ')}]`)
    }

    return this._urqlClient.query(allQueries[document], variables).toPromise()
  }

  getSSRData () {
    return this._ssr.extractData()
  }

  private makeClient () {
    return createClient({
      url: `__`,
      exchanges: [
        dedupExchange,
        cacheExchange({ ...urqlCacheKeys, schema: introspectionFromSchema(this.schema) }),
        this._ssr,
        executeExchange({
          schema: this.schema,
          context: this.ctx,
        }),
      ],
    })
  }
}
