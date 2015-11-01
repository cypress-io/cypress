_       = require("lodash")
path    = require("path")
utils   = require("../utils")

class Run
  constructor: (project = ".", options = {}) ->
    if not (@ instanceof Run)
      return new Run(project, options)

    _.defaults options,
      key:      null
      spec:     null
      reporter: null
      project:  path.resolve(process.cwd(), project)

    @run(options)

  run: (options) ->
    opts = {}
    args = ["--run-project", options.project]

    if options.env
      args.push("--env", options.env)

    if options.port
      args.push("--port", options.port)

    ## if we have a specific spec push that into the args
    if options.spec
      args.push("--spec", options.spec)

    ## if we have a specific reporter push that into the args
    if options.reporter
      args.push("--reporter", options.reporter)

    ## if we have a key assume we're in CI mode
    if options.key
      args.push("--ci", "--key", options.key)
      opts.xvfb = true

    utils.spawn(args, opts)

module.exports = Run