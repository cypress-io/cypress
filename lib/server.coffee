express      = require 'express'
http         = require 'http'
fs           = require 'fs'
hbs          = require 'hbs'
_            = require 'underscore'
_.str        = require 'underscore.string'
allowDestroy = require "server-destroy"
Promise      = require 'bluebird'
Log          = require "./log"
Project      = require "./project"
Socket       = require "./socket"
Settings     = require './util/settings'

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
    @config = @getCypressJson(projectRoot)

    @setCypressJson(@config)

    Log.setSettings(@config)

  getCypressJson: (projectRoot) ->
    obj = Settings.readSync(projectRoot)
    obj.projectRoot = projectRoot
    obj

  setCypressDefaults: (obj = {}) ->
    if url = obj.baseUrl
      ## always strip trailing slashes
      obj.baseUrl = _.str.rtrim(url, "/")

    ## commandTimeout should be in the cypress.json file
    ## since it has a significant impact on the tests
    ## passing or failing

    _.defaults obj,
      clientRoute: "/__/"
      commandTimeout: 4000
      port: 2020
      autoOpen: false
      wizard: false
      testFolder: "tests"
      javascripts: []
      env: process.env["NODE_ENV"]
      namespace: "__cypress"

    rootUrl = "http://localhost:" + obj.port

    _.defaults obj,
      clientUrlDisplay: rootUrl
      clientUrl: rootUrl + obj.clientRoute

    _.defaults obj,
      idGeneratorUrl: rootUrl + "/__cypress/id_generator"

  ## go through this method for all tests because
  ## it handles setting the defaults up automatically
  ## which gives more accurate testing results
  setCypressJson: (obj) ->
    @setCypressDefaults(obj)

    @app.set "cypress", obj

  configureApplication: ->
    ## set the cypress config from the cypress.json file
    @app.set "port",        @config.port
    @app.set "view engine", "html"
    @app.engine "html",     hbs.__express

    @app.use require("cookie-parser")()
    @app.use require("compression")()
    @app.use require("morgan")("dev")
    @app.use require("body-parser").json()

    ## serve static file from public when route is /__cypress/static
    ## this is to namespace the static cypress files away from
    ## the real application by separating the root from the files
    @app.use "/__cypress/static", express.static(__dirname + "/public")

    ## errorhandler
    @app.use require("errorhandler")()

    @createRoutes()

  createRoutes: ->
    require("./routes")(@app)

  portInUseErr: (port) ->
    e = new Error("Port: '#{port}' is already in use.")
    e.portInUse = true
    e

  open: ->
    @server    = http.createServer(@app)
    @io        = require("socket.io")(@server, {path: "/__socket.io"})
    @project   = Project(@config.projectRoot)

    allowDestroy(@server)

    @configureApplication()

    ## refactor this class
    socket = Socket(@io, @app)
    socket.startListening()

    new Promise (resolve, reject) =>
      onError = (err) =>
        ## if the server bombs before starting
        ## and the err no is EADDRINUSE
        ## then we know to display the custom err message
        if err.errno is "EADDRINUSE"
          reject @portInUseErr(@config.port)

      @server.once "error", onError

      @server.listen @config.port, =>
        @isListening = true
        Log.info("Server listening", {port: @config.port})

        @server.removeListener "error", onError

        @project.ensureProjectId().bind(@)
        .then ->
          require('open')(@config.clientUrl) if @config.autoOpen
        .return(@config)
        .then(resolve)
        .catch(reject)

  close: ->
    promise = new Promise (resolve) =>
      Log.unsetSettings()

      ## bail early we dont have a server or we're not
      ## currently listening
      return resolve() if not @server or not @isListening

      Log.info("Server closing")

      @app.emit("close")

      @server.destroy =>
        @isListening = false
        resolve()

    promise.then ->
      Log.info "Server closed"

module.exports = Server