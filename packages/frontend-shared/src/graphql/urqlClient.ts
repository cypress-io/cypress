import {
  Client,
  createClient,
  dedupExchange,
  errorExchange,
  cacheExchange,
  fetchExchange,
} from '@urql/core'

export function makeUrqlClient (): Client {
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
