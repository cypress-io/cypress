import { graphqlHTTP } from 'express-graphql'
import express from 'express'
import Debug from 'debug'
import type { Server } from 'http'
import type { AddressInfo } from 'net'
import cors from 'cors'
import getenv from 'getenv'
import { graphqlSchema } from './schema'
import type { DataContext } from '@packages/data-context'

const debug = Debug('cypress:server:graphql')
const GRAPHQL_PORT = getenv.int('CYPRESS_INTERNAL_GQL_PORT', 52159)

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
let dataContext: DataContext | undefined

// Injected this way, since we want to set this up where the IPC layer
// is established in the server package, which should be an independent
// layer from GraphQL
export function setDataContext (ctx: DataContext) {
  dataContext = ctx

  return ctx
}

export function startGraphQLServer ({ port }: { port: number } = { port: GRAPHQL_PORT }): Promise<{
  server: Server
  app: Express.Application
  endpoint: string
}> {
  app = express()

  app.use(cors())

  app.use('/graphql', graphqlHTTP((req) => {
    if (!dataContext) {
      throw new Error(`setDataContext has not been called`)
    }

    return {
      schema: graphqlSchema,
      graphiql: true,
      context: dataContext,
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
