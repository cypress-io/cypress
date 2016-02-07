path      = require("path")
EE        = require("events")
_         = require("lodash")
Promise   = require("bluebird")
Request   = require("request-promise")
Settings  = require("./util/settings")
Routes    = require("./util/routes")
Log       = require("./log")
Server    = require("./server")
Support   = require("./support")
Fixtures  = require("./fixtures")
Watchers  = require("./watchers")
Reporter  = require("./reporter")

class Project extends EE
  constructor: (projectRoot) ->
    if not (@ instanceof Project)
      return new Project(projectRoot)

    if not projectRoot
      throw new Error("Instantiating lib/project requires a projectRoot!")

    @projectRoot = projectRoot
    @socket      = null
    @watchers    = null

  open: (options = {}) ->
    @server = Server(@projectRoot)

    ## TODO: what to return here?
    @server.open(options)
    .bind(@)
    .then (config) ->
      ## store the config from
      ## opening the server
      @config = config

      @watchFilesAndStartWebsockets(options)

      .then ->
        @scaffold(config)

      ## return our project instance
      .return(@)

  close: ->
    Promise.join(
      @server.close(),
      @watchers.close()
    )

  watchFilesAndStartWebsockets: (options) ->
    ## preserve file watchers
    @watchers = Watchers()

    ## whenever the cypress.json file changes we need to reboot
    @watchers.watch(Settings.pathToCypressJson(@projectRoot), {
      onChange: (filePath, stats) =>
        if _.isFunction(options.onReboot)
          options.onReboot()
    })

    ## if we've passed down reporter
    ## then record these via mocha reporter
    if options.reporter
      reporter = Reporter()

    @server.startWebsockets(@watchers, {
      onConnect: (id) =>
        @emit("socket:connected", id)

      onMocha: (event, args...) =>
        ## bail if we dont have a
        ## reporter instance
        return if not reporter

        args = [event].concat(args)
        reporter.emit.apply(reporter, args)

        if event is "end"
          stats = reporter.stats()

          # console.log stats
          @emit("end", stats)
    })

  getConfig: ->
    @config ? {}

  scaffold: (config) ->
    Promise.join(
      ## ensure fixtures dir is created
      ## and example fixture if dir doesnt exist
      Fixtures(config).scaffold(),
      ## ensure support dir is created
      ## and example support file if dir doesnt exist
      Support(config).scaffold()
    )

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

module.exports = Project