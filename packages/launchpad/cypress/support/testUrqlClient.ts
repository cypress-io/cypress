import { Client, createClient, dedupExchange, errorExchange, cacheExchange } from '@urql/core'
// import { cacheExchange } from '@urql/exchange-graphcache'
import { executeExchange } from '@urql/exchange-execute'
import { graphqlSchema } from '@packages/graphql'
import type { ClientTestContext } from '../../src/graphql/ClientTestContext'

interface TestUrqlClientConfig {
  context: ClientTestContext
  rootValue?: any
}

export function testUrqlClient (config: TestUrqlClientConfig): Client {
  return createClient({
    url: '/graphql',
    exchanges: [
      dedupExchange,
      cacheExchange,
      errorExchange({
        onError (error) {
          // eslint-disable-next-line
          console.error(error)
        },
      }),
      executeExchange({
        schema: graphqlSchema,
        ...config,
      }),
    ],
  })
}
