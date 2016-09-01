_             = require("lodash")
fs            = require("fs")
mime          = require("mime")
path          = require("path")
zlib          = require("zlib")
jsUri         = require("jsuri")
concat        = require("concat-stream")
request       = require("request")
through       = require("through")
through2      = require("through2")
urlHelpers    = require("url")
cwd           = require("../cwd")
logger        = require("../logger")
cors          = require("../util/cors")
buffers       = require("../util/buffers")
escapeRegExp  = require("../util/escape_regexp")
send          = require("send")

headRe           = /(<head.*?>)/i
bodyRe           = /(<body.*?>)/i
htmlRe           = /(<html.*?>)/i
okStatusRe       = /^[2|3|4]\d+$/

convertNewLinesToBr = (text) ->
  text.split("\n").join("<br />")

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

    @getContent(thr, req, res, remoteState, config)
      # .on "error", (e) => @errorHandler(e, req, res, remoteState)
      .pipe(res)

  getContent: (thr, req, res, remoteState, config) ->
    ## serve from the file system because
    ## we are using cypress as our weberver
    ## only if we are on file strategy and
    ## this request does indeed match the
    ## remote origin
    if remoteState.strategy is "file" and (req.proxiedUrl.startsWith(remoteState.origin) or remoteState.visiting)
      @getFileContent(thr, req, res, remoteState, config)

    ## else go make an HTTP request to the
    ## real server!
    else
      @getHttpContent(thr, req, res, remoteState)

  getHttpContent: (thr, req, res, remoteState) ->
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

    ## prepends req.url with remoteState.origin
    remoteUrl = req.proxiedUrl

    isInitial = req.cookies["__cypress.initial"] is "true"

    resContentTypeIsHtmlAndMatchesOriginPolicy = (respHeaders) ->
      contentType = respHeaders["content-type"]

      ## bail if our response headers are not text/html
      return if not (contentType and contentType.includes("text/html"))

      cors.urlMatchesOriginPolicyProps(req.proxiedUrl, remoteState.props)

    setCookies = (value, wantsInjection) =>
      ## dont modify any cookies if we're trying to clear
      ## the initial cookie and we're not injecting anything
      return if (not value) and (not wantsInjection)

      ## dont set the cookies if we're not on the initial request
      return if not isInitial

      setCookie(res, "__cypress.initial", value, remoteState.domainName)

    onResponse = (str, incomingRes, wantsInjection) =>
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

        wantsInjection ?= do ->
          return false if not resContentTypeIsHtmlAndMatchesOriginPolicy(incomingRes.headers)

          if isInitial then "full" else "partial"

        ## turn off __cypress.initial by setting false here
        setCookies(false, wantsInjection)

        if not okStatusRe.test incomingRes.statusCode
          ## bail early, continue on with the stream'in
          return str.pipe(thr)

        logger.info "received request response"

        ## if there is nothing to inject then just
        ## bypass the stream buffer and pipe this back
        if not wantsInjection
          str.pipe(thr)
        else
          @concatStream str, thr, (body, cb) =>
            encoding = incomingRes.headers["content-encoding"]

            rewrite = (body) =>
              body = body.toString()

              switch wantsInjection
                when "full"
                  @rewrite(body, remoteState, "initial")

                when "partial"
                  @rewrite(body, remoteState)

            ## if we're gzipped that means we need to unzip
            ## this content first, inject, and the rezip
            if encoding and encoding.includes("gzip")
              zlib.gunzip body, (err, unzipped) ->
                if err
                  httpRequestErr(err)
                else
                  ## get the body as a string now
                  body = rewrite(unzipped)

                  ## zip it back up
                  zlib.gzip body, (err, zipped) ->
                    if err
                      httpRequestErr(err)
                    else
                      cb(zipped)
            else
              cb rewrite(body)

    if obj = buffers.take(remoteUrl)
      onResponse(obj.stream, obj.response, "full")
    else
      opts = {url: remoteUrl, followRedirect: false, strictSSL: false}

      httpRequestErr = (err) =>
        status = err.status ? 500

        logger.info("request failed", {url: remoteUrl, status: status, err: err.message})

        text = """
        Cypress errored attempting to make an http request to this url:

        #{remoteUrl}


        The error was:

        #{err.message}


        The stack trace was:

        #{err.stack}
        """

        res
        .status(status)
        .send(convertNewLinesToBr(text))

      rq = request(opts)

      rq.on("error", httpRequestErr)

      rq.on "response", (incomingRes) ->
        onResponse(rq, incomingRes)

      ## proxy the request body, content-type, headers
      ## to the new rq
      req.pipe(rq)

    return thr

  getFileContent: (thr, req, res, remoteState, config) ->
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

    logger.info "getting static file content", file: file

    ext = path.extname(file)

    isInitial = req.cookies["__cypress.initial"] is "true"

    ## ext will be blank when requesting a folder
    ## which could serve an index.html file
    isHtml = [".html", ".htm", ""].some (str) ->
      ext is str

    onResponse = (str, wantsInjection) =>
      if remoteState.visiting
        wantsInjection = false

      wantsInjection ?= do ->
        return false if not isHtml

        if isInitial then "full" else "partial"

      if isInitial and wantsInjection
        setCookie(res, "__cypress.initial", false, remoteState.domainName)

      ## if the files extname isnt html or the __cypress.initial
      ## isnt true then bypass concatThrough and just pipe directly
      if not wantsInjection
        str.pipe(thr)
      else
        @concatThrough str, thr, (body) =>
          switch wantsInjection
            when "full"
              body = @rewrite(body, remoteState, "initial")

            when "partial"
              body = @rewrite(body, remoteState)

          return body
        .pipe(thr)

    res.set("x-cypress-file-path", file)

    if obj = buffers.take(req.proxiedUrl)
      return onResponse(obj.stream, "full")

    staticFileErr = (err) =>
      status = err.status ? 500

      logger.info("static file failed", {err: err.message, status: status})

      text = """
      Cypress errored trying to serve this file from your system:

      #{file}

      #{if status is 404 then "The file was not found." else ""}
      """

      res
      .status(status)
      .send(convertNewLinesToBr(text))

    sendOpts = {
      root: path.resolve(config.fileServerFolder)
      transform: onResponse
    }

    if not isInitial
      sendOpts.etag = true
      sendOpts.lastModified = true

    send(req, urlHelpers.parse(req.url).pathname, sendOpts)
    .on("error", staticFileErr)

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

  concatStream: (str, thr, fn) ->
    str.pipe concat (body) ->

      fn body, (html) ->
        thr.end(html)

  concatThrough: (str, thr, fn) ->
    buffer = ""

    tstr = (fn) ->
      through2 (chunk, enc, cb) ->
        buffer += chunk.toString()

        cb()
      .on "end", ->
        fn(buffer)

    str.pipe tstr (body) ->
      thr.end fn(body)

  rewrite: (html, remoteState, type) ->
    rewrite = (re, str) ->
      html.replace(re, str)

    htmlToInject = do =>
      switch type
        when "initial"
          @getHeadContent(remoteState.domainName)
        else
          @getDocumentDomainContent(remoteState.domainName)

    switch
      when headRe.test(html)
        rewrite(headRe, "$1 #{htmlToInject}")

      when bodyRe.test(html)
        rewrite(bodyRe, "<head> #{htmlToInject} </head> $1")

      when htmlRe.test(html)
        rewrite(htmlRe, "$1 <head> #{htmlToInject} </head>")

      else
        "<head> #{htmlToInject} </head>" + html

  getDocumentDomainContent: (domain) ->
    "
      <script type='text/javascript'>
        document.domain = '#{domain}';
      </script>
    "

  getHeadContent: (domain) ->
    "
      <script type='text/javascript'>
        document.domain = '#{domain}';
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
