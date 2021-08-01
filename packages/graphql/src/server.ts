import { graphqlHTTP } from 'express-graphql'
import express from 'express'
import Debug from 'debug'
import type { Server } from 'http'
import type { AddressInfo } from 'net'

import { graphqlSchema } from './schema'
import type { BaseContext } from './context/BaseContext'

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

// singleton during the lifetime of the application
let serverContext: BaseContext | undefined

// Injected this way, since we want to set this up where the IPC layer
// is established in the server package, which should be an independent
// layer from GraphQL
export function setServerContext (ctx: BaseContext) {
  serverContext = ctx

  return ctx
}

export function startGraphQLServer (): {server: Server, app: Express.Application} {
  app = express()

  app.use('/graphql', graphqlHTTP(() => {
    if (!serverContext) {
      throw new Error(`setServerContext has not been called`)
    }

    return {
      schema: graphqlSchema,
      graphiql: true,
      context: serverContext,
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
