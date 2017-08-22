_     = require("lodash")
Mocha = require("mocha")
chalk = require("chalk")
path  = require("path")
log   = require("./log")

mochaReporters = require("mocha/lib/reporters")

STATS = "suites tests passes pending failures start end duration".split(" ")

createSuite = (obj, parent) ->
  suite = new Mocha.Suite(obj.title, {})
  suite.parent = parent if parent
  if obj.file
    console.log('has file:', obj.file)
  suite.file = obj.file
  return suite

createRunnable = (obj, parent) ->
  {body} = obj

  if body
    fn = ->
    fn.toString = -> body

  runnable = new Mocha.Test(obj.title, fn)
  runnable.timedOut = obj.timedOut
  runnable.async    = obj.async
  runnable.sync     = obj.sync
  runnable.duration = obj.duration
  runnable.state    = obj.state
  runnable.body     ?= body

  runnable.parent = parent if parent

  return runnable

mergeRunnable = (testProps, runnables) ->
  runnable = runnables[testProps.id]

  if not runnable.started
    testProps.started = Date.now()

  _.extend(runnable, testProps)

safelyMergeRunnable = (testProps, runnables) ->
  _.extend({}, runnables[testProps.id], testProps)

mergeErr = (test, runnables) ->
  runnable = runnables[test.id]
  runnable.err = test.err
  runnable.state = "failed"
  runnable.duration ?= test.duration
  runnable = _.extend({}, runnable, {title: test.title})
  [runnable, test.err]

events = {
  "start":     true
  "end":       true
  "suite":     mergeRunnable
  "suite end": mergeRunnable
  "test":      mergeRunnable
  "test end":  mergeRunnable
  "hook":      safelyMergeRunnable
  "hook end":  safelyMergeRunnable
  "pass":      mergeRunnable
  "pending":   mergeRunnable
  "fail":      mergeErr
}

reporters = {
  teamcity: "@cypress/mocha-teamcity-reporter"
  junit: "mocha-junit-reporter"
}

class Reporter
  constructor: (reporterName = "spec", reporterOptions = {}, projectRoot) ->
    if not (@ instanceof Reporter)
      return new Reporter(reporterName)

    @reporterName = reporterName
    @projectRoot = projectRoot
    @reporterOptions = reporterOptions

  setRunnables: (rootRunnable = {}) ->
    @runnables = {}
    rootRunnable = @_createRunnable(rootRunnable, "suite")
    reporter = Reporter.loadReporter(@reporterName, @projectRoot)
    @mocha = new Mocha({reporter: reporter})
    @mocha.suite = rootRunnable
    @runner = new Mocha.Runner(rootRunnable)
    @reporter = new @mocha._reporter(@runner, {reporterOptions: @reporterOptions})

    @runner.ignoreLeaks = true

  _createRunnable: (runnableProps, type, parent) ->
    runnable = switch type
      when "suite"
        suite = createSuite(runnableProps, parent)
        suite.tests = _.map runnableProps.tests, (testProps) =>
          @_createRunnable(testProps, "test", suite)
        suite.suites = _.map runnableProps.suites, (suiteProps) =>
          @_createRunnable(suiteProps, "suite", suite)
        suite
      when "test"
        createRunnable(runnableProps, parent)
      else
        throw new Error("Unknown runnable type: '#{type}'")

    @runnables[runnableProps.id] = runnable
    return runnable

  emit: (event, args...) ->
    if args = @parseArgs(event, args)
      @runner?.emit.apply(@runner, args)

  parseArgs: (event, args) ->
    ## make sure this event is in our events hash
    if e = events[event]
      if _.isFunction(e)
        ## transform the arguments if
        ## there is an event.fn callback
        args = e.apply(@, args.concat(@runnables))

      [event].concat(args)

  normalize: (test = {}) ->
    getParentTitle = (runnable, titles) ->
      if p = runnable.parent
        if t = p.title
          titles.unshift(t)

        getParentTitle(p, titles)
      else
        titles

    err = test.err ? {}

    titles = [test.title]

    ## TODO: move the separator into some shared util function somewhere

    {
      clientId:       test.id
      title:          getParentTitle(test, titles).join(" /// ")
      duration:       test.duration
      stack:          err.stack
      error:          err.message
      started:        test.started
      # videoTimestamp: test.started - videoStart
    }

  stats: ->
    failingTests = _
    .chain(@runnables)
    .filter({state: "failed"})
    .map(@normalize)
    .value()

    stats = if @reporter then @reporter.stats else {}

    _.extend {reporter: @reporterName, failingTests: failingTests}, _.pick(stats, STATS)

  @setVideoTimestamp = (videoStart, tests = []) ->
    _.map tests, (test) ->
      test.videoTimestamp = test.started - videoStart
      test

  @create = (reporterName, reporterOptions, projectRoot) ->
    new Reporter(reporterName, reporterOptions, projectRoot)

  @loadReporter = (reporterName, projectRoot) ->
    log("loading reporter #{reporterName}")
    if r = reporters[reporterName]
      log("#{reporterName} is built-in reporter")
      return require(r)

    if mochaReporters[reporterName]
      log("#{reporterName} is Mocha reporter")
      return reporterName

    ## it's likely a custom reporter
    ## that is local (./custom-reporter.js)
    ## or one installed by the user through npm
    try
      ## try local
      log("loading local reporter by name #{reporterName}")
      return require(path.join(projectRoot, reporterName))
    catch err
      ## try npm. if this fails, we're out of options, so let it throw
      log("loading NPM reporter module #{reporterName} from #{projectRoot}")
      try
        return require(path.join(projectRoot, "node_modules", reporterName))
      catch err
        msg = "Could not find reporter module #{reporterName} relative to #{projectRoot}"
        throw new Error(msg)

  @isValidReporterName = (reporterName, projectRoot) ->
    try
      Reporter.loadReporter(reporterName, projectRoot)
      log("reporter #{reporterName} is valid name")
      true
    catch
      false

module.exports = Reporter
