_             = require("lodash")
zlib          = require("zlib")
concat        = require("concat-stream")
through       = require("through")
Promise       = require("bluebird")
accept        = require("http-accept")
debug         = require("debug")("cypress:server:proxy")
cwd           = require("../cwd")
cors          = require("../util/cors")
buffers       = require("../util/buffers")
rewriter      = require("../util/rewriter")
blacklist     = require("../util/blacklist")
conditional   = require("../util/conditional_stream")
networkFailures = require("../util/network_failures")

redirectRe  = /^30(1|2|3|7|8)$/

zlib = Promise.promisifyAll(zlib)

zlibOptions = {
  flush: zlib.Z_SYNC_FLUSH
  finishFlush: zlib.Z_SYNC_FLUSH
}

setCookie = (res, key, val, domainName) ->
  ## cannot use res.clearCookie because domain
  ## is not sent correctly
  options = {
    domain: domainName
  }

  if not val
    val = ""

    ## force expires to be the epoch
    options.expires = new Date(0)

  res.cookie(key, val, options)

module.exports = {
  handle: (req, res, config, getRemoteState, request) ->
    remoteState = getRemoteState()

    debug("handling proxied request %o", {
      url: req.url
      proxiedUrl: req.proxiedUrl
      cookies: req.cookies
      remoteState
    })

    ## if we have an unload header it means
    ## our parent app has been navigated away
    ## directly and we need to automatically redirect
    ## to the clientRoute
    if req.cookies["__cypress.unload"]
      return res.redirect config.clientRoute

    ## when you access cypress from a browser which has not
    ## had its proxy setup then req.url will match req.proxiedUrl
    ## and we'll know to instantly redirect them to the correct
    ## client route
    if req.url is req.proxiedUrl and not remoteState.visiting
      ## if we dont have a remoteState.origin that means we're initially
      ## requesting the cypress app and we need to redirect to the
      ## root path that serves the app
      return res.redirect(config.clientRoute)

    ## if we have black listed hosts
    if blh = config.blacklistHosts
      ## and url matches any of our blacklisted hosts
      if matched = blacklist.matches(req.proxiedUrl, blh)
        ## then bail and return with 503
        ## and set a custom header
        res.set("x-cypress-matched-blacklisted-host", matched)

        debug("blacklisting request %o", {
          url: req.proxiedUrl
          matched: matched
        })

        return res.status(503).end()

    thr = through (d) -> @queue(d)

    @getHttpContent(thr, req, res, remoteState, config, request)
    .pipe(res)

  getHttpContent: (thr, req, res, remoteState, config, request) ->
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

    ## prepends req.url with remoteState.origin
    remoteUrl = req.proxiedUrl

    isInitial = req.cookies["__cypress.initial"] is "true"

    wantsInjection = null
    wantsSecurityRemoved = null

    resContentTypeIs = (respHeaders, str) ->
      contentType = respHeaders["content-type"]

      ## make sure the response includes string type
      contentType and contentType.includes(str)

    reqAcceptsHtml = ->
      ## don't inject if this is an XHR from jquery
      return if req.headers["x-requested-with"]

      types = accept.parser(req.headers.accept) ? []

      find = (type) ->
        type in types

      ## bail if we didn't find both text/html and application/xhtml+xml
      ## https://github.com/cypress-io/cypress/issues/288
      find("text/html") and find("application/xhtml+xml")

    resMatchesOriginPolicy = (respHeaders) ->
      switch remoteState.strategy
        when "http"
          cors.urlMatchesOriginPolicyProps(remoteUrl, remoteState.props)
        when "file"
          remoteUrl.startsWith(remoteState.origin)

    setCookies = (value) =>
      ## dont modify any cookies if we're trying to clear
      ## the initial cookie and we're not injecting anything
      return if (not value) and (not wantsInjection)

      ## dont set the cookies if we're not on the initial request
      return if not isInitial

      setCookie(res, "__cypress.initial", value, remoteState.domainName)

    getErrorHtml = (err, filePath) =>
      status = err.status ? 500

      debug("request failed %o", { url: remoteUrl, status: status, error: err.stack })

      urlStr = filePath ? remoteUrl

      networkFailures.get(err, urlStr, status, remoteState.strategy)

    setBody = (str, statusCode, headers) =>
      ## set the status to whatever the incomingRes statusCode is
      res.status(statusCode)

      ## turn off __cypress.initial by setting false here
      setCookies(false, wantsInjection)

      encoding = headers["content-encoding"]

      isGzipped = encoding and encoding.includes("gzip")

      debug("received response for %o", {
        url: remoteUrl
        headers,
        statusCode,
        isGzipped
        wantsInjection,
        wantsSecurityRemoved,
      })

      ## if there is nothing to inject then just
      ## bypass the stream buffer and pipe this back
      if wantsInjection
        rewrite = (body) ->
          rewriter.html(body.toString("utf8"), remoteState.domainName, wantsInjection, config.modifyObstructiveCode)

        ## TODO: we can probably move this to the new
        ## replacestream rewriter instead of using
        ## a buffer
        injection = concat (body) ->
          ## if we're gzipped that means we need to unzip
          ## this content first, inject, and the rezip
          if isGzipped
            zlib.gunzipAsync(body, zlibOptions)
            .then(rewrite)
            .then(zlib.gzipAsync)
            .then(thr.end)
            .catch(endWithResponseErr)
          else
            thr.end rewrite(body)

        str.pipe(injection)
      else
        ## only rewrite if we should
        if config.modifyObstructiveCode and wantsSecurityRemoved
          gunzip = zlib.createGunzip(zlibOptions)
          gunzip.setEncoding("utf8")

          onError = (err) ->
            debug("failed to proxy response %o", {
              url: remoteUrl
              headers
              statusCode
              isGzipped
              wantsInjection
              wantsSecurityRemoved
              err
            })

            if not res.headersSent
              res
              .set({
                "X-Cypress-Proxy-Error-Message": err.message
                "X-Cypress-Proxy-Error-Stack": JSON.stringify(err.stack)
              })
              .status(502)

            return thr.end()

          ## only unzip when it is already gzipped
          return str
          .pipe(conditional(isGzipped, gunzip))
          .on("error", onError)
          .pipe(rewriter.security())
          .on("error", onError)
          .pipe(conditional(isGzipped, zlib.createGzip()))
          .on("error", onError)
          .pipe(thr)
          .on("error", onError)

        return str.pipe(thr)

    endWithResponseErr = (err) ->
      ## use res.statusCode if we have one
      ## in the case of an ESOCKETTIMEDOUT
      ## and we have the incomingRes headers
      checkResStatus = ->
        if res.headersSent
          res.statusCode

      status = err.status ? checkResStatus() ? 500

      if not res.headersSent
        res.removeHeader("Content-Encoding")

      str = through (d) -> @queue(d)

      onResponse(str, {
        statusCode: status
        headers: {
          "content-type": "text/html"
        }
      })

      str.end(getErrorHtml(err))

    onResponse = (str, incomingRes) =>
      {headers, statusCode} = incomingRes

      wantsInjection ?= do ->
        return false if not resContentTypeIs(headers, "text/html")

        return false if not resMatchesOriginPolicy(headers)

        return "full" if isInitial

        return false if not reqAcceptsHtml()

        return "partial"

      wantsSecurityRemoved ?= do ->
        resContentTypeIs(headers, "application/javascript")

      @setResHeaders(req, res, incomingRes, wantsInjection)

      ## always proxy the cookies coming from the incomingRes
      if cookies = headers["set-cookie"]
        ## normalize into array
        for c in [].concat(cookies)
          try
            res.append("Set-Cookie", c)
          catch err
            ## noop

      if redirectRe.test(statusCode)
        newUrl = headers.location

        ## set cookies to initial=true
        setCookies(true)

        debug("redirecting to new url %o", { status: statusCode, url: newUrl })

        ## finally redirect our user agent back to our domain
        ## by making this an absolute-path-relative redirect
        res.redirect(statusCode, newUrl)
      else
        if headers["x-cypress-file-server-error"]
          filePath = headers["x-cypress-file-path"]
          wantsInjection or= "partial"
          str = through (d) -> @queue(d)
          setBody(str, statusCode, headers)
          str.end(getErrorHtml({status: statusCode}, filePath))
        else
          setBody(str, statusCode, headers)

    if obj = buffers.take(remoteUrl)
      wantsInjection = "full"

      ## if we already have an error
      ## on our stream just immediately
      ## end with this
      if err = obj.stream.error
        endWithResponseErr(err)
      else
        ## else listen for the error even which
        ## could happen at any time
        obj.stream.on("error", endWithResponseErr)

      onResponse(obj.stream, obj.response)
    else
      # opts = {url: remoteUrl, followRedirect: false, strictSSL: false}
      opts = {followRedirect: false, strictSSL: false}

      ## strip unsupported accept-encoding headers
      encodings = accept.parser(req.headers["accept-encoding"]) ? []

      if "gzip" in encodings
        ## we only want to support gzip right now
        req.headers["accept-encoding"] = "gzip"
      else
        ## else just delete them since we cannot
        ## properly decode them
        delete req.headers["accept-encoding"]

      if remoteState.strategy is "file" and req.proxiedUrl.startsWith(remoteState.origin)
        opts.url = req.proxiedUrl.replace(remoteState.origin, remoteState.fileServer)
      else
        opts.url = remoteUrl

      ## if we have auth headers and this request matches our origin policy
      if (a = remoteState.auth) and resMatchesOriginPolicy()
        ## and no existing Authentication headers
        if not req.headers["authorization"]
          base64 = new Buffer(a.username + ":" + a.password).toString("base64")
          req.headers["authorization"] = "Basic #{base64}"

      rq = request.create(opts)

      rq.on("error", endWithResponseErr)

      rq.on "response", (incomingRes) ->
        onResponse(rq, incomingRes)

      ## proxy the request body, content-type, headers
      ## to the new rq
      req.pipe(rq)

    return thr

  setResHeaders: (req, res, incomingRes, wantsInjection) ->
    return if res.headersSent

    ## omit problematic headers
    headers = _.omit incomingRes.headers, "set-cookie", "x-frame-options", "content-length", "content-security-policy"

    ## do not cache when we inject content into responses
    ## later on we should switch to an etag system so we dont
    ## have to download the remote http responses if the etag
    ## hasnt changed
    if wantsInjection
      headers["cache-control"] = "no-cache, no-store, must-revalidate"

    ## proxy the headers
    res.set(headers)
}
