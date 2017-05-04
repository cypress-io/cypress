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
  if _.isString err
    console.error(chalk.red(err))
  else if _.isObject err
    console.error(chalk.red "type: #{err.type}") if err.type
    console.error(chalk.red err.message) if err.message
    console.error(chalk.red err.stack) if err.stack

module.exports = class Runner
  constructor: (options = {}) ->
    @_config = getConfig(options)
    @_Reporter = getReporter(@_config)
    @_clients = {}
    @_localBus = new EventEmitter()
    @_runnerBus = new EventEmitter()

    process.on "SIGINT", =>
      @_stopBrowser().then ->
        process.exit 0

  start: (server) ->
    io = new SocketServer(server)
    io.on "connection", (client) =>
      @_handleConnection(client)

    @_launchBrowser()

  run: (specPath) ->
    specPath = specPath
    .replace(path.join(__dirname, "../.."), "")
    .replace(path.extname(specPath), "")

    for id, client of @_clients
      client.emit("run", specPath)

  runAllSpecsOnce: (allSpecsPath) ->
    new Promise (resolve) =>
      @_localBus.addListener "end", =>
        @_stopBrowser().then =>
          resolve(@_reporter.stats)

  _handleConnection: (client) ->
    @_clients[client.id] = client

    client.on("report", @_onReport.bind(@))
    client.on("error", @_onError.bind(@))

    client.on "disconnect", =>
      delete @_clients[client.id]

  _launchBrowser: ->
    theBrowser = getArg("browser") or "chrome"
    # spec = if @_config.once then "/specs/all_specs" else ""
    spec = if @_config.once then "/specs/integration/clicks_spec" else ""
    url = "http://localhost:#{@_config.port}#{spec}?reporter=socket"

    browser.launch(theBrowser, url)
    .then (instance) =>
      @_browserInstance = instance
    .catch (err) =>
      logError(err)
      throw err

  _onReport: ({ tests }) ->
    for test in tests
      @_report(test)

  _report: ({ event, info, err }) ->
    if event is "start"
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
    @_localBus.emit(event, info, err)
    @_runnerBus.emit(event, info, err)

  _stopBrowser: ->
    if not @_browserInstance
      return Promise.resolve()

    new Promise (resolve) =>
      @_browserInstance.stop(resolve)
    .timeout(10000)
    .catch Promise.TimeoutError, ->
      logError("Timed out trying to stop browser")

  _onError: (err) ->
    logError("Unexpected error occurred in browser:\n")
    logError(err)
    @_stopBrowser().then ->
      process.exit 1
