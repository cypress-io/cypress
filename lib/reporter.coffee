_     = require("lodash")
Mocha = require("mocha")
chalk = require("chalk")
path  = require("path")

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
  _.extend(runnables[testProps.id], testProps)

createHook = (props, runnables) ->
  createRunnable(props, runnables[props.id])

mergeErr = (test, runnables) ->
  runnable = runnables[test.id]
  runnable.err = test.err
  [runnable, test.err]

events = {
  "start":     true
  "end":       true
  "suite":     mergeRunnable
  "suite end": mergeRunnable
  "test":      mergeRunnable
  "test end":  mergeRunnable
  "hook":      createHook
  "hook end":  createHook
  "pass":      mergeRunnable
  "pending":   mergeRunnable
  "fail":      mergeErr
}

reporters = {
  teamcity: "mocha-teamcity-reporter"
  junit: "mocha-junit-reporter"
}

class Reporter
  constructor: (reporterName = "spec", reporterOptions = {}, projectRoot) ->
    if not (@ instanceof Reporter)
      return new Reporter(reporterName)

    @reporterName = reporterName
    @projectRoot = projectRoot
    @reporterOptions = reporterOptions

  setRunnables: (rootRunnable) =>
    @runnables = {}
    rootRunnable = @_createRunnable(rootRunnable, "suite")

    if r = reporters[@reporterName]
      reporter = require(r)
    else if r = mochaReporters[@reporterName]
      reporter = @reporterName
    else
      ## it's likely a custom reporter
      ## that is local (./custom-reporter.js)
      ## or one installed by the user through npm
      try
        ## try local
        reporter = require(path.join(@projectRoot, @reporterName))
      catch err
        ## try npm. if this fails, we're out of options, so let it throw
        reporter = require(path.join(@projectRoot, "node_modules", @reporterName))

    @mocha = new Mocha({reporter: reporter})
    @mocha.suite = rootRunnable
    @runner = new Mocha.Runner(rootRunnable)
    @reporter = new @mocha._reporter(@runner, {reporterOptions: @reporterOptions})

    @runner.ignoreLeaks = true

  _createRunnable: (runnableProps, type, parent) =>
    runnable = if type is "suite"
      suite = createSuite(runnableProps, parent)
      suite.tests = _.map runnableProps.tests, (testProps) =>
        @_createRunnable(testProps, "test", suite)
      suite.suites = _.map runnableProps.suites, (suiteProps) =>
        @_createRunnable(suiteProps, "suite", suite)
      suite
    else
      createRunnable(runnableProps, parent)

    @runnables[runnableProps.id] = runnable
    return runnable

  emit: (event, args...) ->
    if args = @parseArgs(event, args)
      @runner.emit.apply(@runner, args)

  parseArgs: (event, args) ->
    ## make sure this event is in our events hash
    if e = events[event]
      if _.isFunction(e)
        ## transform the arguments if
        ## there is an event.fn callback
        args = e.apply(@, args.concat(@runnables))

      [event].concat(args)

  stats: ->
    _.extend {reporter: @reporterName}, _.pick(@reporter.stats, STATS)

  @create = (reporterName, reporterOptions, projectRoot) ->
    new Reporter(reporterName, reporterOptions, projectRoot)

module.exports = Reporter
