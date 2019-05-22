const fs = require('fs')
const path = require('path')
const server = require('socket.io')
const version = require('socket.io-client/package.json').version
const clientPath = require.resolve('socket.io-client')
const client = require('./client')

module.exports = {
  server,

  client,

  getPathToClientSource () {
    // clientPath returns the path to socket.io-client/lib/index.js
    // so walk up two levels to get to the root
    return path.join(clientPath, '..', '..', 'dist', 'socket.io.js')
  },

  getClientVersion () {
    return version
  },

  getClientSource () {
    return fs.readFileSync(this.getPathToClientSource(), 'utf8')
  },
}
