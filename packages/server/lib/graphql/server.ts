import { graphqlHTTP } from 'express-graphql'
import express from 'express'
import Debug from 'debug'
import { Server } from 'http'
import type { AddressInfo } from 'net'

import { graphqlSchema } from './schema'
import { ServerContext } from './context/ServerContext'

const debug = Debug('cypress:server:graphql')

let app: ReturnType<typeof express>
let server: Server

export function closeGraphQLServer (): Promise<void | null> {
  if (!server || !server.listening) {
    return Promise.resolve(null)
  }

  return new Promise<void | null>((res, rej) => {
    server.close((err) => {
      if (err) {
        rej(err)
      }

      res(null)
    })
  })
}

export function startGraphQLServer (): {server: Server, app: Express.Application} {
  app = express()

  const context = new ServerContext()

  app.use('/graphql', graphqlHTTP(() => {
    return {
      schema: graphqlSchema,
      graphiql: true,
      context,
    }
  }))

  server = app.listen(52159, () => {
    if (process.env.NODE_ENV === 'development') {
      /* eslint-disable-next-line no-console */
      console.log('GraphQL server is running at http://localhost:52159/graphql')
    }

    debug(`GraphQL Server at http://localhost:${(server.address() as AddressInfo).port}/graphql`)
  })

  return {
    server,
    app,
  }
}
