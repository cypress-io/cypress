/* eslint prefer-rest-params: "off", no-console: "off", arrow-body-style: "off"*/

const { _ } = Cypress
const helpers = require('../../support/helpers')

const { registerInCypress, stringifyShort } = require('../../plugins/snapshot/command')

const snapshots = require('./eventSnapshots').EventSnapshots

const sinon = require('sinon')

registerInCypress()
/**
 * @type {sinon.SinonMatch}
 */
const match = Cypress.sinon.match

// const { defer } = helpers

const backupCy = window.cy
const backupCypress = window.Cypress

backupCy.__original__ = true

/**
   * @type {sinon.SinonStub}
   */
let allStubs
/**
   * @type {sinon.SinonStub}
   */
let mochaStubs
/**
   * @type {sinon.SinonStub}
   */
let setRunnablesStub

const snapshotEvents = (name) => {
  expect(setRunnablesStub.args).to.matchSnapshot(setRunnablesCleanseMap, name.setRunnables)
  expect(mochaStubs.args).to.matchSnapshot(mochaEventCleanseMap, name.mocha)
}

const simpleSingleTest = {
  suites: { 'suite 1': { tests: [{ name: 'test 1' }] } },
}

const threeTestsWithHooks = {
  suites: { 'suite 1': { hooks: ['before', 'beforeEach', 'afterEach', 'after'], tests: ['test 1', 'test 2', 'test 3'] } },
}

const enableStubSnapshots = false
// const enableStubSnapshots = true

const eventCleanseMap = {
  snapshots: stringifyShort,
  parent: stringifyShort,
  tests: stringifyShort,
  commands: stringifyShort,
  err: stringifyShort,
  body: '[body]',
  wallClockStartedAt: match.date,
  lifecycle: match.number,
  fnDuration: match.number,
  duration: match.number,
  afterFnDuration: match.number,
  wallClockDuration: match.number,
  stack: match.string,
  message: '[error message]',
}

const mochaEventCleanseMap = {
  ...eventCleanseMap,
  start: match.date,
  end: match.date,
}

const setRunnablesCleanseMap = { ...eventCleanseMap, tests: _.identity }

let autCypress

let onBeforeRun

