const fs = require('fs')
const path = require('path')
const server = require('socket.io')
const { version } = require('socket.io-client/package.json')
const { client, circularParser } = require('./browser')

const clientPath = require.resolve('socket.io-client')

module.exports = {
  server,

  client,

  circularParser,

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
