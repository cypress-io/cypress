const _ = require('lodash')
const path = require('path')
const moment = require('moment')
const snapshot = require('snap-shot-it')
const fs = require('../../lib/util/fs')
const e2e = require('../support/helpers/e2e').default
const Fixtures = require('../support/helpers/fixtures')

const e2ePath = Fixtures.projectPath('e2e')

const outputPath = path.join(e2ePath, 'output.json')

const STATIC_DATE = '2018-02-01T20:14:19.323Z'

const specs = [
  'simple_passing_spec.coffee',
  'simple_hooks_spec.coffee',
  'simple_failing_spec.coffee',
  'simple_failing_h*_spec.coffee', // simple failing hook spec
].join(',')

const expectStartToBeBeforeEnd = function (obj, start, end) {
  const s = _.get(obj, start)
  const e = _.get(obj, end)

  expect(
    moment(s).isBefore(e),
    `expected start: ${s} to be before end: ${e}`,
  ).to.be.true

  // once valid, mutate and set static dates
  _.set(obj, start, STATIC_DATE)

  return _.set(obj, end, STATIC_DATE)
}

const expectDurationWithin = function (obj, duration, low, high, reset) {
  const d = _.get(obj, duration)

  // bail if we don't have a duration
  if (!_.isNumber(d)) {
    return
  }

  // ensure the duration is within range
  expect(d, duration).to.be.within(low, high)

  // once valid, mutate and set static range
  return _.set(obj, duration, reset)
}

const normalizeTestTimings = function (obj, timings) {
  const t = _.get(obj, timings)

  // bail if we don't have any timings
  if (!t) {
    return
  }

  return _.set(obj, 'timings', _.mapValues(t, (val, key) => {
    switch (key) {
      case 'lifecycle':
        // ensure that lifecycle is under 500ms
        expect(val, 'lifecycle').to.be.within(0, 500)

        // reset to 100
        return 100
      case 'test':
        // ensure test fn duration is within 1500ms
        expectDurationWithin(val, 'fnDuration', 0, 1500, 400)
        // ensure test after fn duration is within 500ms
        expectDurationWithin(val, 'afterFnDuration', 0, 500, 200)

        return val
      default:
        return _.map(val, (hook) => {
          // ensure test fn duration is within 1500ms
          expectDurationWithin(hook, 'fnDuration', 0, 1500, 400)
          // ensure test after fn duration is within 500ms
          expectDurationWithin(hook, 'afterFnDuration', 0, 500, 200)

          return hook
        })
    }
  }))
}

const expectRunsToHaveCorrectStats = (runs = []) => {
  return runs.forEach((run) => {
    expectStartToBeBeforeEnd(run, 'stats.wallClockStartedAt', 'stats.wallClockEndedAt')
    expectStartToBeBeforeEnd(run, 'reporterStats.start', 'reporterStats.end')

    // grab all the wallclock durations for all test (and retried attempts)
    // because our duration should be at least this

    const attempts = _.flatMap(run.tests, (test) => test.attempts)

    const wallClocks = _.sumBy(attempts, 'wallClockDuration')

    // ensure each run's duration is around the sum
    // of all tests wallclock duration
    expectDurationWithin(
      run,
      'stats.wallClockDuration',
      wallClocks,
      wallClocks + 400, // add 400ms to account for padding
      1234,
    )

    expectDurationWithin(
      run,
      'reporterStats.duration',
      wallClocks,
      wallClocks + 400, // add 400ms to account for padding
      1234,
    )

    const addFnAndAfterFn = (obj) => {
      return obj.fnDuration + obj.afterFnDuration
    }

    run.spec.absolute = e2e.normalizeStdout(run.spec.absolute)

    _.each(run.tests, (test) => {
      if (test.displayError) {
        test.displayError = e2e.normalizeStdout(test.displayError)
      }
    })

    // now make sure that each tests wallclock duration
    // is around the sum of all of its timings
    attempts.forEach((attempt) => {
    // cannot sum an object, must use array of values
      const timings = _.sumBy(_.values(attempt.timings), (val) => {
        if (_.isArray(val)) {
        // array for hooks
          return _.sumBy(val, addFnAndAfterFn)
        }

        if (_.isObject(val)) {
        // obj for test itself
          return addFnAndAfterFn(val)
        }

        return val
      })

      expectDurationWithin(
        attempt,
        'wallClockDuration',
        timings,
        timings + 80, // add 80ms to account for padding
        1234,
      )

      // now reset all the test timings
      normalizeTestTimings(attempt, 'timings')

      // normalize stack
      if (attempt.error) {
        attempt.error.stack = e2e.normalizeStdout(attempt.error.stack).trim()
      }

      if (attempt.wallClockStartedAt) {
        const d = new Date(attempt.wallClockStartedAt)

        expect(d.toJSON()).to.eq(attempt.wallClockStartedAt)
        attempt.wallClockStartedAt = STATIC_DATE

        expect(attempt.videoTimestamp).to.be.a('number')
        attempt.videoTimestamp = 9999
      }
    })

    // normalize video path
    run.video = e2e.normalizeStdout(run.video)

    run.screenshots = _.map(run.screenshots, (screenshot) => {
      expect(screenshot.screenshotId).to.have.length('5')

      const d = new Date(screenshot.takenAt)

      expect(d.toJSON()).to.eq(screenshot.takenAt)
      screenshot.takenAt = STATIC_DATE

      screenshot.screenshotId = 'some-random-id'
      screenshot.path = e2e.normalizeStdout(screenshot.path)

      return screenshot
    })
  })
}

