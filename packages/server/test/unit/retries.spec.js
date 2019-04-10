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

function createReporter ({ setRunnables, mocha }) {

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
    reporter.emit(...event.slice(1))
  })

  stdout.restore()

  return { stubs, reporter }
}

module.exports = {
  createReporter,
}

describe('reporter retries', () => {

  /**@type{sinon.SinonStub} */
  let console_log

  const snapshot = (name) => {
    if (!name) throw new Error('snapshot name cannot be empty')

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
    }, `${name} runnables`)
    expect(currentStubs.runnerEmit.args).to.matchSnapshot(runnerEmitCleanseMap, `${name} runner emit`)
    expect(currentReporter.results()).to.matchSnapshot({
      'reporterStats.end': match.date,
      'reporterStats.start': match.date,
      'reporterStats.duration': match.number,
    }, `${name} reporter results`)
  }

  beforeEach(function () {

    console_log = stdout.capture()

    // console_log = spyOn(process, 'stdout', debug.extend('console:log'))

    // console_log = spyOn(console, 'log', (...args) => {
    //   debug.extend('console:log')(...args)
    //   debugger

    //   if (_.isString(args && args[1]) && args[1].includes(currentTestTitle)) {
    //     return
    //   }

    //   return args.map(stripAnsi)
    // })
  })

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

    expect(console_log.toString())
    .matchSnapshot({ '^': (v) => v.replace(/\(\d+ms\)/g, '') }, 'retry [afterEach] stdout')

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

    expect(console_log.toString())
    .matchSnapshot(
      { '^': (v) => v.replace(/\(\d+ms\)/g, '') },
      'retry [beforeEach] stdout'
    )

    snapshot('retry [beforeEach]')

  })

})

const runnerEmitCleanseMap = {
  '^.*.1': stringifyShort,
  parent: stringifyShort,
}
