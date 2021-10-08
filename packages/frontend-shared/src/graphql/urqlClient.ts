import {
  Client,
  createClient,
  dedupExchange,
  errorExchange,
  Exchange,
  fetchExchange,
} from '@urql/core'
import { devtoolsExchange } from '@urql/devtools'
import VueToast, { ToastPluginApi } from 'vue-toast-notification'
import 'vue-toast-notification/dist/theme-sugar.css'

export { VueToast }

import { cacheExchange as graphcacheExchange } from '@urql/exchange-graphcache'
import { pubSubExchange } from './urqlExchangePubsub'
import { client } from '@packages/socket/lib/browser'

const GRAPHQL_PORT = window.location.search.slice(9)
const GRAPHQL_URL = `http://localhost:${GRAPHQL_PORT}/graphql`

const io = client(`http://localhost:${GRAPHQL_PORT}`, {
  transports: ['websocket'],
})

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
