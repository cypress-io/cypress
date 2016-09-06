_     = require("lodash")
Mocha = require("mocha")
chalk = require("chalk")
path  = require("path")

STATS = "suites tests passes pending failures start end duration".split(" ")

createSuite = (obj, parent) ->
  suite = new Mocha.Suite(obj.title, {})
  suite.parent = parent if parent
  return suite

createRunnable = (obj, parent) ->
  runnable = new Mocha.Runnable(obj.title, ->)
  runnable.timedOut = obj.timedOut
  runnable.async    = obj.async
  runnable.sync     = obj.sync
  runnable.duration = obj.duration
  runnable.state    = obj.state

  runnable.parent = parent if parent

  return runnable

mergeRunnable = (testProps, runnables) ->
  _.extend(runnables[testProps.id], testProps)

createHook = (props, runnables) ->
  createRunnable(props, runnables[props.id])

createErr = (test, runnables) ->
  [createRunnable(test, runnables[test.id]), test.err]

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
  "fail":      createErr
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

    if r = reporters[@reporterName]
      reporter = require(r)
    else
      reporter = @reporterName

    if @reporterName is "junit"
      reporterOptions.mochaFile = reporterOptions.mochaFile or "{{projectRoot}}/test-result.xml"

    ## any reporter option could be a path, which we need to ensure is rooted
    ## in the project, so we have the user prepend {{projectRoot}} to any
    ## paths in the reporter options
    _.each reporterOptions, (value, key) ->
      if _.isString(value)
        reporterOptions[key] = value.replace("{{projectRoot}}", projectRoot)

    @mocha    = new Mocha({reporter: reporter})
    @runner   = new Mocha.Runner(@mocha.suite)
    @reporter = new @mocha._reporter(@runner, {reporterOptions})

    @runnables = {}

    @runner.ignoreLeaks = true

  setRunnables: (rootRunnable) =>
    @_createRunnable(rootRunnable, "suite")

  _createRunnable: (runnableProps, type, parent) =>
    runnable = if type is "suite"
      suite = createSuite(runnableProps, parent)
      suite.suites = _.map runnableProps.suites, (suiteProps) =>
        @_createRunnable(suiteProps, "suite", suite)
      suite.tests = _.map runnableProps.tests, (testProps) =>
        @_createRunnable(testProps, "test", suite)
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
