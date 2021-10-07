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

import { GRAPHQL_URL } from '../utils/env'

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
    },
  })
}

export function makeUrqlClient (): Client {
  const exchanges: Exchange[] = [
    dedupExchange,
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
