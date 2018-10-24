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
const contentType = require('content-type')

module.exports = {
  getContentType (res, type) {
    try {
      return contentType.parse(res).type
    } catch (err) {
      return null
    }
  },

  hasContentType (res, type) {
    //# does the response object have a content-type
    //# that matches what we expect
    try {
      return contentType.parse(res).type === type
    } catch (err) {
      return false
    }
  },
}
