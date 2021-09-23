import { Client, createClient, dedupExchange, errorExchange } from '@urql/core'
import { executeExchange } from '@urql/exchange-execute'
import { graphqlSchema } from '@packages/graphql'
import { makeCacheExchange } from './urqlClient'
import type * as stubData from './testStubCloudTypes'

export interface ClientTestContext {
  stubData: typeof stubData
}

export interface TestUrqlClientConfig {
  context: ClientTestContext
  rootValue?: any
}

export function testUrqlClient (config: TestUrqlClientConfig): Client {
  return createClient({
    url: '/graphql',
    exchanges: [
      dedupExchange,
      errorExchange({
        onError (error) {
          // eslint-disable-next-line
          console.error(error)
        },
      }),
      makeCacheExchange(),
      executeExchange({
        schema: graphqlSchema,
        ...config,
      }),
    ],
  })
}