const createCypress = (mochaTests, opts = {}) => {
  _.defaults(opts, {
    state: {},
    config: {},
  })

  return cy.visit('/fixtures/isolated-runner.html#/tests/integration/cypress/empty_spec.js')
  .then({ timeout: 60000 }, (win) => {
    win.channel.destroy()

    allStubs = cy.stub().snapshot(enableStubSnapshots)
    mochaStubs = cy.stub().snapshot(enableStubSnapshots)
    setRunnablesStub = cy.stub().snapshot(enableStubSnapshots)

    return new Promise((resolve) => {
      const runCypress = () => {
        autCypress.run.restore()

        const emit = autCypress.emit
        const emitMap = autCypress.emitMap
        const emitThen = autCypress.emitThen

        cy.stub(autCypress, 'automation').snapshot(enableStubSnapshots)
        .callThrough()
        .withArgs('clear:cookies')
        .resolves({
          foo: 'bar',
        })
        .withArgs('take:screenshot')
        .resolves({
          path: '/path/to/screenshot',
          size: 12,
          dimensions: { width: 20, height: 20 },
          multipart: false,
          pixelRatio: 1,
          takenAt: new Date().toISOString(),
          name: 'name',
          blackout: ['.foo'],
          duration: 100,
        })

        cy.stub(autCypress, 'emit').snapshot(enableStubSnapshots).log(false)
        .callsFake(function () {
          const noLog = _.includes([
            'navigation:changed',
            'stability:changed',
            'window:load',
            'url:changed',
            'log:added',
            'page:loading',
            'window:unload',
            'newListener',
          ], arguments[0])
          const noCall = _.includes(['window:before:unload', 'mocha'], arguments[0])
          const isMocha = _.includes(['mocha'], arguments[0])

          if (isMocha) {
            mochaStubs.apply(this, arguments)
          }

          noLog || allStubs.apply(this, ['emit'].concat([].slice.call(arguments)))

          return noCall || emit.apply(this, arguments)
        })

        cy.stub(autCypress, 'emitMap').snapshot(enableStubSnapshots).log(false)
        .callsFake(function () {
          allStubs.apply(this, ['emitMap'].concat([].slice.call(arguments)))

          return emitMap.apply(this, arguments)
        })

        cy.stub(autCypress, 'emitThen').snapshot(enableStubSnapshots).log(false)
        .callsFake(function () {
          allStubs.apply(this, ['emitThen'].concat([].slice.call(arguments)))

          return emitThen.apply(this, arguments)
        })

        spyOn(autCypress.mocha.getRunner(), 'fail', (...args) => {
          Cypress.log({
            name: 'Runner Fail',
            message: `${args[1]}`,
            state: 'failed',
            consoleProps: () => {
              return {
                Error: args[1],
              }
            },
          })
        })

        cy.spy(cy.state('window').console, 'log').as('console_log')
        cy.spy(cy.state('window').console, 'error').as('console_error')

        onBeforeRun && onBeforeRun()
        autCypress.run(resolve)
      }

      cy.spy(win.reporterBus, 'emit').snapshot(enableStubSnapshots).as('reporterBus')
      cy.spy(win.localBus, 'emit').snapshot(enableStubSnapshots).as('localBus')

      cy.stub(win.channel, 'emit').snapshot(enableStubSnapshots)
      .withArgs('watch:test:file')
      .callsFake(() => {
        autCypress = win.Cypress

        cy.stub(autCypress, 'onSpecWindow').snapshot(enableStubSnapshots).callsFake((specWindow) => {
          autCypress.onSpecWindow.restore()

          autCypress.onSpecWindow(specWindow)

          helpers.generateMochaTestsForWin(specWindow, mochaTests)

          specWindow.before = () => {}
          specWindow.beforeEach = () => {}
          specWindow.afterEach = () => {}
          specWindow.after = () => {}
          specWindow.describe = () => {}
        })

        cy.stub(autCypress, 'run').snapshot(enableStubSnapshots).callsFake(runCypress)
      })
      .withArgs('is:automation:client:connected')
      .yieldsAsync(true)

      .withArgs('get:existing:run:state')
      .callsFake((evt, cb) => {
        cb(opts.state)
      })

      .withArgs('backend:request', 'reset:server:state')
      .yieldsAsync({})

      .withArgs('backend:request', 'resolve:url')
      .yieldsAsync({ response: {
        isOkStatusCode: true,
        isHtml: true,
        url: 'http://localhost:3500/fixtures/generic.html',
      } })

      .withArgs('set:runnables')
      .callsFake((...args) => {
        setRunnablesStub(...args)
        _.last(args)()
      })

      // .withArgs('preserve:run:state')
      // .callsFake()

      .withArgs('automation:request')
      .yieldsAsync({ response: {} })

      const c = _.extend({}, Cypress.config(), { isTextTerminal: true }, opts.config)

      c.state = {}
      // c.state = opts.state

      cy.stub(win.channel, 'on').snapshot(enableStubSnapshots)

      win.Runner.start(win.document.getElementById('app'), window.btoa(JSON.stringify(c)))
    })
  })
}

