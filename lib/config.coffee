_        = require("lodash")
str      = require("underscore.string")
settings = require("./util/settings")

## cypress following by _
cypressEnvRe = /^(cypress_)/i

isCypressEnvLike = (key) ->
  cypressEnvRe.test(key) and key isnt "CYPRESS_ENV"

module.exports = {
  get: (projectRoot, options = {}) ->
    Promise.all([
      settings.readEnv(projectRoot)
      settings.read(projectRoot)
    ])
    .spread (env, config) =>
      config.projectRoot = projectRoot
      config.envFile = env

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

    _.defaults config,
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
      supportFolder:     "cypress/helpers"
      fixturesFolder:    "cypress/fixtures"
      integrationFolder: "cypress/integration"
      # unitFolder:        "cypress/unit"
      # fixturesFolder:    "cypress/fixtures"
      # helpersFolder:     "cypress/helpers"
      # helpersFolder:     "cypress/helpers/custom_commands.js"
      # helpersFolder:     "cypress/helpers/configuration.js"
      javascripts:    []
      namespace:      "__cypress"

    ## split out our own app wide env from user env variables
    ## and delete envFile
    config.environmentVariables = @parseEnv(config)
    config.env = process.env["CYPRESS_ENV"]
    delete config.envFile

    @setUrls(config)

    return config

  setUrls: (obj) ->
    rootUrl = "http://localhost:" + obj.port

    _.extend obj,
      clientUrlDisplay: rootUrl
      clientUrl:        rootUrl + obj.clientRoute
      xhrUrl:           obj.namespace + obj.xhrRoute

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

}