describe('e2e spec_isolation', () => {
  e2e.setup()

  e2e.it('fails', {
    spec: specs,
    outputPath,
    snapshot: false,
    expectedExitCode: 5,
    onRun (exec) {
      return exec()
      .then(() => {
        // now what we want to do is read in the outputPath
        // and snapshot it so its what we expect after normalizing it
        return fs.readJsonAsync(outputPath)
        .then((json) => {
        // ensure that config has been set
          expect(json.config).to.be.an('object')
          expect(json.config.projectName).to.eq('e2e')
          expect(json.config.projectRoot).to.eq(e2ePath)

          // but zero out config because it's too volatile
          json.config = {}

          expect(json.browserPath).to.be.a('string')
          expect(json.browserName).to.be.a('string')
          expect(json.browserVersion).to.be.a('string')
          expect(json.osName).to.be.a('string')
          expect(json.osVersion).to.be.a('string')
          expect(json.cypressVersion).to.be.a('string')

          _.extend(json, {
            browserPath: 'path/to/browser',
            browserName: 'FooBrowser',
            browserVersion: '88',
            osName: 'FooOS',
            osVersion: '1234',
            cypressVersion: '9.9.9',
          })

          // ensure the totals are accurate
          expect(json.totalTests).to.eq(
            _.sum([
              json.totalFailed,
              json.totalPassed,
              json.totalPending,
              json.totalSkipped,
            ]),
          )

          expectStartToBeBeforeEnd(json, 'startedTestsAt', 'endedTestsAt')

          // ensure totalDuration matches all of the stats durations
          expectDurationWithin(
            json,
            'totalDuration',
            _.sumBy(json.runs, 'stats.wallClockDuration'),
            _.sumBy(json.runs, 'stats.wallClockDuration'),
            5555,
          )

          // should be 4 total runs
          expect(json.runs).to.have.length(4)

          expectRunsToHaveCorrectStats(json.runs)

          return snapshot('e2e spec isolation fails', json, { allowSharedSnapshot: true })
        })
      })
    },
  })

  e2e.it('failing with retries enabled', {
    spec: 'simple_failing_hook_spec.coffee',
    outputPath,
    snapshot: true,
    expectedExitCode: 3,
    config: {
      retries: 1,
    },
    async onRun (execFn) {
      await execFn()
      const json = await fs.readJsonAsync(outputPath)

      expect(json.config).to.be.an('object')
      expect(json.config.projectName).to.eq('e2e')
      expect(json.config.projectRoot).to.eq(e2ePath)
      json.config = {}
      expect(json.browserPath).to.be.a('string')
      expect(json.browserName).to.be.a('string')
      expect(json.browserVersion).to.be.a('string')
      expect(json.osName).to.be.a('string')
      expect(json.osVersion).to.be.a('string')
      expect(json.cypressVersion).to.be.a('string')

      _.extend(json, {
        browserPath: 'path/to/browser',
        browserName: 'FooBrowser',
        browserVersion: '88',
        osName: 'FooOS',
        osVersion: '1234',
        cypressVersion: '9.9.9',
      })

      expect(json.totalTests).to.eq(_.sum([json.totalFailed, json.totalPassed, json.totalPending, json.totalSkipped]))
      expectStartToBeBeforeEnd(json, 'startedTestsAt', 'endedTestsAt')
      expectDurationWithin(json, 'totalDuration', _.sumBy(json.runs, 'stats.wallClockDuration'), _.sumBy(json.runs, 'stats.wallClockDuration'), 5555)
      expect(json.runs).to.have.length(1)
      expectRunsToHaveCorrectStats(json.runs)

      snapshot('failing with retries enabled', json)
    },
  })
})
