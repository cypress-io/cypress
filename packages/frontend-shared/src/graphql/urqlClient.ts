import type { Exchange, Client } from '@urql/core'
import {
  createClient,
  dedupExchange,
  errorExchange,
  fetchExchange,
  subscriptionExchange,
} from '@urql/core'
import { devtoolsExchange } from '@urql/devtools'
import { useToast } from 'vue-toastification'
import type { Socket } from '@packages/socket/lib/browser'
import { client } from '@packages/socket/lib/browser'
import { createClient as createWsClient } from 'graphql-ws'

import { cacheExchange as graphcacheExchange } from '@urql/exchange-graphcache'
import { urqlCacheKeys } from '@packages/data-context/src/util/urqlCacheKeys'

import { urqlSchema } from '../generated/urql-introspection.gen'

import { pubSubExchange } from './urqlExchangePubsub'
import { namedRouteExchange } from './urqlExchangeNamedRoute'
import type { SpecFile, AutomationElementId, Browser } from '@packages/types'
import { urqlFetchSocketAdapter } from './urqlFetchSocketAdapter'

const toast = useToast()

export function makeCacheExchange (schema: any = urqlSchema) {
  return graphcacheExchange({ ...urqlCacheKeys, schema })
}

declare global {
  interface Window {
    ws?: Socket
    /**
     * We can set this in onBeforeLoad in Cypress tests, allowing us
     * to use cy.intercept in tests that we need it
     */
    __CYPRESS_GQL_NO_SOCKET__?: string
    __CYPRESS_MODE__: 'run' | 'open'
    __RUN_MODE_SPECS__: SpecFile[]
    __CYPRESS_TESTING_TYPE__: 'e2e' | 'component'
    __CYPRESS_BROWSER__: Partial<Browser> & {majorVersion: string | number}
    __CYPRESS_CONFIG__: {
      base64Config: string
      namespace: AutomationElementId
    }
  }
}

const cypressInRunMode = window.top === window && window.__CYPRESS_MODE__ === 'run'

interface LaunchpadUrqlClientConfig {
  target: 'launchpad'
}

interface AppUrqlClientConfig {
  target: 'app'
  namespace: string
  socketIoRoute: string
}

export type UrqlClientConfig = LaunchpadUrqlClientConfig | AppUrqlClientConfig

export async function makeUrqlClient (config: UrqlClientConfig): Promise<Client> {
  let hasError = false

  const exchanges: Exchange[] = [dedupExchange]

  const io = getPubSubSource(config)

  const connectPromise = new Promise<void>((resolve) => {
    io.once('connect', resolve)
  })

  const socketClient = getSocketSource(config)

  // GraphQL and urql are not used in app + run mode, so we don't add the
  // pub sub exchange.
  if (config.target === 'launchpad' || config.target === 'app' && !cypressInRunMode) {
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
    namedRouteExchange,
    fetchExchange,
    subscriptionExchange({
      forwardSubscription (op) {
        return {
          subscribe: (sink) => {
            // @ts-ignore
            const dispose = socketClient.subscribe(op, sink)

            return {
              unsubscribe: dispose,
            }
          },
        }
      },
    }),
  )

  if (import.meta.env.DEV) {
    exchanges.unshift(devtoolsExchange)
  }

  const url = config.target === 'launchpad' ? `/__launchpad/graphql` : `/${config.namespace}/graphql`

  const client = createClient({
    url,
    requestPolicy: cypressInRunMode ? 'cache-only' : 'cache-first',
    exchanges,

    // Rather than authoring a custom exchange, let's just polyfill the "fetch"
    // exchange to adapt to a similar interface. This way it'll be simple to
    // swap in-and-out during integration tests.
    fetch: config.target === 'launchpad' || window.__CYPRESS_GQL_NO_SOCKET__ ? window.fetch : urqlFetchSocketAdapter(io),
  })

  await connectPromise

  return client
}

interface LaunchpadPubSubConfig {
  target: 'launchpad'
}

interface AppPubSubConfig {
  target: 'app'
  socketIoRoute: string
}

type PubSubConfig = LaunchpadPubSubConfig | AppPubSubConfig

// We need a dedicated socket.io namespace, rather than re-use the one provided via the runner
// at window.ws, because the event-manager calls .off() on its socket instance when Cypress
// execution is stopped. We need to make sure the events here are long-lived.
function getPubSubSource (config: PubSubConfig) {
  if (config.target === 'launchpad') {
    return client('/data-context', {
      path: '/__launchpad/socket',
      transports: ['websocket'],
    })
  }

  return client('/data-context', {
    path: config.socketIoRoute,
    transports: ['websocket'],
  })
}

function getSocketSource (config: UrqlClientConfig) {
  // http: -> ws:  &  https: -> wss:
  const protocol = window.location.protocol.replace('http', 'ws')
  const wsUrl = config.target === 'launchpad'
    ? `ws://${window.location.host}/__launchpad/graphql-ws`
    : `${protocol}//${window.location.host}${config.socketIoRoute}-graphql`

  return createWsClient({
    url: wsUrl,
  })
}
