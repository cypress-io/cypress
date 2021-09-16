import {
  Client,
  createClient,
  dedupExchange,
  errorExchange,
  cacheExchange,
  fetchExchange,
} from '@urql/core'
import { GRAPHQL_URL } from '../utils/env'

export function makeUrqlClient (): Client {
  return createClient({
    url: GRAPHQL_URL,
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