describe('src/cypress/runner', () => {
  describe('isolated test runner', () => {
    beforeEach(() => {
      window.cy = backupCy
      window.Cypress = backupCypress
    })

    describe('test events', function () {
      it('simple 1 test', () => {
        createCypress(simpleSingleTest)
        .then(shouldHaveTestResults(1, 0))
      })

      it('simple 3 tests', function () {
        createCypress({
          suites: {
            'suite 1': { tests: ['test 1', 'test 2', 'test 3'] },
          },
        })
        .then(shouldHaveTestResults(3, 0))
      })

      it('simple fail', function () {
        createCypress({
          suites: {
            'suite 1': {
              tests: [
                {
                  name: 'test 1',
                  fail: true,
                },
              ],
            },
          },
        })
        .then(shouldHaveTestResults(0, 1))
        .then(() => {
          // render exactly one error
          cy.get('.runnable-err:contains(AssertionError)').should('have.length', 1)
        })
      })

      it('pass fail pass fail', () => {
        createCypress({
          suites: {
            'suite 1': {
              tests: [
                'test 1',
                {
                  name: 'test 2',
                  fail: true,
                },
              ],
            },
            'suite 2': {
              tests: [
                'test 1',
                {
                  name: 'test 2',
                  fail: true,
                },
              ],
            },
          },
        })
        .then(shouldHaveTestResults(2, 2))
      })

      it('fail pass', function () {
        createCypress({
          suites: {
            'suite 1': {
              tests: [
                {
                  name: 'test 1',
                  fail: true,
                },
                { name: 'test 2' },
              ],
            },
          },
        })
        .then(shouldHaveTestResults(1, 1))
      })

      it('no tests', function () {
        createCypress({})
        .then(shouldHaveTestResults(0, 0))

        cy.contains('No tests found in your file').should('be.visible')
        cy.get('.error-message p').invoke('text').should('eq', 'We could not detect any tests in the above file. Write some tests and re-run.')
      })

      it('ends test before nested suite', function () {
        createCypress({
          suites: {
            'suite 1': { tests: ['test 1', 'test 2'],
              suites: {
                'suite 1-1': {
                  tests: ['test 1'],
                },
              } },
          },
        }, { config: { numTestRetries: 1 } })
        .then(shouldHaveTestResults(3, 0))
      })

      it('simple fail, catch cy.on(fail)', () => {
        createCypress({
          suites: {
            'suite 1': {
              tests: [
                {
                  name: 'test 1',
                  fn: () => {
                    console.log('test ran')
                    cy.on('fail', () => {
                      console.log('on:fail')

                      return false
                    })

                    console.log('added handler')
                    expect(false).ok
                    throw new Error('error in test')
                  },
                  eval: true,
                },
              ],
            },
          },
        })
        .then(shouldHaveTestResults(1, 0))
      })

      describe('hook failures', () => {
        it('fail in [before]', () => {
          createCypress({
            suites: {
              'suite 1': {
                hooks: [
                  {
                    type: 'before',
                    fail: true,
                  },
                ],
                tests: [{ name: 'test 1' }],
              },
            },
          })
          .then(shouldHaveTestResults(0, 1))
          .then(() => {
            cy.get('.runnable-err:visible').invoke('text').should('contain', 'Because this error occurred during a before all hook')
          })
          .then(() => {
            snapshotEvents(snapshots.FAIL_IN_BEFORE)
          })
        })

        it('fail in [beforeEach]', () => {
          createCypress({
            suites: {
              'suite 1': {
                hooks: [
                  {
                    type: 'beforeEach',
                    fail: true,
                  },
                ],
                tests: [{ name: 'test 1' }],
              },
            },
          })
          .then(shouldHaveTestResults(0, 1))
          .then(() => {
            snapshotEvents(snapshots.FAIL_IN_BEFOREEACH)
          })
        })

        it('fail in [afterEach]', () => {
          createCypress({
            suites: {
              'suite 1': {
                hooks: [
                  {
                    type: 'afterEach',
                    fail: true,
                  },
                ],
                tests: [{ name: 'test 1' }],
              },
            },
          })
          .then(shouldHaveTestResults(0, 1))
          .then(() => {
            snapshotEvents(snapshots.FAIL_IN_AFTEREACH)
          })
        })

        it('fail in [after]', () => {
          createCypress({
            suites: {
              'suite 1': {
                hooks: [
                  {
                    type: 'after',
                    fail: true,
                  },
                ],
                tests: ['test 1', 'test 2'],
              },
            },
          })
          .then(shouldHaveTestResults(1, 1))
          .then(() => {
            cy.get('.runnable-err:visible').invoke('text').should('contain', 'Because this error occurred during a after all hook')
          })
          .then(() => {
            snapshotEvents(snapshots.FAIL_IN_AFTER)
          })
        })
      })

      describe('test failures w/ hooks', () => {
        it('fail with [before]', () => {
          createCypress({
            suites: {
              'suite 1': {
                hooks: ['before'],
                tests: [
                  {
                    name: 'test 1',
                    fail: true,
                  },
                  { name: 'test 2' },
                ],
              },
            },
          })
          .then(shouldHaveTestResults(1, 1))
        })

        it('fail with [after]', () => {
          createCypress({
            suites: {
              'suite 1': {
                hooks: [{ type: 'after' }],
                tests: [{ name: 'test 1', fail: true }, 'test 2'],
              },
            },
          })
          .then(shouldHaveTestResults(1, 1))
        })

        it('fail with all hooks', () => {
          createCypress({
            suites: {
              'suite 1': {
                hooks: ['before', 'beforeEach', 'afterEach', 'after'],
                tests: [{ name: 'test 1', fail: true }],
              },
            },
          })
          .then(shouldHaveTestResults(0, 1))
        })
      })

      describe('mocha grep', () => {
        it('fail with [only]', () => {
          createCypress({
            suites: {
              'suite 1': {
                hooks: ['before', 'beforeEach', 'afterEach', 'after'],
                tests: [
                  { name: 'test 1', fail: true },
                  { name: 'test 2', fail: true, only: true },
                  { name: 'test 3', fail: true },
                ],
              },
            },
          })
          .then(shouldHaveTestResults(0, 1))
          .then(() => {
            snapshotEvents(snapshots.FAIL_WITH_ONLY)
          })
        })

        it('pass with [only]', () => {
          createCypress({
            suites: {
              'suite 1': {
                hooks: ['before', 'beforeEach', 'afterEach', 'after'],
                tests: [
                  { name: 'test 1' },
                  { name: 'test 2', only: true },
                  { name: 'test 3' },
                ],
              },
            },
          })
          .then(shouldHaveTestResults(1, 0))
          .then(() => {
            snapshotEvents(snapshots.PASS_WITH_ONLY)
          })
        })
      })
    })

    describe('save/reload state', () => {
      describe('serialize / load from state', () => {
        const serializeState = () => {
          return getRunState(autCypress)
        }

        const loadStateFromSnapshot = (cypressConfig, name) => {
          cy.task('getSnapshot', {
            file: Cypress.spec.name,
            exactSpecName: name,
          })
          .then((state) => {
            cypressConfig[1].state = state
          })
        }

        describe('hooks', () => {
          let realState
          const stub1 = sinon.stub()
          const stub2 = sinon.stub()
          const stub3 = sinon.stub().callsFake(() => realState = serializeState())
          let cypressConfig = [
            {
              suites: {
                'suite 1': {
                  hooks: [
                    'before',
                    'beforeEach',
                    'afterEach',
                    'after',
                  ],
                  tests: [{ name: 'test 1', fn: stub1 }],
                },
                'suite 2': {
                  tests: [
                    { name: 'test 1', fn: stub2 },
                    { name: 'test 2', fn: stub3 },
                    'test 3',
                  ],
                },
              },
            }, { config: { numTestRetries: 1 } },
          ]

          it('serialize state', () => {
            createCypress(...cypressConfig)
            .then(shouldHaveTestResults(4, 0))
            .then(() => {
              expect(realState).to.matchSnapshot(cleanseRunStateMap, 'serialize state - hooks')
            })
          })

          it('load state', () => {
            loadStateFromSnapshot(cypressConfig, 'serialize state - hooks')

            createCypress(...cypressConfig)
            .then(shouldHaveTestResults(4, 0))
            .then(() => {
              expect(stub1).to.calledOnce
              expect(stub2).to.calledOnce
              expect(stub3).to.calledTwice
            })
          })
        })
      })
    })

    describe('other specs', () => {
      it('simple failing hook spec', () => {
        const mochaTests = {
          suites: {
            'simple failing hook spec': {
              suites: {
                'beforeEach hooks': {
                  hooks: [{ type: 'beforeEach', fail: true }],
                  tests: ['never gets here'],
                },
                'pending': {
                  tests: [{ name: 'is pending', pending: true }],
                },
                'afterEach hooks': {
                  hooks: [{ type: 'afterEach', fail: true }],
                  tests: ['fails this', 'does not run this'],
                },
                'after hooks': {
                  hooks: [{ type: 'after', fail: true }]
                  , tests: ['runs this', 'fails on this'],
                },
              },
            },

          },
        }

        createCypress(mochaTests)
        .then(shouldHaveTestResults(1, 3))
        .then(() => {
          cy.contains('.test', 'never gets here').should('have.class', 'runnable-failed')
          cy.contains('.command', 'beforeEach').should('have.class', 'command-state-failed')
          cy.contains('.runnable-err', 'AssertionError: beforeEach').scrollIntoView().should('be.visible').then((v) => console.log(v.text()))

          cy.contains('.test', 'is pending').should('have.class', 'runnable-pending')

          cy.contains('.test', 'fails this').should('have.class', 'runnable-failed')
          cy.contains('.command', 'afterEach').should('have.class', 'command-state-failed')
          cy.contains('.runnable-err', 'AssertionError: afterEach').should('be.visible')

          cy.contains('.test', 'does not run this').should('have.class', 'runnable-processing')

          cy.contains('.test', 'runs this').should('have.class', 'runnable-passed')

          cy.contains('.test', 'fails on this').should('have.class', 'runnable-failed')
          cy.contains('.command', 'after').should('have.class', 'command-state-failed')
          cy.contains('.runnable-err', 'AssertionError: after').should('be.visible')
        })
      })

      it('async timeout spec', () => {
        createCypress({
          suites: {
            'async': {
              tests: [
                { name: 'bar fails',
                // eslint-disable-next-line
                fn (done) {
                    this.timeout(100)
                    cy.on('fail', function () {})
                    // eslint-disable-next-line
                    foo.bar()
                  },
                  eval: true,
                },
              ],
            },
          },
        })
        .then(shouldHaveTestResults(0, 1))
      })

      it('mocha suite:end fire before test:pass event', () => {
        createCypress({
          suites: {
            'suite 1': {
              suites: {
                'suite 1-1': {
                  tests: ['test 1', 'test 2'],
                },
              },
            },
          },
        }).then(() => {
          const getOrderFired = (eventProps) => {
            const event = _.find(mochaStubs.args, eventProps)

            expect(event).ok

            return _.indexOf(mochaStubs.args, event)
          }

          expect(getOrderFired({ 1: 'pass', 2: { title: 'test 2' } }))
          .to.be.lt(getOrderFired({ 1: 'suite end', 2: { title: 'suite 1-1' } }))
        })
      })

      describe('screenshots', () => {
        let onAfterScreenshotListener

        beforeEach(() => {
          onBeforeRun = () => {
            autCypress.Screenshot.onAfterScreenshot = cy.stub()
            onAfterScreenshotListener = cy.stub()
            autCypress.on('after:screenshot', onAfterScreenshotListener)
          }
        })

        it('screenshot after failed test', () => {
          createCypress({
            suites: {
              'suite 1': {
                tests: [
                  {
                    name: 'test 1',
                    fn: () => {
                      assert(false, 'some error')
                    },
                    eval: true,
                  },
                ],
              },
            },
          })
          .then(() => {
          // sent to server
            expect(autCypress.automation.withArgs('take:screenshot').args).to.matchSnapshot(cleanseRunStateMap)

            //// on('after:screenshot')
            // TODO: for some reason snapshot is not properly saved
            // expect(onAfterScreenshotListener.args).to.matchSnapshot(cleanseRunStateMap)

            //// Screenshot.onAfterScreenshot
            // TODO: for some reason snapshot is not properly saved
            // expect(autCypress.Screenshot.onAfterScreenshot.args).to.matchSnapshot(
            //   { '^.0.0': stringifyShort, 'test': stringifyShort, takenAt: match.string },
            // )
          })
        })
      })
    })

    describe('mocha events', () => {
      it('simple single test', () => {
        createCypress(simpleSingleTest)
        .then(() => {
          snapshotEvents(snapshots.SIMPLE_SINGLE_TEST)
        })
      })

      it('simple three tests', () => {
        createCypress(threeTestsWithHooks)
        .then(() => {
          snapshotEvents(snapshots.THREE_TESTS_WITH_HOOKS)
        })
      })
    })
  })
})

