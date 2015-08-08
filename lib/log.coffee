path           = require("path")
_              = require("lodash")
fs             = require("fs-extra")
Promise        = require("bluebird")
winston        = require("winston")
config         = require("./config")

## make sure the log folder is available
fs.ensureDirSync(config.app.log_path)

getName = (name) ->
  name + ".log"

getPathToLog = (name) ->
  path.join config.app.log_path, getName(name)

createFile = (name, level, opts = {}) ->
  obj = {
    name: name
    filename: getPathToLog(name)
    colorize: true
    tailable: true
    maxsize: 1000000 ## 1mb
  }

  if level
    obj.level = level

  _.extend obj, opts

  new (winston.transports.File)(obj)

logger = new (winston.Logger)({
  transports: [
    createFile("all", null, {handleExceptions: true})
  ]

  exitOnError: (err) ->
    ## cannot use a reference here since
    ## defaultErrorHandler does not exist yet
    logger.defaultErrorHandler(err)

})

logger.defaultErrorHandler = (err) ->
  logger.info("caught error", error: ""+err)

  exit = ->
    process.exit(1)

  handleErr = ->
    if e = logger.errorHandler
      ret = e(err)

      if ret is true
        exit()

    else
      console.error(err)
      exit()

  settings = logger.getSettings()
  require("./exception").create(err, settings).then(handleErr).catch(handleErr)

  ## do not exit on error, let us
  ## handle it manually
  return false

logger.setSettings = (obj) ->
  logger._settings = obj

logger.getSettings = ->
  logger._settings

logger.unsetSettings = ->
  delete logger._settings

logger.setErrorHandler = (fn) ->
  logger.errorHandler = fn

logger.getData = (obj) ->
  keys = ["level", "message", "timestamp", "type"]

  _.reduce obj, (memo, value, key) ->
    if key not in keys
      memo.data[key] = value
    else
      memo[key] = value

    memo
  , {data: {}}

logger.normalize = (logs = []) ->
  _.map logs, logger.getData

logger.getLogs = ->
  transport = "all"

  new Promise (resolve, reject) ->
    opts = {
      limit: 500
      order: "desc"
    }

    t = logger.transports[transport] ? throw new Error("Log transport: '#{transport}' does not exist!")

    t.query opts, (err, results) ->
      return reject(err) if err

      resolve logger.normalize(results)

logger.off = ->
  logger.removeAllListeners("logging")

logger.onLog = (fn) ->
  name = "all"

  logger.off()

  logger.on "logging", (transport, level, msg, data) ->
    if transport.name is name
      obj = {level: level, message: msg}
      obj.type = data.type
      obj.data = _.omit data, "type"
      obj.timestamp = new Date

      fn(obj)

logger.clearLogs = ->
  files = _.map logger.transports, (value, key) ->
    fs.outputFileAsync getPathToLog(key), ""

  Promise.all(files)

logger.log = _.wrap logger.log, (orig, args...) ->
  last = _.last(args)

  ## should be cloning this last object
  ## and not mutating it directly!
  if _.isObject(last)
    _.defaults last,
      type: "server"

  orig.apply(@, args)

module.exports = logger