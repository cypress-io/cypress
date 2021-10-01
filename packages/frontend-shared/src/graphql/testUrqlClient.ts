import { Client, createClient, dedupExchange, errorExchange } from '@urql/core'
import { executeExchange } from '@urql/exchange-execute'
import { makeCacheExchange } from './urqlClient'
import type * as stubCloudData from './testStubCloudTypes'
import type * as stubData from './testStubData'
import type { stubApp } from './testApp'
import type { stubWizard } from './testWizard'
import type { stubQuery } from './testQuery'
import type { navigationMenu as stubNavigationMenu } from './testNavigationMenu'
import { clientTestSchema } from './clientTestSchema'

export interface ClientTestContext {
  stubData: typeof stubData
  stubCloudData: typeof stubCloudData
  stubApp: typeof stubApp
  stubNavigationMenu: typeof stubNavigationMenu
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
