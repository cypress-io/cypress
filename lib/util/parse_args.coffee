_        = require("lodash")
path     = require("path")
minimist = require("minimist")

args     = "apiKey smokeTest getKey generateKey runProject spec reporter ci silent debug updating headless ping coords".split(" ")

parseCoords = (cords) ->
  [x, y] = coords.split("x")
  {x: x, y: y}

module.exports = (options) ->
  argv = minimist(options.argv, {
    alias: {
      "api-key":     "apiKey"
      "smoke-test":  "smokeTest"
      "get-key":     "getKey"
      "new-key":     "generateKey"
      "run-project": "runProject"
    }
  })

  _.extend options, _.pick(argv, args...), {
    env: process.env["NODE_ENV"]
  }

  if options.coords
    options.coords = parseCoords(options.coords)

  if options.runProject
    options.projectPath = path.resolve(process.cwd(), options.runProject)

  if options.updating
    _.extend options,
      appPath:  options.argv[0]
      execPath: options.argv[1]

  if options.smokeTest
    options.pong = options.ping

  return options