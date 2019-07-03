_             = require("lodash")
zlib          = require("zlib")
concat        = require("concat-stream")
Promise       = require("bluebird")
accept        = require("http-accept")
debug         = require("debug")("cypress:server:proxy")
cwd           = require("../cwd")
cors          = require("../util/cors")
buffers       = require("../util/buffers")
rewriter      = require("../util/rewriter")
blacklist     = require("../util/blacklist")
conditional   = require("../util/conditional_stream")
{ passthruStream } = require("../util/passthru_stream")

REDIRECT_STATUS_CODES = [301, 302, 303, 307, 308]
NO_BODY_STATUS_CODES = [204, 304]

zlib = Promise.promisifyAll(zlib)

zlibOptions = {
  flush: zlib.Z_SYNC_FLUSH
  finishFlush: zlib.Z_SYNC_FLUSH
}

isGzipError = (err) ->
  Object.prototype.hasOwnProperty.call(zlib.constants, err.code)

## https://github.com/cypress-io/cypress/issues/4298
## https://tools.ietf.org/html/rfc7230#section-3.3.3
## HEAD, 1xx, 204, and 304 responses should never contain anything after headers
responseMustHaveEmptyBody = (method, statusCode) ->
  _.some([
    _.includes(NO_BODY_STATUS_CODES, statusCode),
    _.inRange(statusCode, 100, 200),
    _.invoke(method, 'toLowerCase') == 'head',
  ])

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

reqNeedsBasicAuthHeaders = (req, remoteState) ->
  { auth, origin } = remoteState

  auth &&
    not req.headers["authorization"] &&
      cors.urlMatchesOriginProtectionSpace(req.proxiedUrl, origin)

