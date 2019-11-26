_     = require("lodash")
path  = require("path")
Mocha = require("mocha")
debug = require("debug")("cypress:server:reporter")
Promise = require("bluebird")

mochaReporters = require("mocha/lib/reporters")

STATS = "suites tests passes pending failures start end duration".split(" ")

if Mocha.Suite.prototype.titlePath
  throw new Error('Mocha.Suite.prototype.titlePath already exists. Please remove the monkeypatch code.')

Mocha.Suite.prototype.titlePath = ->
  result = []

  if @parent
    result = result.concat(@parent.titlePath())

  if !@root
    result.push(@title);

  return result

Mocha.Runnable.prototype.titlePath = ->
  @parent.titlePath().concat([@title])

getParentTitle = (runnable, titles) ->
  if not titles
    titles = [runnable.title]

  if p = runnable.parent
    if t = p.title
      titles.unshift(t)

    getParentTitle(p, titles)
  else
    titles

createSuite = (obj, parent) ->
  suite = new Mocha.Suite(obj.title, {})
  suite.parent = parent if parent
  # if obj.file
    # console.log('has file:', obj.file)
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
  runnable.state    = obj.state ? "skipped" ## skipped by default
  runnable.body     ?= body

  runnable.parent = parent if parent

  return runnable

mergeRunnable = (eventName) ->
  return (testProps, runnables) ->
    runnable = runnables[testProps.id]

    _.extend(runnable, testProps)

safelyMergeRunnable = (hookProps, runnables) ->
  { hookId, title, hookName, body, type } = hookProps

  if not runnable = runnables[hookId]
    runnables[hookId] = {
      hookId
      type
      title
      body
      hookName
    }

  _.extend({}, runnables[hookProps.id], hookProps)

mergeErr = (runnable, runnables, stats) ->
  ## this will always be a test because
  ## we reset hook id's to match tests
  test = runnables[runnable.id]
  test.err = runnable.err
  test.state = "failed"
  test.duration ?= test.duration

  if runnable.type is "hook"
    test.failedFromHookId = runnable.hookId

  ## dont mutate the test, and merge in the runnable title
  ## in the case its a hook so that we emit the right 'fail'
  ## event for reporters
  test = _.extend({}, test, { title: runnable.title })

  [test, test.err]

setDate = (obj, runnables, stats) ->
  if s = obj.start
    stats.wallClockStartedAt = new Date(s)

  if e = obj.end
    stats.wallClockEndedAt = new Date(e)

  return null

