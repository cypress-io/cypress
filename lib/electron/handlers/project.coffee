Promise = require("bluebird")
errors  = require("../../errors")
cache   = require("../../cache")
Project = require("../../project")

## global reference to any open projects
openProject = null

module.exports = {
  open: (path, options = {}) ->
    ## store the currently open project
    openProject = Project(path)

    ## open the project and return
    ## the config for the project instance
    openProject
    .open(options)

  opened: -> openProject

  onSettingsChanged: ->
    Promise.try =>
      if not openProject
        errors.throw("NO_CURRENTLY_OPEN_PROJECT")
      else
        new Promise (resolve, reject) ->
          openProject.on "settings:changed", -> resolve()

  close: ->
    nullify = ->
      ## null this back out
      openProject = null

      Promise.resolve(null)

    if not openProject
      nullify()
    else
      openProject.close()
      .then(nullify)
}