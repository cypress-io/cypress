_ = require("lodash")
args = require("minimist")(process.argv.slice(2))
chalk = require("chalk")
EventEmitter = require("events").EventEmitter

browser = require("./browser")
socket = require("../../../../socket")

reporters =
 spec: require("mocha/lib/reporters/spec")
 dot: require("mocha/lib/reporters/dot")
 nyan: require("mocha/lib/reporters/nyan")

getArg = (name)->
  args[name]

getConfig = (options) ->
  {
    once: options.once ? false
    port: options.port
    reporter: getArg("reporter") ? options.reporter ? "dot"
  }

getReporter = (config) ->
  reporters[config.reporter.toLowerCase()] or reporters.dot

logWarning = (warning) ->
  console.log(chalk.magenta warning)

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

    unless @_config.once
      process.on 'SIGINT', =>
        @_stopBrowser -> process.exit 0

  start: (server) ->
    io = socket.server(server)
    io.on("connection", @_handleConnection.bind(@))

    @_launchBrowser()

  rerun: ->
    for id, client of @_clients
      client.emit("rerun")

  _handleConnection: (client) ->
    @_clients[client.id] = client

    client.on("reporter", @_onReport.bind(@))
    client.on("batch-report", @_onBatchReport.bind(@))
    client.on("error", @_onError.bind(@))

    client.on "disconnect", =>
      delete @_clients[client.id]

  _launchBrowser: ->
    theBrowser = getArg("browser") or "chrome"
    url = "http://localhost:#{@_config.port}/specs/integration/clicks_spec"

    browser.launch(theBrowser, url)
    .then (instance) =>
      @_browserInstance = instance
    .catch (err) =>
      @_logAndFail(err)

  _onBatchReport: (tests) ->
    for test in tests
      @_onReport(test)

  _onReport: ({ event, info, err }) ->
    if event is "start"
      @runner.removeAllListeners() if @runner?
      @runner = new EventEmitter()
      new @_Reporter @runner

    info or= {}
    info.slow = ->
    info.fullTitle = ->
      if info.parentTitle
        "#{info.parentTitle} #{info.title}"
      else
        info.title
    @runner.emit event, info, err

    if @_config.once and event is "end"
      @_stopBrowser -> process.exit 0

  _stopBrowser: (cb) ->
    if @_browserInstance
      timedOut = false
      timer = setTimeout =>
        timedOut = true
        logError("Timed out trying to stop browser.")
        cb()
      , 10000 # 10 seconds

      @_browserInstance.stop ->
        return if timedOut
        clearTimeout timer
        cb()
    else
      cb()

  _onError: (err) ->
    logError("Error from browser:")
    logError(err)
    @_logAndFail("Unexpected error occurred - bailing")

  _logAndFail: (err) ->
    logError(err)
    @_fail()

  _fail: ->
    @_stopBrowser -> process.exit 1
