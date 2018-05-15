_        = require("lodash")
path     = require("path")
Promise  = require("bluebird")
deepDiff = require("return-deep-diff")
errors   = require("./errors")
scaffold = require("./scaffold")
errors   = require("./errors")
fs       = require("./util/fs")
origin   = require("./util/origin")
coerce   = require("./util/coerce")
settings = require("./util/settings")
v        = require("./util/validation")
log      = require("debug")("cypress:server:config")
pathHelpers = require("./util/path_helpers")

## cypress followed by _
cypressEnvRe = /^(cypress_)/i
dashesOrUnderscoresRe = /^(_-)+/
oneOrMoreSpacesRe = /\s+/
everythingAfterFirstEqualRe = /=(.+)/

toWords = (str) ->
  str.trim().split(oneOrMoreSpacesRe)

isCypressEnvLike = (key) ->
  cypressEnvRe.test(key) and key isnt "CYPRESS_ENV"

folders = toWords """
  fileServerFolder   fixturesFolder   integrationFolder   screenshotsFolder
  supportFile        supportFolder    unitFolder          videosFolder
"""

configKeys = toWords """
  animationDistanceThreshold      fileServerFolder
  baseUrl                         fixturesFolder
  chromeWebSecurity
  modifyObstructiveCode           integrationFolder
  env                             pluginsFile
  hosts                           screenshotsFolder
  numTestsKeptInMemory            supportFile
  port                            supportFolder
  reporter                        videosFolder
  reporterOptions
  screenshotOnHeadlessFailure     defaultCommandTimeout
  testFiles                       execTimeout
  trashAssetsBeforeHeadlessRuns   pageLoadTimeout
  blacklistHosts                  requestTimeout
  userAgent                       responseTimeout
  viewportWidth
  viewportHeight
  videoRecording
  videoCompression
  videoUploadOnPasses
  watchForFileChanges
  waitForAnimations
"""

toArrayFromPipes = (str) ->
  if _.isArray(str)
    return str

  [].concat(str.split('|'))

toObjectFromPipes = (str) ->
  if _.isObject(str)
    return str

  ## convert foo=bar|version=1.2.3 to
  ## {foo: 'bar', version: '1.2.3'}
  _
  .chain(str)
  .split("|")
  .map (pair) ->
    pair.split("=")
  .fromPairs()
  .mapValues(coerce)
  .value()

defaults = {
  port:                          null
  hosts:                         null
  morgan:                        true
  baseUrl:                       null
  socketId:                      null
  userAgent:                     null
  isTextTerminal:                false
  reporter:                      "spec"
  reporterOptions:               null
  blacklistHosts:                null
  clientRoute:                   "/__/"
  xhrRoute:                      "/xhrs/"
  socketIoRoute:                 "/__socket.io"
  socketIoCookie:                "__socket.io"
  reporterRoute:                 "/__cypress/reporter"
  ignoreTestFiles:               "*.hot-update.js"
  testFiles:                     "**/*.*"
  defaultCommandTimeout:         4000
  requestTimeout:                5000
  responseTimeout:               30000
  pageLoadTimeout:               60000
  execTimeout:                   60000
  videoRecording:                true
  videoCompression:              32
  videoUploadOnPasses:           true
  modifyObstructiveCode:         true
  chromeWebSecurity:             true
  waitForAnimations:             true
  animationDistanceThreshold:    5
  numTestsKeptInMemory:          50
  watchForFileChanges:           true
  screenshotOnHeadlessFailure:   true
  trashAssetsBeforeHeadlessRuns: true
  autoOpen:                      false
  viewportWidth:                 1000
  viewportHeight:                660
  fileServerFolder:              ""
  videosFolder:                  "cypress/videos"
  supportFile:                   "cypress/support"
  fixturesFolder:                "cypress/fixtures"
  integrationFolder:             "cypress/integration"
  screenshotsFolder:             "cypress/screenshots"
  namespace:                     "__cypress"
  pluginsFile:                    "cypress/plugins"

  ## deprecated
  javascripts:                   []
}

