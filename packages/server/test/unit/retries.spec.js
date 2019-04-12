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

const events = require('../../../driver/test/__snapshots__/runner.spec.js.snapshot')
const { EventSnapshots } = require('../../../driver/test/cypress/integration/cypress/eventSnapshots')

let currentReporter
let currentStubs

/** @param {typeof EventSnapshots.FAIL_IN_AFTER} snapshotName */
const getSnapshot = (snapshotName) => {
  return _.mapValues(snapshotName, (v) => parseSnapshot(events[v]))
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

describe('reporter retries', () => {

  const snapshot = (name) => {
    if (!name) throw new Error('snapshot name cannot be empty')

    /*
      expect(currentReporter.runnables).to.matchSnapshot({
        parent: stringifyShort,
        'addListener': undefined,
        'clearTimeout': undefined,
        'clone': undefined,
        'currentRetry': undefined,
        'emit': undefined,
        'enableTimeouts': undefined,
        'eventNames': undefined,
        'fullTitle': undefined,
        'getMaxListeners': undefined,
        'globals': undefined,
        'inspect': undefined,
        'listenerCount': undefined,
        'listeners': undefined,
        'on': undefined,
        'once': undefined,
        'prependListener': undefined,
        'prependOnceListener': undefined,
        'removeAllListeners': undefined,
        'removeListener': undefined,
        'resetTimeout': undefined,
        'retries': undefined,
        'run': undefined,
        'setMaxListeners': undefined,
        'skip': undefined,
        'slow': undefined,
        'timeout': undefined,
        'titlePath': undefined,
        'addSuite': undefined,
        'addTest': undefined,
        'afterAll': undefined,
        'afterEach': undefined,
        'bail': undefined,
        'beforeAll': undefined,
        'beforeEach': undefined,
        'eachTest': undefined,
        'total': undefined,
        'speed': undefined,
      }, `${name} runnables`)
    */
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

  afterEach(() => {
    stdout.restore()
  })

  it('simple single test', () => {

    createReporter(getSnapshot(EventSnapshots.SIMPLE_SINGLE_TEST))
    snapshot('simple_single_test')

  })

  it('three tests with retry', () => {
    const { reporter } = createReporter(getSnapshot(EventSnapshots.THREE_TESTS_WITH_RETRY))

    expect(reporter.runnables.r4).to.matchDeep({ parent: stringifyShort }, {
      _currentRetry: 2,
      _retries: 2,
      state: 'passed',
      prevAttempts: [
        {
          _currentRetry: 0,
          state: 'failed',
        },
        {
          _currentRetry: 1,
          state: 'failed',
        },
      ],
    })

    snapshot('three tests with retry')
  })

  it('retry [afterEach]', () => {
    const { reporter } = createReporter(getSnapshot(EventSnapshots.RETRY_PASS_IN_AFTEREACH))

    expect(reporter.runnables)
    .matchDeep({ parent: stringifyShort }, {
      r3: {
        _currentRetry: 1,
        _retries: 2,
        state: 'passed',
        prevAttempts: [
          {
            _currentRetry: 0,
            state: 'failed',
            failedFromHookId: match.string,
          },
        ],
      },
    })

    // make sure duplicated props are not sent on prevAttempts
    expect(reporter.results().tests[0]).to.matchDeep({
      prevAttempts: [
        {
          testId: undefined,
          body: undefined,
          title: undefined,
          prevAttempts: undefined,
        },
      ],
    })

    snapshot('retry [afterEach]')

  })

  it('retry [beforeEach]', () => {
    const { reporter } = createReporter(getSnapshot(EventSnapshots.RETRY_PASS_IN_BEFOREEACH))

    expect(reporter.runnables).matchDeep({ parent: stringifyShort }, {
      r3: {
        _currentRetry: 1,
        _retries: 1,
        state: 'passed',
        prevAttempts: [
          {
            _currentRetry: 0,
            state: 'failed',
            failedFromHookId: match.string,
          },
        ],
      },
    })

    // make sure duplicated props are not sent on prevAttempts
    expect(reporter.results().tests[0]).to.matchDeep({
      prevAttempts: [
        {
          testId: undefined,
          body: undefined,
          title: undefined,
          prevAttempts: undefined,
        },
      ],
    })

    snapshot('retry [beforeEach]')

  })

  it('fail [afterEach]', () => {
    createReporter(getSnapshot(EventSnapshots.FAIL_IN_AFTEREACH))

    snapshot('fail in [afterEach]')
  })
  it('fail [beforeEach]', () => {
    createReporter(getSnapshot(EventSnapshots.FAIL_IN_BEFOREEACH))

    snapshot('fail in [beforeEach]')
  })

})

const runnerEmitCleanseMap = {
  '^.*.1': stringifyShort,
  parent: stringifyShort,
}
