_        = require("lodash")
str      = require("underscore.string")
settings = require("./util/settings")

## cypress following by _ or - or .
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
      testFolder:     "tests"
      fixturesFolder: "tests/_fixtures"
      supportFolder:  "tests/_support"
      # integrationFolder: "cypress/integration"
      # unitFolder:        "cypress/unit"
      # fixturesFolder:    "cypress/fixtures"
      # helpersFolder:     "cypress/helpers"
      # helpersFolder:     "cypress/helpers/custom_commands.js"
      # helpersFolder:     "cypress/helpers/configuration.js"
      javascripts:    []
      namespace:      "__cypress"
      environmentVariables: null

    ## split out our own app wide env from user env variables
    ## and delete envFile
    config.environmentVariables = @parseEnv(config.env, config.envFile, config.environmentVariables)
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

  parseEnv: (env = {}, envFile = {}, envVars = {}) ->
    ## env is from cypress.json
    ## envFile is from cypress.env.json

    _.extend env,
      envVars,
      envFile,
      @getProcessEnvVars(process.env)
      ## finally get the ones from the CLI --env
      ## this should come from nw parseArgs?

  getProcessEnvVars: (obj = {}) ->
    normalize = (key) ->
      key.replace(cypressEnvRe, "")

    _.reduce obj, (memo, value, key) ->
      if isCypressEnvLike(key)
        memo[normalize(key)] = value
      memo
    , {}

}