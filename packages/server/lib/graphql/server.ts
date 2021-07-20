import { graphqlHTTP } from 'express-graphql'
import express from 'express'
import Debug from 'debug'
import { Server } from 'http'
import type { AddressInfo } from 'net'

import { graphqlSchema } from './schema'
import { ExecContext } from './ExecContext'

const debug = Debug('cypress:server:graphql')

let app: ReturnType<typeof express>
let server: Server

export async function closeGraphQLServer () {
  if (!server) {
    return
  }

  return new Promise<void>((res, rej) => {
    server.close((err) => {
      if (err) {
        rej(err)
      }

      res()
    })
  })
}

export function startGraphQLServer () {
  app = express()

  app.use('/graphql', graphqlHTTP(() => {
    return {
      schema: graphqlSchema,
      graphiql: true,
      context: new ExecContext({}),
    }
  }))

  server = app.listen(52159, () => {
    debug(`GraphQL Server at http://localhost:${(server.address() as AddressInfo).port}/graphql`)
  })

  return {
    server,
    app,
  }
}
