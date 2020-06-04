chalk  = require("chalk")
logger = require("../logger")

module.exports = {
  get: ->
    logger.getLogs()

  clear: ->
    logger.clearLogs()

  off: ->
    logger.off()

  onLog: (fn) ->
    logger.onLog(fn)

  error: (err) ->
    ## swallow any errors creating this exception
    logger.createException(err).catch(->)

  print: ->
    ## print all the logs and exit
    @get().then (logs) ->
      logs.forEach (log, i) ->
        str   = JSON.stringify(log)
        color = if i % 2 is 0 then "cyan" else "yellow"
        console.log chalk[color](str)
}
