_            = require("underscore")
hbs          = require("hbs")
url          = require("url")
http         = require("http")
cookie       = require("cookie")
stream       = require("stream")
express      = require("express")
Promise      = require("bluebird")
evilDns      = require("evil-dns")
statuses     = require("http-status-codes")
httpProxy    = require("http-proxy")
httpsProxy   = require("packages/core-https-proxy")
allowDestroy = require("server-destroy-vvo")
cors         = require("./util/cors")
headersUtil  = require("./util/headers")
appData      = require("./util/app_data")
buffers      = require("./util/buffers")
cwd          = require("./cwd")
errors       = require("./errors")
logger       = require("./logger")
Socket       = require("./socket")
Request      = require("./request")
fileServer   = require("./file_server")

DEFAULT_DOMAIN_NAME    = "localhost"
fullyQualifiedRe       = /^https?:\/\//
isOkayStatusRe         = /^2/

setProxiedUrl = (req) ->
  ## bail if we've already proxied the url
  return if req.proxiedUrl

  ## backup the original proxied url
  ## and slice out the host/origin
  ## and only leave the path which is
  ## how browsers would normally send
  ## use their url
  req.proxiedUrl = req.url
  logger.info "Setting proxied url", proxiedUrl: req.proxiedUrl

  req.url = url.parse(req.url).path

