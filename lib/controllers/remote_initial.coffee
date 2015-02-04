fs            = require 'fs'
hyperquest    = require 'hyperquest'
through2      = require 'through2'
_             = require 'lodash'
path          = require 'path'
Domain        = require 'domain'
fsUtil        = new (require("../util/file_helpers"))
through       = require 'through'
Url           = require 'url'
UrlMerge      = require '../util/url_merge'

Controller  = require "./controller"

class RemoteInitial extends Controller
  constructor: ->
    if not (@ instanceof RemoteInitial)
      return new RemoteInitial()

    super

  handle: (req, res, opts = {}) ->
    uri = req.url.split("/__remote/").join("")
    @emit "verbose", "handling request for #{uri}"

    ## initially set the session to this url
    ## in case we aren't grabbing url content
    ## this may later be overridden if we're
    ## going to to the web and following redirects
    @setSessionRemoteUrl(req, uri)

    d = Domain.create()

    d.on 'error', (e) => @errorHandler(e, res, uri)

    d.run =>
      content = @getContent(uri, res, req)

      content.on "error", (e) => @errorHandler(e, res, uri)

      content
      .pipe(@injectContent(opts.inject))
      .pipe(res)

  setSessionRemoteUrl: (req, url) ->
    req.session.remote  = url.split("?")[0]

  injectContent: (toInject) ->
    toInject ?= ""

    through2.obj (chunk, enc, cb) ->
      src = chunk.toString()
            .replace(/<head>/, "<head> #{toInject}")

      cb(null, src)

  getContent: (url, res, req) ->
    switch type = fsUtil.detectType(url)
      when "absolute" then @getRelativeFileContent(url)
      when "file"     then @getFileContent(url)
      when "url"      then @getUrlContent(url, res, req)
      else
        throw new Error "Unable to handle type #{type}"

  getRelativeFileContent: (p) ->
    fs.createReadStream(path.join(
      app.get("cypress").projectRoot,
      p.split('?')[0]
    ), 'utf8')

  getFileContent: (p) ->
    fs.createReadStream(p.slice(7).split('?')[0], 'utf8')

  getUrlContent: (url, res, req) ->
    @_resolveRedirects(url, res, req)

  errorHandler: (e, res, url) ->
    res.status(500)
    .send("Error getting #{url} <pre>#{e.message}</pre>")

  _resolveRedirects: (url, res, req) ->
    thr = through((d) -> this.queue(d))

    rq = hyperquest.get url, {}, (err, incomingRes) =>
      if err?
        return thr.emit("error", err)

      if /^30(1|2|7|8)$/.test(incomingRes.statusCode)
        newUrl = UrlMerge(url, incomingRes.headers.location)
        res.redirect("/__remote/" + newUrl)
      else
        res.contentType(incomingRes.headers['content-type'])

        ## reset the session to the latest redirected URL
        @setSessionRemoteUrl(req, url)
        rq.pipe(thr)

    ## set the headers on the hyperquest request
    ## this will naturally forward cookies or auth tokens
    ## or anything else which should be proxied
    _.each req.headers, (val, key) ->
      rq.setHeader key, val

    thr

module.exports = RemoteInitial