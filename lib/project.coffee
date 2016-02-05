_        = require("lodash")
Promise  = require("bluebird")
Request  = require("request-promise")
path     = require("path")
Settings = require("./util/settings")
Routes   = require("./util/routes")
Log      = require("./log")
Server   = require("./server")

class Project
  constructor: (projectRoot) ->
    if not (@ instanceof Project)
      return new Project(projectRoot)

    if not projectRoot
      throw new Error("Instantiating lib/project requires a projectRoot!")

    @projectRoot = projectRoot

  open: (options = {}) ->
    @server = Server(@projectRoot)

    @server.open(@, options).bind(@)
    .then (settings) ->
      {server: @server, settings: settings}

  close: ->
    @server.close()

  ## A simple helper method
  ## to create a project ID if we do not already
  ## have one
  ## should refactor this method to only create
  ## a project ID if we were missing one
  ## currently this catches all errors like EACCES
  ## errors which should not try to generate a project id
  ensureProjectId: ->
    @getProjectId()
    .bind(@)
    .catch(@createProjectId)

  createProjectId: (err) ->
    ## dont try to create a project id if
    ## we had an error accessing cypress.json
    throw err if err and err.code is "EACCES"

    Log.info "Creating Project ID"

    write = (id) =>
      attrs = {projectId: id}
      Log.info "Writing Project ID", _.clone(attrs)
      Settings
        .write(@projectRoot, attrs)
        .get("projectId")

    ## allow us to specify the exact key
    ## we want via the CYPRESS_PROJECT_ID env.
    ## this allows us to omit the cypress.json
    ## file (like in example repos) yet still
    ## use a correct id in the API
    if id = process.env.CYPRESS_PROJECT_ID
      return write(id)

    require("./cache").getUser().then (user = {}) =>
      Request.post({
        url: Routes.projects()
        headers: {"X-Session": user.session_token}
        json: true
      })
      .then (attrs) ->
        write(attrs.uuid)

  getProjectId: ->
    Settings.read(@projectRoot)
    .then (settings) ->
      if (id = settings.projectId)
        Log.info "Returning Project ID", {id: id}
        return id

      Log.info "No Project ID found"
      throw new Error("No project ID found")

  getDetails: (projectId) ->
    require("./cache").getUser().then (user = {}) =>
      Request.get({
        url: Routes.project(projectId)
        headers: {"X-Session": user.session_token}
      }).catch (err) ->
        ## swallow any errors

module.exports = Project