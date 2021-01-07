import fs from 'fs'
import http from 'http'
import server, { Server as SocketIOBaseServer, ServerOptions } from 'socket.io'
import { client } from './browser'

const HUNDRED_MEGABYTES = 1e8 // 100000000

const { version } = require('socket.io-client/package.json')
const clientSource = require.resolve('socket.io-client/dist/socket.io.js')

export { ServerOptions }

// socket.io types are incorrect
type PatchedServerOptions = ServerOptions & { cookie: { name: string | boolean } }

class SocketIOServer extends SocketIOBaseServer {
  constructor (srv: http.Server, opts?: Partial<PatchedServerOptions>) {
    // in socket.io v3, they reduced down the max buffer size
    // from 100mb to 1mb, so we reset it back to the previous value
    //
    // previous commit for reference:
    // https://github.com/socketio/engine.io/blame/61b949259ed966ef6fc8bfd61f14d1a2ef06d319/lib/server.js#L29
    opts = opts ?? {}
    opts.maxHttpBufferSize = opts.maxHttpBufferSize ?? HUNDRED_MEGABYTES

    super(srv, opts)
  }
}

export {
  client,
  server,
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
