import systemTests from './system-tests'
import dayjs from 'dayjs'
import _ from 'lodash'

const STATIC_DATE = '2018-02-01T20:14:19.323Z'

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

const expectStartToBeBeforeEnd = function (obj, start, end) {
  const s = _.get(obj, start)
  const e = _.get(obj, end)

  expect(
    dayjs(s).isBefore(e),
    `expected start: ${s} to be before end: ${e}`,
  ).to.be.true

  // once valid, mutate and set static dates
  _.set(obj, start, STATIC_DATE)

  return _.set(obj, end, STATIC_DATE)
}

export const expectRunsToHaveCorrectTimings = (runs = []) => {
  runs.forEach((run) => {
    expect(run.config).to.not.exist
    expectStartToBeBeforeEnd(run, 'stats.wallClockStartedAt', 'stats.wallClockEndedAt')
    expectStartToBeBeforeEnd(run, 'reporterStats.start', 'reporterStats.end')

    // grab all the durations for all tests
    // because our duration should be at least this
    const wallClocks = _.sumBy(run.tests, 'duration')

    // ensure each run's duration is around the sum
    // of all tests wallclock duration

    // TODO: if this remains flaky, increase padding here
    // and add an additional non-e2e performance test with baseline p95
    expectDurationWithin(
      run,
      'stats.duration',
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

    _.each(run.tests, (test) => {
      try {
        if (test.displayError) {
          test.displayError = systemTests.normalizeStdout(test.displayError)
        }
      } catch (e) {
        e.message = `Error during validation for test \n${e.message}`
        throw e
      }

      test.duration = 1234
    })

    run.screenshots = _.map(run.screenshots, (screenshot) => {
      expect(screenshot.screenshotId).to.have.length(5)
      screenshot.screenshotId = 'some-random-id'

      const d = new Date(screenshot.takenAt)

      expect(d.toJSON()).to.eq(screenshot.takenAt)
      screenshot.takenAt = STATIC_DATE

      return screenshot
    })
  })
}

export const expectCorrectModuleApiResult = (json, opts: {
  e2ePath: string
  runs: number
  video: boolean
}) => {
  if (opts.video == null) {
    opts.video = true
  }

  // should be n runs
  expect(json.runs).to.have.length(opts.runs)

  // ensure that config has been set
  expect(json.config).to.be.an('object')
  expect(json.config.projectName).to.eq('e2e')
  expect(json.config.projectRoot).to.eq(opts.e2ePath)

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

  // ensure totalDuration matches all of the stats durations
  expectDurationWithin(
    json,
    'totalDuration',
    _.sumBy(json.runs, 'stats.duration'),
    _.sumBy(json.runs, 'stats.duration'),
    5555,
  )

  expectStartToBeBeforeEnd(json, 'startedTestsAt', 'endedTestsAt')

  json.runs.forEach((run) => {
    console.log(run)

    expectStartToBeBeforeEnd(run, 'stats.start', 'stats.end')
    expectStartToBeBeforeEnd(run, 'reporterStats.start', 'reporterStats.end')

    const wallClocks = _.sumBy(run.tests, 'duration')

    // ensure each run's duration is around the sum
    // of all tests wallclock duration
    expectDurationWithin(
      run,
      'stats.duration',
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

    run.spec.absolute = systemTests.normalizeStdout(run.spec.absolute)

    _.each(run.tests, (test) => {
      if (test.displayError) {
        test.displayError = systemTests.normalizeStdout(test.displayError)
      }
    })

    if (opts.video) {
      // normalize video path
      run.video = systemTests.normalizeStdout(run.video)
    }

    run.screenshots.forEach((screenshot) => {
      const d = new Date(screenshot.takenAt)

      expect(d.toJSON()).to.eq(screenshot.takenAt)
      screenshot.takenAt = STATIC_DATE

      screenshot.path = systemTests.normalizeStdout(screenshot.path)
    })
  })
}
