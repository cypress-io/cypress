_            = require("lodash")
exphbs       = require("express-handlebars")
url          = require("url")
http         = require("http")
concatStream = require("concat-stream")
cookie       = require("cookie")
stream       = require("stream")
express      = require("express")
Promise      = require("bluebird")
evilDns      = require("evil-dns")
isHtml       = require("is-html")
httpProxy    = require("http-proxy")
la           = require("lazy-ass")
check        = require("check-more-types")
httpsProxy   = require("@packages/https-proxy")
compression  = require("compression")
debug        = require("debug")("cypress:server:server")
agent        = require("@packages/network").agent
cors         = require("./util/cors")
uri          = require("./util/uri")
origin       = require("./util/origin")
ensureUrl    = require("./util/ensure-url")
appData      = require("./util/app_data")
buffers      = require("./util/buffers")
blacklist    = require("./util/blacklist")
statusCode   = require("./util/status_code")
headersUtil  = require("./util/headers")
allowDestroy = require("./util/server_destroy")
cwd          = require("./cwd")
errors       = require("./errors")
logger       = require("./logger")
Socket       = require("./socket")
Request      = require("./request")
fileServer   = require("./file_server")

DEFAULT_DOMAIN_NAME    = "localhost"
fullyQualifiedRe       = /^https?:\/\//

isResponseHtml = (contentType, responseBuffer) ->
  if contentType
    return contentType is "text/html"

  if body = _.invoke(responseBuffer, 'toString')
    return isHtml(body)

  return false

setProxiedUrl = (req) ->
  ## bail if we've already proxied the url
  return if req.proxiedUrl

  ## backup the original proxied url
  ## and slice out the host/origin
  ## and only leave the path which is
  ## how browsers would normally send
  ## use their url
  req.proxiedUrl = uri.removeDefaultPort(req.url).format()

  req.url = uri.getPath(req.url)

notSSE = (req, res) ->
  req.headers.accept isnt "text/event-stream" and compression.filter(req, res)

