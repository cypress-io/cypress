require('../spec_helper')

const _ = require('lodash')
const sinon = require('sinon')
const Debug = require('debug')

const Reporter = require(`../../lib/reporter`)
const { spyOn, stdout } = require('../support/helpers/utils')
const { registerInMocha, parseSnapshot, stringifyShort } = require('../matchDeep')
const events = require('@packages/runner/__snapshots__/runner.spec')
const { EventSnapshots } = require('@packages/runner/cypress/support/eventSnapshots')

registerInMocha()

const debug = Debug('spec:retries')
const { match } = sinon

const runnerEmitCleanseMap = {
  '^.*.1': stringifyShort,
  parent: stringifyShort,
}

/** @param {typeof EventSnapshots.FAIL_IN_AFTER} snapshotName */
function createReporterFromSnapshot (snapshotName) {
  const getSnapshot = (snapshotName) => {
    return _.mapValues(snapshotName, (v) => parseSnapshot(events[v]))
  }

  const { setRunnables, mocha } = getSnapshot(snapshotName)

  const stdoutStub = stdout.capture()

  const reporter = new Reporter()

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

function createReporter () {
  const reporter = new Reporter()

  const root = {
    id: 'r1',
    root: true,
    title: '',
    tests: [],
    suites: [
      {
        id: 'r2',
        title: 'TodoMVC - React',
        tests: [],
        suites: [
          {
            id: 'r3',
            title: 'When page is initially opened',
            tests: [
              {
                id: 'r4',
                title: 'should focus on the todo input field',
                duration: 4,
                state: 'failed',
                timedOut: false,
                async: 0,
                sync: true,
                err: {
                  message: 'foo',
                  stack: [1, 2, 3],
                },
              },
              {
                id: 'r5',
                title: 'does something good',
                duration: 4,
                state: 'pending',
                timedOut: false,
                async: 0,
                sync: true,
              },
            ],
            suites: [],
          },
        ],
      },
    ],
  }

  const testObj = root.suites[0].suites[0].tests[0]

  reporter.setRunnables(root)

  return { reporter, testObj, root }
}

describe('lib/reporter', () => {
  describe('integration from snapshots', () => {
    it('simple single test', () => {
      const { snapshot } = createReporterFromSnapshot(EventSnapshots.SIMPLE_SINGLE_TEST)

      snapshot('simple_single_test')
    })

    it('fail [afterEach]', () => {
      const { snapshot } = createReporterFromSnapshot(EventSnapshots.FAIL_IN_AFTEREACH)

      snapshot('fail in [afterEach]')
    })

    it('fail [beforeEach]', () => {
      const { snapshot } = createReporterFromSnapshot(EventSnapshots.FAIL_IN_BEFOREEACH)

      snapshot('fail in [beforeEach]')
    })
  })

  describe('unit', () => {
    let reporter
    let testObj
    let root

    beforeEach(function () {
      ({ reporter, testObj, root } = createReporter())
    })

    context('.create', () => {
      it('can create mocha-teamcity-reporter', function () {
        const teamCityFn = sinon.stub()

        mockery.registerMock('mocha-teamcity-reporter', teamCityFn)

        const reporter = Reporter.create('teamcity')

        reporter.setRunnables(root)

        expect(reporter.reporterName).to.eq('teamcity')

        expect(teamCityFn).to.be.calledWith(reporter.runner)
      })

      it('can create mocha-junit-reporter', function () {
        const junitFn = sinon.stub()

        mockery.registerMock('mocha-junit-reporter', junitFn)

        const reporter = Reporter.create('junit')

        reporter.setRunnables(root)

        expect(reporter.reporterName).to.eq('junit')

        expect(junitFn).to.be.calledWith(reporter.runner)
      })
    })

    context('createSuite', () => {
      beforeEach(function () {
        this.errorObj = {
          message: 'expected true to be false',
          name: 'AssertionError',
          stack: 'AssertionError: expected true to be false',
          actual: true,
          expected: false,
          showDiff: false,
        }
      })

      it('recursively creates suites for fullTitle', function () {
        const args = reporter.parseArgs('fail', [testObj])

        expect(args[0]).to.eq('fail')

        const title = 'TodoMVC - React When page is initially opened should focus on the todo input field'

        expect(args[1].fullTitle()).to.eq(title)
      })
    })

    context('#emit', () => {
      let emit

      beforeEach(function () {
        emit = sinon.spy(reporter.runner, 'emit')
      })

      it('emits start', function () {
        reporter.emit('start')
        expect(emit).to.be.calledWith('start')

        expect(emit).to.be.calledOn(reporter.runner)
      })

      it('emits test with updated properties', function () {
        reporter.emit('test', { id: 'r5', state: 'passed' })
        expect(emit).to.be.calledWith('test')
        expect(emit.getCall(0).args[1].title).to.eq('does something good')

        expect(emit.getCall(0).args[1].state).to.eq('passed')
      })

      it('ignores events not in the events table', function () {
        reporter.emit('foo')

        expect(emit).not.to.be.called
      })

      it('sends suites with updated properties and nested subtree', function () {
        reporter.emit('suite', { id: 'r3', state: 'passed' })
        expect(emit).to.be.calledWith('suite')
        expect(emit.getCall(0).args[1].state).to.eq('passed')

        expect(emit.getCall(0).args[1].tests.length).to.equal(2)
      })
    })
  })
})
