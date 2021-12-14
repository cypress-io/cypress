import {
  Client,
  createClient,
  dedupExchange,
  errorExchange,
  fetchExchange,
  Exchange,
  ssrExchange,
} from '@urql/core'
import type { SSRData } from '@urql/core/dist/types/exchanges/ssr'
import { devtoolsExchange } from '@urql/devtools'
import { useToast } from 'vue-toastification'
import { client } from '@packages/socket/lib/browser'

import { cacheExchange as graphcacheExchange } from '@urql/exchange-graphcache'
import { urqlCacheKeys } from '@packages/data-context/src/util/urqlCacheKeys'

import { pubSubExchange } from './urqlExchangePubsub'
import { namedRouteExchange } from './urqlExchangeNamedRoute'
import { latestMutationExchange } from './urqlExchangeLatestMutation'

const GQL_PORT_MATCH = /gqlPort=(\d+)/.exec(window.location.search)
const SERVER_PORT_MATCH = /serverPort=(\d+)/.exec(window.location.search)

const toast = useToast()

export function makeCacheExchange () {
  return graphcacheExchange(urqlCacheKeys)
}

declare global {
  interface Window {
    __CYPRESS_INITIAL_DATA__: SSRData
    __CYPRESS_GRAPHQL_PORT__?: string
  }
}

function gqlPort () {
  if (GQL_PORT_MATCH) {
    return GQL_PORT_MATCH[1]
  }

  if (window.__CYPRESS_GRAPHQL_PORT__) {
    return window.__CYPRESS_GRAPHQL_PORT__
  }

  throw new Error(`${window.location.href} cannot be visited without a gqlPort`)
}

export async function preloadLaunchpadData () {
  try {
    const resp = await fetch(`http://localhost:${gqlPort()}/__cypress/launchpad-preload`)

    window.__CYPRESS_INITIAL_DATA__ = await resp.json()
  } catch {
    //
  }
}

export function makeUrqlClient (target: 'launchpad' | 'app'): Client {
  const port = gqlPort()

  const GRAPHQL_URL = `http://localhost:${port}/graphql`

  // If we're in the launchpad, we connect to the known GraphQL Socket port,
  // otherwise we connect to the /__socket.io of the current domain, unless we've explicitly
  //
  const io = getPubSubSource({ target, gqlPort: port, serverPort: SERVER_PORT_MATCH?.[1] })

  let hasError = false

  const exchanges: Exchange[] = [
    dedupExchange,
    pubSubExchange(io),
    latestMutationExchange,
    errorExchange({
      onError (error) {
        const message = `
        GraphQL Field Path: [${error.graphQLErrors[0].path?.join(', ')}]:

        ${error.message}

        ${error.stack ?? ''}
      `

        if (process.env.NODE_ENV !== 'production' && !hasError) {
          hasError = true
          toast.error(message, {
            timeout: false,
            onClose () {
              hasError = false
            },
          })
        }

        // eslint-disable-next-line
        console.error(error)
      },
    }),
    // https://formidable.com/open-source/urql/docs/graphcache/errors/
    makeCacheExchange(),
    ssrExchange({
      isClient: true,
      initialState: window.__CYPRESS_INITIAL_DATA__ ?? {},
    }),
    namedRouteExchange,
    // TODO(tim): add this when we want to use the socket as the GraphQL
    // transport layer for all operations
    // target === 'launchpad' ? fetchExchange : socketExchange(io),
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

interface PubSubConfig {
  target: 'launchpad' | 'app'
  gqlPort: string
  serverPort?: string
}

function getPubSubSource (config: PubSubConfig) {
  if (config.target === 'launchpad') {
    return client(`http://localhost:${config.gqlPort}`, {
      path: '/__gqlSocket',
      transports: ['websocket'],
    })
  }

  // Only happens during testing
  if (config.serverPort) {
    return client(`http://localhost:${config.serverPort}`, {
      path: '/__socket.io',
      transports: ['websocket'],
    })
  }

  return client({
    path: '/__socket.io',
    transports: ['websocket'],
  })
}

// TODO(tim): add this when we want to use the socket as the GraphQL
// transport layer for all operations
// const socketExchange = (io: Socket): Exchange => {
//   return (input) => {
//     return (ops$) => {
//     }
//   }
// }
