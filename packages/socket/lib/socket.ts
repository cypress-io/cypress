import fs from 'fs'
import buffer from 'buffer'
import type http from 'http'
import server, { Server as SocketIOBaseServer, ServerOptions, Socket, Namespace } from 'socket.io'
import path from 'path'

export type { Socket, Namespace as SocketIONamespace }

const { version } = require('socket.io-client/package.json')
let clientSource: string

export { ServerOptions }

// socket.io types are incorrect
type PatchedServerOptions = ServerOptions & { cookie: { name: string | boolean } }

class SocketIOServer extends SocketIOBaseServer {
  constructor (srv: http.Server, opts?: Partial<PatchedServerOptions>) {
    opts = opts ?? {}

    // the maxHttpBufferSize is used to limit the message size sent over
    // the socket. Small values can be used to mitigate exposure to
    // denial of service attacks; the default as of v3.0 is 1MB.
    // because our server is local, we do not need to arbitrarily limit
    // the message size and can use the theoretical maximum value.
    opts.maxHttpBufferSize = opts.maxHttpBufferSize ?? buffer.constants.MAX_LENGTH

    super(srv, opts)
  }
}

export {
  server,
  SocketIOServer,
}

export const getPathToClientSource = () => {
  if (!clientSource) {
    clientSource = path.join(__dirname, '..', 'node_modules', 'socket.io-client', 'dist', 'socket.io.js')
  }

  return clientSource
}

export const getClientVersion = () => {
  return version
}

export const getClientSource = () => {
  return fs.readFileSync(getPathToClientSource(), 'utf8')
}
