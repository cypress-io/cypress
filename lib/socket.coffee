_             = require("lodash")
os            = require("os")
fs            = require("fs-extra")
str           = require("underscore.string")
path          = require("path")
uuid          = require("node-uuid")
Promise       = require("bluebird")
socketIo      = require("socket.io")
open          = require("./util/open")
pathHelpers   = require("./util/path_helpers")
cwd           = require("./cwd")
fixture       = require("./fixture")
Request       = require("./request")
logger        = require("./logger")
Reporter      = require("./reporter")

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
    ## exact file
    return cb() if testFilePath is @testFilePath

    logger.info "watching test file", {path: testFilePath}

    ## remove the existing file by its path
    watchers.remove(testFilePath)

    ## store this location
    @testFilePath = testFilePath

    watchers.watchAsync(testFilePath, {
      onChange: _.bind(@onTestFileChange, @, config.integrationFolder, originalFilePath)
    })
    .then(cb)

  onRequest: (options, cb) ->
    Request.send(options)
    .then(cb)
    .catch (err) ->
      cb({__error: err.message})

  onFixture: (config, file, cb) ->
    fixture.get(config.fixturesFolder, file)
    .then(cb)
    .catch (err) ->
      cb({__error: err.message})

  createIo: (server, path) ->
    socketIo(server, {path: path})

  _startListening: (server, watchers, config, options) ->
    _.defaults options,
      socketId: null
      onMocha: ->
      onConnect: ->
      onChromiumRun: ->
      onIsNewProject: ->
      checkForAppErrors: ->

    ## promisify this function
    options.onIsNewProject = Promise.method(options.onIsNewProject)

    messages = {}
    chromiums = {}

    {integrationFolder, socketIoRoute} = config

    @testsDir = integrationFolder

    @io = @createIo(server, socketIoRoute)

    @io.on "connection", (socket) =>
      logger.info "socket connected"

      socket.on "chromium:connected", =>
        return if socket.inChromiumRoom

        socket.inChromiumRoom = true
        socket.join("chromium")

        socket.on "chromium:history:response", (id, response) =>
          if message = chromiums[id]
            delete chromiums[id]
            message(response)

      socket.on "history:entries", (cb) =>
        id = uuid.v4()

        chromiums[id] = cb

        if _.keys(@io.sockets.adapter.rooms.chromium).length > 0
          messages[id] = cb
          @io.to("chromium").emit "chromium:history:request", id
        else
          cb({__error: "Could not process 'history:entries'. No chromium servers connected."})

      socket.on "remote:connected", =>
        logger.info "remote:connected"

        return if socket.inRemoteRoom

        socket.inRemoteRoom = true
        socket.join("remote")

        socket.on "remote:response", (id, response) =>
          if message = messages[id]
            delete messages[id]
            logger.info "remote:response", id: id, response: response
            message(response)

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

      socket.on "request", =>
        @onRequest.apply(@, arguments)

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