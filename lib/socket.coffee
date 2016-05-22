_             = require("lodash")
os            = require("os")
fs            = require("fs-extra")
str           = require("underscore.string")
path          = require("path")
uuid          = require("node-uuid")
Promise       = require("bluebird")
socketIo      = require("@cypress/core-socket")
open          = require("./util/open")
pathHelpers   = require("./util/path_helpers")
cwd           = require("./cwd")
exec          = require("./exec")
fixture       = require("./fixture")
Request       = require("./request")
errors        = require("./errors")
logger        = require("./logger")
automation    = require("./automation")

retry = (fn) ->
  Promise.delay(25).then(fn)

class Socket
  constructor: ->
    if not (@ instanceof Socket)
      return new Socket

  onTestFileChange: (integrationFolder, originalFilePath, filePath, stats) ->
    logger.info "onTestFileChange", filePath: filePath

    ## return if we're not a js or coffee file.
    ## this will weed out directories as well
    return if not /\.(js|coffee)$/.test filePath

    ## originalFilePath is what was originally sent to us when
    ## we were told to 'watch:test:file'
    ## and its what we want to send back to the client

    fs.statAsync(filePath)
    .then =>
      @io.emit "test:changed", {file: originalFilePath}
    .catch(->)

  watchTestFileByPath: (config, originalFilePath, watchers, cb = ->) ->
    testFilePath = str.ltrim(originalFilePath, "/")

    ## normalize the testFilePath
    testFilePath = pathHelpers.getAbsolutePathToSpec(testFilePath, config)

    ## bail if we're already watching this
    ## exact file or we've turned off watching
    ## for file changes
    return cb() if (testFilePath is @testFilePath) or (config.watchForFileChanges is false)

    logger.info "watching test file", {path: testFilePath}

    ## remove the existing file by its path
    watchers.remove(testFilePath)

    ## store this location
    @testFilePath = testFilePath

    watchers.watchAsync(testFilePath, {
      onChange: _.bind(@onTestFileChange, @, config.integrationFolder, originalFilePath)
    })
    .then(cb)

  onRequest: (automation, options, cb) ->
    Request.send(automation, options)
    .then(cb)
    .catch (err) ->
      cb({__error: err.message})

  onFixture: (config, file, cb) ->
    fixture.get(config.fixturesFolder, file)
    .then(cb)
    .catch (err) ->
      cb({__error: err.message})

  onExec: (projectRoot, options, cb) ->
    exec.run(projectRoot, options)
    .then(cb)
    .catch (err) ->
      cb({__error: err.message, timedout: err.timedout})

  onAutomation: (messages, message, data) ->
    Promise.try =>
      ## instead of throwing immediately here perhaps we need
      ## to make this more resilient by automatically retrying
      ## up to 1 second in the case where our automation room
      ## is empty. that would give padding for reconnections
      ## to automatically happen.
      ## for instance when socket.io detects a disconnect
      ## does it immediately remove the member from the room?
      ## YES it does per http://socket.io/docs/rooms-and-namespaces/#disconnection
      if _.isEmpty(@io.sockets.adapter.rooms.automation)
        throw new Error("Could not process '#{message}'. No automation servers connected.")
      else
        new Promise (resolve, reject) =>
          id = uuid.v4()
          messages[id] = (obj) ->
            ## normalize the error from automation responses
            if e = obj.__error
              err = new Error(e)
              err.name = obj.__name
              err.stack = obj.__stack
              reject(err)
            else
              ## normalize the response
              resolve(obj.response)

          @io.to("automation").emit("automation:request", id, message, data)

  createIo: (server, path, cookie) ->
    ## TODO: dont serve the client!
    # socketIo(server, {path: path, destroyUpgrade: false, serveClient: false})
    socketIo.server(server, {path: path, destroyUpgrade: false, cookie: cookie})

  _startListening: (server, watchers, config, options) ->
    _.defaults options,
      socketId: null
      onAutomationRequest: null
      onMocha: ->
      onConnect: ->
      onChromiumRun: ->
      onIsNewProject: ->
      onReloadBrowser: ->
      checkForAppErrors: ->

    ## promisify this function
    options.onIsNewProject = Promise.method(options.onIsNewProject)

    messages = {}

    {integrationFolder, socketIoRoute, socketIoCookie} = config

    @testsDir = integrationFolder

    @io = @createIo(server, socketIoRoute, socketIoCookie)

    @io.on "connection", (socket) =>
      logger.info "socket connected"

      respond = (id, resp) ->
        if message = messages[id]
          delete messages[id]
          message(resp)

      automationRequest = (message, data) =>
        automate = options.onAutomationRequest ? (message, data) =>
          @onAutomation(messages, message, data)

        automation(config.namespace, socketIoCookie)
        .request(message, data, automate)

      socket.on "automation:connected", =>
        return if socket.inAutomationRoom

        socket.inAutomationRoom = true
        socket.join("automation")

        ## if our automation disconnects then we're
        ## in trouble and should probably bomb everything
        socket.on "disconnect", =>
          ## if we are in headless mode then log out an error and maybe exit with process.exit(1)?
          Promise.delay(500)
          .then =>
            ## give ourselves about 500ms to reconnected
            ## and if we're connected its all good
            return if socket.connected

            ## TODO: if all of our clients have also disconnected
            ## then don't warn anything
            errors.warning("AUTOMATION_SERVER_DISCONNECTED")
            @io.emit("automation:disconnected")

        socket.on "automation:push:request", (msg, data, cb = ->) =>
          fn = (data) =>
            @io.emit("automation:push:message", msg, data)
            cb()

          automation(config.namespace, socketIoCookie)
          .pushMessage(msg, data, fn)

        socket.on "automation:response", respond

      socket.on "automation:request", (message, data, cb) =>
        automationRequest(message, data)
        .then (resp) ->
          cb({response: resp})
        .catch (err) ->
          cb({__error: err.message, __name: err.name, __stack: err.stack})

      socket.on "remote:connected", =>
        logger.info "remote:connected"

        return if socket.inRemoteRoom

        socket.inRemoteRoom = true
        socket.join("remote")

        socket.on "remote:response", respond

      socket.on "client:request", (message, data, cb) =>
        ## if cb isnt a function then we know
        ## data is really the cb, so reassign it
        ## and set data to null
        if not _.isFunction(cb)
          cb = data
          data = null

        id = uuid.v4()

        logger.info "client:request", id: id, msg: message, data: data

        if _.keys(@io.sockets.adapter.rooms.remote).length > 0
          messages[id] = cb
          @io.to("remote").emit "remote:request", id, message, data
        else
          cb({__error: "Could not process '#{message}'. No remote servers connected."})

      socket.on "run:tests:in:chromium", (src) ->
        options.onChromiumRun(src)

      socket.on "watch:test:file", (filePath, cb) =>
        @watchTestFileByPath(config, filePath, watchers, cb)

      socket.on "request", (options, cb) =>
        @onRequest(automationRequest, options, cb)

      socket.on "fixture", (fixturePath, cb) =>
        @onFixture(config, fixturePath, cb)

      socket.on "exec", (options, cb) =>
        @onExec(config.projectRoot, options, cb)

      socket.on "app:connect", (socketId) ->
        options.onConnect(socketId, socket)

      socket.on "mocha", =>
        options.onMocha.apply(options, arguments)

      socket.on "open:finder", (p, cb = ->) ->
        opts = {}

        if os.platform() is "darwin"
          opts.args = "-R"

        open.opn(p, opts)
        .then -> cb()

      socket.on "is:new:project", (cb) ->
        options.onIsNewProject()
        .then(cb)

      socket.on "reload:browser", (url, browser) ->
        options.onReloadBrowser(url, browser)

      socket.on "is:automation:connected", (data = {}, cb) =>
        isConnected = =>
          automationRequest("is:automation:connected", data)

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

  end: ->
    ## TODO: we need an 'ack' from this end
    ## event from the other side
    @io and @io.emit("tests:finished")

  startListening: (server, watchers, config, options) ->
    if process.env["CYPRESS_ENV"] is "development"
      @listenToCssChanges(watchers)

    @_startListening(server, watchers, config, options)

  listenToCssChanges: (watchers) ->
    watchers.watch cwd("lib", "public", "css"), {
      ignored: (path, stats) =>
        return false if fs.statSync(path).isDirectory()

        not /\.css$/.test path
      onChange: (filePath, stats) =>
        filePath = path.basename(filePath)
        @io.emit "cypress:css:changed", file: filePath
    }

  close: ->
    @io?.close()

module.exports = Socket
