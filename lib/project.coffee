path      = require("path")
EE        = require("events")
_         = require("lodash")
Promise   = require("bluebird")
Settings  = require("./util/settings")
api       = require("./api")
user      = require("./user")
cache     = require("./cache")
logger    = require("./logger")
errors    = require("./errors")
Server    = require("./server")
Support   = require("./support")
Fixture   = require("./fixture")
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

    @server.open(options)
    .bind(@)
    .then (config) ->
      ## store the config from
      ## opening the server
      @config = config

      @watchFilesAndStartWebsockets(options)

      .then =>
        @scaffold(config)

      ## return our project instance
      .return(@)

  close: ->
    Promise.join(
      @server?.close(),
      @watchers?.close()
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

          ## TODO: convert this to a promise
          ## since we need an ack to this end
          ## event, and then finally emit 'end'
          @server.end()

          Promise.delay(1000).then =>
            # console.log stats
            @emit("end", stats)
    })

  getConfig: ->
    @config ? {}

  scaffold: (config) ->
    Promise.join(
      ## ensure fixtures dir is created
      ## and example fixture if dir doesnt exist
      Fixture(config).scaffold(),
      ## ensure support dir is created
      ## and example support file if dir doesnt exist
      Support(config).scaffold()
    )

  writeProjectId: (id) ->
    attrs = {projectId: id}
    logger.info "Writing Project ID", _.clone(attrs)
    Settings
      .write(@projectRoot, attrs)
      .get("projectId")

  createProjectId: ->
    logger.info "Creating Project ID"

    ## allow us to specify the exact key
    ## we want via the CYPRESS_PROJECT_ID env.
    ## this allows us to omit the cypress.json
    ## file (like in example repos) yet still
    ## use a correct id in the API
    if id = process.env.CYPRESS_PROJECT_ID
      return @writeProjectId(id)

    user.ensureSession()
    .bind(@)
    .then (session) ->
      api.createProject(session)
    .then(@writeProjectId)

  getProjectId: ->
    @verifyExistance()
    .then =>
      Settings.read(@projectRoot)
    .then (settings) =>
      if settings and id = settings.projectId
        return id

      errors.throw("NO_PROJECT_ID", @projectRoot)

  verifyExistance: ->
    fs
    .statAsync(@projectRoot)
    .return(@)
    .catch =>
      errors.throw("NO_PROJECT_FOUND_AT_PROJECT_ROOT", @projectRoot)

  ensureProjectId: ->
    @getProjectId()
    .bind(@)
    .catch({type: "NO_PROJECT_ID"}, @createProjectId)

  @paths = ->
    cache.getProjectPaths()

  @remove = (path) ->
    cache.removeProject(path)

  @add = (path) ->
    ## make sure we either have or receive an id
    Project(path)
    .ensureProjectId()
    .then (id) =>
      ## make sure we've written it to the local .cy file
      cache.insertProject(id)
      .then =>
        ## and make sure we have the correct path
        cache.updateProject(id, path)

      ## return the project id
      .return(id)

  ## TODO: this method should not exist.
  ## refactor the relationship between
  ## projects and cache and remove this.
  @id = (path) ->
    cache.getProjectIdByPath(path)

  @exists = (path) ->
    @paths().then (paths) ->
      path in paths

  @getSecretKeyByPath = (path) ->
    ## verify the project exists at the projectRoot
    Project(path).verifyExistance()

    ## then get its project id
    .call("getProjectId")
    .then (id) ->
      user.ensureSession()
      .then (session) ->
        api.getProjectToken(id, session)
        .catch ->
          errors.throw("CANNOT_FETCH_PROJECT_TOKEN")

  @generateSecretKeyByPath = (path) ->
    ## verify the project exists at the projectRoot
    Project(path).verifyExistance()

    ## then get its project id
    .call("getProjectId")
    .then (id) ->
      user.ensureSession()
      .then (session) ->
        api.updateProjectToken(id, session)
        .catch ->
          errors.throw("CANNOT_CREATE_PROJECT_TOKEN")

module.exports = Project