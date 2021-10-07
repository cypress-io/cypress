import express from 'express'
import { addGraphQLHTTP } from '@packages/graphql/src/server'
import type { AddressInfo } from 'net'
import type { DataContext } from '@packages/data-context'
import pDefer from 'p-defer'
import cors from 'cors'
import type { Server } from 'http'
import { SocketIOServer } from '@packages/socket'

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

  const srv = graphqlServer = app.listen(() => {
    const port = (srv.address() as AddressInfo).port
    const endpoint = `http://localhost:${port}/graphql`

    if (process.env.NODE_ENV === 'development') {
      /* eslint-disable-next-line no-console */
      console.log(`GraphQL server is running at ${endpoint}`)
    }

    ctx.debug(`GraphQL Server at ${endpoint}`)

    dfd.resolve(port)
  })

  let socketServer = new SocketIOServer(srv, {
    transports: ['websocket'],
  })

  ctx.emitter.setLaunchpadSocketServer(socketServer)

  return dfd.promise
}
