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
import { pubSubExchange } from './urqlExchangePubsub'
import { client } from '@packages/socket/lib/browser'

const GRAPHQL_PORT = window.location.search.slice(9)
const GRAPHQL_URL = `http://localhost:${GRAPHQL_PORT}/graphql`

const io = client(`http://localhost:${GRAPHQL_PORT}`, {
  transports: ['websocket'],
})

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
    pubSubExchange(io),
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
