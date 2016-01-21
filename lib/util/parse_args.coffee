_        = require("lodash")
path     = require("path")
minimist = require("minimist")

args     = "appPath execPath apiKey smokeTest getKey generateKey runProject project spec reporter ci debug updating headless ping coords key logs gui clearLogs port returnPkg environmentVariables getChromiumVersion".split(" ")

parseCoords = (coords) ->
  [x, y] = coords.split("x")
  {x: x, y: y}

parseEnv = (envs) ->
  ## convert foo=bar,version=1.2.3 to
  ## {foo: 'bar', version: '1.2.3'}
  _(envs.split(",")).map (pair) ->
    pair.split("=")
  .object().value()

module.exports = (argv) ->
  options = minimist(argv, {
    alias: {
      "app-path":    "appPath"
      "exec-path":   "execPath"
      "api-key":     "apiKey"
      "smoke-test":  "smokeTest"
      "get-key":     "getKey"
      "new-key":     "generateKey"
      "run-project": "runProject"
      "clear-logs":  "clearLogs"
      "return-pkg":  "returnPkg"
      "env":         "environmentVariables"
      "get-chromium-version": "getChromiumVersion"
    }
  })

  _.extend options, _.pick(argv, args...), {
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