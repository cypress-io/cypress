_           = require("lodash")
fs          = require("fs-extra")
EE          = require("events")
path        = require("path")
glob        = require("glob")
Promise     = require("bluebird")
cwd         = require("./cwd")
ids         = require("./ids")
api         = require("./api")
user        = require("./user")
cache       = require("./cache")
config      = require("./config")
logger      = require("./logger")
debug       = require("./log")
errors      = require("./errors")
Server      = require("./server")
scaffold    = require("./scaffold")
Watchers    = require("./watchers")
Reporter    = require("./reporter")
savedState  = require("./saved_state")
Automation  = require("./automation")
git         = require("./util/git")
settings    = require("./util/settings")
scaffoldLog = require("debug")("cypress:server:scaffold")
log         = require("debug")("cypress:server:project")

fs   = Promise.promisifyAll(fs)
glob = Promise.promisify(glob)

localCwd = cwd()

multipleForwardSlashesRe = /[^:\/\/](\/{2,})/g

class Project extends EE
  constructor: (projectRoot) ->
    if not (@ instanceof Project)
      return new Project(projectRoot)

    if not projectRoot
      throw new Error("Instantiating lib/project requires a projectRoot!")

    @projectRoot = path.resolve(projectRoot)
    @watchers    = Watchers()
    @server      = null
    @cfg         = null
    @memoryCheck = null
    @automation  = null
    debug("Project created %s", @projectRoot)

  open: (options = {}) ->
    debug("opening project instance %s", @projectRoot)
    @server = Server(@watchers)

    _.defaults options, {
      report:       false
      onFocusTests: ->
      onSettingsChanged: false
    }

    if process.env.CYPRESS_MEMORY
      logMemory = ->
        console.log("memory info", process.memoryUsage())

      @memoryCheck = setInterval(logMemory, 1000)

    @getConfig(options)
    .then (cfg) =>
      process.chdir(@projectRoot)

      @server.open(cfg, @)
      .spread (port, warning) =>
        ## if we didnt have a cfg.port
        ## then get the port once we
        ## open the server
        if not cfg.port
          cfg.port = port

          ## and set all the urls again
          _.extend cfg, config.setUrls(cfg)

        ## store the cfg from
        ## opening the server
        @cfg = cfg

        if warning
          options.onWarning(warning)

        options.onSavedStateChanged = (state) =>
          @saveState(state)

        Promise.join(
          @watchSettingsAndStartWebsockets(options, cfg)
          @scaffold(cfg)
        )
        .then =>
          @watchSupportFile(cfg)

    # return our project instance
    .return(@)

  getRuns: ->
    Promise.all([
      @getProjectId(),
      user.ensureAuthToken()
    ])
    .spread (projectId, authToken) ->
      api.getProjectRuns(projectId, authToken)

  close: ->
    debug("closing project instance %s", @projectRoot)
    if @memoryCheck
      clearInterval(@memoryCheck)

    @cfg = null

    Promise.join(
      @server?.close(),
      @watchers?.close()
    )
    .then ->
      process.chdir(localCwd)

  watchSupportFile: (config) ->
    if supportFile = config.supportFile
      fs.pathExists(supportFile)
      .then (found) =>
        if not found
          errors.throw("SUPPORT_FILE_NOT_FOUND", supportFile)

        relativePath = path.relative(config.projectRoot, config.supportFile)
        if config.watchForFileChanges isnt false
          options = {
            onChange: _.bind(@server.onTestFileChange, @server, relativePath)
          }
        @watchers.watchBundle(relativePath, config, options)
        ## ignore errors b/c we're just setting up the watching. errors
        ## are handled by the spec controller
        .catch ->
    else
      Promise.resolve()

  watchSettings: (onSettingsChanged) ->
    ## bail if we havent been told to
    ## watch anything
    return if not onSettingsChanged

    obj = {
      onChange: (filePath, stats) =>
        ## dont fire change events if we generated
        ## a project id less than 1 second ago
        return if @generatedProjectIdTimestamp and
          (new Date - @generatedProjectIdTimestamp) < 1000

        ## call our callback function
        ## when settings change!
        onSettingsChanged.call(@)
    }

    @watchers.watch(settings.pathToCypressJson(@projectRoot), obj)

  watchSettingsAndStartWebsockets: (options = {}, config = {}) ->
    @watchSettings(options.onSettingsChanged)

    ## if we've passed down reporter
    ## then record these via mocha reporter
    if config.report
      if not Reporter.isValidReporterName(config.reporter, config.projectRoot)
        paths = Reporter.getSearchPathsForReporter(config.reporter, config.projectRoot)
        errors.throw("INVALID_REPORTER_NAME", config.reporter, paths)

      reporter = Reporter.create(config.reporter, config.reporterOptions, config.projectRoot)

    @automation = Automation.create(config.namespace, config.socketIoCookie, config.screenshotsFolder)

    @server.startWebsockets(@watchers, @automation, config, {
      onReloadBrowser: options.onReloadBrowser

      onFocusTests: options.onFocusTests

      onSpecChanged: options.onSpecChanged

      onSavedStateChanged: options.onSavedStateChanged

      onConnect: (id) =>
        @emit("socket:connected", id)

      onSetRunnables: (runnables) ->
        debug("onSetRunnables")
        debug("runnables", runnables)
        reporter?.setRunnables(runnables)

      onMocha: (event, runnable) =>
        debug("onMocha", event)
        ## bail if we dont have a
        ## reporter instance
        return if not reporter

        reporter.emit(event, runnable)

        if event is "end"
          stats = reporter?.stats()

          ## TODO: convert this to a promise
          ## since we need an ack to this end
          ## event, and then finally emit 'end'
          @server.end()

          @emit("end", stats)
    })

  changeToUrl: (url) ->
    @server.changeToUrl(url)

  setBrowsers: (browsers = []) ->
    @getConfig()
    .then (cfg) ->
      cfg.browsers = browsers

  getAutomation: ->
    @automation

  ## do not check files again and again - keep previous promise
  ## to refresh it - just close and open the project again.
  determineIsNewProject: (folder) ->
    scaffold.isNewProject(folder)

  ## returns project config (user settings + defaults + cypress.json)
  ## with additional object "state" which are transient things like
  ## window width and height, DevTools open or not, etc.
  getConfig: (options = {}) =>
    setNewProject = (cfg) =>
      ## decide if new project by asking scaffold
      ## and looking at previously saved user state
      throw new Error("Missing integration folder") if not cfg.integrationFolder
      @determineIsNewProject(cfg.integrationFolder)
      .then (untouchedScaffold) ->
        userHasSeenOnBoarding = _.get(cfg, 'state.showedOnBoardingModal', false)
        scaffoldLog("untouched scaffold #{untouchedScaffold} modal closed #{userHasSeenOnBoarding}")
        cfg.isNewProject = untouchedScaffold && !userHasSeenOnBoarding
      .return(cfg)

    if c = @cfg
      Promise.resolve(c)
    else
      config.get(@projectRoot, options)
      .then (cfg) => @_setSavedState(cfg)
      .then(setNewProject)

  # forces saving of project's state by first merging with argument
  saveState: (stateChanges = {}) ->
    throw new Error("Missing project config") if not @cfg
    throw new Error("Missing project root") if not @projectRoot
    newState = _.merge({}, @cfg.state, stateChanges)
    savedState(@projectRoot)
    .then (state) ->
      state.set(newState)
    .then =>
      @cfg.state = newState
      newState

  _setSavedState: (cfg) ->
    savedState(@projectRoot)
    .then (state) -> state.get()
    .then (state) ->
      cfg.state = state
      cfg

  ensureSpecUrl: (spec) ->
    @getConfig()
    .then (cfg) =>
      ## if we dont have a spec or its __all
      if not spec or (spec is "__all")
        @getUrlBySpec(cfg.browserUrl, "/__all")
      else
        @ensureSpecExists(spec)
        .then (pathToSpec) =>
          ## TODO:
          ## to handle both unit + integration tests we need
          ## to figure out (based on the config) where this spec
          ## lives. does it live in the integrationFolder or
          ## the unit folder?
          ## once we determine that we can then prefix it correctly
          ## with either integration or unit
          prefixedPath = @getPrefixedPathToSpec(cfg.integrationFolder, pathToSpec)
          @getUrlBySpec(cfg.browserUrl, prefixedPath)

  ensureSpecExists: (spec) ->
    specFile = path.resolve(@projectRoot, spec)

    ## we want to make it easy on the user by allowing them to pass both
    ## an absolute path to the spec, or a relative path from their test folder
    fs
    .statAsync(specFile)
    .return(specFile)
    .catch ->
      errors.throw("SPEC_FILE_NOT_FOUND", specFile)

  getPrefixedPathToSpec: (integrationFolder, pathToSpec, type = "integration") ->
    ## for now hard code the 'type' as integration
    ## but in the future accept something different here

    ## strip out the integration folder and prepend with "/"
    ## example:
    ##
    ## /Users/bmann/Dev/cypress-app/.projects/cypress/integration
    ## /Users/bmann/Dev/cypress-app/.projects/cypress/integration/foo.coffee
    ##
    ## becomes /integration/foo.coffee
    "/" + path.join(type, path.relative(integrationFolder, pathToSpec))

  getUrlBySpec: (browserUrl, specUrl) ->
    replacer = (match, p1) ->
      match.replace("//", "/")

    [browserUrl, "#/tests", specUrl].join("/").replace(multipleForwardSlashesRe, replacer)

  scaffold: (config) ->
    debug("scaffolding project %s", @projectRoot)

    scaffolds = []

    push = scaffolds.push.bind(scaffolds)

    ## TODO: we are currently always scaffolding support
    ## even when headlessly - this is due to a major breaking
    ## change of 0.18.0
    ## we can later force this not to always happen when most
    ## of our users go beyond 0.18.0
    ##
    ## ensure support dir is created
    ## and example support file if dir doesnt exist
    push(scaffold.support(config.supportFolder, config))

    ## if we're in headed mode add these other scaffolding
    ## tasks
    if not config.isTextTerminal
      ## ensure integration folder is created
      ## and example spec if dir doesnt exit
      push(scaffold.integration(config.integrationFolder, config))

      ## ensure fixtures dir is created
      ## and example fixture if dir doesnt exist
      push(scaffold.fixture(config.fixturesFolder, config))

    Promise.all(scaffolds)

  writeProjectId: (id) ->
    attrs = {projectId: id}
    logger.info "Writing Project ID", _.clone(attrs)

    @generatedProjectIdTimestamp = new Date

    settings
    .write(@projectRoot, attrs)
    .return(id)

  getProjectId: ->
    @verifyExistence()
    .then =>
      if id = process.env.CYPRESS_PROJECT_ID
        {projectId: id}
      else
        settings.read(@projectRoot)
    .then (settings) =>
      if settings and id = settings.projectId
        return id

      errors.throw("NO_PROJECT_ID", @projectRoot)

  verifyExistence: ->
    fs
    .statAsync(@projectRoot)
    .return(@)
    .catch =>
      errors.throw("NO_PROJECT_FOUND_AT_PROJECT_ROOT", @projectRoot)

  createCiProject: (projectDetails) ->
    user.ensureAuthToken()
    .then (authToken) =>
      git
      .init(@projectRoot)
      .getRemoteOrigin()
      .then (remoteOrigin) ->
        api.createProject(projectDetails, remoteOrigin, authToken)
    .then (newProject) =>
      @writeProjectId(newProject.id)
      .return(newProject)

  getRecordKeys: ->
    Promise.all([
      @getProjectId(),
      user.ensureAuthToken()
    ])
    .spread (projectId, authToken) ->
      api.getProjectRecordKeys(projectId, authToken)

  requestAccess: (projectId) ->
    user.ensureAuthToken()
    .then (authToken) ->
      api.requestAccess(projectId, authToken)

  @getOrgs = ->
    user.ensureAuthToken()
    .then (authToken) ->
      api.getOrgs(authToken)

  @paths = ->
    cache.getProjectPaths()

  @getPathsAndIds = ->
    cache.getProjectPaths()
    .map (projectPath) ->
      Promise.props({
        path: projectPath
        id: settings.id(projectPath)
      })

  @_mergeDetails = (clientProject, project) ->
    _.extend({}, clientProject, project, {state: "VALID"})

  @_mergeState = (clientProject, state) ->
    _.extend({}, clientProject, {state: state})

  @_getProject = (clientProject, authToken) ->
    log("get project from api", clientProject.id, clientProject.path)
    api.getProject(clientProject.id, authToken)
    .then (project) ->
      log("got project from api")
      Project._mergeDetails(clientProject, project)
    .catch (err) ->
      log("failed to get project from api", err.statusCode)
      switch err.statusCode
        when 404
          ## project doesn't exist
          return Project._mergeState(clientProject, "INVALID")
        when 403
          ## project exists, but user isn't authorized for it
          return Project._mergeState(clientProject, "UNAUTHORIZED")
        else
          throw err

  @getProjectStatuses = (clientProjects = []) ->
    log("get project statuses for #{clientProjects.length} projects")
    user.ensureAuthToken()
    .then (authToken) ->
      log("got auth token #{authToken}")
      api.getProjects(authToken).then (projects = []) ->
        log("got #{projects.length} projects")
        projectsIndex = _.keyBy(projects, "id")
        Promise.all(_.map clientProjects, (clientProject) ->
          log("looking at", clientProject.path)
          ## not a CI project, just mark as valid and return
          if not clientProject.id
            log("no project id")
            return Project._mergeState(clientProject, "VALID")

          if project = projectsIndex[clientProject.id]
            log("found matching:", project)
            ## merge in details for matching project
            Project._mergeDetails(clientProject, project)
          else
            log("did not find matching:", project)
            ## project has id, but no matching project found
            ## check if it doesn't exist or if user isn't authorized
            Project._getProject(clientProject, authToken)
        )

  @getProjectStatus = (clientProject) ->
    log("get project status for", clientProject.id, clientProject.path)

    if not clientProject.id
      log("no project id")
      return Promise.resolve(Project._mergeState(clientProject, "VALID"))

    user.ensureAuthToken().then (authToken) ->
      log("got auth token #{authToken}")
      Project._getProject(clientProject, authToken)

  @remove = (path) ->
    cache.removeProject(path)

  @add = (path) ->
    cache.insertProject(path)
    .then =>
      @id(path)
    .then (id) ->
      {id, path}
    .catch ->
      {path}

  @removeIds = (p) ->
    Project(p)
    .verifyExistence()
    .call("getConfig")
    .then (cfg) ->
      ## remove all of the ids for the test files found in the integrationFolder
      ids.remove(cfg.integrationFolder)

  @id = (path) ->
    Project(path).getProjectId()

  @ensureExists = (path) ->
    ## do we have a cypress.json for this project?
    settings.exists(path)

  @config = (path) ->
    Project(path).getConfig()

  @getSecretKeyByPath = (path) ->
    ## get project id
    Project.id(path)
    .then (id) ->
      user.ensureAuthToken()
      .then (authToken) ->
        api.getProjectToken(id, authToken)
        .catch ->
          errors.throw("CANNOT_FETCH_PROJECT_TOKEN")

  @generateSecretKeyByPath = (path) ->
    ## get project id
    Project.id(path)
    .then (id) ->
      user.ensureAuthToken()
      .then (authToken) ->
        api.updateProjectToken(id, authToken)
        .catch ->
          errors.throw("CANNOT_CREATE_PROJECT_TOKEN")

module.exports = Project
