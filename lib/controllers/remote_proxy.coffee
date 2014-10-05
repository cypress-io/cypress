url     = require("url")
request = require("request")

module.exports = class extends require('events').EventEmitter
  handle: (req, res) ->
    request
    .get(req.session.proxyUrl + url.parse(req.url).pathname)
    .pipe(res)