const getRunState = (Cypress) => {
  const currentRunnable = Cypress.cy.state('runnable')
  const currentId = currentRunnable && currentRunnable.id

  const s = {
    currentId,
    tests: Cypress.getTestsState(),
    startTime: Cypress.getStartTime(),
    emissions: Cypress.getEmissions(),
  }

  s.passed = Cypress.countByTestState(s.tests, 'passed')
  s.failed = Cypress.countByTestState(s.tests, 'failed')
  s.pending = Cypress.countByTestState(s.tests, 'pending')
  s.numLogs = Cypress.Log.countLogsByTests(s.tests)

  return _.cloneDeep(s)
}

const cleanseRunStateMap = {
  wallClockStartedAt: new Date(0),
  wallClockDuration: 1,
  fnDuration: 1,
  afterFnDuration: 1,
  lifecycle: 1,
  duration: 1,
  startTime: new Date(0),
  'err.stack': '[err stack]',
}

const shouldHaveTestResults = (passed, failed) => {
  return (exitCode) => {
    expect(exitCode, 'resolve with failure count').eq(exitCode)
    passed = passed || '--'
    failed = failed || '--'
    cy.get('header .passed .num').should('have.text', `${passed}`)
    cy.get('header .failed .num').should('have.text', `${failed}`)
  }
}

const spyOn = (obj, prop, fn) => {
  const _fn = obj[prop]

  obj[prop] = function () {
    fn.apply(this, arguments)

    const ret = _fn.apply(this, arguments)

    return ret
  }
}
