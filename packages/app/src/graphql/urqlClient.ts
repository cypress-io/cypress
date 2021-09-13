import {
  Client,
  createClient,
  dedupExchange,
  errorExchange,
  fetchExchange,
} from '@urql/core'
import { cacheExchange as graphCacheExchange } from '@urql/exchange-graphcache'

export function makeCacheExchange () {
  return graphCacheExchange({
    // @ts-ignore
    schema: urqlSchema,
    keys: {
      NavigationMenu: (data) => data.__typename,
      App: (data) => data.__typename,
      Wizard: (data) => data.__typename,
    },
  })
}

export function makeUrqlClient (): Client {
  // TODO: investigate creating ipcExchange
  return createClient({
    url: 'http://localhost:52159/graphql',
    requestPolicy: 'cache-and-network',
    exchanges: [
      dedupExchange,
      errorExchange({
        onError (error) {
          // eslint-disable-next-line
          console.error(error)
        },
      }),
      makeCacheExchange(),
      fetchExchange,
    ],
  })
}
