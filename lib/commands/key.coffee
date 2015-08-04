_     = require("lodash")
path  = require("path")
utils = require("../utils")

class Key
  constructor: (project = ".", options = {}) ->
    if not (@ instanceof Key)
      return new Key(project, options)

    _.defaults options,
      initialize: true
      project: path.resolve(process.cwd(), project)
      reset: false

    return if not options.initialize

    if options.reset then @newKey(options) else @getKey(options)

  getKey: (options) ->
    utils.spawn(["--get-key", "--project", options.project])

  newKey: (options) ->
    utils.spawn(["--new-key", "--project", options.project])

module.exports = Key