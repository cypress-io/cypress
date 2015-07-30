_       = require("lodash")
path    = require("path")
utils   = require("../utils")

class Run
  constructor: (project = ".", options = {}) ->
    if not (@ instanceof Run)
      return new Run(project, options)

    _.defaults options,
      spec:     null
      reporter: "spec"
      project:  path.resolve(process.cwd(), project)

    @run(options)

  run: (options) ->
    args = ["--headless", "--project", options.project]

    ## if we have a specific spec push that into the args
    if options.spec
      args.push("--spec", options.spec)

    utils.spawn(args)

module.exports = Run