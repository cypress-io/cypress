_        = require("lodash")
path     = require("path")
minimist = require("minimist")
coerce   = require("./coerce")
config   = require("../config")
cwd      = require("../cwd")

whitelist = "appPath execPath apiKey smokeTest getKey generateKey runProject project spec ci record updating ping key logs clearLogs returnPkg version mode autoOpen removeIds headed config exitWithCode hosts browser headless outputPath group groupId".split(" ")
whitelist = whitelist.concat(config.getConfigKeys())

parseNestedValues = (vals) ->
  ## convert foo=bar,version=1.2.3 to
  ## {foo: 'bar', version: '1.2.3'}
  _
  .chain(vals)
  .split(",")
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
        "clear-logs":  "clearLogs"
        "run-project": "runProject"
        "return-pkg":  "returnPkg"
        "auto-open":   "autoOpen"
        "env":         "environmentVariables"
        "headless":    "isTextTerminal"
        "exit-with-code":   "exitWithCode"
        "reporter-options": "reporterOptions"
        "output-path":      "outputPath"
        "group-id":         "groupId"
      }
    })

    whitelisted = _.pick(argv, whitelist...)

    options = _
    .chain(options)
    .defaults(whitelisted)
    .extend({env: process.env["CYPRESS_ENV"]})
    .mapValues(coerce)
    .value()

    ## if we are updating we may have to pluck out the
    ## appPath + execPath from the options._ because
    ## in previous versions up until 0.14.0 these args
    ## were not passed as dashes and instead were just
    ## regular arguments
    if options.updating and not options.appPath
      ## take the last two arguments that were unknown
      ## and apply them to both appPath + execPath
      [options.appPath, options.execPath] = options._.slice(-2)

    if hosts = options.hosts
      backup("hosts", options)
      options.hosts = parseNestedValues(hosts)

    if envs = options.environmentVariables
      backup("environmentVariables", options)
      options.environmentVariables = parseNestedValues(envs)

    if ro = options.reporterOptions
      backup("reporterOptions", options)
      options.reporterOptions = parseNestedValues(ro)

    if c = options.config
      backup("config", options)

      ## convert config to an object
      c = parseNestedValues(c)

      ## store the config
      options.config = c

      ## and pull up and flatten any whitelisted
      ## config directly into our options
      _.extend options, config.whitelist(c)

    ## normalize project to projectPath
    if p = options.project or options.runProject
      options.projectPath = path.resolve(cwd(), p)

    ## normalize output path from current working directory
    if op = options.outputPath
      options.outputPath = path.resolve(cwd(), op)

    if options.runProject
      options.run = true

    if options.smokeTest
      options.pong = options.ping

    return options

  toArray: (obj = {}) ->
    ## goes in reverse, takes an object
    ## and converts to an array by picking
    ## only the whitelisted properties and
    ## mapping them to include the argument
    _
    .chain(obj)
    .mapValues(anyUnderscoredValuePairs)
    .pick(whitelist...)
    .mapValues (val, key) ->
      "--#{key}=#{val}"
    .values()
    .value()
}
