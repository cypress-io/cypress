import {
  Client,
  createClient,
  dedupExchange,
  errorExchange,
  fetchExchange,
  Exchange,
  ssrExchange,
} from '@urql/core'
import { devtoolsExchange } from '@urql/devtools'
import { useToast } from 'vue-toastification'
import { client } from '@packages/socket/lib/browser'

import { cacheExchange as graphcacheExchange } from '@urql/exchange-graphcache'
import { urqlCacheKeys } from '@packages/data-context/src/util/urqlCacheKeys'
import { urqlSchema } from '../generated/urql-introspection.gen'

import { pubSubExchange } from './urqlExchangePubsub'
import { namedRouteExchange } from './urqlExchangeNamedRoute'
import { decodeBase64Unicode } from '../utils/decodeBase64'
import type { SpecFile, AutomationElementId } from '@packages/types'

const toast = useToast()

export function makeCacheExchange (schema: any = urqlSchema) {
  return graphcacheExchange({ ...urqlCacheKeys, schema })
}

declare global {
  interface Window {
    __CYPRESS_INITIAL_DATA__: string
    __CYPRESS_MODE__: 'run' | 'open'
    __RUN_MODE_SPECS__: SpecFile[]
    __CYPRESS_CONFIG__: {
      base64Config: string
      namespace: AutomationElementId
    }
  }
}

const cypressInRunMode = window.top === window && window.__CYPRESS_MODE__ === 'run'

export async function preloadLaunchpadData () {
  try {
    const resp = await fetch('/__launchpad/preload')

    window.__CYPRESS_INITIAL_DATA__ = JSON.parse(decodeBase64Unicode(await resp.json()))
  } catch {
    //
  }
}

interface LaunchpadUrqlClientConfig {
  target: 'launchpad'
}

interface AppUrqlClientConfig {
  target: 'app'
  namespace: string
  socketIoRoute: string
}

export type UrqlClientConfig = LaunchpadUrqlClientConfig | AppUrqlClientConfig

export function makeUrqlClient (config: UrqlClientConfig): Client {
  let hasError = false

  const exchanges: Exchange[] = [dedupExchange]

  // GraphQL and urql are not used in app + run mode, so we don't add the
  // pub sub exchange.
  if (config.target === 'launchpad' || config.target === 'app' && !cypressInRunMode) {
    // If we're in the launchpad, we connect to the known GraphQL Socket port,
    // otherwise we connect to the /__socket.io of the current domain, unless we've explicitly
    //
    const io = getPubSubSource(config)

    exchanges.push(pubSubExchange(io))
  }

  exchanges.push(
    errorExchange({
      onError (error) {
        const message = `
        GraphQL Field Path: [${error.graphQLErrors?.[0]?.path?.join(', ')}]:

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
      // @ts-ignore - this seems fine locally, but on CI tsc is failing - bizarre.
      initialState: (window.__CYPRESS_INITIAL_DATA__ ? JSON.parse(decodeBase64Unicode(window.__CYPRESS_INITIAL_DATA__)) : {}),
    }),
    namedRouteExchange,
    // TODO(tim): add this when we want to use the socket as the GraphQL
    // transport layer for all operations
    // target === 'launchpad' ? fetchExchange : socketExchange(io),
    fetchExchange,
  )

  if (import.meta.env.DEV) {
    exchanges.unshift(devtoolsExchange)
  }

  const url = config.target === 'launchpad' ? `/__launchpad/graphql` : `/${config.namespace}/graphql`

  return createClient({
    url,
    requestPolicy: cypressInRunMode ? 'cache-only' : 'cache-and-network',
    exchanges,
  })
}

interface LaunchpadPubSubConfig {
  target: 'launchpad'
}

interface AppPubSubConfig {
  target: 'app'
  socketIoRoute: string
}

type PubSubConfig = LaunchpadPubSubConfig | AppPubSubConfig

function getPubSubSource (config: PubSubConfig) {
  if (config.target === 'launchpad') {
    return client({
      path: '/__gqlSocket',
      transports: ['websocket'],
    })
  }

  return client({
    path: config.socketIoRoute,
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
