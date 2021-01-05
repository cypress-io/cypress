import fs from 'fs'
import server, { Server as SocketIOBaseServer, ServerOptions } from 'socket.io'
import { client } from './browser'
import http from 'http'

const { version } = require('socket.io-client/package.json')
const clientSource = require.resolve('socket.io-client/dist/socket.io.js')

export { ServerOptions }

// socket.io types are incorrect
type PatchedServerOptions = ServerOptions & { cookie: { name: string | boolean } }

class SocketIOServer extends SocketIOBaseServer {
  constructor (srv: http.Server, opts?: Partial<PatchedServerOptions>) {
    super(srv, opts)
  }
}

export {
  client,
  server,
  // circularParser,
  SocketIOServer,
}

export const getPathToClientSource = () => {
  return clientSource
}

export const getClientVersion = () => {
  return version
}

export const getClientSource = () => {
  return fs.readFileSync(getPathToClientSource(), 'utf8')
}
