/* eslint-disable
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require('lodash')
const send = require('send')
const reporter = require('@packages/reporter/lib/resolve-dist')

module.exports = {
  handle (req, res) {
    const pathToFile = reporter.getPathToDist(req.params[0])

    return send(req, pathToFile)
    .pipe(res)
  },
}
