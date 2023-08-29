import express, { Request } from 'express'
import type { AddressInfo, Socket } from 'net'
import { DataContext, getCtx, globalPubSub, GraphQLRequestInfo } from '@packages/data-context'
import pDefer from 'p-defer'
import cors from 'cors'
import { SocketIONamespace, SocketIOServer } from '@packages/socket'
import type { Server } from 'http'
import { graphqlHTTP } from 'express-graphql'
import serverDestroy from 'server-destroy'
import send from 'send'
import { getPathToDist } from '@packages/resolve-dist'
import httpProxy from 'http-proxy'
import debugLib from 'debug'
import { Server as WebSocketServer } from 'ws'
import { useServer } from 'graphql-ws/lib/use/ws'

import { graphqlSchema } from './schema'
import { DefinitionNode, DocumentNode, execute, Kind, OperationDefinitionNode, OperationTypeNode, parse } from 'graphql'

const debug = debugLib(`cypress-verbose:graphql:operation`)

const IS_DEVELOPMENT = process.env.CYPRESS_INTERNAL_ENV !== 'production'

let gqlSocketServer: SocketIONamespace
let gqlServer: Server

globalPubSub.on('reset:data-context', (ctx) => {
  ctx.actions.servers.setGqlServer(gqlServer)
  ctx.actions.servers.setGqlSocketServer(gqlSocketServer)
})

export async function makeGraphQLServer () {
  const dfd = pDefer<number>()
  const app = express()

  app.use(cors())

  app.get('/cloud-notification', (req, res) => {
    const ctx = getCtx()

    const operationName = req.query.operationName

    if (!operationName || Array.isArray(operationName)) {
      res.sendStatus(200)

      return
    }

    switch (operationName) {
      case 'orgCreated':
        ctx.cloud.invalidate('Query', 'cloudViewer')
        .then(() => {
          ctx.emitter.cloudViewerChange()
        })
        .catch(ctx.logTraceError)

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

  const ctx = getCtx()
  const graphqlPort = process.env.CYPRESS_INTERNAL_GRAPHQL_PORT

  let srv: Server

  function listenCallback () {
    const port = (srv.address() as AddressInfo).port

    const endpoint = `http://localhost:${port}/__launchpad/graphql`

    if (process.env.NODE_ENV === 'development') {
      /* eslint-disable-next-line no-console */
      console.log(`GraphQL server is running at ${endpoint}`)
    }

    debug(`GraphQL Server at ${endpoint}`)

    gqlServer = srv

    ctx.actions.servers.setGqlServer(srv)

    dfd.resolve(port)
  }

  srv = graphqlPort ? app.listen(graphqlPort, listenCallback) : app.listen(listenCallback)

  serverDestroy(srv)

  const socketSrv = new SocketIOServer(srv, {
    path: '/__launchpad/socket',
    transports: ['websocket'],
  })

  gqlSocketServer = socketSrv.of('/data-context')

  graphqlWS(srv, '/__launchpad/graphql-ws')

  gqlSocketServer.on('connection', (socket) => {
    socket.on('graphql:request', handleGraphQLSocketRequest)
  })

  ctx.actions.servers.setGqlSocketServer(gqlSocketServer)

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
    const context = getCtx()
    const document = parse(operation.query)

    DataContext.addActiveRequest()
    const result = await execute({
      operationName: operation.operationName,
      variableValues: operation.variables,
      document,
      schema: graphqlSchema,
      contextValue: graphqlRequestContext({
        app: 'app',
        context,
        document,
        variables: operation.variables ?? null,
      }),
    })

    callback(result)
  } catch (e) {
    callback({ data: null, errors: [e] })
  } finally {
    DataContext.finishActiveRequest()
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

  httpServer.on('upgrade', (req: Request, socket: Socket, head) => {
    if (req.url?.startsWith(targetRoute)) {
      return graphqlWs.handleUpgrade(req, socket, head, (client) => {
        graphqlWs.emit('connection', client, req)
      })
    }
  })

  useServer({
    schema: graphqlSchema,
    context: () => getCtx(),
  }, graphqlWs)

  return graphqlWs
}

/**
 * An Express middleware function handler which can be added to
 * routes expected to service a GraphQL request from an HTTP client.
 */
export const graphQLHTTP = graphqlHTTP((req, res, params) => {
  const context = getCtx()
  let document: DocumentNode | undefined

  // Parse the query ahead-of-time, so we can use in the graphqlRequestContext
  try {
    // @ts-expect-error
    document = parse(params.query)
  } catch {
    // error will be re-thrown in customParseFn below
  }

  return {
    schema: graphqlSchema,
    graphiql: IS_DEVELOPMENT,
    context: params && document ? graphqlRequestContext({
      req: req as Request,
      context,
      document,
      variables: params.variables,
    }) : undefined,
    customParseFn: (source) => {
      // No need to re-parse if we have a document, otherwise re-parse to throw the error
      return document ?? parse(source)
    },
    customExecuteFn: (args) => {
      const date = new Date()
      const prefix = `${args.operationName ?? '(anonymous)'}`

      DataContext.addActiveRequest()

      return Promise.resolve(execute(args)).then((val) => {
        debug(`${prefix} completed in ${new Date().valueOf() - date.valueOf()}ms with ${val.errors?.length ?? 0} errors`)

        return val
      }).finally(() => {
        DataContext.finishActiveRequest()
      })
    },
  }
})

interface GraphQLRequestContextOptions {
  app?: 'launchpad' | 'app'
  req?: Request
  context: DataContext
  document: DocumentNode
  variables: Record<string, unknown> | null
}

/**
 * Since the DataContext is considered a singleton throughout the electron app process,
 * we create a Proxy object for it, adding metadata associated each GraphQL operation.
 * This is used in middleware, such as the `nexusDeferIfNotLoadedPlugin`, to associate
 * remote requests to operations needing to be refetched on the client.
 */
function graphqlRequestContext (options: GraphQLRequestContextOptions) {
  const app = options.app ?? (options.req?.originalUrl.startsWith('/__launchpad') ? 'launchpad' : 'app')

  const primaryOperation = getPrimaryOperation(options.document)

  const requestInfo: GraphQLRequestInfo = {
    app,
    operation: (primaryOperation?.kind ?? 'query') as OperationTypeNode,
    document: options.document,
    headers: options.req?.headers ?? {},
    variables: options.variables,
    operationName: primaryOperation?.name?.value ?? null,
  }

  debug('Creating context for %s, operation %s', app, primaryOperation?.name?.value)

  return new Proxy(options.context, {
    get (target, p, receiver) {
      if (p === 'graphqlRequestInfo') {
        return requestInfo
      }

      if (p === 'actions' && IS_DEVELOPMENT && requestInfo.operation === 'query') {
        throw new Error(
          `Cannot access ctx.${p} within a query, only within mutations / outside of a GraphQL request\n` +
          `Seen in operation: ${requestInfo.operationName}`,
        )
      }

      return Reflect.get(target, p, receiver)
    },
  })
}

function getPrimaryOperation (query: DocumentNode): OperationDefinitionNode | undefined {
  return query.definitions.find(isOperationDefinitionNode)
}

function isOperationDefinitionNode (node: DefinitionNode): node is OperationDefinitionNode {
  return node.kind === Kind.OPERATION_DEFINITION
}
