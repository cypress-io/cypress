import { Client, createClient, dedupExchange, errorExchange } from '@urql/core'
import { executeExchange } from '@urql/exchange-execute'
import { makeCacheExchange } from './urqlClient'
import type * as stubData from './testStubCloudTypes'
import type { navigationMenu } from './testNavigationMenu'
import { clientTestSchema } from './clientTestSchema'

export interface ClientTestContext {
  stubData: typeof stubData
  navigationMenu: typeof navigationMenu
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
        schema: clientTestSchema,
        ...config,
      }),
    ],
  })
}
