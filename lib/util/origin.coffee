url = require("url")

module.exports = (urlStr) ->
  parsed = url.parse(urlStr)

  parsed.hash     = null
  parsed.search   = null
  parsed.query    = null
  parsed.path     = null
  parsed.pathname = null

  url.format(parsed)
