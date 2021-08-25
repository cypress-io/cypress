import {
  Client,
  createClient,
  dedupExchange,
  // cacheExchange,
  errorExchange,
  fetchExchange,
} from '@urql/core'
import { cacheExchange } from '@urql/exchange-graphcache'

import { initGraphQLIPC } from './graphqlIpc'

export function makeCacheExchange () {
  return cacheExchange({
    //
  })
}

export function makeUrqlClient (): Client {
  initGraphQLIPC()

  // TODO: investigate creating ipcExchange
  return createClient({
    url: 'http://localhost:52159/graphql',
    exchanges: [
      dedupExchange,
      makeCacheExchange(),
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