## currently not making use of event emitter
## but may do so soon
class Server
  constructor: ->
    if not (@ instanceof Server)
      return new Server

    @_request    = null
    @_middleware = null
    @_server     = null
    @_socket     = null
    @_wsProxy    = null
    @_fileServer = null
    @_httpsProxy = null

  createExpressApp: (morgan) ->
    app = express()

    ## set the cypress config from the cypress.json file
    app.set("view engine", "html")
    app.engine("html",     hbs.__express)

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
    app.use require("compression")()
    app.use require("morgan")("dev") if morgan

    ## serve static file from public when route is /__cypress/static
    ## this is to namespace the static cypress files away from
    ## the real application by separating the root from the files
    app.use "/__cypress/static", express.static(cwd("lib", "public"))

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

  resetState: ->
    buffers.reset()

    if @_remoteProps
      ## clear out the previous domain
      ## and reset to the initial state
      @_onDomainSet("<root>")

  open: (config = {}) ->
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

      getRemoteState = => @_getRemoteState()

      @createHosts(config.hosts)

      @createRoutes(app, config, @_request, getRemoteState)

      @createServer(app, config, @_request)

  createHosts: (hosts = {}) ->
    _.each hosts, (ip, host) ->
      evilDns.add(host, ip)

  createServer: (app, config, request) ->
    new Promise (resolve, reject) =>
      {port, fileServerFolder, socketIoRoute} = config

      @_server  = http.createServer(app)
      @_wsProxy = httpProxy.createProxyServer()

      allowDestroy(@_server)

      onError = (err) =>
        ## if the server bombs before starting
        ## and the err no is EADDRINUSE
        ## then we know to display the custom err message
        if err.code is "EADDRINUSE"
          reject @portInUseErr(port)

      onUpgrade = (req, socket, head) =>
        @proxyWebsockets(@_wsProxy, socketIoRoute, req, socket, head)

      callListeners = (req, res) =>
        listeners = @_server.listeners("request").slice(0)

        @_callRequestListeners(@_server, listeners, req, res)

      onSniUpgrade = (req, socket, head) =>
        upgrades = @_server.listeners("upgrade").slice(0)
        for upgrade in upgrades
          upgrade.call(@_server, req, socket, head)

      @_server.on "connect", (req, socket, head) =>
        @_httpsProxy.connect(req, socket, head, {
          onDirectConnection: (req) =>
            ## make a direct connection only if
            ## our req url does not match the origin policy
            ## which is the superDomain + port
            dc = not cors.urlMatchesOriginPolicyProps("https://" + req.url, @_remoteProps)

            if dc
              str = "Making"
            else
              str = "Not making"

            logger.info(str + " direction connection to: '#{req.url}'")

            return dc
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

          ## once we open set the domain
          ## to root by default
          ## which prevents a situation where navigating
          ## to http sites redirects to /__/ cypress
          @_onDomainSet("<root>")

          resolve(port)

  _port: ->
    @_server?.address().port

  _listen: (port, onError) ->
    new Promise (resolve) =>
      listener = =>
        port = @_server.address().port

        @isListening = true

        logger.info("Server listening", {port: port})

        @_server.removeListener "error", onError

        resolve(port)

      ## nuke port from our args if its falsy
      args = _.compact([port, listener])

      @_server.listen.apply(@_server, args)

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

    _.extend({},  {
      props:      @_remoteProps
      origin:     @_remoteOrigin
      strategy:   @_remoteStrategy
      visiting:   @_remoteVisitingUrl
      domainName: @_remoteDomainName
      fileServer: @_remoteFileServer
    })

  _onRequest: (headers, automationRequest, options) ->
    @_request.send(headers, automationRequest, options)

  _onResolveUrl: (urlStr, headers, automationRequest) ->
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

    ## if we have a buffer for this url
    ## then just respond with its details
    ## so we are idempotant and do not make
    ## another request
    if obj = buffers.getByOriginalUrl(urlStr)
      ## reset the cookies from the existing stream's jar
      request.setJarCookies(obj.jar, automationRequest)
      .then (c) ->
        return obj.details
    else
      p = new Promise (resolve, reject) =>
        redirects = []
        newUrl = null

        if not fullyQualifiedRe.test(urlStr)
          handlingLocalFile = true

          @_remoteVisitingUrl = true

          @_onDomainSet(urlStr)

          ## TODO: instead of joining remoteOrigin here
          ## we can simply join our fileServer origin
          ## and bypass all the remoteState.visiting shit
          urlFile = url.resolve(@_remoteFileServer, urlStr)
          urlStr  = url.resolve(@_remoteOrigin, urlStr)

        error = (err) ->
          ## only restore the previous state
          ## if our promise is still pending
          if p.isPending()
            restorePreviousState()

          reject(err)

        getStatusText = (code) ->
          try
            statuses.getStatusText(code)
          catch e
            "Unknown Status Code"

        handleReqStream = (str) =>
          pt = str
          .on("error", error)
          .on "response", (incomingRes) =>
            str.removeListener("error", error)
            str.on "error", (err) ->
              ## if we have listeners on our
              ## passthru stream just emit error
              if pt.listeners("error").length
                pt.emit("error", err)
              else
                ## else store the error for later
                pt.error = err

            jar = str.getJar()

            request.setJarCookies(jar, automationRequest)
            .then (c) =>
              @_remoteVisitingUrl = false

              newUrl ?= urlStr

              isOkay      = isOkayStatusRe.test(incomingRes.statusCode)
              contentType = headersUtil.getContentType(incomingRes)
              isHtml      = contentType is "text/html"

              details = {
                isOk:   isOkay
                isHtml: isHtml
                contentType: contentType
                url: newUrl
                status: incomingRes.statusCode
                cookies: c
                statusText: getStatusText(incomingRes.statusCode)
                redirects: redirects
                originalUrl: originalUrl
              }

              ## does this response have this cypress header?
              if fp = incomingRes.headers["x-cypress-file-path"]
                ## if so we know this is a local file request
                details.filePath = fp

              if isOkay and isHtml
                ## reset the domain to the new url if we're not
                ## handling a local file
                @_onDomainSet(newUrl) if not handlingLocalFile

                buffers.set({
                  url: newUrl
                  jar: jar
                  stream: pt
                  details: details
                  originalUrl: originalUrl
                  response: incomingRes
                })
              else
                restorePreviousState()

              resolve(details)

            .catch(error)
          .pipe(stream.PassThrough())

        restorePreviousState = =>
          @_remoteProps        = previousState.props
          @_remoteOrigin       = previousState.origin
          @_remoteStrategy     = previousState.strategy
          @_remoteFileServer   = previousState.fileServer
          @_remoteDomainName   = previousState.domainName
          @_remoteVisitingUrl  = previousState.visiting

        mergeHost = (curr, next) ->
          ## parse our next url
          next = url.parse(next, true)

          ## and if its missing its host
          ## then take it from the current url
          if not next.host
            curr = url.parse(curr, true)

            for prop in ["hostname", "port", "protocol"]
              next[prop] = curr[prop]

          next.format()

        request.sendStream(headers, automationRequest, {
          ## turn off gzip since we need to eventually
          ## rewrite these contents
          gzip: false
          url: urlFile ? urlStr
          followRedirect: (incomingRes) ->
            status = incomingRes.statusCode
            next = incomingRes.headers.location

            curr = newUrl ? urlStr

            newUrl = mergeHost(curr, next)

            redirects.push([status, newUrl].join(": "))

            return true
        })
        .then(handleReqStream)
        .catch(error)

  _onDomainSet: (fullyQualifiedUrl) ->
    log = (type, url) ->
      logger.info("Setting #{type}", value: url)

    ## if this isn't a fully qualified url
    ## or if this came to us as <root> in our tests
    ## then we know to go back to our default domain
    ## which is the localhost server
    if fullyQualifiedUrl is "<root>" or not fullyQualifiedRe.test(fullyQualifiedUrl)
      @_remoteOrigin = "http://#{DEFAULT_DOMAIN_NAME}:#{@_port()}"
      @_remoteStrategy = "file"
      @_remoteFileServer = "http://#{DEFAULT_DOMAIN_NAME}:#{@_fileServer.port()}"
      @_remoteDomainName = DEFAULT_DOMAIN_NAME
      @_remoteProps = null

      log("remoteOrigin", @_remoteOrigin)
      log("remoteStrategy", @_remoteStrategy)
      log("remoteHostAndPort", @_remoteProps)
      log("remoteDocDomain", @_remoteDomainName)
      log("remoteFileServer", @_remoteFileServer)

    else
      parsed = url.parse(fullyQualifiedUrl)

      parsed.hash     = null
      parsed.search   = null
      parsed.query    = null
      parsed.path     = null
      parsed.pathname = null

      @_remoteOrigin = url.format(parsed)

      @_remoteStrategy = "http"

      @_remoteFileServer = null

      ## set an object with port, tld, and domain properties
      ## as the remoteHostAndPort
      @_remoteProps = cors.parseUrlIntoDomainTldPort(@_remoteOrigin)

      @_remoteDomainName = _.compact([@_remoteProps.domain, @_remoteProps.tld]).join(".")

      log("remoteOrigin", @_remoteOrigin)
      log("remoteHostAndPort", @_remoteProps)
      log("remoteDocDomain", @_remoteDomainName)

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

      proxy.ws(req, socket, head, {
        secure: false
        target: {
          host: hostname
          port: port
          protocol: protocol
        }
      })
    else
      ## we can't do anything with this socket
      ## since we don't know how to proxy it!
      socket.end() if socket.writable

  _close: ->
    new Promise (resolve) =>
      logger.unsetSettings()

      evilDns.clear()

      ## bail early we dont have a server or we're not
      ## currently listening
      return resolve() if not @_server or not @isListening

      logger.info("Server closing")

      @_server.destroy =>
        @isListening = false
        resolve()

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

  onRequest: (fn) ->
    @_middleware = fn

  onNextRequest: (fn) ->
    @onRequest =>
      fn.apply(@, arguments)

      @_middleware = null

  startWebsockets: (watchers, config, options = {}) ->
    options.onResolveUrl = @_onResolveUrl.bind(@)
    options.onRequest    = @_onRequest.bind(@)

    @_socket = Socket()
    @_socket.startListening(@_server, watchers, config, options)
    @_normalizeReqUrl(@_server)
    # handleListeners(@_server)

module.exports = Server