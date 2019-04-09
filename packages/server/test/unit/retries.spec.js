require('../spec_helper.coffee')
const Reporter = require('../../lib/reporter')
const _ = require('lodash')
const sinon = require('sinon')
const Debug = require('debug')
const debug = Debug('spec:retries')
// const snapshot = require('snap-shot-it')
const matchDeep = require('../matchDeep')
const stripAnsi = require('strip-ansi')

matchDeep.registerInMocha()

// process.env.SNAPSHOT_UPDATE = 1
// Debug.enable('spec:retries:console*')
Debug.enable('plugin:snapshot')

const { match } = sinon

const events = require('../../../driver/test/__snapshots__/runner.spec.js.snapshot')
const { EventSnapshots } = require('../../../driver/test/cypress/integration/cypress/eventSnapshots')

/** @param {typeof EventSnapshots.FAIL_IN_AFTER} snapshotName */
const getSnapshot = (snapshotName) => {
  return _.mapValues(snapshotName, (v) => parseSnapshot(events[v]))
}

function createReporter ({ setRunnables, mocha }) {

  const reporter = Reporter()

  const runnables = parseSnapshot(setRunnables)[0][1]
  const mochaEvents = parseSnapshot(mocha)

  // const runnables = setRunnables[0][1]

  reporter.setRunnables(runnables)

  const stubs = {}

  stubs.reporterEmit = spyOn(reporter, 'emit', debug.extend('reporter:emit'))
  stubs.runnerEmit = spyOn(reporter.runner, 'emit', debug.extend('runner:emit'))

  _.each(mochaEvents, (event) => {
    reporter.emit(...event.slice(1))
  })

  return { stubs, reporter }
}

module.exports = {
  createReporter,
}

const debugAndPrint

describe('reporter retries', () => {

  /**@type{sinon.SinonStub} */
  let console_log

  beforeEach(() => {
    console_log = spyOn(console, 'log', debug.extend('console:log'))
  })

  afterEach(() => {
    console_log.restore()
  })

  it('can receive events', () => {

    const { stubs } = createReporter(getSnapshot(EventSnapshots.THREE_TESTS_WITH_HOOKS))

    expect(stubs.runnerEmit.args).to.matchSnapshot(runnerEmitCleanseMap)

  })

  it('three tests with retry', () => {
    const { reporter, stubs } = createReporter(getSnapshot(EventSnapshots.THREE_TESTS_WITH_RETRY))

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

    expect(reporter.runnables).to.matchSnapshot({ parent: stringifyShort })
    expect(stubs.runnerEmit.args).to.matchSnapshot(runnerEmitCleanseMap, 'some title')
    expect(reporter.results()).to.matchSnapshot()
  })

  it.only('retry [afterEach]', () => {
    const { reporter, stubs } = createReporter(getSnapshot(EventSnapshots.RETRY_PASS_IN_AFTEREACH))

    // expect(reporter.runnables.r4).to.matchDeep({ parent: stringifyShort }, {
    //   _currentRetry: 2,
    //   _retries: 2,
    //   state: 'passed',
    //   prevAttempts: [
    //     {
    //       _currentRetry: 0,
    //       state: 'failed',
    //     },
    //     {
    //       _currentRetry: 1,
    //       state: 'failed',
    //     },
    //   ],
    // })

    expect(_.map(console_log.args, (v) => _.isArray(v) ? _.flatMap(v, stripAnsi) : v).join('\n'))
    .to.debug
    .matchDeep({
      '^.*.*': stripAnsi,
    }, {
      // 0: ['foo'],
      3: match.array.deepEquals([]),
      4: {
        1: match(/test/),
      },
    }
    )

    // .matchSnapshot({
    //   '^.*.*': stripAnsi,
    // })

    // expect(reporter.runnables).to.matchSnapshot({ parent: stringifyShort })
    // expect(stubs.runnerEmit.args).to.matchSnapshot(runnerEmitCleanseMap, 'some title')
    // expect(reporter.results()).to.matchSnapshot()
  })
})

const spyOn = (obj, prop, fn) => {
  const _fn = obj[prop]

  const stub = sinon.stub(obj, prop)
  .callsFake(function () {

    fn.apply(this, arguments)

    const ret = _fn.apply(this, arguments)

    return ret

  })

  // obj[prop] = stub

  return stub
}

const stringifyShort = (obj) => {
  const constructorName = _.get(obj, 'constructor.name')

  if (constructorName && !_.includes(['Object'], constructorName)) {
    return `{${constructorName}}`
  }

  if (_.isArray(obj)) {
    return `[Array ${obj.length}]`
  }

  if (_.isObject(obj)) {
    return `{Object ${Object.keys(obj).length}}`
  }

  return obj
}

const parseMatcher = (matcher) => {
  const regex = /match\.(.*)/

  if (_.isString(matcher)) {
    const parsed = regex.exec(matcher)

    if (parsed) {

      return parsed[1]
    }
  }
}

const parseSnapshot = (s) => {
  s = _.cloneDeep(s)
  const recurse = (_obj) => {
    _.each(_obj, (value, key) => {
      const matcherType = parseMatcher(value)

      if (matcherType) {
        const replacement = getFake(matcherType)

        _obj[key] = replacement

        return
      }

      if (_.isObjectLike(value)) {
        return recurse(value)
      }

    })
  }

  recurse(s)

  return s
}

const getFake = (matcherType) => {
  if (matcherType === 'number') {
    return 1
  }

  if (matcherType === 'date') {
    return new Date(0)
  }

  if (matcherType === 'string') {
    return 'foobar'
  }
}

const runnerEmitCleanseMap = {
  '^.*.1': stringifyShort,
  parent: stringifyShort,
}
