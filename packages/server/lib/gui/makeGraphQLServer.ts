import express from 'express'
import { addGraphQLHTTP } from '@packages/graphql/src/server'
import type { AddressInfo } from 'net'
import type { DataContext } from '@packages/data-context'
import pDefer from 'p-defer'
import cors from 'cors'
import { SocketIOServer } from '@packages/socket'

export async function makeGraphQLServer (ctx: DataContext) {
  const dfd = pDefer<number>()
  const app = express()

  app.use(cors())

  app.get('/__cypress/shiki-themes', (req, res) => {
    res.json([{}, {}])
  })

  // TODO: Figure out how we want to cleanup & juggle the config, so
  // it's not jammed into the projects
  addGraphQLHTTP(app, ctx)

  const srv = app.listen(() => {
    const port = (srv.address() as AddressInfo).port

    const endpoint = `http://localhost:${port}/graphql`

    if (process.env.NODE_ENV === 'development') {
      /* eslint-disable-next-line no-console */
      console.log(`GraphQL server is running at ${endpoint}`)
    }

    ctx.debug(`GraphQL Server at ${endpoint}`)

    ctx.setGqlServer(srv)

    dfd.resolve(port)
  })

  const socketServer = new SocketIOServer(srv, {
    path: '/__gqlSocket',
    transports: ['websocket'],
  })

  ctx.emitter.setLaunchpadSocketServer(socketServer)

  return dfd.promise
}
