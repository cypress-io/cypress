import systemTests from './system-tests'
import dayjs from 'dayjs'

const STATIC_DATE = '2018-02-01T20:14:19.323Z'

function getPath (obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => acc?.[key], obj)
}

function setPath (obj: any, path: string, value: any): any {
  const keys = path.split('.')
  let current = obj

  for (let i = 0; i < keys.length - 1; i++) {
    current = current[keys[i]]
  }

  current[keys[keys.length - 1]] = value

  return obj
}

const expectDurationWithin = function (obj: object, duration: string, low: number, high: number, reset: number) {
  const d: number | undefined = getPath(obj, duration)

  // bail if we don't have a duration
  if (typeof d !== 'number') {
    return
  }

  // ensure the duration is within range
  expect(d, duration).to.be.within(low, high)

  // once valid, mutate and set static range
  return setPath(obj, duration, reset)
}

const expectStartToBeBeforeEnd = function (obj, start, end) {
  const s = getPath(obj, start)
  const e = getPath(obj, end)

  expect(
    dayjs(s).isBefore(e),
    `expected start: ${s} to be before end: ${e}`,
  ).to.be.true

  // once valid, mutate and set static dates
  setPath(obj, start, STATIC_DATE)

  return setPath(obj, end, STATIC_DATE)
}

const normalizeTestTimings = function (obj, timings) {
  const t = getPath(obj, timings)

  // bail if we don't have any timings
  if (!t) {
    return
  }

  const mapped = Object.fromEntries(Object.entries(t).map(([key, val]: [string, any]) => {
    switch (key) {
      case 'lifecycle':
        // ensure that lifecycle is under 500ms
        expect(val, 'lifecycle').to.be.within(0, 500)

        // reset to 100
        return [key, 100]
      case 'test':
        // ensure test fn duration is within 2000ms
        expectDurationWithin(val, 'fnDuration', 0, 2000, 400)
        // ensure test after fn duration is within 500ms
        expectDurationWithin(val, 'afterFnDuration', 0, 500, 200)

        return [key, val]
      default:
        return [key, (val as any[]).map((hook) => {
          // ensure test fn duration is within 1500ms
          expectDurationWithin(hook, 'fnDuration', 0, 1500, 400)
          // ensure test after fn duration is within 500ms
          expectDurationWithin(hook, 'afterFnDuration', 0, 500, 200)

          return hook
        })]
    }
  }))

  setPath(obj, 'timings', mapped)
}

export const expectRunsToHaveCorrectTimings = (runs = []) => {
  runs.forEach((run) => {
    expect(run.config).to.not.exist
    expectStartToBeBeforeEnd(run, 'stats.wallClockStartedAt', 'stats.wallClockEndedAt')
    expectStartToBeBeforeEnd(run, 'reporterStats.start', 'reporterStats.end')

    // grab all the wallclock durations for all test (and retried attempts)
    // because our duration should be at least this

    const attempts = run.tests.flatMap((test) => test.attempts)

    const wallClocks = attempts.reduce((sum, a) => sum + (a.wallClockDuration || 0), 0)

    // ensure each run's duration is around the sum
    // of all tests wallclock duration

    // TODO: if this remains flaky, increase padding here
    // and add an additional non-e2e performance test with baseline p95
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

    run.tests.forEach((test) => {
      try {
        if (test.displayError) {
          test.displayError = systemTests.normalizeStdout(test.displayError)
        }

        const attempts = test.attempts

        // now make sure that each tests wallclock duration
        // is around the sum of all of its timings
        attempts.forEach((attempt) => {
          if (attempt.error) {
            attempt.error.stack = systemTests.normalizeStdout(attempt.error.stack).trim()
          }

          // cannot sum an object, must use array of values
          const timings = Object.values(attempt.timings).reduce((sum: number, val: any) => {
            if (Array.isArray(val)) {
              // array for hooks
              return sum + val.reduce((s, v) => s + addFnAndAfterFn(v), 0)
            }

            if (val !== null && typeof val === 'object') {
              // obj for test itself
              return sum + addFnAndAfterFn(val)
            }

            return sum + val
          }, 0)

          expectDurationWithin(
            attempt,
            'wallClockDuration',
            timings,
            timings + 80, // add 80ms to account for padding
            1234,
          )

          // now reset all the test timings
          normalizeTestTimings(attempt, 'timings')

          if (attempt.wallClockStartedAt) {
            const d = new Date(attempt.wallClockStartedAt)

            expect(d.toJSON()).to.eq(attempt.wallClockStartedAt)
            attempt.wallClockStartedAt = STATIC_DATE

            expect(attempt.videoTimestamp).to.be.a('number')
            attempt.videoTimestamp = 9999
          }
        })
      } catch (e) {
        e.message = `Error during validation for test \n${e.message}`
        throw e
      }
    })

    run.screenshots = run.screenshots.map((screenshot) => {
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

  Object.assign(json, {
    browserPath: 'path/to/browser',
    browserName: 'FooBrowser',
    browserVersion: '88',
    osName: 'FooOS',
    osVersion: '1234',
    cypressVersion: '9.9.9',
  })

  // ensure the totals are accurate
  expect(json.totalTests).to.eq(
    json.totalFailed + json.totalPassed + json.totalPending + json.totalSkipped,
  )

  // ensure totalDuration matches all of the stats durations
  expectDurationWithin(
    json,
    'totalDuration',
    json.runs.reduce((sum, r) => sum + (r.stats.duration || 0), 0),
    json.runs.reduce((sum, r) => sum + (r.stats.duration || 0), 0),
    5555,
  )

  expectStartToBeBeforeEnd(json, 'startedTestsAt', 'endedTestsAt')

  json.runs.forEach((run) => {
    expectStartToBeBeforeEnd(run, 'stats.startedAt', 'stats.endedAt')
    expectStartToBeBeforeEnd(run, 'reporterStats.start', 'reporterStats.end')

    const wallClocks = run.tests.reduce((sum, t) => sum + (t.duration || 0), 0)

    // ensure each run's duration is around the sum
    // of all tests wallclock duration
    expectDurationWithin(
      run,
      'stats.duration',
      wallClocks,
      wallClocks + 1000, // add 600ms to account for padding
      1234,
    )

    expectDurationWithin(
      run,
      'reporterStats.duration',
      wallClocks - 100,
      wallClocks + 1000, // add 600ms to account for padding
      1234,
    )

    run.spec.absolute = systemTests.normalizeStdout(run.spec.absolute)

    run.tests.forEach((test) => {
      if (test.displayError) {
        test.displayError = systemTests.normalizeStdout(test.displayError)
      }

      test.duration = 1234
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
