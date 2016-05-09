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
fixture       = require("./fixture")
Request       = require("./request")
logger        = require("./logger")
automation    = require("./automation")

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

  onAutomation: (messages, message, data) ->
    Promise.try =>
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

      _.each "load:spec:iframe url:changed page:loading command:add command:attrs:changed runner:start runner:end before:run before:add after:add suite:add suite:start suite:stop test test:add test:start test:end after:run test:results:ready exclusive:test".split(" "), (event) =>
        socket.on event, (args...) =>
          args = _.chain(args).reject(_.isUndefined).reject(_.isFunction).value()
          @io.emit event, args...

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

      socket.on "is:new:project", (cb) =>
        options.onIsNewProject()
        .then(cb)

      socket.on "is:automation:connected", (cb) ->
        cb(true)

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

  automate: (msg) ->
    @io?.to("automation").emit("automation:request", Math.random(), msg)

  close: ->
    @io?.close()

module.exports = Socket