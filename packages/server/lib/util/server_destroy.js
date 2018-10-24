// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Promise = require('bluebird')
const allowDestroy = require('server-destroy')

module.exports = function (server) {
  allowDestroy(server)

  server.destroyAsync = () => {
    return Promise.promisify(server.destroy)()
    .catch(() => {})
  }
}
//# dont catch any errors
