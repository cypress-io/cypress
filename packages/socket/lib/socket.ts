import fs from 'fs'
import type http from 'http'
import server, { Server as SocketIOBaseServer, ServerOptions } from 'socket.io'
import { client } from './browser'

const FIVE_HUNDRED_MEGABYTES = 5 * 1e8 // 500000000

const { version } = require('socket.io-client/package.json')
const clientSource = require.resolve('socket.io-client/dist/socket.io.js')

export { ServerOptions }

// socket.io types are incorrect
type PatchedServerOptions = ServerOptions & { cookie: { name: string | boolean } }

class SocketIOServer extends SocketIOBaseServer {
  constructor (srv: http.Server, opts?: Partial<PatchedServerOptions>) {
    // in socket.io v4, the default maxHttpBufferSize is set to 1 MB to mitigate
    // the potential of DoS attacks. given that our usage is limited to a local network,
    // we can safely increase the buffer size to allow larger payloads over the
    // socket. this is particularly helpful for large I/O processes (readFile/writeFile).
    //
    // related issue: https://github.com/cypress-io/cypress/issues/3350
    opts = opts ?? {}
    opts.maxHttpBufferSize = opts.maxHttpBufferSize ?? FIVE_HUNDRED_MEGABYTES

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
