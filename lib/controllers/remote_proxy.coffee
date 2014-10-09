url     = require("url")
request = require("request")
path    = require("path")
fs      = require("fs")
fsUtil  = new (require("../util/file_helpers"))

module.exports = class extends require('events').EventEmitter
  handle: (req, res) =>
    @getContentSteam(
      path: url.parse(req.url).pathname
      proxyPath: req.session.proxyUrl
      reqPath: req.path
    )
    .pipe(res)

  getContentSteam: (obj) ->
    if (!obj.proxyPath)
      throw new Error("no path set yet for #{obj.reqPath}")
    else
      switch type = fsUtil.detectType(obj.proxyPath)
        when "relative" then @pipeRelativeContent(obj)
        when "file"     then @getFileContent(obj)
        when "url"      then @getUrlContent(obj)
        else
          throw new Error "Unable to handle type #{type}"

  getUrlContent: (obj) ->
    request.get(obj.proxyPath + obj.path)

  getFileContent: (obj) ->
    @pipeRelativeContent({
      proxyPath: obj.proxyPath.slice(7),
      path: obj.path
    })

  pipeRelativeContent: (obj) ->
    fs.createReadStream(
      path.join(process.cwd(), obj.path)
    )