module.exports = {
  handle: (req, res, config, getRemoteState, request, nodeProxy) ->
    remoteState = getRemoteState()

    debug("handling proxied request %o", {
      url: req.url
      proxiedUrl: req.proxiedUrl
      headers: req.headers
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

    thr = passthruStream()

    @getHttpContent(thr, req, res, remoteState, config, request)
    .pipe(res)

  getHttpContent: (thr, req, res, remoteState, config, request) ->
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

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
          cors.urlMatchesOriginPolicyProps(req.proxiedUrl, remoteState.props)
        when "file"
          req.proxiedUrl.startsWith(remoteState.origin)

    setCookies = (value) ->
      ## dont modify any cookies if we're trying to clear
      ## the initial cookie and we're not injecting anything
      return if (not value) and (not wantsInjection)

      ## dont set the cookies if we're not on the initial request
      return if not isInitial

      setCookie(res, "__cypress.initial", value, remoteState.domainName)

    setBody = (str, statusCode, headers) ->
      ## set the status to whatever the incomingRes statusCode is
      res.status(statusCode)

      ## turn off __cypress.initial by setting false here
      setCookies(false, wantsInjection)

      encoding = headers["content-encoding"]

      isGzipped = encoding and encoding.includes("gzip")

      debug("received response for %o", {
        url: req.proxiedUrl
        headers,
        statusCode,
        isGzipped
        wantsInjection,
        wantsSecurityRemoved,
      })

      if responseMustHaveEmptyBody(req.method, statusCode)
        return res.end()

      ## if there is nothing to inject then just
      ## bypass the stream buffer and pipe this back
      if wantsInjection
        rewrite = (body) ->
          rewriter.html(body.toString("utf8"), remoteState.domainName, wantsInjection, wantsSecurityRemoved)

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
            ## if we have an error here there's nothing
            ## to do but log it out and end the socket
            ## because we cannot inject into content
            ## that failed rewriting gzip
            ## which is the same thing we do below
            ## on regular proxied network requests
            .catch(endWithNetworkErr)
          else
            thr.end rewrite(body)

        str.pipe(injection)
      else
        ## only rewrite if we should
        if wantsSecurityRemoved
          gunzip = zlib.createGunzip(zlibOptions)
          gunzip.setEncoding("utf8")

          onError = (err) ->
            gzipError = isGzipError(err)

            debug("failed to proxy response %o", {
              url: req.proxiedUrl
              headers
              statusCode
              isGzipped
              gzipError
              wantsInjection
              wantsSecurityRemoved
              err
            })

            endWithNetworkErr(err)

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

    endWithNetworkErr = (err) ->
      debug('request failed in proxy layer %o', {
        res: _.pick(res, 'headersSent', 'statusCode', 'headers')
        req: _.pick(req, 'url', 'proxiedUrl', 'headers', 'method')
        err
      })

      req.socket.destroy()

    onResponse = (str, incomingRes) =>
      {headers, statusCode} = incomingRes

      wantsInjection ?= do ->
        return false if not resContentTypeIs(headers, "text/html")

        return false if not resMatchesOriginPolicy(headers)

        return "full" if isInitial

        return false if not reqAcceptsHtml()

        return "partial"

      wantsSecurityRemoved = do ->
        ## we want to remove security IF we're doing a full injection
        ## on the response or its a request for any javascript script tag
        config.modifyObstructiveCode and (
          (wantsInjection is "full") or
            resContentTypeIs(headers, "application/javascript")
        )

      @setResHeaders(req, res, incomingRes, wantsInjection)

      ## always proxy the cookies coming from the incomingRes
      if cookies = headers["set-cookie"]
        ## normalize into array
        for c in [].concat(cookies)
          try
            res.append("Set-Cookie", c)
          catch err
            ## noop

      if REDIRECT_STATUS_CODES.includes(statusCode)
        newUrl = headers.location

        ## set cookies to initial=true
        setCookies(true)

        debug("redirecting to new url %o", { status: statusCode, url: newUrl })

        ## finally redirect our user agent back to our domain
        ## by making this an absolute-path-relative redirect
        return res.redirect(statusCode, newUrl)

      if headers["x-cypress-file-server-error"]
        wantsInjection or= "partial"

      setBody(str, statusCode, headers)

    if obj = buffers.take(req.proxiedUrl)
      wantsInjection = "full"

      onResponse(obj.stream, obj.response)
    else
      opts = {
        timeout: null
        strictSSL: false
        followRedirect: false
        retryIntervals: [0, 100, 200, 200]
      }

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
        opts.url = req.proxiedUrl

      ## if we have auth headers and this request matches our origin
      ## protection space and the user has not supplied auth headers
      if reqNeedsBasicAuthHeaders(req, remoteState)
        { auth } = remoteState

        base64 = Buffer
        .from(auth.username + ":" + auth.password)
        .toString("base64")

        req.headers["authorization"] = "Basic #{base64}"

      rq = request.create(opts)

      rq.on("error", endWithNetworkErr)

      rq.on "response", (incomingRes) ->
        onResponse(rq, incomingRes)

      ## if our original request has been
      ## aborted, then ensure we forward
      ## this onto the proxied request
      ## https://github.com/cypress-io/cypress/issues/2612
      ## this can happen on permanent connections
      ## like SSE, but also on any regular ol'
      ## http request
      req.on "aborted", ->
        rq.abort()

      ## proxy the request body, content-type, headers
      ## to the new rq
      req.pipe(rq)

    return thr

  setResHeaders: (req, res, incomingRes, wantsInjection) ->
    return if res.headersSent

    ## omit problematic headers
    headers = _.omit incomingRes.headers, "set-cookie", "x-frame-options", "content-length", "content-security-policy", "connection"

    ## do not cache when we inject content into responses
    ## later on we should switch to an etag system so we dont
    ## have to download the remote http responses if the etag
    ## hasnt changed
    if wantsInjection
      headers["cache-control"] = "no-cache, no-store, must-revalidate"

    ## proxy the headers
    res.set(headers)
}
