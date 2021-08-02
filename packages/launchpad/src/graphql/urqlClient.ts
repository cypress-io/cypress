import {
  Client,
  createClient,
  dedupExchange,
  cacheExchange,
  errorExchange,
  fetchExchange,
} from '@urql/core'

import { initGraphQLIPC } from './graphqlIpc'

export function makeUrqlClient (): Client {
  initGraphQLIPC()

  // TODO: investigate creating ipcExchange
  return createClient({
    url: 'http://localhost:52159/graphql',
    exchanges: [
      dedupExchange,
      cacheExchange,
      errorExchange({
        onError (error) {
          // eslint-disable-next-line
          console.error(error)
        },
      }),
      fetchExchange,
    ],
  })
}
