import {
  Client,
  createClient,
  dedupExchange,
  errorExchange,
  fetchExchange,
} from '@urql/core'
import { cacheExchange as graphcacheExchange } from '@urql/exchange-graphcache'

export function makeCacheExchange () {
  return graphcacheExchange({
    keys: {
      App: (data) => data.__typename,
      Wizard: (data) => data.__typename,
    },
  })
}

export function makeUrqlClient (): Client {
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
      // https://formidable.com/open-source/urql/docs/graphcache/errors/
      makeCacheExchange(),
      fetchExchange,
    ],
  })
}
