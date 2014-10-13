url     = require("url")
request = require("request")
path    = require("path")
fs      = require("fs")
fsUtil  = new (require("../util/file_helpers"))

module.exports = class extends require('events').EventEmitter
  handle: (req, res) =>
    ## strip out the /__remote/ from the req.url
    uri = req.url.split("/__remote/").join("")
    @getContentSteam(uri).pipe(res)

  getContentSteam: (uri) ->
    switch type = fsUtil.detectType(uri)
      # when "relative" then @pipeRelativeContent(uri)
      # when "file"     then @getFileContent(uri)
      when "url"      then @getUrlContent(uri)
      else
        throw new Error "Unable to handle type #{type}"

  getUrlContent: (uri) ->
    request.get(uri)

  getFileContent: (obj) ->
    @pipeRelativeContent({
      proxyPath: obj.proxyPath.slice(7),
      path: obj.path
    })

  pipeRelativeContent: (obj) ->
    fs.createReadStream(
      path.join(process.cwd(), obj.path)
    )
