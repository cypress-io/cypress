_       = require("lodash")
path    = require("path")
utils   = require("../utils")

class Open
  constructor: (project = ".", options = {}) ->
    if not (@ instanceof Open)
      return new Open(project, options)

    _.defaults options,
      project:  path.resolve(process.cwd(), project)

    @open(options)

  open: (options) ->
    opts = {}
    args = ["--project", options.project]

    if options.env
      args.push("--env", options.env)

    if options.config
      args.push("--config", options.config)

    if options.port
      args.push("--port", options.port)

    utils.spawn(args, {
      xvfb: false
      detached: true
      stdio: ["ignore", "ignore", "ignore"]
    })

module.exports = Open