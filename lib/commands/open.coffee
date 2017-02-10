_       = require("lodash")
path    = require("path")
utils   = require("../utils")

class Open
  constructor: (options = {}) ->
    if not (@ instanceof Open)
      return new Open(options)

    @open(options)

  open: (options) ->
    opts = {}
    args = []

    if options.env
      args.push("--env", options.env)

    if options.config
      args.push("--config", options.config)

    if options.port
      args.push("--port", options.port)

    utils.spawn(args, {
      detached: true
      stdio: ["ignore", "ignore", "ignore"]
    })

module.exports = Open
