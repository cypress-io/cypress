// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const statuses = require('http-status-codes')

const isOkStatusCodeRe = /^[2|3]\d+$/

module.exports = {
  isOk (code) {
    return code && isOkStatusCodeRe.test(code)
  },

  //# TODO: test this method
  getText (code) {
    try {
      return statuses.getStatusText(code)
    } catch (e) {
      return 'Unknown Status Code'
    }
  },
}