events = {
  "start":     setDate
  "end":       setDate
  "suite":     mergeRunnable("suite")
  "suite end": mergeRunnable("suite end")
  "test":      mergeRunnable("test")
  "test end":  mergeRunnable("test end")
  "hook":      safelyMergeRunnable
  "hook end":  safelyMergeRunnable
  "pass":      mergeRunnable("pass")
  "pending":   mergeRunnable("pending")
  "fail":      mergeErr
  "test:after:run": mergeRunnable("test:after:run") ## our own custom event
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

  setRunnables: (rootRunnable = {}) ->
    ## manage stats ourselves
    @stats = { suites: 0, tests: 0, passes: 0, pending: 0, skipped: 0, failures: 0 }
    @runnables = {}
    rootRunnable = @_createRunnable(rootRunnable, "suite")
    reporter = Reporter.loadReporter(@reporterName, @projectRoot)
    @mocha = new Mocha({reporter: reporter})
    @mocha.suite = rootRunnable
    @runner = new Mocha.Runner(rootRunnable)
    @reporter = new @mocha._reporter(@runner, {
      reporterOptions: @reporterOptions
    })

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

    runnable.id = runnableProps.id

    @runnables[runnableProps.id] = runnable
    return runnable

  emit: (event, args...) ->
    if args = @parseArgs(event, args)
      @runner?.emit.apply(@runner, args)

  parseArgs: (event, args) ->
    ## make sure this event is in our events hash
    if e = events[event]
      if _.isFunction(e)
        debug("got mocha event '%s' with args: %o", event, args)
        ## transform the arguments if
        ## there is an event.fn callback
        args = e.apply(@, args.concat(@runnables, @stats))

      [event].concat(args)

  normalizeHook: (hook = {}) ->
    {
      hookId: hook.hookId
      hookName: hook.hookName
      title:  getParentTitle(hook)
      body:   hook.body
    }

  normalizeTest: (test = {}) ->
    get = (prop) ->
      _.get(test, prop, null)

    ## use this or null
    if wcs = get("wallClockStartedAt")
      ## convert to actual date object
      wcs = new Date(wcs)

    ## wallClockDuration:
    ## this is the 'real' duration of wall clock time that the
    ## user 'felt' when the test run. it includes everything
    ## from hooks, to the test itself, to lifecycle, and event
    ## async browser compute time. this number is likely higher
    ## than summing the durations of the timings.
    ##
    {
      testId:         get("id")
      title:          getParentTitle(test)
      state:          get("state")
      body:           get("body")
      stack:          get("err.stack")
      error:          get("err.message")
      timings:        get("timings")
      failedFromHookId: get("failedFromHookId")
      wallClockStartedAt: wcs
      wallClockDuration: get("wallClockDuration")
      videoTimestamp: null ## always start this as null
    }

  end: ->
    if @reporter.done
      failures = @runner.failures

      new Promise (resolve, reject) =>
        @reporter.done(failures, resolve)
      .then =>
        @results()
    else
      @results()

  results: ->
    tests = _
    .chain(@runnables)
    .filter({type: "test"})
    .map(@normalizeTest)
    .value()

    hooks = _
    .chain(@runnables)
    .filter({type: "hook"})
    .map(@normalizeHook)
    .value()

    suites = _
    .chain(@runnables)
    .filter({root: false}) ## don't include root suite
    .value()

    ## default to 0
    @stats.wallClockDuration = 0

    { wallClockStartedAt, wallClockEndedAt } = @stats

    if wallClockStartedAt and wallClockEndedAt
      @stats.wallClockDuration = wallClockEndedAt - wallClockStartedAt

    @stats.suites = suites.length
    @stats.tests = tests.length
    @stats.passes = _.filter(tests, { state: "passed" }).length
    @stats.pending = _.filter(tests, { state: "pending" }).length
    @stats.skipped = _.filter(tests, { state: "skipped" }).length
    @stats.failures = _.filter(tests, { state: "failed" }).length

    ## return an object of results
    return {
      ## this is our own stats object
      stats: @stats

      reporter: @reporterName

      ## this comes from the reporter, not us
      reporterStats: @runner.stats

      hooks

      tests
    }

  @setVideoTimestamp = (videoStart, tests = []) ->
    _.map tests, (test) ->
      ## if we have a wallClockStartedAt
      if wcs = test.wallClockStartedAt
        test.videoTimestamp = test.wallClockStartedAt - videoStart
      test

  @create = (reporterName, reporterOptions, projectRoot) ->
    new Reporter(reporterName, reporterOptions, projectRoot)

  @loadReporter = (reporterName, projectRoot) ->
    debug("trying to load reporter:", reporterName)

    if r = reporters[reporterName]
      debug("#{reporterName} is built-in reporter")
      return require(r)

    if mochaReporters[reporterName]
      debug("#{reporterName} is Mocha reporter")
      return reporterName

    ## it's likely a custom reporter
    ## that is local (./custom-reporter.js)
    ## or one installed by the user through npm
    try
      p = path.resolve(projectRoot, reporterName)

      ## try local
      debug("trying to require local reporter with path:", p)

      ## using path.resolve() here so we can just pass an
      ## absolute path as the reporterName which avoids
      ## joining projectRoot unnecessarily
      return require(p)
    catch err
      if err.code isnt "MODULE_NOT_FOUND"
        ## bail early if the error wasn't MODULE_NOT_FOUND
        ## because that means theres something actually wrong
        ## with the found reporter
        throw err

      p = path.resolve(projectRoot, "node_modules", reporterName)

      ## try npm. if this fails, we're out of options, so let it throw
      debug("trying to require local reporter with path:", p)

      return require(p)

  @getSearchPathsForReporter = (reporterName, projectRoot) ->
    _.uniq([
      path.resolve(projectRoot, reporterName),
      path.resolve(projectRoot, "node_modules", reporterName)
    ])

module.exports = Reporter
