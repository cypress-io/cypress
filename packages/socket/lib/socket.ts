import fs from 'fs'
import server, { Server as SocketIOServer } from 'socket.io'
import { client } from './browser'

const { version } = require('socket.io-client/package.json')
const clientSource = require.resolve('socket.io-client/dist/socket.io.js')

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
