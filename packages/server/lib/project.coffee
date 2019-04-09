_           = require("lodash")
R           = require("ramda")
EE          = require("events")
path        = require("path")
Promise     = require("bluebird")
commitInfo  = require("@cypress/commit-info")
la          = require("lazy-ass")
check       = require("check-more-types")
scaffoldDebug = require("debug")("cypress:server:scaffold")
debug       = require("debug")("cypress:server:project")
cwd         = require("./cwd")
api         = require("./api")
user        = require("./user")
cache       = require("./cache")
config      = require("./config")
logger      = require("./logger")
errors      = require("./errors")
Server      = require("./server")
plugins     = require("./plugins")
scaffold    = require("./scaffold")
Watchers    = require("./watchers")
Reporter    = require("./reporter")
browsers    = require("./browsers")
savedState  = require("./saved_state")
Automation  = require("./automation")
preprocessor = require("./plugins/preprocessor")
fs          = require("./util/fs")
settings    = require("./util/settings")
specsUtil   = require("./util/specs")

localCwd = cwd()

multipleForwardSlashesRe = /[^:\/\/](\/{2,})/g

class Project extends EE
  constructor: (projectRoot) ->
    if not (@ instanceof Project)
      return new Project(projectRoot)

    if not projectRoot
      throw new Error("Instantiating lib/project requires a projectRoot!")

    if not check.unemptyString(projectRoot)
      throw new Error("Expected project root path, not #{projectRoot}")

    @projectRoot = path.resolve(projectRoot)
    @watchers    = Watchers()
    @cfg         = null
    @spec        = null
    @browser     = null
    @server      = null
    @memoryCheck = null
    @automation  = null

    debug("Project created %s", @projectRoot)

  open: (options = {}) ->
    debug("opening project instance %s", @projectRoot)
    @server = Server()

    _.defaults options, {
      report:       false
      onFocusTests: ->
      onError: ->
      onSettingsChanged: false
    }

    if process.env.CYPRESS_MEMORY
      logMemory = ->
        console.log("memory info", process.memoryUsage())

      @memoryCheck = setInterval(logMemory, 1000)

    @getConfig(options)
    .tap (cfg) =>
      process.chdir(@projectRoot)

      ## TODO: we currently always scaffold the plugins file
      ## even when headlessly or else it will cause an error when
      ## we try to load it and it's not there. We must do this here
      ## else initialing the plugins will instantly fail.
      if cfg.pluginsFile
        scaffold.plugins(path.dirname(cfg.pluginsFile), cfg)
    .then (cfg) =>
      @_initPlugins(cfg, options)
      .then (modifiedCfg) ->
        debug("plugin config yielded:", modifiedCfg)

        return config.updateWithPluginValues(cfg, modifiedCfg)
    .then (cfg) =>
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

        debug("project config: %o", _.omit(cfg, "resolved"))

        if warning
          options.onWarning(warning)

        options.onSavedStateChanged = (state) =>
          @saveState(state)

        Promise.join(
          @watchSettingsAndStartWebsockets(options, cfg)
          @scaffold(cfg)
        )
        .then =>
          Promise.join(
            @checkSupportFile(cfg)
            @watchPluginsFile(cfg, options)
          )

    # return our project instance
    .return(@)

  _initPlugins: (cfg, options) ->
    ## only init plugins with the
    ## whitelisted config values to
    ## prevent tampering with the
    ## internals and breaking cypress
    cfg = config.whitelist(cfg)

    plugins.init(cfg, {
      onError: (err) ->
        debug('got plugins error', err.stack)

        browsers.close()
        options.onError(err)
    })

  getRuns: ->
    Promise.all([
      @getProjectId(),
      user.ensureAuthToken()
    ])
    .spread (projectId, authToken) ->
      api.getProjectRuns(projectId, authToken)

  reset: ->
    debug("resetting project instance %s", @projectRoot)

    @spec = @browser = null

    Promise.try =>
      @automation?.reset()
      @server?.reset()

  close: ->
    debug("closing project instance %s", @projectRoot)

    if @memoryCheck
      clearInterval(@memoryCheck)

    @cfg = @spec = @browser = null

    Promise.join(
      @server?.close(),
      @watchers?.close(),
      preprocessor.close()
    )
    .then ->
      process.chdir(localCwd)

  checkSupportFile: (cfg) ->
    if supportFile = cfg.supportFile
      fs.pathExists(supportFile)
      .then (found) =>
        if not found
          errors.throw("SUPPORT_FILE_NOT_FOUND", supportFile)

  watchPluginsFile: (cfg, options) ->
    debug("attempt watch plugins file: #{cfg.pluginsFile}")
    if not cfg.pluginsFile
      return Promise.resolve()

    fs.pathExists(cfg.pluginsFile)
    .then (found) =>
      debug("plugins file found? #{found}")
      ## ignore if not found. plugins#init will throw the right error
      return if not found

      debug("watch plugins file")
      @watchers.watchTree(cfg.pluginsFile, {
        onChange: =>
          ## TODO: completely re-open project instead?
          debug("plugins file changed")
          ## re-init plugins after a change
          @_initPlugins(cfg, options)
          .catch (err) ->
            options.onError(err)
      })

  watchSettings: (onSettingsChanged) ->
    ## bail if we havent been told to
    ## watch anything
    return if not onSettingsChanged

    debug("watch settings files")

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
    @watchers.watch(settings.pathToCypressEnvJson(@projectRoot), obj)

  watchSettingsAndStartWebsockets: (options = {}, cfg = {}) ->
    @watchSettings(options.onSettingsChanged)

    { reporter, projectRoot } = cfg

    ## if we've passed down reporter
    ## then record these via mocha reporter
    if cfg.report
      try
        Reporter.loadReporter(reporter, projectRoot)
      catch err
        paths = Reporter.getSearchPathsForReporter(reporter, projectRoot)

        ## only include the message if this is the standard MODULE_NOT_FOUND
        ## else include the whole stack
        errorMsg = if err.code is "MODULE_NOT_FOUND" then err.message else err.stack

        errors.throw("INVALID_REPORTER_NAME", {
          paths
          error: errorMsg
          name: reporter
        })

      reporter = Reporter.create(reporter, cfg.reporterOptions, projectRoot)

    @automation = Automation.create(cfg.namespace, cfg.socketIoCookie, cfg.screenshotsFolder)

    @server.startWebsockets(@automation, cfg, {
      onReloadBrowser: options.onReloadBrowser

      onFocusTests: options.onFocusTests

      onSpecChanged: options.onSpecChanged

      onSavedStateChanged: options.onSavedStateChanged

      onConnect: (id) =>
        @emit("socket:connected", id)

      onSetRunnables: (runnables) ->
        debug("received runnables %o", runnables)
        reporter?.setRunnables(runnables)

      onMocha: (event, runnable) =>
        debug("onMocha", event)
        ## bail if we dont have a
        ## reporter instance
        return if not reporter

        console.log(reporter)

        reporter.emit(event, runnable)

        if event is "end"
          Promise.all([
            reporter?.end()
            @server.end()
          ])
          .spread (stats = {}) =>
            @emit("end", stats)
    })

  changeToUrl: (url) ->
    @server.changeToUrl(url)

  setCurrentSpecAndBrowser: (spec, browser) ->
    @spec = spec
    @browser = browser

  getCurrentSpecAndBrowser: ->
    _.pick(@, "spec", "browser")

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
    if @cfg
      return Promise.resolve(@cfg)

    setNewProject = (cfg) =>
      return if cfg.isTextTerminal

      ## decide if new project by asking scaffold
      ## and looking at previously saved user state
      if not cfg.integrationFolder
        throw new Error("Missing integration folder")

      @determineIsNewProject(cfg.integrationFolder)
      .then (untouchedScaffold) ->
        userHasSeenOnBoarding = _.get(cfg, 'state.showedOnBoardingModal', false)
        scaffoldDebug("untouched scaffold #{untouchedScaffold} modal closed #{userHasSeenOnBoarding}")
        cfg.isNewProject = untouchedScaffold && !userHasSeenOnBoarding

    config.get(@projectRoot, options)
    .then (cfg) => @_setSavedState(cfg)
    .tap(setNewProject)

  # forces saving of project's state by first merging with argument
  saveState: (stateChanges = {}) ->
    throw new Error("Missing project config") if not @cfg
    throw new Error("Missing project root") if not @projectRoot
    newState = _.merge({}, @cfg.state, stateChanges)
    savedState(@projectRoot, @cfg.isTextTerminal)
    .then (state) ->
      state.set(newState)
    .then =>
      @cfg.state = newState
      newState

  _setSavedState: (cfg) ->
    debug("get saved state")
    savedState(@projectRoot, cfg.isTextTerminal)
    .then (state) -> state.get()
    .then (state) ->
      cfg.state = state
      cfg

  getSpecUrl: (absoluteSpecPath) ->
    @getConfig()
    .then (cfg) =>
      ## if we dont have a absoluteSpecPath or its __all
      if not absoluteSpecPath or (absoluteSpecPath is "__all")
        @normalizeSpecUrl(cfg.browserUrl, "/__all")
      else
        ## TODO:
        ## to handle both unit + integration tests we need
        ## to figure out (based on the config) where this absoluteSpecPath
        ## lives. does it live in the integrationFolder or
        ## the unit folder?
        ## once we determine that we can then prefix it correctly
        ## with either integration or unit
        prefixedPath = @getPrefixedPathToSpec(cfg, absoluteSpecPath)
        @normalizeSpecUrl(cfg.browserUrl, prefixedPath)

  getPrefixedPathToSpec: (cfg, pathToSpec, type = "integration") ->
    { integrationFolder, projectRoot } = cfg

    ## for now hard code the 'type' as integration
    ## but in the future accept something different here

    ## strip out the integration folder and prepend with "/"
    ## example:
    ##
    ## /Users/bmann/Dev/cypress-app/.projects/cypress/integration
    ## /Users/bmann/Dev/cypress-app/.projects/cypress/integration/foo.coffee
    ##
    ## becomes /integration/foo.coffee
    "/" + path.join(type, path.relative(
      integrationFolder,
      path.resolve(projectRoot, pathToSpec)
    ))

  normalizeSpecUrl: (browserUrl, specUrl) ->
    replacer = (match, p1) ->
      match.replace("//", "/")

    [
      browserUrl,
      "#/tests",
      specUrl
    ].join("/").replace(multipleForwardSlashesRe, replacer)

  scaffold: (cfg) ->
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
    push(scaffold.support(cfg.supportFolder, cfg))

    ## if we're in headed mode add these other scaffolding
    ## tasks
    if not cfg.isTextTerminal
      push(scaffold.integration(cfg.integrationFolder, cfg))
      push(scaffold.fixture(cfg.fixturesFolder, cfg))

    Promise.all(scaffolds)

  writeProjectId: (id) ->
    attrs = { projectId: id }
    logger.info "Writing Project ID", _.clone(attrs)

    @generatedProjectIdTimestamp = new Date

    settings
    .write(@projectRoot, attrs)
    .return(id)

  getProjectId: ->
    @verifyExistence()
    .then =>
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
      commitInfo.getRemoteOrigin(@projectRoot)
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
    cache.getProjectRoots()

  @getPathsAndIds = ->
    cache.getProjectRoots()
    .map (projectRoot) ->
      Promise.props({
        path: projectRoot
        id: settings.id(projectRoot)
      })

  @_mergeDetails = (clientProject, project) ->
    _.extend({}, clientProject, project, {state: "VALID"})

  @_mergeState = (clientProject, state) ->
    _.extend({}, clientProject, {state: state})

  @_getProject = (clientProject, authToken) ->
    debug("get project from api", clientProject.id, clientProject.path)
    api.getProject(clientProject.id, authToken)
    .then (project) ->
      debug("got project from api")
      Project._mergeDetails(clientProject, project)
    .catch (err) ->
      debug("failed to get project from api", err.statusCode)
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
    debug("get project statuses for #{clientProjects.length} projects")
    user.ensureAuthToken()
    .then (authToken) ->
      debug("got auth token #{authToken}")
      api.getProjects(authToken).then (projects = []) ->
        debug("got #{projects.length} projects")
        projectsIndex = _.keyBy(projects, "id")
        Promise.all(_.map clientProjects, (clientProject) ->
          debug("looking at", clientProject.path)
          ## not a CI project, just mark as valid and return
          if not clientProject.id
            debug("no project id")
            return Project._mergeState(clientProject, "VALID")

          if project = projectsIndex[clientProject.id]
            debug("found matching:", project)
            ## merge in details for matching project
            Project._mergeDetails(clientProject, project)
          else
            debug("did not find matching:", project)
            ## project has id, but no matching project found
            ## check if it doesn't exist or if user isn't authorized
            Project._getProject(clientProject, authToken)
        )

  @getProjectStatus = (clientProject) ->
    debug("get project status for", clientProject.id, clientProject.path)

    if not clientProject.id
      debug("no project id")
      return Promise.resolve(Project._mergeState(clientProject, "VALID"))

    user.ensureAuthToken().then (authToken) ->
      debug("got auth token #{authToken}")
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

  # Given a path to the project, finds all specs
  # returns list of specs with respect to the project root
  @findSpecs = (projectRoot, specPattern) ->
    debug("finding specs for project %s", projectRoot)
    la(check.unemptyString(projectRoot), "missing project path", projectRoot)
    la(check.maybe.unemptyString(specPattern), "invalid spec pattern", specPattern)

    ## if we have a spec pattern
    if specPattern
      ## then normalize to create an absolute
      ## file path from projectRoot
      ## ie: **/* turns into /Users/bmann/dev/project/**/*
      specPattern = path.resolve(projectRoot, specPattern)

    Project(projectRoot)
    .getConfig()
    # TODO: handle wild card pattern or spec filename
    .then (cfg) ->
      specsUtil.find(cfg, specPattern)
    .then R.prop("integration")
    .then R.map(R.prop("name"))

module.exports = Project
