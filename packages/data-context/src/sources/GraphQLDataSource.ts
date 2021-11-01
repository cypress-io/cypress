import { createClient, Client, dedupExchange, ssrExchange } from '@urql/core'
import { cacheExchange } from '@urql/exchange-graphcache'
import { executeExchange } from '@urql/exchange-execute'
import type { GraphQLSchema } from 'graphql'
import type { DataContextShell } from '../DataContextShell'
import type * as allOperations from '../gen/all-operations.gen'

type AllQueries<T> = {
  [K in keyof T]: K
}[keyof T]

export class GraphQLDataSource {
  private _urqlClient: Client
  private _ssr: ReturnType<typeof ssrExchange>

  constructor (private ctx: DataContextShell, private schema: GraphQLSchema) {
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
        cacheExchange(),
        this._ssr,
        executeExchange({
          schema: this.schema,
          context: this.ctx,
        }),
      ],
    })
  }
}
