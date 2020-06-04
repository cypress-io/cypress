// process.env.SNAPSHOT_UPDATE = 1
const _ = require('lodash')
const sinon = require('sinon')
const Debug = require('debug')

const Reporter = require('../../lib/reporter')
const { spyOn, stdout } = require('../support/helpers/utils')
const { registerInMocha, parseSnapshot, stringifyShort } = require('../matchDeep')

const events = require('../../../runner/test/__snapshots__/runner.spec.js.snapshot')
const { EventSnapshots } = require('../../../runner/test/cypress/support/eventSnapshots')

require('../spec_helper.coffee')
registerInMocha()

const debug = Debug('spec:retries')
const { match } = sinon

const runnerEmitCleanseMap = {
  '^.*.1': stringifyShort,
  parent: stringifyShort,
}

// TODO: maybe refactor into utility, remove module.exports
/** @param {typeof EventSnapshots.FAIL_IN_AFTER} snapshotName */
function createReporter (snapshotName) {
  const getSnapshot = (snapshotName) => {
    return _.mapValues(snapshotName, (v) => parseSnapshot(events[v]))
  }

  const { setRunnables, mocha } = getSnapshot(snapshotName)

  const stdoutStub = stdout.capture()

  const reporter = Reporter()

  const currentReporter = reporter

  const runnables = parseSnapshot(setRunnables)[0][1]
  const mochaEvents = parseSnapshot(mocha)

  reporter.setRunnables(runnables)

  const stubs = {}

  const currentStubs = stubs

  stubs.reporterEmit = spyOn(reporter, 'emit', debug.extend('reporter:emit'))
  stubs.runnerEmit = spyOn(reporter.runner, 'emit', debug.extend('runner:emit'))

  _.each(mochaEvents, (event) => {
    reporter.emit(...event.slice(1, 3))
  })

  stdout.restore()
  const snapshot = (name) => {
    if (!name) throw new Error('snapshot name cannot be empty')

    expect(currentStubs.runnerEmit.args).to.matchSnapshot(runnerEmitCleanseMap, `${name} runner emit`)
    expect(currentReporter.results()).to.matchSnapshot({
      'reporterStats.end': match.date,
      'reporterStats.start': match.date,
      'reporterStats.duration': match.number,
    }, `${name} reporter results`)

    expect(stdoutStub.toString())

    expect(stdoutStub.toString())
    .matchSnapshot({ '^': (v) => v.replace(/\(\d+ms\)/g, '') }, `${name} stdout`)
  }

  return { stubs, reporter, snapshot }
}

describe('reporter retries', () => {
  afterEach(() => {
    stdout.restore()
  })

  it('simple single test', () => {
    const { snapshot } = createReporter(EventSnapshots.SIMPLE_SINGLE_TEST)

    snapshot('simple_single_test')
  })

  it('fail [afterEach]', () => {
    const { snapshot } = createReporter(EventSnapshots.FAIL_IN_AFTEREACH)

    snapshot('fail in [afterEach]')
  })

  it('fail [beforeEach]', () => {
    const { snapshot } = createReporter(EventSnapshots.FAIL_IN_BEFOREEACH)

    snapshot('fail in [beforeEach]')
  })
})
