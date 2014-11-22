Domain      = require 'domain'
url         = require 'url'
Through     = require 'through'
hyperquest  = require 'hyperquest'
mime        = require 'mime'
path        = require 'path'
_           = require 'lodash'
fs          = require 'fs'
fsUtil      = new (require('../util/file_helpers'))
UrlMerge    = require '../util/url_merge'
httpProxy   = require 'http-proxy'

escapeRegExp = (str) ->
  str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

module.exports = class extends require('events').EventEmitter
  handle: (req, res, next) =>
    ## strip out the /__remote/ from the req.url
    if not req.session.remote?
      if r = app.get('eclectus').rootUrl
        req.session.remote = r
      else
        throw new Error("™ Session Proxy not yet set! ™")

    uri = req.url.split("/__remote/").join("")

    proxy = httpProxy.createProxyServer({})

    domain = Domain.create()

    domain.on('error', next)

    domain.run =>
      @getContentSteam({
        uri: uri,
        remote: req.session.remote,
        req: req
        res: res
        proxy: proxy
      })
      .on('error', (e) -> throw e)
      .pipe(res)

  getContentSteam: (opts) ->
    switch type = fsUtil.detectType(opts.uri)
      when "absolute" then @pipeAbsolutePath(opts, opts.res)
      when "file"     then @pipeFileContent(opts.uri, opts.res)
      when "url"      then @pipeUrlContent(opts)
      else
        throw new Error "Unable to handle type #{type}"

  pipeUrlContent: (opts) ->
    @emit "verbose", "piping url content #{opts.uri}, #{opts.uri.split(opts.remote)[1]}"

    remote = url.parse(opts.remote)

    opts.req.url = opts.req.url.replace(/\/__remote\//, "")
    opts.req.url = url.resolve(opts.remote, opts.req.url or "")

    remote.path = "/"
    remote.pathname = "/"

    ## If the path is relative from root
    ## like foo.com/../
    ## we need to handle when it walks up past the root host and into
    ## the http:// part, so we need to fix the request url to contain
    ## the correct root.

    requestUrlBase = url.parse(opts.req.url)
    requestUrlBase = _.extend(requestUrlBase, {
      path: "/"
      pathname: "/"
      query: ""
      search: ""
    })

    requestUrlBase = escapeRegExp(requestUrlBase.format())

    unless (remote.format().match(///^#{requestUrlBase}///))
      basePath = url.parse(opts.req.url).path
      basePath = basePath.replace /\/$/, ""
      opts.req.url = remote.format() + url.parse(opts.req.url).host + basePath

    opts.proxy.web(opts.req, opts.res, {
      target: remote.format()
      changeOrigin: true,
      hostRewrite: opts.req.session.host
    })

    opts.res

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

  pipeAbsolutePath: (opts, res) ->
    switch type = fsUtil.detectType(opts.remote)
      when "url"
        @pipeUrlContent(opts)
      when "file"
        @pipeFileContent(opts.remote + opts.uri, res)
      when "absolute"
        @pipeAbsoluteFileContent(opts.uri, res)
      else
        throw new Error "Unable to handle path for '#{type}': " + JSON.stringify(opts)
