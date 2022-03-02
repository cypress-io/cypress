import type { Exchange, Client } from '@urql/core'
import {
  createClient,
  dedupExchange,
  errorExchange,
  fetchExchange,
  ssrExchange,
} from '@urql/core'
import { devtoolsExchange } from '@urql/devtools'
import { useToast } from 'vue-toastification'
import type { Socket } from '@packages/socket/lib/browser'
import { client } from '@packages/socket/lib/browser'

import { cacheExchange as graphcacheExchange } from '@urql/exchange-graphcache'
import { urqlCacheKeys } from '@packages/data-context/src/util/urqlCacheKeys'

import { urqlSchema } from '../generated/urql-introspection.gen'

import { pubSubExchange } from './urqlExchangePubsub'
import { namedRouteExchange } from './urqlExchangeNamedRoute'
import { decodeBase64Unicode } from '../utils/base64'
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
    __CYPRESS_INITIAL_DATA__: object
    __CYPRESS_INITIAL_DATA_ENCODED__: string
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

export async function preloadLaunchpadData () {
  try {
    const resp = await fetch('/__launchpad/preload')

    window.__CYPRESS_INITIAL_DATA__ = await resp.json()
  } catch (e) {
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

  const io = window.ws ?? getPubSubSource(config)

  // GraphQL and urql are not used in app + run mode, so we don't add the
  // pub sub exchange.
  if (config.target === 'launchpad' || config.target === 'app' && !cypressInRunMode) {
    // If we're in the launchpad, we connect to the known GraphQL Socket port,
    // otherwise we connect to the /__socket.io of the current domain, unless we've explicitly

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
      initialState: (window.__CYPRESS_INITIAL_DATA_ENCODED__
        ? JSON.parse(decodeBase64Unicode(window.__CYPRESS_INITIAL_DATA_ENCODED__))
        : window.__CYPRESS_INITIAL_DATA__) || {},
    }),
    namedRouteExchange,
    fetchExchange,
  )

  if (import.meta.env.DEV) {
    exchanges.unshift(devtoolsExchange)
  }

  const url = config.target === 'launchpad' ? `/__launchpad/graphql` : `/${config.namespace}/graphql`

  return createClient({
    url,
    requestPolicy: cypressInRunMode ? 'cache-only' : 'cache-first',
    exchanges,

    // Rather than authoring a custom exchange, let's just polyfill the "fetch"
    // exchange to adapt to a similar interface. This way it'll be simple to
    // swap in-and-out during integration tests.
    fetch: config.target === 'launchpad' || window.__CYPRESS_GQL_NO_SOCKET__ ? window.fetch : urqlFetchSocketAdapter(io),
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
