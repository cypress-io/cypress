_        = require("lodash")
path     = require("path")
minimist = require("minimist")

whitelist = "appPath execPath apiKey smokeTest getKey generateKey runProject project spec reporter ci updating ping coords key logs clearLogs port returnPkg environmentVariables getChromiumVersion mode autoOpen removeIds".split(" ")

parseCoords = (coords) ->
  [x, y] = coords.split("x")
  {x: x, y: y}

parseEnv = (envs) ->
  ## convert foo=bar,version=1.2.3 to
  ## {foo: 'bar', version: '1.2.3'}
  _(envs.split(",")).map (pair) ->
    pair.split("=")
  .object().value()

module.exports = {
  toObject: (argv) ->
    ## takes an array of args and converts
    ## to an object
    options = minimist(argv, {
      alias: {
        "app-path":    "appPath"
        "exec-path":   "execPath"
        "api-key":     "apiKey"
        "smoke-test":  "smokeTest"
        "remove-ids":  "removeIds"
        "get-key":     "getKey"
        "new-key":     "generateKey"
        "run-project": "runProject"
        "clear-logs":  "clearLogs"
        "return-pkg":  "returnPkg"
        "auto-open":   "autoOpen"
        "env":         "environmentVariables"
        "get-chromium-version": "getChromiumVersion"
      }
    })

    _.extend options, _.pick(argv, whitelist...), {
      env: process.env["CYPRESS_ENV"]
    }

    if options.coords
      options.coords = parseCoords(options.coords)

    if envs = options.environmentVariables
      options.environmentVariables = parseEnv(envs)

    ## normalize runProject or project to projectPath
    if rp = options.runProject or p = options.project
      options.projectPath = path.resolve(process.cwd(), rp ? p)

    if options.smokeTest
      options.pong = options.ping

    return options

  toArray: (obj = {}) ->
    ## goes in reverse, takes an object
    ## and converts to an array by picking
    ## only the whitelisted properties and
    ## mapping them to include the argument
    _.chain(obj)
    .pick(whitelist...)
    .mapValues (val, key) ->
      "--#{key}=#{val}"
    .values()
    .value()
}