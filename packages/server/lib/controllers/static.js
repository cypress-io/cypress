const send = require('send')
/**
 * @type {import('@packages/resolve-dist')}
 */
const { getPathToDist } = require('@packages/resolve-dist')

module.exports = {
  handle (req, res) {
    const pathToFile = getPathToDist('static', req.params[0])

    return send(req, pathToFile)
    .pipe(res)
  },
}
