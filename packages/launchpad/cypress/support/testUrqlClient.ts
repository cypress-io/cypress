import { cacheExchange, Client, createClient, dedupExchange, errorExchange } from '@urql/core'
import { executeExchange } from '@urql/exchange-execute'
import { combinedSchema } from '@packages/graphql'
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
        schema: combinedSchema,
        ...config,
      }),
    ],
  })
}
