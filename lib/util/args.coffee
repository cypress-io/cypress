_        = require("lodash")
path     = require("path")
minimist = require("minimist")
coerce   = require("./coerce")
config   = require("../config")
cwd      = require("../cwd")

whitelist = "appPath execPath apiKey smokeTest getKey generateKey runProject project spec ci updating ping coords key logs clearLogs returnPkg version mode autoOpen removeIds showHeadlessGui config exitWithCode".split(" ")
whitelist = whitelist.concat(config.getConfigKeys())

parseCoords = (coords) ->
  [x, y] = _.map(coords.split("x"), parseFloat)
  {x: x, y: y}

parseNestedValues = (vals) ->
  ## convert foo=bar,version=1.2.3 to
  ## {foo: 'bar', version: '1.2.3'}
  _(vals.split(","))
  .map (pair) ->
    pair.split("=")
  .fromPairs()
  .mapValues(coerce)
  .value()

backup = (key, options) ->
  options["_#{key}"] = options[key]

anyUnderscoredValuePairs = (val, key, obj) ->
  return v if v = obj["_#{key}"]
  return val

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
        "show-headless-gui":"showHeadlessGui"
        "exit-with-code": "exitWithCode"
      }
    })

    _.extend options, _.pick(argv, whitelist...), {
      env: process.env["CYPRESS_ENV"]
    }

    ## if we are updating we may have to pluck out the
    ## appPath + execPath from the options._ because
    ## in previous versions up until 0.14.0 these args
    ## were not passed as dashes and instead were just
    ## regular arguments
    if options.updating and not options.appPath
      ## take the last two arguments that were unknown
      ## and apply them to both appPath + execPath
      [options.appPath, options.execPath] = options._.slice(-2)

    if options.coords
      backup("coords", options)
      options.coords = parseCoords(options.coords)

    if envs = options.environmentVariables
      backup("environmentVariables", options)
      options.environmentVariables = parseNestedValues(envs)

    if c = options.config
      backup("config", options)

      ## convert config to an object
      c = parseNestedValues(c)

      ## store the config
      options.config = c

      ## and pull up and flatten any whitelisted
      ## config directly into our options
      _.extend options, config.whitelist(c)

    ## normalize runProject or project to projectPath
    if rp = options.runProject or p = options.project
      options.projectPath = path.resolve(cwd(), rp ? p)

    if options.smokeTest
      options.pong = options.ping

    return options

  toArray: (obj = {}) ->
    ## goes in reverse, takes an object
    ## and converts to an array by picking
    ## only the whitelisted properties and
    ## mapping them to include the argument
    _.chain(obj)
    .mapValues(anyUnderscoredValuePairs)
    .pick(whitelist...)
    .mapValues (val, key) ->
      "--#{key}=#{val}"
    .values()
    .value()
}