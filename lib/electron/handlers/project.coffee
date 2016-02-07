cache   = require("../../cache")
Project = require("../../project")

## global reference to any open projects
openProject = null

module.exports = {
  paths: ->
    cache.getProjectPaths()

  remove: (path) ->
    cache.removeProject(path)

  add: (path) ->
    cache.addProject(path)

  ## TODO: this method should not exist.
  ## refactor the relationship between
  ## projects and cache and remove this.
  id: (path) ->
    cache.getProjectIdByPath(path)

  exists: (path) ->
    @paths().then (paths) ->
      path in paths

  open: (path, options) ->
    ## store the currently open project
    openProject = Project(path)

    openProject
    .open(options)

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