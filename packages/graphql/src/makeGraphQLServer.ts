import express from 'express'
import type { AddressInfo } from 'net'
import { DataContext, getCtx, globalPubSub } from '@packages/data-context'
import pDefer from 'p-defer'
import cors from 'cors'
import { SocketIOServer } from '@packages/socket'
import type { Server } from 'http'
import { graphqlHTTP, GraphQLParams } from 'express-graphql'
import serverDestroy from 'server-destroy'

import { graphqlSchema } from './schema'
import { parse } from 'graphql'

const SHOW_GRAPHIQL = process.env.CYPRESS_INTERNAL_ENV !== 'production'

let gqlSocketServer: SocketIOServer
let gqlServer: Server

globalPubSub.on('reset:data-context', (ctx) => {
  ctx.setGqlServer(gqlServer)
  ctx.setGqlSocketServer(gqlSocketServer)
})

export async function makeGraphQLServer () {
  const dfd = pDefer<number>()
  const app = express()

  app.use(cors())

  app.get('/__cypress/shiki-themes', (req, res) => {
    res.json([{}, {}])
  })

  app.get('/__cypress/launchpad-preload', (req, res) => {
    const ctx = getCtx()

    ctx.html.fetchLaunchpadInitialData().then((data) => {
      res.json(data)
    }).catch((e) => {
      ctx.logError(e)
      res.json({})
    })
  })

  addGraphQLHTTP(app)

  const graphqlPort = process.env.CYPRESS_INTERNAL_GRAPHQL_PORT

  let srv: Server

  function listenCallback () {
    const ctx = getCtx()
    const port = (srv.address() as AddressInfo).port

    const endpoint = `http://localhost:${port}/graphql`

    if (process.env.NODE_ENV === 'development') {
      /* eslint-disable-next-line no-console */
      console.log(`GraphQL server is running at ${endpoint}`)
    }

    ctx.debug(`GraphQL Server at ${endpoint}`)

    gqlServer = srv

    ctx.setGqlServer(srv)

    dfd.resolve(port)
  }

  srv = graphqlPort ? app.listen(graphqlPort, listenCallback) : app.listen(listenCallback)

  serverDestroy(srv)

  gqlSocketServer = new SocketIOServer(srv, {
    path: '/__gqlSocket',
    transports: ['websocket'],
  })

  getCtx().setGqlSocketServer(gqlSocketServer)

  return dfd.promise
}

function addGraphQLHTTP (app: ReturnType<typeof express>) {
  app.use('/graphql/:operationName?', graphqlHTTP((req, res, params) => {
    const context = getCtx()
    const ctx = SHOW_GRAPHIQL ? maybeProxyContext(params, context) : context

    return {
      schema: graphqlSchema,
      graphiql: SHOW_GRAPHIQL,
      context: ctx,
    }
  }))

  return app
}

/**
 * Adds runtime validations during development to ensure patterns of access are enforced
 * on the DataContext
 */
function maybeProxyContext (params: GraphQLParams | undefined, context: DataContext): DataContext {
  if (params?.query) {
    const parsed = parse(params.query)
    const def = parsed.definitions[0]

    if (def?.kind === 'OperationDefinition') {
      return def.operation === 'query' ? proxyContext(context, def.name?.value ?? '(anonymous)') : context
    }
  }

  return context
}

function proxyContext (ctx: DataContext, operationName: string) {
  return new Proxy(ctx, {
    get (target, p, receiver) {
      // Allows us to get the context value, deref'ed so it's not guarded
      if (p === 'deref') {
        return Reflect.get(ctx, 'deref', ctx)
      }

      if (p === 'actions' || p === 'emitter') {
        throw new Error(
          `Cannot access ctx.${p} within a query, only within mutations / outside of a GraphQL request\n` +
          `Seen in operation: ${operationName}`,
        )
      }

      return Reflect.get(target, p, receiver)
    },
  })
}
