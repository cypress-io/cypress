import { cacheExchange, Client, createClient, dedupExchange, errorExchange } from '@urql/core'
import { graphqlSchema } from '@packages/server/lib/graphql/schema'
import { ClientTestContext } from '@packages/server/lib/graphql/context/ClientTestContext'
import { executeExchange } from '@urql/exchange-execute'

export function testApolloClient (ctx: ClientTestContext): Client {
  return createClient({
    url: '/graphql',
    exchanges: [
      dedupExchange,
      cacheExchange,
      errorExchange({
        onError (error) {
          // eslint-disable-next-line
          console.error(error)
        },
      }),
      executeExchange({
        schema: graphqlSchema,
        context: ctx,
      }),
    ],
  })
}
