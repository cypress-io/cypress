import express from 'express'
import type { AddressInfo, Socket } from 'net'
import { DataContext, getCtx, globalPubSub } from '@packages/data-context'
import pDefer from 'p-defer'
import cors from 'cors'
import { SocketIOServer } from '@packages/socket'
import type { Server } from 'http'
import { graphqlHTTP, GraphQLParams } from 'express-graphql'
import serverDestroy from 'server-destroy'
import send from 'send'
import { getPathToDist } from '@packages/resolve-dist'
import httpProxy from 'http-proxy'
import debugLib from 'debug'
import { Server as WebSocketServer } from 'ws'
import { useServer } from 'graphql-ws/lib/use/ws'

import { graphqlSchema } from './schema'
import { execute, parse } from 'graphql'

const debugOperation = debugLib(`cypress-verbose:graphql:operation`)

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

  app.get('/__launchpad/preload', (req, res) => {
    const ctx = getCtx()

    ctx.html.fetchLaunchpadInitialData().then((data) => {
      res.json(data)
    }).catch((e) => {
      ctx.logTraceError(e)
      res.json({})
    })
  })

  app.get('/cloud-notification', (req, res) => {
    const ctx = getCtx()

    const operationName = req.query.operationName

    if (!operationName || Array.isArray(operationName)) {
      res.sendStatus(200)

      return
    }

    switch (operationName) {
      case 'orgCreated':
        ctx.emitter.cloudViewerChange()
        break

      default:
        break
    }

    res.sendStatus(200)
  })

  app.use('/__launchpad/graphql/:operationName?', graphQLHTTP)

  function makeProxy (): express.Handler {
    if (process.env.CYPRESS_INTERNAL_VITE_DEV) {
      const viteProxy = httpProxy.createProxyServer({
        target: `http://localhost:${process.env.CYPRESS_INTERNAL_VITE_LAUNCHPAD_PORT}/`,
      })

      return (req, res) => {
        viteProxy.web(req, res, {}, (e) => {})
      }
    }

    return (req, res) => {
      send(req, req.params[0] ?? '', {
        root: getPathToDist('launchpad'),
      }).pipe(res)
    }
  }

  app.get('/__launchpad/*', makeProxy())

  const graphqlPort = process.env.CYPRESS_INTERNAL_GRAPHQL_PORT

  let srv: Server

  function listenCallback () {
    const ctx = getCtx()
    const port = (srv.address() as AddressInfo).port

    const endpoint = `http://localhost:${port}/__launchpad/graphql`

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
    path: '/__launchpad/socket',
    transports: ['websocket'],
  })

  graphqlWS(srv, '/__launchpad/graphql-ws')

  gqlSocketServer.on('connection', (socket) => {
    socket.on('graphql:request', handleGraphQLSocketRequest)
  })

  getCtx().setGqlSocketServer(gqlSocketServer)

  return dfd.promise
}

interface GraphQLSocketPayload {
  query: string
  variables?: Record<string, any>
  operationName?: string
}

// TODO: replace this w/ persisted queries
/**
 * Handles the GraphQL operation run over WebSockets,
 * rather than HTTP to clear up the console from extra chatter
 * that doesn't originate from the users' web app.
 * @param uid
 * @param data
 * @param callback
 */
export async function handleGraphQLSocketRequest (uid: string, payload: string, callback: Function) {
  try {
    const operation = JSON.parse(payload) as GraphQLSocketPayload

    const result = await execute({
      operationName: operation.operationName,
      variableValues: operation.variables,
      document: parse(operation.query),
      schema: graphqlSchema,
      contextValue: getCtx(),
    })

    callback(result)
  } catch (e) {
    callback({ data: null, errors: [e] })
  }
}

/**
 * Creates a new WSServer conforming to the GraphQL over Websocket protocol:
 * https://github.com/enisdenjo/graphql-ws/blob/master/PROTOCOL.md
 *
 * @param httpServer The http server we are utilizing for the websocket
 * @param targetRoute Route to target in the server upgrade event
 * @returns Disposable Function to cleanup the created server resource
 */
export const graphqlWS = (httpServer: Server, targetRoute: string) => {
  const graphqlWs = new WebSocketServer({ noServer: true })

  httpServer.on('upgrade', (req, socket: Socket, head) => {
    if (req.url.startsWith(targetRoute)) {
      return graphqlWs.handleUpgrade(req, socket, head, (client) => {
        graphqlWs.emit('connection', client, req)
      })
    }
  })

  return useServer({
    schema: graphqlSchema,
    context: () => getCtx(),
  }, graphqlWs)
}

export const graphQLHTTP = graphqlHTTP((req, res, params) => {
  const context = getCtx()
  const ctx = SHOW_GRAPHIQL ? maybeProxyContext(params, context) : context

  return {
    schema: graphqlSchema,
    graphiql: SHOW_GRAPHIQL,
    context: ctx,
    customExecuteFn: (args) => {
      const date = new Date()
      const prefix = `${args.operationName ?? '(anonymous)'}`

      return Promise.resolve(execute(args)).then((val) => {
        debugOperation(`${prefix} completed in ${new Date().valueOf() - date.valueOf()}ms with ${val.errors?.length ?? 0} errors`)

        return val
      })
    },
  }
})

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
