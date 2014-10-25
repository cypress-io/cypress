Domain      = require("domain")
url         = require("url")
Through     = require("through")
hyperquest  = require("hyperquest")
mime        = require("mime")
path        = require("path")
_           = require("lodash")
fs          = require("fs")
fsUtil      = new (require("../util/file_helpers"))

module.exports = class extends require('events').EventEmitter
  handle: (req, res, next) =>
    ## strip out the /__remote/ from the req.url
    if not req.session.remote?
      throw new Error("™ Session Proxy not yet set! ™")

    uri = req.url.split("/__remote/").join("")

    domain = Domain.create()

    domain.on('error', next)

    domain.run =>
      @getContentSteam({
        uri: uri,
        remote: req.session.remote,
        res: res
      }).pipe(res)

  getContentSteam: (opts) ->
    switch type = fsUtil.detectType(opts.uri)
      when "absolute" then @pipeAbsolutePath(opts, opts.res)
      when "file"     then @pipeFileContent(opts.uri, opts.res)
      when "url"      then @pipeUrlContent(opts.uri, opts.res)
      else
        throw new Error "Unable to handle type #{type}"

  pipeUrlContent: (uri, res) ->
    @emit "verbose", "piping url content #{uri}"
    th = Through((b) -> this.queue(b))
    hq = hyperquest.get uri, {}, (err, incomingRes) ->
      res.contentType(incomingRes?.headers['content-type'])
      hq.pipe(th)
    th

  pipeFileContent: (uri, res) ->
    @emit "verbose", "piping url content #{uri}"
    if (~uri.indexOf('file://'))
      uri = uri.split('file://')[1]

    @pipeFileUriContents.apply(this, arguments)

  ## creates a read stream to a file stored on the users filesystem
  ## taking into account if they've chosen a specific rootFolder
  ## that their project files exist in
  pipeFileUriContents: (uri, res) ->
    ## strip off any query params from our req's url
    ## since we're pulling this from the file system
    ## it does not understand query params
    baseUri = url.parse(uri).pathname

    res.contentType(mime.lookup(baseUri))

    args = _.compact([process.cwd(), app.get("eclectus").rootFolder, baseUri])

    fs.createReadStream(
      path.join(args...)
    )

  pipeAbsoluteFileContent: (uri, res) ->
    @emit "verbose", "piping url content #{uri}"
    @pipeFileUriContents.apply(this, arguments)

  pipeAbsolutePath: (paths, res) ->
    switch type = fsUtil.detectType(paths.remote)
      when "url"
        base = url.parse(paths.remote)
        base = base.protocol + "//" + base.hostname + paths.uri

        @pipeUrlContent(base, res)
      when "file"
        @pipeFileContent(paths.remote + paths.uri, res)
      when "absolute"
        @pipeAbsoluteFileContent(paths.uri, res)
      else
        throw new Error "Unable to handle path for '#{type}': " + JSON.stringify(paths)
