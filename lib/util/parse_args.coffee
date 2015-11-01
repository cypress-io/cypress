_        = require("lodash")
path     = require("path")
minimist = require("minimist")

args     = "apiKey smokeTest getKey generateKey runProject project spec reporter ci debug updating headless ping coords key logs clearLogs port returnPkg environmentVariables".split(" ")

parseCoords = (coords) ->
  [x, y] = coords.split("x")
  {x: x, y: y}

parseEnv = (envs) ->
  ## convert foo=bar,version=1.2.3 to
  ## {foo: 'bar', version: '1.2.3'}
  _(envs.split(",")).map (pair) ->
    pair.split("=")
  .object().value()

module.exports = (options) ->
  argv = minimist(options.argv, {
    alias: {
      "api-key":     "apiKey"
      "smoke-test":  "smokeTest"
      "get-key":     "getKey"
      "new-key":     "generateKey"
      "run-project": "runProject"
      "clear-logs":  "clearLogs"
      "return-pkg":  "returnPkg"
      "env":         "environmentVariables"
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

  if options.updating
    _.extend options,
      appPath:  options.argv[0]
      execPath: options.argv[1]

  if options.smokeTest
    options.pong = options.ping

  return options