validationRules = {
  animationDistanceThreshold: v.isNumber
  baseUrl: v.isFullyQualifiedUrl
  blacklistHosts: v.isStringOrArrayOfStrings
  modifyObstructiveCode: v.isBoolean
  chromeWebSecurity: v.isBoolean
  defaultCommandTimeout: v.isNumber
  env: v.isPlainObject
  execTimeout: v.isNumber
  fileServerFolder: v.isString
  fixturesFolder: v.isStringOrFalse
  ignoreTestFiles: v.isStringOrArrayOfStrings
  integrationFolder: v.isString
  numTestsKeptInMemory: v.isNumber
  pageLoadTimeout: v.isNumber
  pluginsFile: v.isStringOrFalse
  port: v.isNumber
  reporter: v.isString
  requestTimeout: v.isNumber
  responseTimeout: v.isNumber
  testFiles: v.isString
  screenshotOnHeadlessFailure: v.isBoolean
  supportFile: v.isStringOrFalse
  trashAssetsBeforeHeadlessRuns: v.isBoolean
  userAgent: v.isString
  videoCompression: v.isNumberOrFalse
  videoRecording: v.isBoolean
  videoUploadOnPasses: v.isBoolean
  videosFolder: v.isString
  viewportHeight: v.isNumber
  viewportWidth: v.isNumber
  waitForAnimations: v.isBoolean
  watchForFileChanges: v.isBoolean
}

convertRelativeToAbsolutePaths = (projectRoot, obj, defaults = {}) ->
  _.reduce folders, (memo, folder) ->
    val = obj[folder]
    if val? and val isnt false
      memo[folder] = path.resolve(projectRoot, val)
    return memo
  , {}

validate = (file) ->
  return (settings) ->
    _.each settings, (value, key) ->
      if validationFn = validationRules[key]
        result = validationFn(key, value)
        if result isnt true
          errors.throw("CONFIG_VALIDATION_ERROR", file, result)

