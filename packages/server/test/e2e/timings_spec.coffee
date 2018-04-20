_ = require("lodash")
path = require("path")
moment = require("moment")
snapshot = require("snap-shot-it")
fs = require("../../lib/util/fs")
e2e = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")

e2ePath = Fixtures.projectPath("e2e")

outputPath = path.join(e2ePath, "output.json")

STATIC_DATE = "2018-02-01T20:14:19.323Z"

specs = {
  "simple_passing_spec.coffee": 0
  "simple_hooks_spec.coffee": 0
  "simple_failing_spec.coffee": 2
  "simple_failing_hook_spec.coffee": 3
}

expectStartToBeBeforeEnd = (obj, start, end) ->
  s = _.get(obj, start)
  e = _.get(obj, end)

  expect(
    moment(s).isBefore(e),
    "expected start: #{s} to be before end: #{e}"
  ).to.be.true

  ## once valid, mutate and set static dates
  _.set(obj, start, STATIC_DATE)
  _.set(obj, end, STATIC_DATE)

expectDurationWithin = (obj, duration, low, high, reset) ->
  d = _.get(obj, duration)

  ## bail if we don't have a duration
  return if not _.isNumber(d)

  ## ensure the duration is within range
  expect(d).to.be.within(low, high)

  ## once valid, mutate and set static range
  _.set(obj, duration, reset)

normalizeTestTimings = (obj, timings) ->
  t = _.get(obj, timings)

  ## bail if we don't have any timings
  return if not t

  _.set obj, "timings", _.mapValues t, (val, key) ->
    switch key
      when "lifecycle"
        ## ensure that lifecycle is under 500ms
        expect(val, "lifecycle").to.be.within(0, 500)

        ## reset to 100
        return 100
      when "test"
        ## ensure test fn duration is within 1500ms
        expectDurationWithin(val, "fnDuration", 0, 1500, 400)
        ## ensure test after fn duration is within 500ms
        expectDurationWithin(val, "afterFnDuration", 0, 500, 200)

        return val
      else
        _.map val, (hook) ->
          ## ensure test fn duration is within 1500ms
          expectDurationWithin(hook, "fnDuration", 0, 1500, 400)
          ## ensure test after fn duration is within 500ms
          expectDurationWithin(hook, "afterFnDuration", 0, 500, 200)

          return hook

expectRunToHaveCorrectStats = (run) ->
  expectStartToBeBeforeEnd(run, "stats.start", "stats.end")
  expectStartToBeBeforeEnd(run, "reporterStats.start", "reporterStats.end")

  ## grab all the wallclock durations for all tests
  ## because our duration should be at least this
  wallClocks = _.sumBy(run.tests, "wallClockDuration")

  ## ensure each run's duration is around the sum
  ## of all tests wallclock duration
  expectDurationWithin(
    run,
    "stats.duration",
    wallClocks,
    wallClocks + 150, ## add 150ms to account for padding
    1234
  )

  expectDurationWithin(
    run,
    "reporterStats.duration",
    wallClocks,
    wallClocks + 150, ## add 150ms to account for padding
    1234
  )

  addFnAndAfterFn = (obj) ->
    ## add these two together
    obj.fnDuration + obj.afterFnDuration

  ## make sure we've added failingTests
  failingTests = _.filter(run.tests, { state: "failed" })

  if failingTests.length
    expect(run.failingTests).to.deep.eq(failingTests)

    ## now reset it
    run.failingTests = []
  else
    expect(run.failingTests).to.be.undefined

  ## now make sure that each tests wallclock duration
  ## is around the sum of all of its timings
  run.tests.forEach (test) ->
    ## cannot sum an object, must use array of values
    timings = _.sumBy _.values(test.timings), (val) ->
      switch
        when _.isArray(val)
          ## array for hooks
          _.sumBy(val, addFnAndAfterFn)
        when _.isObject(val)
          ## obj for test itself
          addFnAndAfterFn(val)
        else
          val

    expectDurationWithin(
      test,
      "wallClockDuration",
      timings,
      timings + 50, ## add 50ms to account for padding
      1234
    )

    ## now reset all the test timings
    normalizeTestTimings(test, "timings")

    ## normalize stack
    if test.stack
      test.stack = e2e.normalizeStdout(test.stack)

    if test.wallClockStart
      d = new Date(test.wallClockStart)
      expect(d.toJSON()).to.eq(test.wallClockStart)
      test.wallClockStart = STATIC_DATE

      expect(test.videoTimestamp).to.be.a("number")
      test.videoTimestamp = 9999

  ## normalize video path
  run.video = e2e.normalizeStdout(run.video)

  ## normalize screenshot dynamic props
  run.screenshots = _.map run.screenshots, (screenshot) ->
    expect(screenshot.clientId).to.be.a.uuid("v4")

    screenshot.clientId = "some-random-guid-number"
    screenshot.path = e2e.normalizeStdout(screenshot.path)
    screenshot

describe "e2e timings", ->
  e2e.setup()

  _.each specs, (exitCode, name) ->
    it name, ->
      e2e.exec(@, {
        spec: name
        outputPath: outputPath
        snapshot: true
        expectedExitCode: exitCode
      })
      .then ->
        ## now what we want to do is read in the outputPath
        ## and snapshot it so its what we expect after normalizing it
        fs.readJsonAsync(outputPath)
        .then (json) ->
          expect(json.runs).to.have.length(1)

          run = json.runs[0]

          ## TODO: temporary to match snapshots
          delete run.spec

          expectRunToHaveCorrectStats(run)

          snapshot(run)
