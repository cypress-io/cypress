url     = require("url")
request = require("request")
path    = require("path")
fs      = require("fs")
fsUtil  = new (require("../util/file_helpers"))

module.exports = class extends require('events').EventEmitter
  handle: (req, res) =>
    ## strip out the /__remote/ from the req.url
    uri = req.url.split("/__remote/").join("")
    @getContentSteam({
      uri: uri,
      remote: req.session.remote
    }).pipe(res)

  getContentSteam: (paths) ->
    switch type = fsUtil.detectType(paths.uri)
      when "absolute" then @pipeAbsolutePath(paths)
      when "file"     then @pipeFileContent(paths.uri)
      when "url"      then @pipeUrlContent(paths.uri)
      else
        throw new Error "Unable to handle type #{type}"

  pipeUrlContent: (uri) ->
    @emit "verbose", "piping url content #{uri}"
    request.get(uri)

  pipeFileContent: (uri) ->
    @emit "verbose", "piping url content #{uri}"

    if (~uri.indexOf('file://'))
      uri = uri.split('file://')[1]

    fs.createReadStream(
      path.resolve(process.cwd(), uri)
    )

  pipeAbsoluteFileContent: (uri) ->
    @emit "verbose", "piping url content #{uri}"

    fs.createReadStream(
      path.resolve(process.cwd(), uri)
    )

  pipeAbsolutePath: (paths) ->
    switch type = fsUtil.detectType(paths.remote)
      when "url"
        base = url.parse(paths.remote)
        base = base.protocol + "//" + base.hostname + paths.uri

        @pipeUrlContent(base)
      when "file"
        @pipeFileContent(paths.remote + paths.uri)
      when "absolute"
        @pipeAbsoluteFileContent(paths.uri)
      else
        throw new Error "Unable to handle path for '#{type}': " + JSON.stringify(paths)
