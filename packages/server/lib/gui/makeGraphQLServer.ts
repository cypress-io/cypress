import express from 'express'
import { addGraphQLHTTP } from '@packages/graphql/src/server'
import type { AddressInfo } from 'net'
import type { DataContext } from '@packages/data-context'
import getenv from 'getenv'
import pDefer from 'p-defer'

const GRAPHQL_PORT = getenv.int('CYPRESS_INTERNAL_GQL_PORT', 52200)

export async function makeGraphQLServer (ctx: DataContext) {
  const dfd = pDefer<number>()
  const app = express()

  // TODO: Figure out how we want to cleanup & juggle the config, so
  // it's not jammed into the projects
  addGraphQLHTTP(app, ctx)

  const graphqlServer = app.listen(GRAPHQL_PORT, () => {
    const endpoint = `http://localhost:${(graphqlServer.address() as AddressInfo).port}/graphql`

    if (process.env.NODE_ENV === 'development') {
      /* eslint-disable-next-line no-console */
      console.log(`GraphQL server is running at ${endpoint}`)
    }

    ctx.debug(`GraphQL Server at ${endpoint}`)

    dfd.resolve(GRAPHQL_PORT)
  })

  return dfd.promise
}
