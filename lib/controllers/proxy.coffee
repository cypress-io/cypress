_             = require("lodash")
fs            = require("fs")
request       = require("request")
mime          = require("mime")
path          = require("path")
Domain        = require("domain")
through       = require("through")
jsUri         = require("jsuri")
trumpet       = require("trumpet")
urlHelpers    = require("url")
cwd           = require("../cwd")
logger        = require("../logger")
UrlHelpers    = require("../util/url_helpers")
escapeRegExp  = require("../util/escape_regexp")
send          = require("send")

headRe           = /(<head.*?>)/
htmlRe           = /(<html.*?>)/
okStatusRe       = /^[2|3|4]\d+$/

module.exports = {
  handle: (req, res, config, getRemoteOrigin, next) ->
    ## if we have an unload header it means
    ## our parent app has been navigated away
    ## directly and we need to automatically redirect
    ## to the clientRoute
    if req.cookies["__cypress.unload"]
      return res.redirect config.clientRoute

    d = Domain.create()

    d.on 'error', (e) =>
      @errorHandler(e, req, res, getRemoteOrigin())

    d.run =>
      ## 1. first check to see if this url contains a FQDN
      ## if it does then its been rewritten from an absolute-domain
      ## into a absolute-path-relative link, and we should extract the
      ## remoteOrigin from this URL
      ## 2. or use cookies
      ## 3. or use baseUrl
      ## 4. or finally fall back on app instance var
      remoteOrigin = getRemoteOrigin()

      logger.info "handling initial request", url: req.url, proxiedUrl: req.proxiedUrl, remoteOrigin: remoteOrigin

      ## we must have the remoteOrigin which tell us where
      ## we should request the initial HTML payload from
      if not remoteOrigin
        ## if we dont have a remoteOrigin that means we're initially
        ## requesting the cypress app and we need to redirect to the
        ## root path that serves the app
        return res.redirect(config.clientRoute)

      thr = through (d) -> @queue(d)

      @getContent(thr, req, res, remoteOrigin, config)
        .on "error", (e) => @errorHandler(e, req, res, remoteOrigin)
        .pipe(res)

  getOriginFromFqdnUrl: (req) ->
    ## if we find an origin from this req.url
    ## then return it, and reset our req.url
    ## after stripping out the origin and ensuring
    ## our req.url starts with only 1 leading slash
    if origin = UrlHelpers.getOriginFromFqdnUrl(req.url)
      req.url = "/" + req.url.replace(origin, "").replace(/^\/+/, "")

      ## return the origin
      return origin

  getContent: (thr, req, res, remoteOrigin, config) ->
    switch remoteOrigin
      ## serve from the file system because
      ## we are using cypress as our weberver
      when "<root>"
        @getFileContent(thr, req, res, remoteOrigin, config)

      ## else go make an HTTP request to the
      ## real server!
      else
        @getHttpContent(thr, req, res, remoteOrigin)

  getHttpContent: (thr, req, res, remoteOrigin) ->
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

    ## prepends req.url with remoteOrigin
    remoteUrl = req.proxiedUrl

    isInitial = req.cookies["__cypress.initial"] is "true"

    setCookies = (initial, remoteOrigin) =>
      ## dont set the cookies if we're not on the initial request
      return if req.cookies["__cypress.initial"] isnt "true"

      res.cookie("__cypress.initial", initial)

    opts = {url: remoteUrl, followRedirect: false, strictSSL: false}

    ## do not accept gzip if this is initial
    ## since we have to rewrite html and we dont
    ## want to go through the extra step of unzipping it
    if isInitial
      opts.gzip = false
      delete req.headers["accept-encoding"]

    rq = request(opts)

    rq.on "error", (err) ->
      thr.emit("error", err)

    rq.on "response", (incomingRes) =>
      @setResHeaders(req, res, incomingRes, isInitial)

      ## always proxy the cookies coming from the incomingRes
      if cookies = incomingRes.headers["set-cookie"]
        res.append("Set-Cookie", cookies)

      if /^30(1|2|3|7|8)$/.test(incomingRes.statusCode)
        newUrl = incomingRes.headers.location

        ## set cookies to initial=true
        setCookies(true)

        logger.info "redirecting to new url", status: incomingRes.statusCode, url: newUrl

        ## finally redirect our user agent back to our domain
        ## by making this an absolute-path-relative redirect
        res.redirect(incomingRes.statusCode, newUrl)
      else
        ## set the status to whatever the incomingRes statusCode is
        res.status(incomingRes.statusCode)

        if not okStatusRe.test incomingRes.statusCode
          return @errorHandler(null, req, res, remoteOrigin)

        logger.info "received absolute file content"

        ## turn off __cypress.initial by setting false here
        setCookies(false)

        if req.cookies["__cypress.initial"] is "true"
          # @rewrite(req, res, remoteOrigin)
          # res.isHtml = true
          rq.pipe(@rewrite(req, res, remoteOrigin)).pipe(thr)
        else
          rq.pipe(thr)

    ## proxy the request body, content-type, headers
    ## to the new rq
    req.pipe(rq)

    return thr

  getFileContent: (thr, req, res, remoteOrigin, config) ->
    args = _.compact([
      config.fileServerFolder,
      req.url
    ])

    ## strip off any query params from our req's url
    ## since we're pulling this from the file system
    ## it does not understand query params
    ## and make sure we decode the uri which swaps out
    ## %20 with white space
    file = decodeURI urlHelpers.parse(path.join(args...)).pathname

    req.formattedUrl = file

    logger.info "getting relative file content", file: file

    res.cookie("__cypress.initial", false)

    sendOpts = {
      root: path.resolve(config.fileServerFolder)
      transform: (stream) =>
        if req.cookies["__cypress.initial"] is "true"
          stream.pipe(@rewrite(req, res, remoteOrigin)).pipe(thr)
        else
          stream.pipe(thr)
    }

    unless req.cookies["__cypress.initial"] is "true"
      sendOpts.etag = true
      sendOpts.lastModified = true

    send(req, urlHelpers.parse(req.url).pathname, sendOpts)

  errorHandler: (e, req, res, remoteOrigin) ->
    url = req.proxiedUrl

    ## disregard ENOENT errors (that means the file wasnt found)
    ## which is a perfectly acceptable error (we account for that)
    if process.env["CYPRESS_ENV"] isnt "production" and e and e.code isnt "ENOENT"
      console.log(e.stack)
      debugger

    logger.info "error handling initial request", url: url, error: e

    if e
      res.set("x-cypress-error", e.message)
      res.set("x-cypress-stack", JSON.stringify(e.stack))

    filePath = switch
      when f = req.formattedUrl
        "file://#{f}"
      else
        url

    ## using req here to give us an opportunity to
    ## write to req.formattedUrl
    htmlPath = cwd("lib", "html", "initial_500.html")
    res.status(500).render(htmlPath, {
      url: filePath
      fromFile: !!req.formattedUrl
    })

  setResHeaders: (req, res, incomingRes, isInitial) ->
    ## omit problematic headers
    headers = _.omit incomingRes.headers, "set-cookie", "x-frame-options", "content-length", "content-security-policy"

    ## do not cache the initial responses, no matter what
    ## later on we should switch to an etag system so we dont
    ## have to download the remote http responses if the etag
    ## hasnt changed
    if isInitial
      headers["cache-control"] = "no-cache, no-store, must-revalidate"

    ## proxy the headers
    res.set(headers)

  rewrite: (req, res, remoteOrigin) ->
    through = through

    tr = trumpet()

    rewrite = (selector, type, attr, fn) ->
      options = {}

      switch
        when _.isFunction(attr)
          fn   = attr
          attr = null

        when _.isPlainObject(attr)
          options = attr

      options.method ?= "selectAll"

      tr[options.method] selector, (elem) ->
        switch type
          when "attrs"
            elem.getAttributes (attrs) ->
              fn(elem, attrs)

          when "attr"
            elem.getAttribute attr, (val) ->
              elem.setAttribute attr, fn(val)

          when "removeAttr"
            elem.removeAttribute(attr)

          when "html"
            options.outer ?= true
            stream = elem.createStream({outer: options.outer})
            stream.pipe(through (buf) ->
              @queue fn(buf.toString())
            ).pipe(stream)

    ## we still aren't handling pages which are missing their <head> tag
    ## for those we need to insert our own <head> tag
    rewrite "head", "html", (str) =>
      str.replace(headRe, "$1 #{@getHeadContent()}")

    # rewrite "html", "html", {method: "select"}, (str) =>
    #   ## if we are missing a <head> tag then
    #   ## dynamically insert one
    #   if not headRe.test(str)
    #     str.replace(htmlRe, "$1 <head> #{@getHeadContent()} </head>")
    #   else
    #     str

    return tr

  getHeadContent: ->
    "
      <script type='text/javascript'>
        window.onerror = function(){
          parent.onerror.apply(parent, arguments);
        }
      </script>
      <script type='text/javascript' src='/__cypress/static/js/sinon.js'></script>
      <script type='text/javascript'>
        var Cypress = parent.Cypress;
        if (!Cypress){
          throw new Error('Cypress must exist in the parent window!');
        };
        Cypress.onBeforeLoad(window);
      </script>
    "
}
