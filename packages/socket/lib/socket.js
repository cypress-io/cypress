const fs = require('fs')
const server = require('socket.io')
const { version } = require('socket.io-client/package.json')
const { client, circularParser } = require('./browser')

const clientSource = require.resolve('socket.io-client/dist/socket.io.js')

module.exports = {
  server,

  client,

  circularParser,

  getPathToClientSource () {
    return clientSource
  },

  getClientVersion () {
    return version
  },

  getClientSource () {
    return fs.readFileSync(this.getPathToClientSource(), 'utf8')
  },
}
