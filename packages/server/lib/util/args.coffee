_        = require("lodash")
path     = require("path")
minimist = require("minimist")
coerce   = require("./coerce")
config   = require("../config")
cwd      = require("../cwd")

nestedObjectsInCurlyBracesRe = /\{(.+?)\}/g
nestedArraysInSquareBracketsRe = /\[(.+?)\]/g
everythingAfterFirstEqualRe = /=(.+)/

whitelist = "cwd appPath execPath apiKey smokeTest getKey generateKey runProject project spec reporter reporterOptions port env ci record updating ping key logs clearLogs returnPkg version mode headed config exit exitWithCode browser runMode outputPath parallel parallelId".split(" ")

# returns true if the given string has double quote character "
# only at the last position.
hasStrayEndQuote = (s) ->
  quoteAt = s.indexOf('"')
  quoteAt is s.length - 1

removeLastCharacter = (s) ->
  s.substr(0, s.length - 1)

normalizeBackslash = (s) ->
  if hasStrayEndQuote(s)
    removeLastCharacter(s)
  else
    s

normalizeBackslashes = (options) ->
  ## remove stray double quote from runProject and other path properties
  ## due to bug in NPM passing arguments with
  ## backslash at the end
  ## https://github.com/cypress-io/cypress/issues/535
  # these properties are paths and likely to have backslash on Windows
  pathProperties = ["runProject", "project", "appPath", "execPath"]

  pathProperties.forEach (property) ->
    if options[property]
      options[property] = normalizeBackslash(options[property])

  options

backup = (key, options) ->
  options["_#{key}"] = options[key]

anyUnderscoredValuePairs = (val, key, obj) ->
  return v if v = obj["_#{key}"]
  return val

strToArray = (str) ->
  [].concat(str.split(","))

commasForBars = (match, p1) ->
  ## swap out comma's for bars
  p1.split(",").join("|")

sanitizeAndConvertNestedArgs = (str) ->
  ## find foo={a=b,b=c} and bar=[1,2,3] syntax first
  ## and turn those into
  ## foo: a=b|b=c
  ## bar: 1|2|3

  _
  .chain(str)
  .replace(nestedObjectsInCurlyBracesRe, commasForBars)
  .replace(nestedArraysInSquareBracketsRe, commasForBars)
  .split(",")
  .map (pair) ->
    pair.split(everythingAfterFirstEqualRe)
  .fromPairs()
  .mapValues(coerce)
  .value()

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
        "get-key":     "getKey"
        "new-key":     "generateKey"
        "clear-logs":  "clearLogs"
        "run-project": "runProject"
        "return-pkg":  "returnPkg"
        "runMode":    "isTextTerminal"
        "exit-with-code":   "exitWithCode"
        "reporter-options": "reporterOptions"
        "output-path":      "outputPath"
      }
    })

    whitelisted = _.pick(argv, whitelist)

    options = _
    .chain(options)
    .defaults(whitelisted)
    .defaults({
      ## set in case we
      ## bypassed the cli
      cwd: process.cwd()
    })
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

    if spec = options.spec
      backup("spec", options)

      resolvePath = (p) ->
        path.resolve(options.cwd, p)

      options.spec = strToArray(spec).map(resolvePath)

    if envs = options.env
      backup("env", options)
      options.env = sanitizeAndConvertNestedArgs(envs)

    if ro = options.reporterOptions
      backup("reporterOptions", options)
      options.reporterOptions = sanitizeAndConvertNestedArgs(ro)

    if c = options.config
      backup("config", options)

      ## convert config to an object
      ## annd store the config
      options.config = sanitizeAndConvertNestedArgs(c)

    ## get a list of the available config keys
    configKeys = config.getConfigKeys()

    ## and if any of our options match this
    configValues = _.pick(options, configKeys)

    ## then set them on config
    ## this solves situations where we accept
    ## root level arguments which also can
    ## be set in configuration
    _.each configValues, (val, key) ->
      options.config ?= {}
      options.config[key] = val

    options = normalizeBackslashes(options)

    ## normalize project to projectRoot
    if p = options.project or options.runProject
      options.projectRoot = path.resolve(options.cwd, p)

    ## normalize output path from previous current working directory
    if op = options.outputPath
      options.outputPath = path.resolve(options.cwd, op)

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
