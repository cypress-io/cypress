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
class Server #extends require('./logger')
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
    Log.setSettings(@config)

    @app.set "cypress", @config

  getCypressJson: (projectRoot) ->
    obj = Settings.readSync(projectRoot)

    if url = obj.baseUrl
      ## always strip trailing slashes
      obj.baseUrl = _.str.rtrim(url, "/")

    ## commandTimeout should be in the cypress.json file
    ## since it has a significant impact on the tests
    ## passing or failing

    _.defaults obj,
      commandTimeout: 4000
      port: 3000
      autoOpen: false
      wizard: false
      projectRoot: projectRoot
      testFolder: "tests"

    _.defaults obj,
      clientUrl: "http://localhost:#{obj.port}"

    _.defaults obj,
      idGeneratorPath: "#{obj.clientUrl}/id_generator"

  configureApplication: ->
    ## set the cypress config from the cypress.json file
    @app.set "port",        @config.port
    @app.set "view engine", "html"
    @app.engine "html",     hbs.__express

    @app.use require("cookie-parser")()
    @app.use require("compression")()
    @app.use require("morgan")("dev")
    @app.use require("body-parser").json()
    @app.use require('express-session')({
      secret: "marionette is cool"
      saveUninitialized: true
      resave: true
      name: "__cypress.sid"
    })

    ## serve static file from public when route is /eclectus
    ## this is to namespace the static eclectus files away from
    ## the real application by separating the root from the files
    @app.use "/eclectus", express.static(__dirname + "/public")

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

      @server.destroy =>
        @isListening = false
        resolve()

    promise.then ->
      Log.info "Server closed"

module.exports = Server