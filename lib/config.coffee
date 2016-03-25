_        = require("lodash")
str      = require("underscore.string")
path     = require("path")
Promise  = require("bluebird")
settings = require("./util/settings")
scaffold = require("./scaffold")

## cypress following by _
cypressEnvRe = /^(cypress_)/i

folders = "supportFolder fixturesFolder integrationFolder unitFolder".split(" ")

isCypressEnvLike = (key) ->
  cypressEnvRe.test(key) and key isnt "CYPRESS_ENV"

convertRelativeToAbsolutePaths = (rootFolder, obj, defaults = {}) ->
  _.reduce folders, (memo, folder) ->
    val = obj[folder]
    if val?
      ## if this folder has been specifically turned off
      ## then set its value to the default value and
      ## set the Remove key to true
      if val is false and def = defaults[folder]
        memo[folder + "Remove"] = true
        memo[folder] = path.resolve(rootFolder, def)
      else
        ## else just resolve the folder from the rootFolder
        memo[folder] = path.resolve(rootFolder, val)

    return memo
  , {}

module.exports = {
  get: (projectRoot, options = {}) ->
    Promise.all([
      settings.read(projectRoot)
      settings.readEnv(projectRoot)
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
    _.extend config, _.pick(options, "isHeadless", "socketId")

    if p = options.port
      config.port = p

    if e = options.environmentVariables
      config.environmentVariables = e

    if url = config.baseUrl
      ## always strip trailing slashes
      config.baseUrl = str.rtrim(url, "/")

    defaults = {
      morgan:         true
      baseUrl:        null
      socketId:       null
      isHeadless:     false
      clientRoute:    "/__/"
      xhrRoute:       "/xhrs/"
      socketIoRoute:  "/__socket.io"
      commandTimeout: 4000
      visitTimeout:   30000
      requestTimeout: 5000
      responseTimeout: 20000
      port:            2020
      waitForAnimations: true
      animationDistanceThreshold: 5
      autoOpen:       false
      viewportWidth:  1000
      viewportHeight: 660
      rootFolder:     config.projectRoot
      # unitFolder:        "cypress/unit"
      supportFolder:     "cypress/support"
      fixturesFolder:    "cypress/fixtures"
      integrationFolder: "cypress/integration"
      javascripts:    []
      namespace:      "__cypress"
    }

    _.defaults config, defaults

    ## split out our own app wide env from user env variables
    ## and delete envFile
    config.environmentVariables = @parseEnv(config)
    config.env = process.env["CYPRESS_ENV"]
    delete config.envFile

    config = @setUrls(config)

    config = @setAbsolutePaths(config, defaults)

    config = @setParentTestsPaths(config)

    config = @setScaffoldPaths(config)

    return config

  setScaffoldPaths: (obj) ->
    obj = _.clone(obj)

    fileName = scaffold.integrationExampleName()

    obj.integrationExampleFile = path.join(obj.integrationFolder, fileName)
    obj.integrationExampleName = fileName

    return obj

  setParentTestsPaths: (obj) ->
    ## projectRoot:              "/path/to/project"
    ## rootFolder:               "/path/to/project"
    ## integrationFolder:        "/path/to/project/cypress/integration"
    ## parentTestsFolder:        "/path/to/project/cypress"
    ## parentTestsFolderDisplay: "project/cypress"

    obj = _.clone(obj)

    ptf = obj.parentTestsFolder = path.dirname(obj.integrationFolder)

    pr = path.basename(obj.rootFolder)
    f  = path.basename(ptf)

    obj.parentTestsFolderDisplay = path.join(pr, f)

    return obj

  setAbsolutePaths: (obj, defaults) ->
    obj = _.clone(obj)

    ## if we have a rootFolder
    if pr = obj.projectRoot
      ## reset rootFolder to be absolute
      obj.rootFolder = rf = path.resolve(pr, obj.rootFolder)

      ## and do the same for all the rest
      _.extend obj, convertRelativeToAbsolutePaths(rf, obj, defaults)

    return obj

  setUrls: (obj) ->
    obj = _.clone(obj)

    rootUrl = "http://localhost:" + obj.port

    _.extend obj,
      clientUrlDisplay: rootUrl
      clientUrl:        rootUrl + obj.clientRoute
      xhrUrl:           obj.namespace + obj.xhrRoute

    return obj

  parseEnv: (cfg) ->
    envCfg  = cfg.env ? {}
    envFile = cfg.envFile ? {}
    envProc = @getProcessEnvVars(process.env) ? {}
    envCLI  = cfg.environmentVariables ? {}

    ## envCfg is from cypress.json
    ## envFile is from cypress.env.json
    ## envPRoc is from process env vars
    ## envCLI is from CLI arguments
    _.extend envCfg, envFile, envProc, envCLI

  getProcessEnvVars: (obj = {}) ->
    normalize = (key) ->
      key.replace(cypressEnvRe, "")

    _.reduce obj, (memo, value, key) ->
      if isCypressEnvLike(key)
        memo[normalize(key)] = value
      memo
    , {}

  getNameFromRoot: (root = "") ->
    path.basename(root)

}