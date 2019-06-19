// TODO: move this into lib/util/uri.js
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