## currently not making use of event emitter
## but may do so soon
class Server
  constructor:  ->
    if not (@ instanceof Server)
      return new Server()

    @_request    = null
    @_middleware = null
    @_server     = null
    @_socket     = null
    @_baseUrl    = null
    @_nodeProxy  = null
    @_fileServer = null
    @_httpsProxy = null
    @_urlResolver = null

  createExpressApp: (morgan) ->
    app = express()

    ## set the cypress config from the cypress.json file
    app.set("view engine", "html")

    ## since we use absolute paths, configure express-handlebars to not automatically find layouts
    ## https://github.com/cypress-io/cypress/issues/2891
    app.engine("html", exphbs({
      defaultLayout: false
      layoutsDir: []
      partialsDir: []
    }))

    ## handle the proxied url in case
    ## we have not yet started our websocket server
    app.use (req, res, next) =>
      setProxiedUrl(req)

      ## if we've defined some middlware
      ## then call this. useful in tests
      if m = @_middleware
        m(req, res)

      ## always continue on

      next()

    app.use require("cookie-parser")()
    app.use compression({filter: notSSE})
    app.use require("morgan")("dev") if morgan

    ## errorhandler
    app.use require("errorhandler")()

    ## remove the express powered-by header
    app.disable("x-powered-by")

    return app

  createRoutes: ->
    require("./routes").apply(null, arguments)

  getHttpServer: -> @_server

  portInUseErr: (port) ->
    e = errors.get("PORT_IN_USE_SHORT", port)
    e.port = port
    e.portInUse = true
    e

  open: (config = {}, project, onWarning) ->
    la(_.isPlainObject(config), "expected plain config object", config)

    Promise.try =>
      ## always reset any buffers
      ## TODO: change buffers to be an instance
      ## here and pass this dependency around
      buffers.reset()

      app = @createExpressApp(config.morgan)

      logger.setSettings(config)

      ## generate our request instance
      ## and set the responseTimeout
      @_request = Request({timeout: config.responseTimeout})
      @_nodeProxy = httpProxy.createProxyServer()

      getRemoteState = => @_getRemoteState()

      @createHosts(config.hosts)

      @createRoutes(app, config, @_request, getRemoteState, project, @_nodeProxy)

      @createServer(app, config, project, @_request, onWarning)

  createHosts: (hosts = {}) ->
    _.each hosts, (ip, host) ->
      evilDns.add(host, ip)

  createServer: (app, config, project, request, onWarning) ->
    new Promise (resolve, reject) =>
      {port, fileServerFolder, socketIoRoute, baseUrl, blacklistHosts} = config

      @_server  = http.createServer(app)

      allowDestroy(@_server)

      onError = (err) =>
        ## if the server bombs before starting
        ## and the err no is EADDRINUSE
        ## then we know to display the custom err message
        if err.code is "EADDRINUSE"
          reject @portInUseErr(port)

      onUpgrade = (req, socket, head) =>
        debug("Got UPGRADE request from %s", req.url)

        @proxyWebsockets(@_nodeProxy, socketIoRoute, req, socket, head)

      callListeners = (req, res) =>
        listeners = @_server.listeners("request").slice(0)

        @_callRequestListeners(@_server, listeners, req, res)

      onSniUpgrade = (req, socket, head) =>
        upgrades = @_server.listeners("upgrade").slice(0)
        for upgrade in upgrades
          upgrade.call(@_server, req, socket, head)

      @_server.on "connect", (req, socket, head) =>
        debug("Got CONNECT request from %s", req.url)

        @_httpsProxy.connect(req, socket, head, {
          onDirectConnection: (req) =>
            urlToCheck = "https://" + req.url

            isMatching = cors.urlMatchesOriginPolicyProps(urlToCheck, @_remoteProps)

            word = if isMatching then "does" else "does not"

            debug("HTTPS request #{word} match URL: #{urlToCheck} with props: %o", @_remoteProps)

            ## if we are currently matching then we're
            ## not making a direct connection anyway
            ## so we only need to check this if we
            ## have blacklist hosts and are not matching.
            ##
            ## if we have blacklisted hosts lets
            ## see if this matches - if so then
            ## we cannot allow it to make a direct
            ## connection
            if blacklistHosts and not isMatching
              isMatching = blacklist.matches(urlToCheck, blacklistHosts)

              debug("HTTPS request #{urlToCheck} matches blacklist?", isMatching)

            ## make a direct connection only if
            ## our req url does not match the origin policy
            ## which is the superDomain + port
            return not isMatching
        })

      @_server.on "upgrade", onUpgrade

      @_server.once "error", onError

      @_listen(port, onError)
      .then (port) =>
        Promise.all([
          httpsProxy.create(appData.path("proxy"), port, {
            onRequest: callListeners
            onUpgrade: onSniUpgrade
          }),

          fileServer.create(fileServerFolder)
        ])
        .spread (httpsProxy, fileServer) =>
          @_httpsProxy = httpsProxy
          @_fileServer = fileServer

          ## if we have a baseUrl let's go ahead
          ## and make sure the server is connectable!
          if baseUrl
            @_baseUrl = baseUrl

            if config.isTextTerminal
              return @_retryBaseUrlCheck(baseUrl, onWarning)
              .return(null)
              .catch (e) ->
                debug(e)
                reject(errors.get("CANNOT_CONNECT_BASE_URL", baseUrl))

            ensureUrl.isListening(baseUrl)
            .return(null)
            .catch (err) ->
              errors.get("CANNOT_CONNECT_BASE_URL_WARNING", baseUrl)

        .then (warning) =>
          ## once we open set the domain
          ## to root by default
          ## which prevents a situation where navigating
          ## to http sites redirects to /__/ cypress
          @_onDomainSet(baseUrl ? "<root>")

          resolve([port, warning])

  _port: ->
    _.chain(@_server).invoke("address").get("port").value()

  _listen: (port, onError) ->
    new Promise (resolve) =>
      listener = =>
        address = @_server.address()

        @isListening = true

        debug("Server listening on ", address)

        @_server.removeListener "error", onError

        resolve(address.port)

      @_server.listen(port || 0, '127.0.0.1', listener)

  _getRemoteState: ->
    # {
    #   origin: "http://localhost:2020"
    #   fileServer:
    #   strategy: "file"
    #   domainName: "localhost"
    #   props: null
    # }

    # {
    #   origin: "https://foo.google.com"
    #   strategy: "http"
    #   domainName: "google.com"
    #   props: {
    #     port: 443
    #     tld: "com"
    #     domain: "google"
    #   }
    # }

    props = _.extend({},  {
      auth:       @_remoteAuth
      props:      @_remoteProps
      origin:     @_remoteOrigin
      strategy:   @_remoteStrategy
      visiting:   @_remoteVisitingUrl
      domainName: @_remoteDomainName
      fileServer: @_remoteFileServer
    })

    debug("Getting remote state: %o", props)

    return props

  _onRequest: (headers, automationRequest, options) ->
    @_request.sendPromise(headers, automationRequest, options)

  _onResolveUrl: (urlStr, headers, automationRequest, options = {}) ->
    debug("resolving visit %o", {
      url: urlStr
      headers
      options
    })

    startTime = new Date()

    ## if we have an existing url resolver
    ## in flight then cancel it
    if @_urlResolver
      @_urlResolver.cancel()

    request = @_request

    handlingLocalFile = false
    previousState = _.clone @_getRemoteState()

    ## nuke any hashes from our url since
    ## those those are client only and do
    ## not apply to http requests
    urlStr = url.parse(urlStr)
    urlStr.hash = null
    urlStr = urlStr.format()

    originalUrl = urlStr

    reqStream = null
    currentPromisePhase = null

    runPhase = (fn) ->
      return currentPromisePhase = fn()

    return @_urlResolver = p = new Promise (resolve, reject, onCancel) =>
      onCancel ->
        p.currentPromisePhase = currentPromisePhase
        p.reqStream = reqStream

        _.invoke(reqStream, "abort")
        _.invoke(currentPromisePhase, "cancel")

      ## if we have a buffer for this url
      ## then just respond with its details
      ## so we are idempotant and do not make
      ## another request
      if obj = buffers.getByOriginalUrl(urlStr)
        debug("got previous request buffer for url:", urlStr)

        ## reset the cookies from the existing stream's jar
        return runPhase ->
          resolve(
            request.setJarCookies(obj.jar, automationRequest)
            .then (c) ->
              return obj.details
          )

      redirects = []
      newUrl = null

      if not fullyQualifiedRe.test(urlStr)
        handlingLocalFile = true

        @_remoteVisitingUrl = true

        @_onDomainSet(urlStr, options)

        ## TODO: instead of joining remoteOrigin here
        ## we can simply join our fileServer origin
        ## and bypass all the remoteState.visiting shit
        urlFile = url.resolve(@_remoteFileServer, urlStr)
        urlStr  = url.resolve(@_remoteOrigin, urlStr)

      onReqError = (err) =>
        ## only restore the previous state
        ## if our promise is still pending
        if p.isPending()
          restorePreviousState()

        reject(err)

      onReqStreamReady = (str) =>
        reqStream = str

        str
        .on("error", onReqError)
        .on "response", (incomingRes) =>
          debug(
            "resolve:url headers received, buffering response %o",
            _.pick(incomingRes, "headers", "statusCode")
          )

          jar = str.getJar()

          runPhase =>
            request.setJarCookies(jar, automationRequest)
            .then (c) =>
              @_remoteVisitingUrl = false

              newUrl ?= urlStr

              statusIs2xxOrAllowedFailure = ->
                ## is our status code in the 2xx range, or have we disabled failing
                ## on status code?
                statusCode.isOk(incomingRes.statusCode) or (options.failOnStatusCode is false)

              isOk        = statusIs2xxOrAllowedFailure()
              contentType = headersUtil.getContentType(incomingRes)

              details = {
                isOkStatusCode: isOk
                contentType
                url: newUrl
                status: incomingRes.statusCode
                cookies: c
                statusText: statusCode.getText(incomingRes.statusCode)
                redirects
                originalUrl
              }

              ## does this response have this cypress header?
              if fp = incomingRes.headers["x-cypress-file-path"]
                ## if so we know this is a local file request
                details.filePath = fp

              debug("setting details resolving url %o", details)

              concatStr = concatStream (responseBuffer) =>
                ## buffer the entire response before resolving.
                ## this allows us to detect & reject ETIMEDOUT errors
                ## where the headers have been sent but the
                ## connection hangs before receiving a body.

                if !_.get(responseBuffer, 'length')
                  ## concatStream can yield an empty array, which is
                  ## not a valid chunk
                  responseBuffer = undefined

                ## if there is not a content-type, try to determine
                ## if the response content is HTML-like
                ## https://github.com/cypress-io/cypress/issues/1727
                details.isHtml = isResponseHtml(contentType, responseBuffer)

                debug("resolve:url response ended, setting buffer %o", { newUrl, details })

                details.totalTime = new Date() - startTime

                ## TODO: think about moving this logic back into the
                ## frontend so that the driver can be in control of
                ## when the server should cache the request buffer
                ## and set the domain vs not
                if isOk and details.isHtml
                  ## reset the domain to the new url if we're not
                  ## handling a local file
                  @_onDomainSet(newUrl, options) if not handlingLocalFile

                  responseBufferStream = new stream.PassThrough({
                    highWaterMark: Number.MAX_SAFE_INTEGER
                  })

                  responseBufferStream.end(responseBuffer)

                  buffers.set({
                    url: newUrl
                    jar: jar
                    stream: responseBufferStream
                    details: details
                    originalUrl: originalUrl
                    response: incomingRes
                  })
                else
                  ## TODO: move this logic to the driver too for
                  ## the same reasons listed above
                  restorePreviousState()

                resolve(details)

              str.pipe(concatStr)
            .catch(onReqError)

      restorePreviousState = =>
        @_remoteAuth         = previousState.auth
        @_remoteProps        = previousState.props
        @_remoteOrigin       = previousState.origin
        @_remoteStrategy     = previousState.strategy
        @_remoteFileServer   = previousState.fileServer
        @_remoteDomainName   = previousState.domainName
        @_remoteVisitingUrl  = previousState.visiting

      # if they're POSTing an object, querystringify their POST body
      if options.method == 'POST' and _.isObject(options.body)
        options.form = options.body
        delete options.body

      _.assign(options, {
        ## turn off gzip since we need to eventually
        ## rewrite these contents
        gzip: false
        url: urlFile ? urlStr
        headers: _.assign({
          accept: "text/html,*/*"
        }, options.headers)
        onBeforeReqInit: runPhase
        followRedirect: (incomingRes) ->
          status = incomingRes.statusCode
          next = incomingRes.headers.location

          curr = newUrl ? urlStr

          newUrl = url.resolve(curr, next)

          redirects.push([status, newUrl].join(": "))

          return true
      })

      debug('sending request with options %o', options)

      runPhase ->
        request.sendStream(headers, automationRequest, options)
        .then (createReqStream) ->
          onReqStreamReady(createReqStream())
        .catch(onReqError)

  _onDomainSet: (fullyQualifiedUrl, options = {}) ->
    l = (type, val) ->
      debug("Setting", type, val)

    @_remoteAuth = options.auth

    l("remoteAuth", @_remoteAuth)

    ## if this isn't a fully qualified url
    ## or if this came to us as <root> in our tests
    ## then we know to go back to our default domain
    ## which is the localhost server
    if fullyQualifiedUrl is "<root>" or not fullyQualifiedRe.test(fullyQualifiedUrl)
      @_remoteOrigin = "http://#{DEFAULT_DOMAIN_NAME}:#{@_port()}"
      @_remoteStrategy = "file"
      @_remoteFileServer = "http://#{DEFAULT_DOMAIN_NAME}:#{@_fileServer?.port()}"
      @_remoteDomainName = DEFAULT_DOMAIN_NAME
      @_remoteProps = null

      l("remoteOrigin", @_remoteOrigin)
      l("remoteStrategy", @_remoteStrategy)
      l("remoteHostAndPort", @_remoteProps)
      l("remoteDocDomain", @_remoteDomainName)
      l("remoteFileServer", @_remoteFileServer)

    else
      @_remoteOrigin = origin(fullyQualifiedUrl)

      @_remoteStrategy = "http"

      @_remoteFileServer = null

      ## set an object with port, tld, and domain properties
      ## as the remoteHostAndPort
      @_remoteProps = cors.parseUrlIntoDomainTldPort(@_remoteOrigin)

      @_remoteDomainName = _.compact([@_remoteProps.domain, @_remoteProps.tld]).join(".")

      l("remoteOrigin", @_remoteOrigin)
      l("remoteHostAndPort", @_remoteProps)
      l("remoteDocDomain", @_remoteDomainName)

    return @_getRemoteState()

  _callRequestListeners: (server, listeners, req, res) ->
    for listener in listeners
      listener.call(server, req, res)

  _normalizeReqUrl: (server) ->
    ## because socket.io removes all of our request
    ## events, it forces the socket.io traffic to be
    ## handled first.
    ## however we need to basically do the same thing
    ## it does and after we call into socket.io go
    ## through and remove all request listeners
    ## and change the req.url by slicing out the host
    ## because the browser is in proxy mode
    listeners = server.listeners("request").slice(0)
    server.removeAllListeners("request")
    server.on "request", (req, res) =>
      setProxiedUrl(req)

      @_callRequestListeners(server, listeners, req, res)

  _retryBaseUrlCheck: (baseUrl, onWarning) ->
    ensureUrl.retryIsListening(baseUrl, {
      retryIntervals: [3000, 3000, 4000],
      onRetry: ({ attempt, delay, remaining }) ->
        warning = errors.get("CANNOT_CONNECT_BASE_URL_RETRYING", {
          remaining
          attempt
          delay
          baseUrl
        })

        onWarning(warning)
    })

  proxyWebsockets: (proxy, socketIoRoute, req, socket, head) ->
    ## bail if this is our own namespaced socket.io request
    return if req.url.startsWith(socketIoRoute)

    if (host = req.headers.host) and @_remoteProps and (remoteOrigin = @_remoteOrigin)
      ## get the port from @_remoteProps
      ## get the protocol from remoteOrigin
      ## get the hostname from host header
      {port}     = @_remoteProps
      {protocol} = url.parse(remoteOrigin)
      {hostname} = url.parse("http://#{host}")

      onProxyErr = (err, req, res) ->
        ## by default http-proxy will call socket.end
        ## with no data, so we need to override the end
        ## function and write our own response
        ## https://github.com/nodejitsu/node-http-proxy/blob/master/lib/http-proxy/passes/ws-incoming.js#L159
        end = socket.end
        socket.end = ->
          socket.end = end

          response = [
            "HTTP/#{req.httpVersion} 502 #{statusCode.getText(502)}"
            "X-Cypress-Proxy-Error-Message: #{err.message}"
            "X-Cypress-Proxy-Error-Code: #{err.code}"
          ].join("\r\n") + "\r\n\r\n"

          proxiedUrl = "#{protocol}//#{hostname}:#{port}"

          debug(
            "Got ERROR proxying websocket connection to url: '%s' received error: '%s' with code '%s'",
            proxiedUrl,
            err.toString()
            err.code
          )

          socket.end(response)

      proxy.ws(req, socket, head, {
        secure: false
        target: {
          host: hostname
          port: port
          protocol: protocol
        }
        agent: agent
      }, onProxyErr)
    else
      ## we can't do anything with this socket
      ## since we don't know how to proxy it!
      socket.end() if socket.writable

  reset: ->
    buffers.reset()

    @_onDomainSet(@_baseUrl ? "<root>")

  _close: ->
    @reset()

    logger.unsetSettings()

    evilDns.clear()

    ## bail early we dont have a server or we're not
    ## currently listening
    return Promise.resolve() if not @_server or not @isListening

    @_server.destroyAsync()
    .then =>
      @isListening = false

  close: ->
    Promise.join(
      @_close()
      @_socket?.close()
      @_fileServer?.close()
      @_httpsProxy?.close()
    )
    .then =>
      ## reset any middleware
      @_middleware = null

  end: ->
    @_socket and @_socket.end()

  changeToUrl: (url) ->
    @_socket and @_socket.changeToUrl(url)

  onTestFileChange: (filePath) ->
    @_socket and @_socket.onTestFileChange(filePath)

  onRequest: (fn) ->
    @_middleware = fn

  onNextRequest: (fn) ->
    @onRequest =>
      fn.apply(@, arguments)

      @_middleware = null

  startWebsockets: (automation, config, options = {}) ->
    options.onResolveUrl = @_onResolveUrl.bind(@)
    options.onRequest    = @_onRequest.bind(@)

    @_socket = Socket(config)
    @_socket.startListening(@_server, automation, config, options)
    @_normalizeReqUrl(@_server)
    # handleListeners(@_server)

module.exports = Server
