import {
  Client,
  createClient,
  dedupExchange,
  errorExchange,
  fetchExchange,
  Exchange,
} from '@urql/core'
import { devtoolsExchange } from '@urql/devtools'
import VueToast, { ToastPluginApi } from 'vue-toast-notification'
import { client } from '@packages/socket/lib/browser'

import 'vue-toast-notification/dist/theme-sugar.css'

export { VueToast }

import { cacheExchange as graphcacheExchange } from '@urql/exchange-graphcache'
import { pubSubExchange } from './urqlExchangePubsub'

const GQL_PORT_MATCH = /gqlPort=(\d+)/.exec(window.location.search)
const SERVER_PORT_MATCH = /serverPort=(\d+)/.exec(window.location.search)

declare global {
  interface Window {
    $app?: { $toast: ToastPluginApi }
  }
}

export function makeCacheExchange () {
  return graphcacheExchange({
    keys: {
      App: (data) => data.__typename,
      Wizard: (data) => data.__typename,
      GitInfo: () => null,
    },
  })
}

export function makeUrqlClient (target: 'launchpad' | 'app'): Client {
  let gqlPort: string

  if (GQL_PORT_MATCH) {
    gqlPort = GQL_PORT_MATCH[1]
  } else {
    // @ts-ignore
    gqlPort = window.__CYPRESS_GRAPHQL_PORT__
  }

  if (!gqlPort) {
    throw new Error(`${window.location.href} cannot be visited without a gqlPort`)
  }

  const GRAPHQL_URL = `http://localhost:${gqlPort}/graphql`

  // If we're in the launchpad, we connect to the known GraphQL Socket port,
  // otherwise we connect to the /__socket.io of the current domain, unless we've explicitly
  //
  const io = getPubSubSource({ target, gqlPort, serverPort: SERVER_PORT_MATCH?.[1] })

  const exchanges: Exchange[] = [
    dedupExchange,
    pubSubExchange(io),
    errorExchange({
      onError (error) {
        const message = `
        GraphQL Field Path: [${error.graphQLErrors[0].path?.join(', ')}]:<br>
        ${error.message}<br>
      `

        window.$app?.$toast.error(message, {
          message,
          duration: 0,
        })

        // eslint-disable-next-line
        console.error(error)
      },
    }),
    // https://formidable.com/open-source/urql/docs/graphcache/errors/
    makeCacheExchange(),
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
