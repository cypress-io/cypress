const _ = require('lodash')
const fs = require('fs')
const server = require('socket.io')
const debug = require('debug')('cypress:socket')
const { version: clientVersion } = require('socket.io-client/package.json')
const { client, circularParser } = require('./browser')

// hold onto the client source code + version in memory
const clientSourcePath = require.resolve('socket.io-client/dist/socket.io.js')
const clientSource = fs.readFileSync(clientSourcePath, 'utf8')

const getClientVersion = _.constant(clientVersion)
const getClientSource = _.constant(clientSource)
const getPathToClientSource = _.constant(clientSourcePath)

module.exports = {
  server,

  client,

  circularParser,

  getClientVersion,

  getClientSource,

  getPathToClientSource,

  handle (req, res) {
    const etag = req.get('if-none-match')

    debug('serving socket.io client %o', { etag, clientVersion })

    if (etag && (etag === clientVersion)) {
      return res.sendStatus(304)
    }

    return res
    .type('application/javascript')
    .set('ETag', clientVersion)
    .status(200)
    .send(clientSource)
  },
}
