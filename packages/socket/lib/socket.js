const fs = require('fs')
const path = require('path')
const server = require('socket.io')
const version = require('socket.io/package').version
const clientPath = require.resolve('socket.io/lib/client')
const client = require(clientPath)

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
