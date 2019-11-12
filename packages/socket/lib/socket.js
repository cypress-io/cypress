const fs = require('fs')
const server = require('socket.io')
const path = require('path')
const pkg = require('socket.io-client/package.json')
const { client, circularParser } = require('./browser')
const resolvePkg = require('resolve-pkg')

module.exports = {
  server,

  client,

  circularParser,

  getPathToClientSource () {
    const clientSource = resolvePkg('socket.io-client/dist/socket.io.js', { cwd: path.join(__dirname, '..', '..', '..') })

    if (fs.existsSync(clientSource)) {
      return clientSource
    }

    return require.resolve('socket.io-client/dist/socket.io.js')
  },

  getClientVersion () {
    return pkg.version
  },

  getClientSource () {
    return fs.readFileSync(this.getPathToClientSource(), 'utf8')
  },
}
