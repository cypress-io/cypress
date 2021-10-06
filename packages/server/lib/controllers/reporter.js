const send = require('send')
/**
 * @type {import('@packages/resolve-dist')}
 */
const { resolveDistPath } = require('@packages/resolve-dist')

module.exports = {
  handle (req, res) {
    const pathToFile = resolveDistPath('reporter', req.params[0])

    return send(req, pathToFile)
    .pipe(res)
  },
}
