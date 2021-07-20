import { graphqlHTTP } from 'express-graphql'
import express from 'express'
import Debug from 'debug'

import { graphqlSchema } from './schema'
import type { AddressInfo } from 'net'
import { ExecContext } from './ExecContext'

const debug = Debug('cypress:server:graphql')

export function startGraphQLServer () {
  const app = express()

  app.use('/graphql', graphqlHTTP(() => {
    return {
      schema: graphqlSchema,
      graphiql: true,
      context: new ExecContext({}),
    }
  }))

  const srv = app.listen(52159, () => {
    debug(`GraphQL Server at http://localhost:${(srv.address() as AddressInfo).port}/graphql`)
  })

  return {
    server: srv,
    app,
  }
}
