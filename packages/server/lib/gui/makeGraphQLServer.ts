import express from 'express'
import { addGraphQLHTTP } from '@packages/graphql/src/server'
import type { AddressInfo } from 'net'
import type { DataContext } from '@packages/data-context'
import getenv from 'getenv'
import pDefer from 'p-defer'
import cors from 'cors'
import type { Server } from 'http'

const GRAPHQL_PORT = getenv.int('CYPRESS_INTERNAL_GQL_PORT', 52200)

let graphqlServer: Server | undefined

export async function closeGraphQLServer () {
  if (!graphqlServer) {
    return
  }

  const dfd = pDefer()

  graphqlServer.close((err) => {
    if (err) {
      dfd.reject()
    }

    dfd.resolve()
  })

  graphqlServer = undefined

  dfd.promise
}

export async function makeGraphQLServer (ctx: DataContext) {
  const dfd = pDefer<number>()
  const app = express()

  app.use(cors())

  // TODO: Figure out how we want to cleanup & juggle the config, so
  // it's not jammed into the projects
  addGraphQLHTTP(app, ctx)

  const srv = graphqlServer = app.listen(GRAPHQL_PORT, () => {
    const endpoint = `http://localhost:${(srv.address() as AddressInfo).port}/graphql`

    if (process.env.NODE_ENV === 'development') {
      /* eslint-disable-next-line no-console */
      console.log(`GraphQL server is running at ${endpoint}`)
    }

    ctx.debug(`GraphQL Server at ${endpoint}`)

    dfd.resolve(GRAPHQL_PORT)
  })

  return dfd.promise
}
