import { Client, createClient, dedupExchange, errorExchange } from '@urql/core'
import { executeExchange } from '@urql/exchange-execute'
import { makeCacheExchange } from './urqlClient'
import type * as stubCloudData from './testStubCloudTypes'
import type * as stubData from './testStubData'
import type { app as stubApp } from './testApp'
import type { wizard as stubWizard } from './testWizard'
import type { query as stubQuery } from './testQuery'
import type { navigationMenu } from './testNavigationMenu'
import { clientTestSchema } from './clientTestSchema'

export interface ClientTestContext {
  stubData: typeof stubData
  stubCloudData: typeof stubCloudData
  stubApp: typeof stubApp
  navigationMenu: typeof navigationMenu
  stubWizard: typeof stubWizard
  stubQuery: typeof stubQuery
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
