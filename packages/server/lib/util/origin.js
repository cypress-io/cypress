// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const url = require('url')

module.exports = function (urlStr) {
  const parsed = url.parse(urlStr)

  parsed.hash = null
  parsed.search = null
  parsed.query = null
  parsed.path = null
  parsed.pathname = null

  return url.format(parsed)
}
