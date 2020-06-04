path     = require("path")
_        = require("lodash")
Promise  = require("bluebird")
winston  = require("winston")
fs       = require("./util/fs")
appData  = require("./util/app_data")

folder = appData.path()

getName = (name) ->
  name + ".log"

getPathToLog = (name) ->
  path.join(folder, getName(name))

createFile = (name, level, opts = {}) ->
  file = getPathToLog(name)

  ## ensure that the containing dir exists
  fs.ensureDirSync(path.dirname(file))

  obj = {
    name: name
    filename: file
    colorize: true
    tailable: true
    maxsize: 1000000 ## 1mb
  }

  if level
    obj.level = level

  _.extend obj, opts

  new (winston.transports.File)(obj)

transports = [createFile("all", null, {handleExceptions: true})]

if process.env.CYPRESS_DEBUG
  transports.push(new (winston.transports.Console)())

logger = new (winston.Logger)({
  transports: transports

  exitOnError: (err) ->
    ## cannot use a reference here since
    ## defaultErrorHandler does not exist yet
    logger.defaultErrorHandler(err)

})

logger.createException = (err) ->
  require("./exception").create(err, logger.getSettings())

logger.defaultErrorHandler = (err) ->
  logger.info("caught error", error: err.message, stack: err.stack)

  exit = ->
    process.exit(1)

  handleErr = ->
    if e = logger.errorHandler
      ret = e(err)

      if ret is true
        exit()

    else
      ## instead of console'ing these we should
      ## think about chalking them so they are
      ## formatted and displayed
      console.log(err)
      console.log(err.stack)
      exit()

  logger.createException(err).then(handleErr).catch(handleErr)

  ## do not exit on error, let us
  ## handle it manually
  ## why are we returning false here?
  ## we need to return false only from
  ## exitOnError
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

process.removeAllListeners("unhandledRejection")
process.on "unhandledRejection", (err, promise) ->
  logger.defaultErrorHandler(err)

  return false

module.exports = logger
