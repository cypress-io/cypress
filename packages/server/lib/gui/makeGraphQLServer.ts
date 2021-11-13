import express from 'express'
import { addGraphQLHTTP } from '@packages/graphql/src/server'
import type { AddressInfo } from 'net'
import type { DataContext } from '@packages/data-context'
import pDefer from 'p-defer'
import cors from 'cors'
import { SocketIOServer } from '@packages/socket'
import type { Server } from 'http'
import serverDestroy from 'server-destroy'

export async function makeGraphQLServer (ctx: DataContext) {
  const dfd = pDefer<number>()
  const app = express()

  app.use(cors())

  app.get('/__cypress/shiki-themes', (req, res) => {
    res.json([{}, {}])
  })

  app.get('/__cypress/launchpad-preload', (req, res) => {
    ctx.html.fetchLaunchpadInitialData().then((data) => res.json(data)).catch((e) => {
      ctx.logError(e)
      res.json({})
    })
  })

  // TODO: Figure out how we want to cleanup & juggle the config, so
  // it's not jammed into the projects
  addGraphQLHTTP(app, ctx)

  const graphqlPort = process.env.CYPRESS_INTERNAL_GRAPHQL_PORT

  let srv: Server

  function listenCallback () {
    const port = (srv.address() as AddressInfo).port

    const endpoint = `http://localhost:${port}/graphql`

    if (process.env.NODE_ENV === 'development') {
      /* eslint-disable-next-line no-console */
      console.log(`GraphQL server is running at ${endpoint}`)
    }

    ctx.debug(`GraphQL Server at ${endpoint}`)

    ctx.setGqlServer(srv)

    dfd.resolve(port)
  }

  srv = graphqlPort ? app.listen(graphqlPort, listenCallback) : app.listen(listenCallback)

  serverDestroy(srv)

  const socketServer = new SocketIOServer(srv, {
    path: '/__gqlSocket',
    transports: ['websocket'],
  })

  ctx.setGqlSocketServer(socketServer)

  return dfd.promise
}
