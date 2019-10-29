const fs = require('fs')
const server = require('socket.io')
const { join } = require('path')
const { version } = require('socket.io-client/package.json')
const { client, circularParser } = require('./browser')
const resolvePkg = require('resolve-pkg')

const clientSource = resolvePkg('socket.io-client/dist/socket.io.js', { cwd: join(__dirname, '..', '..', '..') })

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
