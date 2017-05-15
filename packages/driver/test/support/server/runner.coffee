_ = require("lodash")
args = require("minimist")(process.argv.slice(2))
chalk = require("chalk")
EventEmitter = require("events").EventEmitter
path = require("path")
Promise = require("bluebird")

browser = require("./browser")
SocketServer = require("socket.io")

reporters =
 spec: require("mocha/lib/reporters/spec")
 dot: require("mocha/lib/reporters/dot")
 nyan: require("mocha/lib/reporters/nyan")

defaultReporter = "spec"

getArg = (name)->
  args[name]

getConfig = (options) ->
  {
    once: options.once ? false
    port: options.port
    reporter: getArg("reporter") ? options.reporter ? defaultReporter
  }

getReporter = (config) ->
  reporters[config.reporter.toLowerCase()] or reporters[defaultReporter]

logWarning = (warning) ->
  console.log(chalk.magenta(warning))

logError = (err) ->
  if _.isString(err)
    console.error(chalk.red(err))
  else if _.isObject(err)
    console.error(chalk.red("type: #{err.type}")) if err.type
    console.error(chalk.red(err.message)) if err.message and not err.stack
    console.error(chalk.red(err.stack)) if err.stack

## monitors a function for calls. if the function isn't called within
## the timeout, it calls the onTimeout callback
monitor = (fn, onTimeout, timeout) ->
  timeoutId = null
  wrappedFn = (args...) ->
    clearTimeout(timeoutId)
    timeoutId = setTimeout(onTimeout, timeout)
    fn(args...)

  wrappedFn.cancel = ->
    clearTimeout(timeoutId)

  return wrappedFn

module.exports = class Runner
  constructor: (options = {}) ->
    @_server = options.server
    @_config = getConfig(options)
    @_Reporter = getReporter(@_config)
    @_clients = {}
    @_errors = []
    @_localBus = new EventEmitter()
    @_runnerBus = new EventEmitter()

    process.on "SIGINT", =>
      @_stopBrowser().then ->
        process.exit 0

  runContinuously: ->
    @_start().then =>
      @_localBus.on "test:event", (event, info, err) =>
        if event is "start"
          @_errors = []

        if event is "end"
          @_monitorReport.cancel()

        if err
          @_onError(err)

        @_runnerBus.emit(event, info, err)

  runAllSpecsOnce: (specPaths) ->
    @_start().then =>
      new Promise (resolve, reject) =>
        current = 0
        timeouts = []

        next = =>
          current++
          @run(specPaths[current])

        finish = (event, info, err) =>
          @_runnerBus.emit(event, info, err)
          @_localBus.removeAllListeners()
          @_stopBrowser().then =>
            resolve({ stats: @_reporter.stats, timeouts })

        @_reporter = new @_Reporter(@_runnerBus)
        @_runnerBus.emit("start")

        @_localBus.once "client:connected", =>
          @run(specPaths[current])

        @_localBus.on "test:event", (event, info, err) =>
          if event is "end"
            if current is (specPaths.length - 1)
              @_monitorReport.cancel()
              finish(event, info, err)
            else
              next()
          else if event isnt "start"
            @_runnerBus.emit(event, info, err)

        @_localBus.on "timeout", ->
          timeouts.push(specPaths[current])
          next()

  run: (specPath) ->
    specPath = specPath
    .replace(path.join(__dirname, "../.."), "specs/")
    .replace(path.extname(specPath), "")

    for id, client of @_clients
      client.emit("run", specPath)

  _start: ->
    io = new SocketServer(@_server)
    io.on "connection", (client) =>
      @_handleConnection(client)

    @_launchBrowser()

  _handleConnection: (client) ->
    @_clients[client.id] = client
    @_localBus.emit("client:connected")

    @_monitorReport?.cancel()
    @_monitorReport = monitor(@_onReport.bind(@), @_onTimeout.bind(@), 15000)
    client.on("report", @_monitorReport)
    client.on("error", @_onError.bind(@))

    client.on "disconnect", =>
      delete @_clients[client.id]

  _launchBrowser: ->
    theBrowser = getArg("browser") or "chrome"
    url = "http://localhost:#{@_config.port}?reporter=socket"

    browser.launch(theBrowser, url)
    .then (instance) =>
      @_browserInstance = instance
    .catch (err) =>
      logError("Error attempting to launch browser:")
      logError(err)
      throw err

  _onReport: ({ tests }) ->
    for test in tests
      @_report(test)

  _report: ({ event, info, err }) ->
    if event is "start" and not @_config.once
      console.log() ## give report some breathing room
      @_runnerBus.removeAllListeners()
      @_reporter = new @_Reporter(@_runnerBus)

    info or= {}
    info.slow = ->
    info.fullTitle = ->
      if info.parentTitle
        "#{info.parentTitle} #{info.title}"
      else
        info.title
    @_localBus.emit("test:event", event, info, err)

  _onTimeout: ->
    console.log()
    logError("Tests timed out")
    console.log()
    if @_errors.length
      logWarning("The following errors were captured:")
    else
      logError("No errors were captured")
    for error in @_errors
      console.log()
      logError(error.stack or error)
    @_localBus.emit("timeout")

  _stopBrowser: ->
    if not @_browserInstance
      return Promise.resolve()

    new Promise (resolve) =>
      @_browserInstance.stop(resolve)
    .timeout(10000)
    .catch Promise.TimeoutError, ->
      logWarning("Timed out trying to stop browser")

  _onError: (err) ->
    @_errors.push(err)
