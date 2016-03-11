path      = require("path")
EE        = require("events")
_         = require("lodash")
fs        = require("fs-extra")
Promise   = require("bluebird")
Settings  = require("./util/settings")
ids       = require("./ids")
api       = require("./api")
user      = require("./user")
cache     = require("./cache")
logger    = require("./logger")
errors    = require("./errors")
Server    = require("./server")
Support   = require("./support")
fixture   = require("./fixture")
Watchers  = require("./watchers")
Reporter  = require("./reporter")

fs = Promise.promisifyAll(fs)

class Project extends EE
  constructor: (projectRoot) ->
    if not (@ instanceof Project)
      return new Project(projectRoot)

    if not projectRoot
      throw new Error("Instantiating lib/project requires a projectRoot!")

    @projectRoot = projectRoot
    @server      = Server(projectRoot)
    @watchers    = Watchers()

  open: (options = {}) ->
    _.defaults options, {
      reporter:     false
      changeEvents: false
      updateProject: false
    }

    @server.open(options)
    .bind(@)
    .then (config) ->
      ## sync but do not block
      @sync(options)

      ## store the config from
      ## opening the server
      @config = config

      @watchSettingsAndStartWebsockets(options)

      .then =>
        @scaffold(config)

      ## return our project instance
      .return(@)

  sync: (options) ->
    ## attempt to sync up with the remote
    ## server to ensure we have a valid
    ## project id and user attached to
    ## this project
    @ensureProjectId()
    .then (id) =>
      @updateProject(id, options)
    .catch ->
      ## dont catch ensure project id or
      ## update project errors which allows
      ## the user to work offline
      return

  close: ->
    @removeAllListeners()

    Promise.join(
      @server?.close(),
      @watchers?.close()
    )

  updateProject: (id, options = {}) ->
    Promise.try =>
      ## bail if updateProject isnt true
      return if not options.updateProject

      user.ensureSession()
      .then (session) ->
        api.updateProject(id, session)

  watchSettings: (options) ->
    ## bail if we havent been told to
    ## watch anything
    return if not options.changeEvents

    obj = {
      onChange: (filePath, stats) =>
        ## dont fire change events if we generated
        ## a project id less than 1 second ago
        return if @generatedProjectIdTimestamp and
          (new Date - @generatedProjectIdTimestamp) < 1000

        ## emit settings:changed whenever
        ## our settings file changes
        @emit("settings:changed")
    }

    @watchers.watch(Settings.pathToCypressJson(@projectRoot), obj)

  watchSettingsAndStartWebsockets: (options) ->
    @watchSettings(options)

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

  ensureSpecUrl: (spec) ->
    Promise.try =>
      if spec
        @ensureSpecExists(spec)
        .then (str) =>
          @getUrlBySpec(str)
      else
        @getUrlBySpec("/__all")

  ensureSpecExists: (spec) ->
    {testFolder} = @getConfig()

    ## TODO this assumes we've already opened the project and have config
    ## refactor this not to be dependent on state
    specFile = path.resolve(@projectRoot, testFolder, spec)

    ## we want to make it easy on the user by allowing them to pass both
    ## an absolute path to the spec, or a relative path from their test folder
    fs
    .statAsync(specFile)
    .then =>
      ## strip out the projectRoot + testFolder
      specFile.replace(path.join(@projectRoot, testFolder), "")
    .catch ->
      errors.throw("SPEC_FILE_NOT_FOUND", specFile)

  getUrlBySpec: (spec) ->
    [@getConfig().clientUrl, "#/tests", spec, "?__ui=satellite"].join("")

  scaffold: (config) ->
    Promise.join(
      ## ensure fixtures dir is created
      ## and example fixture if dir doesnt exist
      fixture.scaffold(config.projectRoot, config.fixturesFolder),
      ## ensure support dir is created
      ## and example support file if dir doesnt exist
      Support(config).scaffold()
    )

  writeProjectId: (id) ->
    attrs = {projectId: id}
    logger.info "Writing Project ID", _.clone(attrs)

    @generatedProjectIdTimestamp = new Date

    Settings
    .write(@projectRoot, attrs)
    .return(id)

  createProjectId: ->
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
    cache.insertProject(path)

  @removeIds = (p) ->
    Project(p)
    .verifyExistance().then (project) ->
      config = project.server.config

      ## remove all of the ids for the test files found in the testFolder
      ids.remove path.join(config.projectRoot, config.testFolder)

  @id = (path) ->
    Project(path).getProjectId()

  @exists = (path) ->
    @paths().then (paths) ->
      path in paths

  @getSecretKeyByPath = (path) ->
    ## get project id
    Project.id(path)
    .then (id) ->
      user.ensureSession()
      .then (session) ->
        api.getProjectToken(id, session)
        .catch ->
          errors.throw("CANNOT_FETCH_PROJECT_TOKEN")

  @generateSecretKeyByPath = (path) ->
    ## get project id
    Project.id(path)
    .then (id) ->
      user.ensureSession()
      .then (session) ->
        api.updateProjectToken(id, session)
        .catch ->
          errors.throw("CANNOT_CREATE_PROJECT_TOKEN")

module.exports = Project