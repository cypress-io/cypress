_    = require("lodash")
path = require("path")
os   = require("os")

class Run
  getDefaultPathToCypress: ->

  constructor: (projectRoot = ".", options = {}) ->
    if not (@ instanceof Run)
      return new Run(projectRoot, options)

    projectRoot = path.resolve(process.cwd(), projectRoot)

    _.defaults options,
      ci:       false
      reporter: "spec"
      cypress:  @getDefaultPathToCypress()

    console.log "projectRoot", projectRoot
    console.log "options", options

module.exports = Run