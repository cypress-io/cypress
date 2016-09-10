_             = require("lodash")
zlib          = require("zlib")
concat        = require("concat-stream")
request       = require("request")
through       = require("through")
Promise       = require("bluebird")
cwd           = require("../cwd")
logger        = require("../logger")
cors          = require("../util/cors")
inject        = require("../util/inject")
buffers       = require("../util/buffers")
networkFailures = require("../util/network_failures")

headRe           = /(<head.*?>)/i
bodyRe           = /(<body.*?>)/i
htmlRe           = /(<html.*?>)/i
okStatusRe       = /^[2|3|4]\d+$/

zlib = Promise.promisifyAll(zlib)

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
  handle: (req, res, config, getRemoteState, next) ->
    logger.info("cookies are", req.cookies)

    ## if we have an unload header it means
    ## our parent app has been navigated away
    ## directly and we need to automatically redirect
    ## to the clientRoute
    if req.cookies["__cypress.unload"]
      return res.redirect config.clientRoute

    remoteState = getRemoteState()

    logger.info({"handling request", url: req.url, proxiedUrl: req.proxiedUrl, remoteState: remoteState})

    ## when you access cypress from a browser which has not
    ## had its proxy setup then req.url will match req.proxiedUrl
    ## and we'll know to instantly redirect them to the correct
    ## client route
    if req.url is req.proxiedUrl and not remoteState.visiting
      ## if we dont have a remoteState.origin that means we're initially
      ## requesting the cypress app and we need to redirect to the
      ## root path that serves the app
      return res.redirect(config.clientRoute)

    thr = through (d) -> @queue(d)

    @getHttpContent(thr, req, res, remoteState, config)
    .pipe(res)

  getHttpContent: (thr, req, res, remoteState, config) ->
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

    ## prepends req.url with remoteState.origin
    remoteUrl = req.proxiedUrl

    isInitial = req.cookies["__cypress.initial"] is "true"

    resContentTypeIsHtmlAndMatchesOriginPolicy = (respHeaders) ->
      contentType = respHeaders["content-type"]

      ## bail if our response headers are not text/html
      return if not (contentType and contentType.includes("text/html"))

      switch remoteState.strategy
        when "http"
          cors.urlMatchesOriginPolicyProps(remoteUrl, remoteState.props)
        when "file"
          remoteUrl.startsWith(remoteState.origin)

    setCookies = (value, wantsInjection) =>
      ## dont modify any cookies if we're trying to clear
      ## the initial cookie and we're not injecting anything
      return if (not value) and (not wantsInjection)

      ## dont set the cookies if we're not on the initial request
      return if not isInitial

      setCookie(res, "__cypress.initial", value, remoteState.domainName)

    onResponse = (str, incomingRes, wantsInjection) =>
      headers = incomingRes.headers

      wantsInjection ?= do ->
        return false if not resContentTypeIsHtmlAndMatchesOriginPolicy(headers)

        if isInitial then "full" else "partial"

      @setResHeaders(req, res, incomingRes, wantsInjection)

      ## always proxy the cookies coming from the incomingRes
      if cookies = headers["set-cookie"]
        res.append("Set-Cookie", cookies)

      if /^30(1|2|3|7|8)$/.test(incomingRes.statusCode)
        newUrl = headers.location

        ## set cookies to initial=true
        setCookies(true)

        logger.info "redirecting to new url", status: incomingRes.statusCode, url: newUrl

        ## finally redirect our user agent back to our domain
        ## by making this an absolute-path-relative redirect
        res.redirect(incomingRes.statusCode, newUrl)
      else
        ## set the status to whatever the incomingRes statusCode is
        res.status(incomingRes.statusCode)

        ## turn off __cypress.initial by setting false here
        setCookies(false, wantsInjection)

        if headers["x-cypress-file-server-error"]
          filePath = headers["x-cypress-file-path"]
          return httpRequestErr({status: res.statusCode}, filePath)

        logger.info "received request response"

        ## if there is nothing to inject then just
        ## bypass the stream buffer and pipe this back
        if not wantsInjection
          str.pipe(thr)
        else
          rewrite = (body) =>
            @rewrite(body.toString(), remoteState, wantsInjection)

          injection = concat (body) =>
            encoding = headers["content-encoding"]

            ## if we're gzipped that means we need to unzip
            ## this content first, inject, and the rezip
            if encoding and encoding.includes("gzip")
              zlib.gunzipAsync(body)
              .then(rewrite)
              .then(zlib.gzipAsync)
              .then(thr.end)
              .catch(httpRequestErr)
            else
              thr.end rewrite(body)

          str.pipe(injection)

    if obj = buffers.take(remoteUrl)
      onResponse(obj.stream, obj.response, "full")
    else
      # opts = {url: remoteUrl, followRedirect: false, strictSSL: false}
      opts = {followRedirect: false, strictSSL: false}

      if remoteState.strategy is "file" and req.proxiedUrl.startsWith(remoteState.origin)
        opts.url = req.proxiedUrl.replace(remoteState.origin, remoteState.fileServer)
      else
        opts.url = remoteUrl

      httpRequestErr = (err, filePath) =>
        status = err.status ? 500

        url = filePath ? remoteUrl

        html = networkFailures.get(err, url, status, remoteState.strategy)

        logger.info("request failed", {url: remoteUrl, status: status, err: err.message})

        res.status(status)

        thr.end(html)

      rq = request(opts)

      rq.on("error", httpRequestErr)

      rq.on "response", (incomingRes) ->
        onResponse(rq, incomingRes)

      ## proxy the request body, content-type, headers
      ## to the new rq
      req.pipe(rq)

    return thr

  setResHeaders: (req, res, incomingRes, wantsInjection) ->
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

  rewrite: (html, remoteState, wantsInjection) ->
    rewrite = (re, str) ->
      html.replace(re, str)

    htmlToInject = do =>
      switch wantsInjection
        when "full"
          inject.full(remoteState.domainName)
        when "partial"
          inject.partial(remoteState.domainName)

    switch
      when headRe.test(html)
        rewrite(headRe, "$1 #{htmlToInject}")

      when bodyRe.test(html)
        rewrite(bodyRe, "<head> #{htmlToInject} </head> $1")

      when htmlRe.test(html)
        rewrite(htmlRe, "$1 <head> #{htmlToInject} </head>")

      else
        "<head> #{htmlToInject} </head>" + html
}
