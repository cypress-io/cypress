import {
  Client,
  createClient,
  dedupExchange,
  errorExchange,
  cacheExchange,
  fetchExchange,
} from '@urql/core'
// import { cacheExchange } from '@urql/exchange-graphcache'

import { initGraphQLIPC } from './graphqlIpc'

export function makeUrqlClient (): Client {
  initGraphQLIPC()

  // TODO: investigate creating ipcExchange
  return createClient({
    url: 'http://localhost:52159/graphql',
    exchanges: [
      dedupExchange,
      cacheExchange,
      errorExchange({
        onError (error) {
          // eslint-disable-next-line
          console.error(error)
        },
      }),
      fetchExchange,
    ],
  })
}
