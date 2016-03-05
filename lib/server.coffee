express      = require("express")
http         = require("http")
fs           = require("fs-extra")
hbs          = require("hbs")
path         = require("path")
_            = require("underscore")
str          = require("underscore.string")
allowDestroy = require("server-destroy")
Promise      = require("bluebird")
cwd          = require("./cwd")
errors       = require("./errors")
logger       = require("./logger")
Socket       = require("./socket")
Settings     = require("./util/settings")

## cypress following by _ or - or .
cypressEnvRe = /^(cypress_)/i

isCypressEnvLike = (key) ->
  cypressEnvRe.test(key) and key isnt "CYPRESS_ENV"

## currently not making use of event emitter
## but may do so soon
class Server
  constructor: (projectRoot) ->
    if not (@ instanceof Server)
      return new Server(projectRoot)

    if not projectRoot
      throw new Error("Instantiating lib/server requires a projectRoot!")

    @app    = express()
    @server = null
    @io     = null

    @initialize(projectRoot)

  initialize: (projectRoot) ->
    try
      @config = @getCypressJson(projectRoot)

      @setCypressJson(@config)

      logger.setSettings(@config)
    catch err
      err.jsonError = true
      @config = err

  getCypressJson: (projectRoot) ->
    obj = Settings.readSync(projectRoot)
    obj.projectRoot = projectRoot
    obj.envFile = Settings.readEnvSync(projectRoot)
    obj

  getProcessEnvVars: (obj = {}) ->
    normalize = (key) ->
      key.replace(cypressEnvRe, "")

    _.reduce obj, (memo, value, key) ->
      if isCypressEnvLike(key)
        memo[normalize(key)] = value
      memo
    , {}

  parseEnv: (env = {}, envFile = {}) ->
    ## env is from cypress.json
    ## envFile is from cypress.env.json

    _.extend env,
      envFile,
      @getProcessEnvVars(process.env)
      ## finally get the ones from the CLI --env
      ## this should come from nw parseArgs?

  setCypressDefaults: (obj = {}) ->
    if url = obj.baseUrl
      ## always strip trailing slashes
      obj.baseUrl = str.rtrim(url, "/")

    _.defaults obj,
      baseUrl:        null
      clientRoute:    "/__/"
      xhrRoute:       "/xhrs/"
      socketIoRoute:  "/__socket.io"
      commandTimeout: 4000
      visitTimeout:   30000
      requestTimeout: 5000
      responseTimeout: 20000
      port:           2020
      waitForAnimations: true
      animationDistanceThreshold: 5
      autoOpen:       false
      viewportWidth:  1000
      viewportHeight: 660
      testFolder:     "tests"
      fixturesFolder: "tests/_fixtures"
      supportFolder:  "tests/_support"
      javascripts:    []
      namespace:      "__cypress"

    ## split out our own app wide env from user env variables
    ## and delete envFile
    obj.environmentVariables = @parseEnv(obj.env, obj.envFile)
    obj.env = process.env["CYPRESS_ENV"]
    delete obj.envFile

    @setUrls(obj)

    return obj

  ## go through this method for all tests because
  ## it handles setting the defaults up automatically
  ## which gives more accurate testing results
  setCypressJson: (obj) ->
    @setCypressDefaults(obj)

    @app.set "cypress", obj

  setUrls: (obj) ->
    rootUrl = "http://localhost:" + obj.port

    _.extend obj,
      clientUrlDisplay: rootUrl
      clientUrl: rootUrl + obj.clientRoute
      xhrUrl: obj.namespace + obj.xhrRoute

  configureApplication: (options = {}) ->
    _.defaults options,
      morgan: true
      isHeadless: false
      port: null
      socketId: null
      environmentVariables: null

    _.extend @config, _.pick(options, "isHeadless")

    ## merge these into except
    ## for the 'environmentVariables' key
    if envs = options.environmentVariables
      @config.environmentVariables ?= {}
      _.extend(@config.environmentVariables, envs)

    ## if we have a port passed through
    ## our options then override what
    ## is set on our config and update
    ## our urls (which reference the port)
    if p = options.port
      @config.port = p
      @setUrls(@config)

    ## send up our socketId to the client
    if sid = options.socketId
      @config.socketId = sid

    ## set the cypress config from the cypress.json file
    @app.set "port",        @config.port
    @app.set "view engine", "html"
    @app.engine "html",     hbs.__express

    @app.use require("cookie-parser")()
    @app.use require("compression")()
    @app.use require("morgan")("dev") if options.morgan

    ## serve static file from public when route is /__cypress/static
    ## this is to namespace the static cypress files away from
    ## the real application by separating the root from the files
    @app.use "/__cypress/static", express.static(cwd("lib", "public"))

    ## errorhandler
    @app.use require("errorhandler")()

    ## remove the express powered-by header
    @app.disable("x-powered-by")

    @createRoutes()

  createRoutes: ->
    require("./routes")(@app)

  getHttpServer: -> @server

  portInUseErr: (port) ->
    e = errors.get("PORT_IN_USE_SHORT", port)
    e.port = port
    e.portInUse = true
    e

  open: (options = {}) ->
    return Promise.reject(@config) if @config.jsonError

    Promise.try =>
      @configureApplication(options)
      @_open(options)

  _open: (options) ->
    new Promise (resolve, reject) =>
      @server = http.createServer(@app)

      allowDestroy(@server)

      onError = (err) =>
        ## if the server bombs before starting
        ## and the err no is EADDRINUSE
        ## then we know to display the custom err message
        if err.code is "EADDRINUSE"
          reject @portInUseErr(@config.port)

      @server.once "error", onError

      @server.listen @config.port, =>
        @isListening = true
        logger.info("Server listening", {port: @config.port})

        @server.removeListener "error", onError

        resolve(@config)

  _close: ->
    new Promise (resolve) =>
      logger.unsetSettings()

      ## bail early we dont have a server or we're not
      ## currently listening
      return resolve() if not @server or not @isListening

      logger.info("Server closing")

      @server.destroy =>
        @isListening = false
        resolve()

  close: ->
    Promise.join(
      @_close()
      @socket?.close()
    )

  end: ->
    @socket and @socket.end()

  startWebsockets: (watchers, options) ->
    @socket = Socket(@app)
    @socket.startListening(@server, watchers, options)

module.exports = Server