module.exports = {
  getConfigKeys: -> configKeys

  whitelist: (obj = {}) ->
    _.pick(obj, configKeys)

  get: (projectRoot, options = {}) ->
    Promise.all([
      settings.read(projectRoot).then(validate("cypress.json"))
      settings.readEnv(projectRoot).then(validate("cypress.env.json"))
    ])
    .spread (settings, envFile) =>
      @set({
        projectName: @getNameFromRoot(projectRoot)
        projectRoot: projectRoot
        config:      settings
        envFile:     envFile
        options:     options
      })

  set: (obj = {}) ->
    {projectRoot, projectName, config, envFile, options} = obj

    ## just force config to be an object
    ## so we dont have to do as much
    ## work in our tests
    config ?= {}

    ## flatten the object's properties
    ## into the master config object
    config.envFile     = envFile
    config.projectRoot = projectRoot
    config.projectName = projectName

    @mergeDefaults(config, options)

  mergeDefaults: (config = {}, options = {}) ->
    resolved = {}

    _.extend config, _.pick(options, "morgan", "isTextTerminal", "socketId", "report", "browsers")

    _
    .chain(@whitelist(options))
    .omit("env")
    .each (val, key) ->
      resolved[key] = "cli"
      config[key] = val
      return
    .value()

    if url = config.baseUrl
      ## always strip trailing slashes
      config.baseUrl = _.trimEnd(url, "/")

    _.defaults(config, defaults)

    ## split out our own app wide env from user env variables
    ## and delete envFile
    config.env = @parseEnv(config, options.env, resolved)
    config.cypressEnv = process.env["CYPRESS_ENV"]
    delete config.envFile

    if hosts = config.hosts
      config.hosts = toObjectFromPipes(hosts)

    if blacklistHosts = config.blacklistHosts
      config.blacklistHosts = toArrayFromPipes(blacklistHosts)

    ## when headless
    if config.isTextTerminal
      ## dont ever watch for file changes
      config.watchForFileChanges = false

      ## and forcibly reset numTestsKeptInMemory
      ## to zero
      config.numTestsKeptInMemory = 0

    config = @setResolvedConfigValues(config, defaults, resolved)

    if config.port
      config = @setUrls(config)

    config = @setAbsolutePaths(config, defaults)

    config = @setParentTestsPaths(config)

    @setSupportFileAndFolder(config)
    .then(@setPluginsFile)
    .then(@setScaffoldPaths)

  setResolvedConfigValues: (config, defaults, resolved) ->
    obj = _.clone(config)

    obj.resolved = @resolveConfigValues(config, defaults, resolved)

    return obj

  updateWithPluginValues: (cfg, overrides = {}) ->
    ## diff the overrides with cfg
    ## including nested objects (env)
    diffs = deepDiff(cfg, overrides, true)

    setResolvedOn = (resolvedObj, obj) ->
      _.each obj, (val, key) ->
        if _.isObject(val)
          ## recurse setting overrides
          ## inside of this nested objected
          setResolvedOn(resolvedObj[key], val)
        else
          ## override the resolved value
          resolvedObj[key] = {
            value: val
            from: "plugin"
          }

    ## for each override go through
    ## and change the resolved values of cfg
    ## to point to the plugin
    setResolvedOn(cfg.resolved, diffs)

    ## merge cfg into overrides
    _.defaultsDeep(diffs, cfg)

  resolveConfigValues: (config, defaults, resolved = {}) ->
    ## pick out only the keys found in configKeys
    _
    .chain(config)
    .pick(configKeys)
    .mapValues (val, key) ->
      source = (s) ->
        {
          value: val
          from:  s
        }

      switch
        when r = resolved[key]
          if _.isObject(r)
            r
          else
            source(r)
        when not _.isEqual(config[key], defaults[key])
          source("config")
        else
          source("default")
    .value()

  setScaffoldPaths: (obj) ->
    obj = _.clone(obj)

    obj.integrationExampleName = scaffold.integrationExampleName()
    obj.integrationExamplePath = path.join(obj.integrationFolder, obj.integrationExampleName)
    obj.scaffoldedFiles = scaffold.fileTree(obj)

    return obj

  # async function
  setSupportFileAndFolder: (obj) ->
    return Promise.resolve(obj) if not obj.supportFile

    obj = _.clone(obj)

    ## TODO move this logic to find support file into util/path_helpers
    sf = obj.supportFile
    log "setting support file #{sf}"
    log "for project root #{obj.projectRoot}"

    Promise
    .try ->
      ## resolve full path with extension
      obj.supportFile = require.resolve(sf)
    .then ->
      if pathHelpers.checkIfResolveChangedRootFolder(obj.supportFile, sf)
        log("require.resolve switched support folder from %s to %s",
          sf, obj.supportFile)
        # this means the path was probably symlinked, like
        # /tmp/foo -> /private/tmp/foo
        # which can confuse the rest of the code
        # switch it back to "normal" file
        obj.supportFile = path.join(sf, path.basename(obj.supportFile))
        return fs.pathExists(obj.supportFile)
        .then (found) ->
          if not found
            errors.throw("SUPPORT_FILE_NOT_FOUND", obj.supportFile)
          log("switching to found file %s", obj.supportFile)
    .catch({code: "MODULE_NOT_FOUND"}, ->
      log("support file %s does not exist", sf)
      ## supportFile doesn't exist on disk
      if sf is path.resolve(obj.projectRoot, defaults.supportFile)
        log("support file is default, check if #{path.dirname(sf)} exists")
        return fs.pathExists(sf)
        .then (found) ->
          if found
            log("support folder exists, set supportFile to false")
            ## if the directory exists, set it to false so it's ignored
            obj.supportFile = false
          else
            log("support folder does not exist, set to default index.js")
            ## otherwise, set it up to be scaffolded later
            obj.supportFile = path.join(sf, "index.js")
          return obj
      else
        log("support file is not default")
        ## they have it explicitly set, so it should be there
        errors.throw("SUPPORT_FILE_NOT_FOUND", path.resolve(obj.projectRoot, sf))
    )
    .then ->
      if obj.supportFile
        ## set config.supportFolder to its directory
        obj.supportFolder = path.dirname(obj.supportFile)
        log "set support folder #{obj.supportFolder}"
      obj

  ## set pluginsFile to an absolute path with the following rules:
  ## - do nothing if pluginsFile is falsey
  ## - look up the absolute path via node, so 'cypress/plugins' can resolve
  ##   to 'cypress/plugins/index.js' or 'cypress/plugins/index.coffee'
  ## - if not found
  ##   * and the pluginsFile is set to the default
  ##     - and the path to the pluginsFile directory exists
  ##       * assume the user doesn't need a pluginsFile, set it to false
  ##         so it's ignored down the pipeline
  ##     - and the path to the pluginsFile directory does not exist
  ##       * set it to cypress/plugins/index.js, it will get scaffolded
  ##   * and the pluginsFile is NOT set to the default
  ##     - throw an error, because it should be there if the user
  ##       explicitly set it
  setPluginsFile: (obj) ->
    return Promise.resolve(obj) if not obj.pluginsFile

    obj = _.clone(obj)

    pluginsFile = path.join(obj.projectRoot, obj.pluginsFile)
    log("setting plugins file #{pluginsFile}")
    log("for project root #{obj.projectRoot}")

    Promise
    .try ->
      ## resolve full path with extension
      obj.pluginsFile = require.resolve(pluginsFile)
      log("set pluginsFile to #{obj.pluginsFile}")
    .catch {code: "MODULE_NOT_FOUND"}, ->
      log("plugins file does not exist")
      if pluginsFile is path.resolve(obj.projectRoot, defaults.pluginsFile)
        log("plugins file is default, check if #{path.dirname(pluginsFile)} exists")
        fs.pathExists(pluginsFile)
        .then (found) ->
          if found
            log("plugins folder exists, set pluginsFile to false")
            ## if the directory exists, set it to false so it's ignored
            obj.pluginsFile = false
          else
            log("plugins folder does not exist, set to default index.js")
            ## otherwise, set it up to be scaffolded later
            obj.pluginsFile = path.join(pluginsFile, "index.js")
          return obj
      else
        log("plugins file is not default")
        ## they have it explicitly set, so it should be there
        errors.throw("PLUGINS_FILE_ERROR", path.resolve(obj.projectRoot, pluginsFile))
    .return(obj)

  setParentTestsPaths: (obj) ->
    ## projectRoot:              "/path/to/project"
    ## integrationFolder:        "/path/to/project/cypress/integration"
    ## parentTestsFolder:        "/path/to/project/cypress"
    ## parentTestsFolderDisplay: "project/cypress"

    obj = _.clone(obj)

    ptfd = obj.parentTestsFolder = path.dirname(obj.integrationFolder)

    prd = path.dirname(obj.projectRoot ? "")

    obj.parentTestsFolderDisplay = path.relative(prd, ptfd)

    return obj

  setAbsolutePaths: (obj, defaults) ->
    obj = _.clone(obj)

    ## if we have a projectRoot
    if pr = obj.projectRoot
      ## reset fileServerFolder to be absolute
      # obj.fileServerFolder = path.resolve(pr, obj.fileServerFolder)

      ## and do the same for all the rest
      _.extend obj, convertRelativeToAbsolutePaths(pr, obj, defaults)

    return obj

  setUrls: (obj) ->
    obj = _.clone(obj)

    proxyUrl = "http://localhost:" + obj.port

    rootUrl = if obj.baseUrl
      origin(obj.baseUrl)
    else
      proxyUrl

    _.extend obj,
      proxyUrl:    proxyUrl
      browserUrl:  rootUrl + obj.clientRoute
      reporterUrl: rootUrl + obj.reporterRoute
      xhrUrl:      obj.namespace + obj.xhrRoute

    return obj

  parseEnv: (cfg, envCLI, resolved = {}) ->
    envVars = resolved.env = {}

    resolveFrom = (from, obj = {}) ->
      _.each obj, (val, key) ->
        envVars[key] = {
          value: val
          from: from
        }

    envCfg  = cfg.env ? {}
    envFile = cfg.envFile ? {}
    envProc = @getProcessEnvVars(process.env) ? {}
    envCLI  = envCLI ? {}

    matchesConfigKey = (key) ->
      if _.has(cfg, key)
        return key

      key = key.toLowerCase().replace(dashesOrUnderscoresRe, "")
      key = _.camelCase(key)

      if _.has(cfg, key)
        return key

    configFromEnv = _.reduce envProc, (memo, val, key) ->
      if cfgKey = matchesConfigKey(key)
        ## only change the value if it hasnt been
        ## set by the CLI. override default + config
        if resolved[cfgKey] isnt "cli"
          cfg[cfgKey] = val
          resolved[cfgKey] = {
            value: val
            from: "env"
          }

        memo.push(key)
      memo
    , []

    envProc = _.omit(envProc, configFromEnv)

    resolveFrom("config",  envCfg)
    resolveFrom("envFile", envFile)
    resolveFrom("env",     envProc)
    resolveFrom("cli",     envCLI)

    ## envCfg is from cypress.json
    ## envFile is from cypress.env.json
    ## envProc is from process env vars
    ## envCLI is from CLI arguments
    _.extend envCfg, envFile, envProc, envCLI

  getProcessEnvVars: (obj = {}) ->
    normalize = (key) ->
      key.replace(cypressEnvRe, "")

    _.reduce obj, (memo, value, key) ->
      if isCypressEnvLike(key)
        memo[normalize(key)] = coerce(value)
      memo
    , {}

  getNameFromRoot: (root = "") ->
    path.basename(root)

}
