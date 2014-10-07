url     = require("url")
request = require("request")
path    = require("path")
fs      = require("fs")
fsUtil  = require("../util/file_helpers")

module.exports = class extends require('events').EventEmitter
  handle: (req, res) =>
    @getContentSteam(
      path: url.parse(req.url).pathname
      proxyPath: req.session.proxyUrl
    )
    .pipe(res)

  getContentSteam: (obj) ->
    if fsUtil.isRelativeRequest(obj.proxyPath)
      @pipeRelativeContent(obj)
    else
      request.get(obj.proxyPath + obj.path)

  pipeRelativeContent: (obj) ->
    fs.createReadStream(
      path.join(process.cwd(), obj.path)
    )
