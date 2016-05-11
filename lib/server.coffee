_            = require("underscore")
hbs          = require("hbs")
url          = require("url")
http         = require("http")
cookie       = require("cookie")
express      = require("express")
Promise      = require("bluebird")
httpProxy    = require("http-proxy")
allowDestroy = require("server-destroy")
cwd          = require("./cwd")
errors       = require("./errors")
logger       = require("./logger")
Socket       = require("./socket")

## currently not making use of event emitter
## but may do so soon
class Server
  constructor: ->
    if not (@ instanceof Server)
      return new Server

    @_server = null
    @_proxy  = null
    @_socket = null

  createExpressApp: (port, morgan) ->
    app = express()

    ## set the cypress config from the cypress.json file
    app.set "port",        port
    app.set "view engine", "html"
    app.engine "html",     hbs.__express

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

  createRoutes: (app, config) ->
    require("./routes")(app, config)

  getHttpServer: -> @_server

  portInUseErr: (port) ->
    e = errors.get("PORT_IN_USE_SHORT", port)
    e.port = port
    e.portInUse = true
    e

  open: (projectRoot, config = {}) ->
    Promise.try =>
      app = @createExpressApp(config.port, config.morgan)

      logger.setSettings(config)

      @createRoutes(app, config)

      @createServer(config.port, config.socketIoRoute, app)
      .return(@)

  createServer: (port, socketIoRoute, app) ->
    new Promise (resolve, reject) =>
      @_server = http.createServer(app)
      @_proxy  = httpProxy.createProxyServer()

      allowDestroy(@_server)

      onError = (err) =>
        ## if the server bombs before starting
        ## and the err no is EADDRINUSE
        ## then we know to display the custom err message
        if err.code is "EADDRINUSE"
          reject @portInUseErr(port)

      onUpgrade = (req, socket, head) =>
        @proxyWebsockets(@_proxy, socketIoRoute, req, socket, head)

      @_server.on "upgrade", onUpgrade

      @_server.once "error", onError

      @_server.listen port, =>
        @isListening = true
        logger.info("Server listening", {port: port})

        @_server.removeListener "error", onError

        resolve(@_server)

  proxyWebsockets: (proxy, socketIoRoute, req, socket, head) ->
    ## bail if this is our own namespaced socket.io request
    return if req.url.startsWith(socketIoRoute)

    ## parse the cookies to find our remoteHost
    cookies = cookie.parse(req.headers.cookie ? "")

    if remoteHost = cookies["__cypress.remoteHost"]
      ## get the hostname + port from the remoteHost
      {hostname, port} = url.parse(remoteHost)

      proxy.ws(req, socket, head, {
        target: {
          host: hostname
          port: port
        }
      })
    else
      ## we can't do anything with this socket
      ## since we don't know how to proxy it!
      socket.end() if socket.writable

  _close: ->
    new Promise (resolve) =>
      logger.unsetSettings()

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
    )

  end: ->
    @_socket and @_socket.end()

  startWebsockets: (watchers, config, options) ->
    @_socket = Socket()
    @_socket.startListening(@_server, watchers, config, options)

module.exports = Server