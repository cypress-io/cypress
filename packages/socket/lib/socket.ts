import buffer from 'buffer'
import type http from 'http'
import server, { Server as SocketIOBaseServer, ServerOptions, Socket, Namespace } from 'socket.io'

export type { Socket, Namespace as SocketIONamespace }

const { version } = require('socket.io-client/package.json')
const clientSource = require.resolve('socket.io-client/dist/socket.io.js')

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

// TODO: I don't know that this is used anywhere?
export const getPathToClientSource = () => {
  return clientSource
}

export const getClientVersion = () => {
  return version
}
