import { graphqlHTTP } from 'express-graphql'
import express from 'express'

import { graphqlSchema } from './schema'
import type { AddressInfo } from 'net'
import { ExecContext } from './ExecContext'

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
    // eslint-disable-next-line
    console.log(`GraphQL Server at http://localhost:${(srv.address() as AddressInfo).port}/graphql`)
  })

  return {
    server: srv,
    app,
  }
}
