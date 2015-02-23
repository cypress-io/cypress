global.config ?= require("konfig")()
path           = require("path")
_              = require("lodash")
fs             = require("fs-extra")
Promise        = require("bluebird")
winston        = require("winston")

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
  }

  if level
    obj.level = level

  _.extend obj, opts

  new (winston.transports.File)(obj)

logger = new (winston.Logger)({
  transports: [
    createFile("all", null, {handleExceptions: true})
    createFile("info", "info")
    createFile("error", "error", {handleExceptions: true})
    createFile("profile", "profile")
  ]
  exitOnError: false
})

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

logger.getLogs = (transport) ->
  new Promise (resolve, reject) ->
    opts = {}

    t = logger.transports[transport] ? throw new Error("Log transport: '#{transport}' does not exist!")

    t.query opts, (err, results) ->
      return reject(err) if err

      resolve logger.normalize(results)

logger.onLog = (name, fn) ->
  logger.removeAllListeners("logging")

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
  return if (logger.forceLogger isnt true) and (process.env["NODE_ENV"] is "test")

  orig.apply(@, args)

module.exports = logger