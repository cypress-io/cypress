_             = require("lodash")
fs            = require("fs-extra")
path          = require("path")
uuid          = require("node-uuid")
Promise       = require("bluebird")
socketIo      = require("@packages/socket")
open          = require("./util/open")
pathHelpers   = require("./util/path_helpers")
cwd           = require("./cwd")
exec          = require("./exec")
files         = require("./files")
fixture       = require("./fixture")
errors        = require("./errors")
logger        = require("./logger")
browsers      = require("./browsers")
automation    = require("./automation")
preprocessor  = require("./preprocessor")
log           = require('debug')('cypress:server:socket')

existingState = null

runnerEvents = [
  "reporter:restart:test:run"
  "runnables:ready"
  "run:start"
  "test:before:hooks"
  "reporter:log:add"
  "reporter:log:state:changed"
  "paused"
  "test:after:hooks"
  "run:end"
]

reporterEvents = [
  # "go:to:file"
  "runner:restart"
  "runner:abort"
  "runner:console:log"
  "runner:console:error"
  "runner:show:snapshot"
  "runner:hide:snapshot"
  "reporter:restarted"
]

retry = (fn) ->
  Promise.delay(25).then(fn)

isSpecialSpec = (name) ->
  name.endsWith("__all")

class Socket
  constructor: ->
    if not (@ instanceof Socket)
      return new Socket

  onTestFileChange: (filePath) ->
    log("test file changed: #{filePath}")

    ## return if we're not a js or coffee file.
    ## this will weed out directories as well
    return if not /\.(js|jsx|coffee|cjsx)$/.test filePath

    console.log("foo")
    fs.statAsync(filePath)
    .then =>
      console.log("bar")
      @io.emit("watched:file:changed")
    .catch ->
      log("could not find test file that changed: #{filePath}")

  watchTestFileByPath: (config, originalFilePath, options) ->
    ## files are always sent as integration/foo_spec.js
    ## need to take into account integrationFolder may be different so
    ## integration/foo_spec.js becomes cypress/my-integration-folder/foo_spec.js
    log("watch test file #{originalFilePath}")
    filePath = path.join(config.integrationFolder, originalFilePath.replace("integration/", ""))
    filePath = filePath.replace("#{config.projectRoot}/", "")

    ## bail if this is special path like "__all"
    ## maybe the client should not ask to watch non-spec files?
    return if isSpecialSpec(filePath)

    ## bail if we're already watching this
    ## exact file or we've turned off watching
    ## for file changes
    return if filePath is @testFilePath

    ## remove the existing file by its path
    if @testFilePath
      preprocessor.removeFile(@testFilePath)

    ## store this location
    @testFilePath = filePath
    log("will watch test file path #{filePath}")

    if config.watchForFileChanges
      options = {
        onChange: @onTestFileChange.bind(@)
      }

    preprocessor.getFile(filePath, config, options)
    ## ignore errors b/c we're just setting up the watching. errors
    ## are handled by the spec controller
    .catch ->

  onFixture: (config, file, options, cb) ->
    fixture.get(config.fixturesFolder, file, options)
    .then(cb)
    .catch (err) ->
      cb({__error: err.message})

  onReadFile: (config, file, options, cb) ->
    files.readFile(config.projectRoot, file, options)
    .then(cb)
    .catch (err) ->
      cb({__error: { message: err.message, code: err.code, filePath: err.filePath }})

  onWriteFile: (config, file, contents, options, cb) ->
    files.writeFile(config.projectRoot, file, contents, options)
    .then(cb)
    .catch (err) ->
      cb({__error: { message: err.message, code: err.code, filePath: err.filePath }})

  onExec: (projectRoot, options, cb) ->
    exec.run(projectRoot, options)
    .then(cb)
    .catch (err) ->
      cb({__error: err.message, timedout: err.timedout})

  toReporter: (event, data) ->
    @io and @io.to("reporter").emit(event, data)

  toRunner: (event, data) ->
    @io and @io.to("runner").emit(event, data)

  isSocketConnected: (socket) ->
    socket and socket.connected

  onAutomation: (socket, message, data, id) ->
    ## instead of throwing immediately here perhaps we need
    ## to make this more resilient by automatically retrying
    ## up to 1 second in the case where our automation room
    ## is empty. that would give padding for reconnections
    ## to automatically happen.
    ## for instance when socket.io detects a disconnect
    ## does it immediately remove the member from the room?
    ## YES it does per http://socket.io/docs/rooms-and-namespaces/#disconnection
    if @isSocketConnected(socket)
      socket.emit("automation:request", id, message, data)
    else
      throw new Error("Could not process '#{message}'. No automation clients connected.")

  createIo: (server, path, cookie) ->
    socketIo.server(server, {
      path: path
      destroyUpgrade: false
      serveClient: false
      cookie: cookie
    })

  startListening: (server, automation, config, options) ->
    _.defaults options,
      socketId: null
      onSetRunnables: ->
      onMocha: ->
      onConnect: ->
      onRequest: ->
      onResolveUrl: ->
      onFocusTests: ->
      onSpecChanged: ->
      onChromiumRun: ->
      onReloadBrowser: ->
      checkForAppErrors: ->
      onSavedStateChanged: ->
      onTestFileChange: ->

    automationClient = null

    {integrationFolder, socketIoRoute, socketIoCookie} = config

    @testsDir = integrationFolder

    @io = @createIo(server, socketIoRoute, socketIoCookie)

    automation.use({
      onPush: (message, data) =>
        @io.emit("automation:push:message", message, data)
    })

    onAutomationClientRequestCallback = (message, data, id) =>
      @onAutomation(automationClient, message, data, id)

    automationRequest = (message, data) ->
      automation.request(message, data, onAutomationClientRequestCallback)

    @io.on "connection", (socket) =>
      logger.info "socket connected"

      ## cache the headers so we can access
      ## them at any time
      headers = socket.request?.headers ? {}

      socket.on "automation:client:connected", =>
        return if automationClient is socket

        automationClient = socket

        ## if our automation disconnects then we're
        ## in trouble and should probably bomb everything
        automationClient.on "disconnect", =>
          ## if we are in headless mode then log out an error and maybe exit with process.exit(1)?
          Promise.delay(500)
          .then =>
            ## bail if we've swapped to a new automationClient
            return if automationClient isnt socket

            ## give ourselves about 500ms to reconnected
            ## and if we're connected its all good
            return if automationClient.connected

            ## TODO: if all of our clients have also disconnected
            ## then don't warn anything
            errors.warning("AUTOMATION_SERVER_DISCONNECTED")
            ## TODO: no longer emit this, just close the browser and display message in reporter
            @io.emit("automation:disconnected")

        socket.on "automation:push:request", (message, data, cb) =>
          automation.push(message, data)

          ## just immediately callback because there
          ## is not really an 'ack' here
          cb() if cb

        socket.on "automation:response", automation.response

      socket.on "automation:request", (message, data, cb) =>
        automationRequest(message, data)
        .then (resp) ->
          cb({response: resp})
        .catch (err) ->
          cb({__error: err.message, __name: err.name, __stack: err.stack})

      socket.on "reporter:connected", =>
        return if socket.inReporterRoom

        socket.inReporterRoom = true
        socket.join("reporter")

        ## TODO: what to do about reporter disconnections?

      socket.on "runner:connected", ->
        return if socket.inRunnerRoom

        socket.inRunnerRoom = true
        socket.join("runner")

        ## TODO: what to do about runner disconnections?

      socket.on "adapter:connected", =>
        logger.info "adapter:connected"

        socket.on "adapter:response", respond

      socket.on "adapter:request", (message, data, cb) =>
        ## if cb isnt a function then we know
        ## data is really the cb, so reassign it
        ## and set data to null
        if not _.isFunction(cb)
          cb = data
          data = null

        id = uuid.v4()

        logger.info "adapter:request", id: id, msg: message, data: data

        if _.keys(@io.sockets.adapter.rooms.adapter).length > 0
          messages[id] = cb
          @io.to("adapter").emit "adapter:request", id, message, data
        else
          cb({__error: "Could not process '#{message}'. No adapter servers connected."})

      socket.on "spec:changed", (spec) ->
        options.onSpecChanged(spec)

      socket.on "watch:test:file", (filePath, cb = ->) =>
        @watchTestFileByPath(config, filePath, options)
        ## callback is only for testing purposes
        cb()

      socket.on "fixture", (fixturePath, options, cb) =>
        @onFixture(config, fixturePath, options, cb)

      socket.on "read:file", (file, options, cb) =>
        @onReadFile(config, file, options, cb)

      socket.on "write:file", (file, contents, options, cb) =>
        @onWriteFile(config, file, contents, options, cb)

      socket.on "exec", (options, cb) =>
        @onExec(config.projectRoot, options, cb)

      socket.on "app:connect", (socketId) ->
        options.onConnect(socketId, socket)

      socket.on "set:runnables", (runnables, cb) =>
        options.onSetRunnables(runnables)
        cb()

      socket.on "mocha", =>
        options.onMocha.apply(options, arguments)

      socket.on "open:finder", (p, cb = ->) ->
        open.opn(p)
        .then -> cb()

      socket.on "reload:browser", (url, browser) ->
        options.onReloadBrowser(url, browser)

      socket.on "focus:tests", ->
        options.onFocusTests()

      socket.on "is:automation:client:connected", (data = {}, cb) =>
        isConnected = =>
          automationRequest("is:automation:client:connected", data)

        tryConnected = =>
          Promise
          .try(isConnected)
          .catch ->
            retry(tryConnected)

        ## retry for up to data.timeout
        ## or 1 second
        Promise
        .try(tryConnected)
        .timeout(data.timeout ? 1000)
        .then ->
          cb(true)
        .catch Promise.TimeoutError, (err) ->
          cb(false)

      socket.on "resolve:url", (url, cb) =>
        options.onResolveUrl(url, headers, automationRequest)
        .then(cb)
        .catch (err) ->
          cb({__error: errors.clone(err)})

      socket.on "request", (params, cb) =>
        options.onRequest(headers, automationRequest, params)
        .then(cb)
        .catch (err) ->
          cb({__error: errors.clone(err)})

      socket.on "preserve:run:state", (state, cb) ->
        existingState = state

        cb()

      socket.on "get:existing:run:state", (cb) ->
        if (s = existingState)
          existingState = null
          cb(s)
        else
          cb()

      socket.on "go:to:file", (p) ->
        browsers.launch("chrome", "http://localhost:2020/__#" + p, {
          host: "http://localhost:2020"
        })

      socket.on "save:app:state", (state, cb) ->
        options.onSavedStateChanged(state)

        ## we only use the 'ack' here in tests
        cb() if cb

      reporterEvents.forEach (event) =>
        socket.on event, (data) =>
          @toRunner(event, data)

      runnerEvents.forEach (event) =>
        socket.on event, (data) =>
          @toReporter(event, data)

  end: ->
    ## TODO: we need an 'ack' from this end
    ## event from the other side
    @io and @io.emit("tests:finished")

  changeToUrl: (url) ->
    @toRunner("change:to:url", url)

  close: ->
    @io?.close()

module.exports = Socket
