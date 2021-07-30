import { Client } from '@urql/core'
// import { graphqlSchema } from '@packages/server/lib/graphql/schema'
import { ClientTestContext } from '@packages/server/lib/graphql/context/ClientTestContext'
// import { graphql, print } from 'graphql'
import { makeUrqlClient } from '../../src/graphql/urqlClient'

export function testApolloClient (ctx: ClientTestContext): Client {
  // const ipcLink = new ApolloLink((op) => {
  //   return new Observable((obs) => {
  //     graphql({
  //       source: print(op.query),
  //       schema: graphqlSchema,
  //       contextValue: ctx,
  //     }).then((result) => {
  //       obs.next(result as FetchResult)
  //       obs.complete()
  //     }).catch((err) => {
  //       obs.error(err)
  //       obs.complete()
  //     })
  //   })
  // })

  return makeUrqlClient()
}
