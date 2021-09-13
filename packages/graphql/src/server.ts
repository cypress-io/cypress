import { graphqlHTTP } from 'express-graphql'
import express from 'express'
import Debug from 'debug'
import type { Server } from 'http'
import type { AddressInfo } from 'net'

import { graphqlSchema } from './schema'
import type { BaseContext } from './context/BaseContext'
import { Query } from './entities/Query'

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

export function startGraphQLServer ({ port }: { port: number } = { port: 52159 }): Promise<{
  server: Server
  app: Express.Application
  endpoint: string
}> {
  app = express()

  app.use('/graphql', graphqlHTTP(() => {
    if (!serverContext) {
      throw new Error(`setServerContext has not been called`)
    }

    return {
      schema: graphqlSchema,
      graphiql: true,
      context: serverContext,
      rootValue: new Query(),
    }
  }))

  return new Promise((resolve, reject) => {
    server = app.listen(port, () => {
      if (process.env.NODE_ENV === 'development') {
        /* eslint-disable-next-line no-console */
        console.log(`GraphQL server is running at http://localhost:${port}/graphql`)
      }

      const endpoint = `http://localhost:${(server.address() as AddressInfo).port}/graphql`

      debug(`GraphQL Server at ${endpoint}`)

      return resolve({
        server,
        endpoint,
        app,
      })
    })
  })
}
