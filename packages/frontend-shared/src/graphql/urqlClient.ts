import {
  Client,
  createClient,
  dedupExchange,
  errorExchange,
  Exchange,
  fetchExchange,
} from '@urql/core'
import { devtoolsExchange } from '@urql/devtools'
import { cacheExchange as graphcacheExchange } from '@urql/exchange-graphcache'
import { GRAPHQL_URL } from '../utils/env'
import { pubSubExchange } from './urqlExchangePubsub'

export function makeCacheExchange () {
  return graphcacheExchange({
    keys: {
      App: (data) => data.__typename,
      Wizard: (data) => data.__typename,
    },
  })
}

export function makeUrqlClient (target: 'launchpad' | 'app'): Client {
  const exchanges: Exchange[] = [
    dedupExchange,
    pubSubExchange(),
    errorExchange({
      onError (error) {
        // eslint-disable-next-line
        console.error(error)
      },
    }),
    // https://formidable.com/open-source/urql/docs/graphcache/errors/
    makeCacheExchange(),
    fetchExchange,
  ]

  if (import.meta.env.DEV) {
    exchanges.unshift(devtoolsExchange)
  }

  return createClient({
    url: GRAPHQL_URL,
    requestPolicy: 'cache-and-network',
    exchanges,
  })
}
