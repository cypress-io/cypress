fs            = require("fs")
hyperquest    = require("hyperquest")
through2      = require("through2")
_             = require "lodash"
path          = require "path"
Domain        = require "domain"
fsUtil        = new (require("../util/file_helpers"))
through       = require("through")
Url           = require("url")
UrlMerge      = require("../util/url_merge")

module.exports = class extends require('events').EventEmitter
  handle: (req, res, opts = {}) =>
    uri = req.url.split("/__remote/").join("")
    @emit "verbose", "handling request for #{uri}"

    d = Domain.create()

    d.on 'error', (e) => @errorHandler(e, res, uri)

    d.run =>
      @getContent(uri, res, req)
      .pipe(@injectContent(opts.inject))
      .pipe(res)

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
    fs.createReadStream(path.join(process.cwd(), p.split('?')[0]), 'utf8')

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
      if /^30(1|2|7|8)$/.test(incomingRes.statusCode)
        newUrl = UrlMerge(url, incomingRes.headers.location)
        res.redirect("/__remote/" + newUrl)
      else
        res.contentType(incomingRes.headers['content-type'])
        req.session.remote  = url.split("?")[0]
        rq.pipe(thr)

    thr