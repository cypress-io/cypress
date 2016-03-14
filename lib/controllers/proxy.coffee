_             = require("lodash")
path          = require("path")
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

headRe           = /(<head.*?>)/
htmlRe           = /(<html.*?>)/
okStatusRe       = /^[2|3|4]\d+$/
badCookieParamRe = /^(httponly|secure|domain=.+)$/i

class Proxy
  constructor: (app) ->
    if not (@ instanceof Proxy)
      return new Proxy(app)

    if not app
      throw new Error("Instantiating controllers/proxy requires an app!")

    @app = app

  handle: (req, res, next) ->
    ## if we have an unload header it means
    ## our parent app has been navigated away
    ## directly and we need to automatically redirect
    ## to the clientRoute
    if req.cookies["__cypress.unload"]
      return res.redirect @app.get("cypress").clientRoute

    getRemoteHost = (req) =>
      @getOriginFromFqdnUrl(req) ? req.cookies["__cypress.remoteHost"] ? @app.get("cypress").baseUrl ? @app.get("__cypress.remoteHost")

    d = Domain.create()

    d.on 'error', (e) =>
      @errorHandler(e, req, res, getRemoteHost(req))

    d.run =>
      ## 1. first check to see if this url contains a FQDN
      ## if it does then its been rewritten from an absolute-domain
      ## into a absolute-path-relative link, and we should extract the
      ## remoteHost from this URL
      ## 2. or use cookies
      ## 3. or use baseUrl
      ## 4. or finally fall back on app instance var
      remoteHost = getRemoteHost(req)

      logger.info "handling initial request", url: req.url, remoteHost: remoteHost

      ## we must have the remoteHost which tell us where
      ## we should request the initial HTML payload from
      if not remoteHost
        ## if we dont have a req.session that means we're initially
        ## requesting the cypress app and we need to redirect to the
        ## root path that serves the app
        return res.redirect @app.get("cypress").clientRoute

      thr = through (d) -> @queue(d)

      @getContent(thr, req, res, remoteHost)
        .on "error", (e) => @errorHandler(e, req, res, remoteHost)
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

  getContent: (thr, req, res, remoteHost) ->
    switch remoteHost
      ## serve from the file system because
      ## we are using cypress as our weberver
      when "<root>"
        @getFileContent(thr, req, res, remoteHost)

      ## else go make an HTTP request to the
      ## real server!
      else
        @getHttpContent(thr, req, res, remoteHost)

  getHttpContent: (thr, req, res, remoteHost) ->
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

    ## prepends req.url with remoteHost
    remoteUrl = urlHelpers.resolve(remoteHost, req.url)

    setCookies = (initial, remoteHost) =>
      ## dont set the cookies if we're not on the initial request
      return if req.cookies["__cypress.initial"] isnt "true"

      res.cookie("__cypress.initial", initial)
      res.cookie("__cypress.remoteHost", remoteHost)
      @app.set("__cypress.remoteHost", remoteHost)

    ## we are setting gzip to false here to prevent automatic
    ## decompression of the response since we dont need to transform
    ## it and we can just hand it back to the client. DO NOT BE CONFUSED
    ## our request will still have 'accept-encoding' and therefore
    ## responses WILL be gzipped! Responses will simply not be unzipped!
    opts = {url: remoteUrl, gzip: false, followRedirect: false, strictSSL: false}

    ## do not accept gzip if this is initial
    ## since we have to rewrite html and we dont
    ## want to go through unzipping it, but we may
    ## do this later
    if req.cookies["__cypress.initial"] is "true"
      delete req.headers["accept-encoding"]

    ## rewrite problematic custom headers referencing
    ## the wrong host
    ## we need to use our cookie's remoteHost here and not necessarilly
    ## the remoteUrl
    ## this fixes a bug where we accidentally swapped out referer with the domain of the new url
    ## when it needs to stay as the previous referring remoteHost (from our cookie)
    ## also the host header NEVER includes the protocol so we need to add it here
    req.headers = @mapHeaders(req.headers, req.protocol + "://" + req.get("host"), req.cookies["__cypress.remoteHost"])

    rq = request(opts)

    rq.on "error", (err) ->
      thr.emit("error", err)

    rq.on "response", (incomingRes) =>
      @setResHeaders(req, res, incomingRes, remoteHost)

      ## always proxy the cookies coming from the incomingRes
      if cookies = incomingRes.headers["set-cookie"]
        res.append("Set-Cookie", @stripCookieParams(cookies))

      if /^30(1|2|3|7|8)$/.test(incomingRes.statusCode)
        ## redirection is extremely complicated and there are several use-cases
        ## we are encompassing. read the routes_spec for each situation and
        ## why we have to check on so many things.

        ## we go through this merge because the spec states that the location
        ## header may not be a FQDN. If it's not (sometimes its just a /) then
        ## we need to merge in the missing url parts
        newUrl = new jsUri UrlHelpers.mergeOrigin(remoteUrl, incomingRes.headers.location)

        ## set cookies to initial=true and our new remoteHost origin
        setCookies(true, newUrl.origin())

        logger.info "redirecting to new url", status: incomingRes.statusCode, url: newUrl.toString()

        isInitial = req.cookies["__cypress.initial"] is "true"

        ## finally redirect our user agent back to our domain
        ## by making this an absolute-path-relative redirect
        res.redirect @getUrlForRedirect(newUrl, req.cookies["__cypress.remoteHost"], isInitial)
      else
        ## set the status to whatever the incomingRes statusCode is
        res.status(incomingRes.statusCode)

        if not okStatusRe.test incomingRes.statusCode
          return @errorHandler(null, req, res, remoteHost)

        logger.info "received absolute file content"
        # if ct = incomingRes.headers["content-type"]
          # res.contentType(ct)
          # throw new Error("Missing header: 'content-type'")
        # res.contentType(incomingRes.headers['content-type'])

        ## turn off __cypress.initial by setting false here
        setCookies(false, remoteHost)

        if req.cookies["__cypress.initial"] is "true"
          # @rewrite(req, res, remoteHost)
          # res.isHtml = true
          rq.pipe(@rewrite(req, res, remoteHost)).pipe(thr)
        else
          rq.pipe(thr)

    ## proxy the request body, content-type, headers
    ## to the new rq
    req.pipe(rq)

    return thr

  getFileContent: (thr, req, res, remoteHost) ->
    args = _.compact([
      @app.get("cypress").projectRoot,
      @app.get("cypress").rootFolder,
      req.url
    ])

    ## strip off any query params from our req's url
    ## since we're pulling this from the file system
    ## it does not understand query params
    file = urlHelpers.parse(path.join(args...)).pathname

    req.formattedUrl = file

    logger.info "getting relative file content", file: file

    ## set the content-type based on the file extension
    res.contentType(mime.lookup(file))

    res.cookie("__cypress.initial", false)
    res.cookie("__cypress.remoteHost", remoteHost)
    @app.set("__cypress.remoteHost", remoteHost)

    stream = fs.createReadStream(file, "utf8")

    if req.cookies["__cypress.initial"] is "true"
      stream.pipe(@rewrite(req, res, remoteHost)).pipe(thr)
    else
      stream.pipe(thr)

    return thr

  errorHandler: (e, req, res, remoteHost) ->
    url = urlHelpers.resolve(remoteHost, req.url)

    ## disregard ENOENT errors (that means the file wasnt found)
    ## which is a perfectly acceptable error (we account for that)
    if process.env["CYPRESS_ENV"] isnt "production" and e and e.code isnt "ENOENT"
      console.error(e.stack)
      debugger

    logger.info "error handling initial request", url: url, error: e

    if e
      res.set("x-cypress-error", e.message)
      res.set("x-cypress-stack", e.stack.replace("\n", "\\n"))

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

  mapHeaders: (headers, currentHost, remoteHost) ->
    ## change out custom X-* headers referencing
    ## the wrong host
    hostRe = new RegExp(escapeRegExp(currentHost), "ig")

    _.mapValues headers, (value, key) ->
      ## if we have a custom header then swap
      ## out any values referencing our currentHost
      ## with the remoteHost
      key = key.toLowerCase()
      if key is "referer" or key is "origin" or key.startsWith("x-")
        value.replace(hostRe, remoteHost)
      else
        ## just return the value
        value

  setResHeaders: (req, res, incomingRes, remoteHost) ->
    ## omit problematic headers
    headers = _.omit incomingRes.headers, "set-cookie", "x-frame-options", "content-length", "content-security-policy"

    ## rewrite custom headers which reference the wrong host
    ## if our host is localhost:8080 we need to
    ## rewrite back to our current host localhost:2020
    headers = @mapHeaders(headers, remoteHost, req.get("host"))

    ## do not cache the initial responses, no matter what
    ## later on we should switch to an etag system so we dont
    ## have to download the remote http responses if the etag
    ## hasnt changed
    headers["cache-control"] = "no-cache, no-store, must-revalidate"

    ## proxy the headers
    res.set(headers)

  getUrlForRedirect: (newUrl, remoteHostCookie, isInitial) ->
    ## if isInitial is true, then we're requesting initial content
    ## and we dont care if newUrl and remoteHostCookie matches because
    ## we've already rewritten the remoteHostCookie above
    ##
    ## if the origin of our newUrl matches the current remoteHostCookie
    ## then we're redirecting back to ourselves and we can make
    ## this an absolute-path-relative url to ourselves
    if isInitial or (newUrl.origin() is remoteHostCookie)
      newUrl.toString().replace(newUrl.origin(), "")
    else
      ## if we're not requesting initial content or these
      ## dont match then just prepend with a leading slash
      ## so we retain the remoteHostCookie in the newUrl (like how
      ## our original request came in!)
      "/" + newUrl.toString()

  stripCookieParams: (cookies) ->
    stripHttpOnlyAndSecure = (cookie) =>
      ## trim out whitespace
      parts = _.invoke cookie.split(";"), "trim"

      ## if Domain is included then we actually need to duplicate
      ## the cookie for both the domain and without the domain so
      ## it gets sent for both types of requests...?

      ## reject any part that is httponly or secure
      parts = _.reject parts, (part) =>
        badCookieParamRe.test(part)

      ## join back up with proper whitespace
      parts.join("; ")

    ## normalize cookies into single dimensional array
     _.map [].concat(cookies), stripHttpOnlyAndSecure

  rewrite: (req, res, remoteHost) ->
    through = through

    tr = trumpet()

       # tr.selectAll selector, (elem) ->
        # elem.getAttribute attr, (val) ->
        #   elem.setAttribute attr, fn(val)

    changeToAbsoluteRelative = (str) ->
      "/" + req.protocol + ":" + str

    removeRemoteHostOrMakeAbsoluteRelative = (str) ->
      if str.startsWith(remoteHost)
        str.replace(remoteHost, "")
      else
        "/" + str

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

    rewrite "[href^='//']", "attr", "href", changeToAbsoluteRelative

    rewrite "form[action^='//']", "attr", "action", changeToAbsoluteRelative

    rewrite "form[action^='http']", "attr", "action", removeRemoteHostOrMakeAbsoluteRelative

    rewrite "[href^='http']", "attr", "href", removeRemoteHostOrMakeAbsoluteRelative

    ## only rewrite these script src tags if the origin matches our remote host
    ## or matches a domain which we have a cookie for. store a list of domains
    ## per cypress session (to enable parallelization)
    ## __cypress.session
    # rewrite "script[src^='http']", "attr", "src", removeRemoteHostOrMakeAbsoluteRelative
    # rewrite "script[src^='//']", "attr", "src", changeToAbsoluteRelative

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

module.exports = Proxy