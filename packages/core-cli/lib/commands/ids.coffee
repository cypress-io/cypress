_     = require("lodash")
path  = require("path")
utils = require("../utils")

class Ids
  constructor: (project = ".", options = {}) ->
    if not (@ instanceof Ids)
      return new Ids(project, options)

    _.defaults options,
      initialize: true
      project: path.resolve(process.cwd(), project)
      reset: false

    return if not options.initialize

    @removeIds(options)

  removeIds: (options) ->
    utils.spawn(["--remove-ids", "--project", options.project])

module.exports = Ids