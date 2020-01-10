const Promise = require('bluebird')
const { allowDestroy } = require('@packages/network')

module.exports = function (server) {
  allowDestroy(server)

  server.destroyAsync = () => {
    return Promise.promisify(server.destroy)()
    .catch(() => {}) // dont catch any errors
  }
}
