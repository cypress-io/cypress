// process.env.SNAPSHOT_UPDATE = 1
require('../spec_helper.coffee')
const Reporter = require('../../lib/reporter')
const _ = require('lodash')
const sinon = require('sinon')
const Debug = require('debug')
const debug = Debug('spec:retries')
const { spyOn, stdout } = require('../support/helpers/utils')
const { registerInMocha, parseSnapshot, stringifyShort } = require('../matchDeep')

registerInMocha()

const { match } = sinon

const events = [require('../../../runner/test/__snapshots__/runner.spec.js.snapshot'), require('../../../runner/test/__snapshots__/retries.spec.js.snapshot')]

const { EventSnapshots } = require('../../../runner/test/cypress/support/eventSnapshots')

let currentReporter
let currentStubs

/** @param {keyof typeof EventSnapshots} snapshotName */
const getSnapshot = (snapshotName) => {
  const ret = _.mapValues(EventSnapshots[snapshotName], (v) => {
    const snapfile = events.find((e) => e[v])

    if (!snapfile) throw new Error(`failed to get snapshot: ${snapshotName}`)

    const esnapshot = snapfile[v]

    return parseSnapshot(esnapshot)
  })

  return ret
}

let stdoutStub

function createReporter ({ setRunnables, mocha }) {
  stdoutStub = stdout.capture()

  const reporter = Reporter()

  currentReporter = reporter

  const runnables = parseSnapshot(setRunnables)[0][1]
  const mochaEvents = parseSnapshot(mocha)

  // const runnables = setRunnables[0][1]

  reporter.setRunnables(runnables)

  const stubs = {}

  currentStubs = stubs

  stubs.reporterEmit = spyOn(reporter, 'emit', debug.extend('reporter:emit'))
  stubs.runnerEmit = spyOn(reporter.runner, 'emit', debug.extend('runner:emit'))

  _.each(mochaEvents, (event) => {
    reporter.emit(...event.slice(1, 3))
  })

  stdout.restore()

  return { stubs, reporter }
}

module.exports = {
  createReporter,
}

function snapshot (name) {
  if (!name) throw new Error('snapshot name cannot be empty')

  expect(currentStubs.runnerEmit.args).to.matchSnapshot(runnerEmitCleanseMap, `${name} - runner emit`)
  expect(currentReporter.results()).to.matchSnapshot({
    'reporterStats.end': match.date,
    'reporterStats.start': match.date,
    'reporterStats.duration': match.number,
    '^.tests.*.prevAttempts.*.wallClockDuration': match.number,
  }, `${name} - reporter results`)

  expect(stdoutStub.toString())

  expect(stdoutStub.toString())
  .matchSnapshot({ '^': (v) => v.replace(/\(\d+ms\)/g, '') }, `${name} - stdout`)
}

describe('server/lib/reporter', () => {
  afterEach(() => {
    stdout.restore()
  })

  it('simple single test', () => {
    createReporter(getSnapshot('SIMPLE_SINGLE_TEST'))
    snapshot('simple_single_test')
  })

  it('fail [afterEach]', () => {
    createReporter(getSnapshot('FAIL_IN_AFTEREACH'))

    snapshot('fail in [afterEach]')
  })

  it('fail [beforeEach]', () => {
    createReporter(getSnapshot('FAIL_IN_BEFOREEACH'))

    snapshot('fail in [beforeEach]')
  })

  describe('retries', () => {
    it('print attempt info in yellow', () => {
      createReporter(getSnapshot('RETRY_PASS_IN_TEST'))

      const results = currentReporter.results()

      const prevAttempts = expect(results.tests).property('0').property('prevAttempts')

      prevAttempts.is.an('array')
      prevAttempts.property('0').not.property('title')

      snapshot('retry before passing in test')
    })
  })
})

const runnerEmitCleanseMap = {
  '^.*.1': stringifyShort,
  parent: stringifyShort,
}
