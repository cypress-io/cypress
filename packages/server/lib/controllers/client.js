const debug = require('debug')('cypress:server:controllers:client')
const socketIo = require('@packages/socket')

// hold onto the client source + version in memory
const clientSourcePath = socketIo.getPathToClientSource()
const clientVersion = socketIo.getClientVersion()

module.exports = {
  handle (req, res) {
    const etag = req.get('if-none-match')

    debug('serving socket.io client %o', { etag, clientVersion })

    if (etag && (etag === clientVersion)) {
      return res.sendStatus(304)
    }

    return res
    .type('text/javascript')
    .set('ETag', clientVersion)
    .status(200)
    // TODO: replace this entire file and sendFile call with `express.static`.
    .sendFile(clientSourcePath)
  },
}
