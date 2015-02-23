global.config ?= require("konfig")()
path           = require("path")
_              = require("lodash")
fs             = require("fs-extra")
winston        = require("winston")

## make sure the log folder is available
fs.ensureDirSync(config.app.log_path)

createFile = (name, level, opts = {}) ->
  obj = {
    name: name
    filename: path.join(config.app.log_path, name + ".log")
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

module.exports = logger