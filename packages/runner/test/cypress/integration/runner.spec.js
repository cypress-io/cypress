const { _ } = Cypress
const helpers = require('../support/helpers')

const snapshots = require('../support/eventSnapshots').EventSnapshots

const sinon = require('sinon')

const backupCy = window.cy
const backupCypress = window.Cypress

backupCy.__original__ = true

const simpleSingleTest = {
  suites: { 'suite 1': { tests: [{ name: 'test 1' }] } },
}

const threeTestsWithHooks = {
  suites: { 'suite 1': { hooks: ['before', 'beforeEach', 'afterEach', 'after'], tests: ['test 1', 'test 2', 'test 3'] } },
}

const { visit, snapshotEvents, onInitialized, getAutCypress } = helpers.createCypress()

describe('src/cypress/runner', () => {
  describe('isolated test runner', () => {
    beforeEach(() => {
      window.cy = backupCy
      window.Cypress = backupCypress
    })

    describe('test events', function () {
      it('simple 1 test', () => {
        visit(simpleSingleTest)
        .then(shouldHaveTestResults(1, 0))
      })

      it('simple 3 tests', function () {
        visit({
          suites: {
            'suite 1': { tests: ['test 1', 'test 2', 'test 3'] },
          },
        })
        .then(shouldHaveTestResults(3, 0))
      })

      it('simple fail', function () {
        visit({
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
        visit({
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
        visit({
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
        visit({})
        .then(shouldHaveTestResults(0, 0))

        cy.contains('No tests found in your file').should('be.visible')
        cy.get('.error-message p').invoke('text').should('eq', 'We could not detect any tests in the above file. Write some tests and re-run.')
      })

      it('ends test before nested suite', function () {
        visit({
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
        visit({
          suites: {
            'suite 1': {
              tests: [
                {
                  name: 'test 1',
                  fn: () => {
                    cy.on('fail', () => {
                      return false
                    })

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
          visit({
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
          visit({
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
          visit({
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
          visit({
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
            expect('foo').contain('f')
            cy.get('.runnable-err:visible').invoke('text').should('contain', 'Because this error occurred during a after all hook')
          })
          .then(() => {
            snapshotEvents(snapshots.FAIL_IN_AFTER)
          })
        })
      })

      describe('test failures w/ hooks', () => {
        it('fail with [before]', () => {
          visit({
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
          visit({
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
          visit({
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
          visit({
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
          visit({
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
          return getRunState(getAutCypress())
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
            visit(...cypressConfig)
            .then(shouldHaveTestResults(4, 0))
            .then(() => {
              expect(realState).to.matchSnapshot(cleanseRunStateMap, 'serialize state - hooks')
            })
          })

          it('load state', () => {
            loadStateFromSnapshot(cypressConfig, 'serialize state - hooks')

            visit(...cypressConfig)
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

        visit(mochaTests)
        .then(shouldHaveTestResults(1, 3))
        .then(() => {
          cy.contains('.test', 'never gets here').should('have.class', 'runnable-failed')
          cy.contains('.command', 'beforeEach').should('have.class', 'command-state-failed')
          cy.contains('.runnable-err', 'AssertionError: beforeEach').scrollIntoView().should('be.visible')

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
        visit({
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
        visit({
          suites: {
            'suite 1': {
              suites: {
                'suite 1-1': {
                  tests: ['test 1', 'test 2'],
                },
              },
            },
          },
        }).then(({ mochaStubs }) => {
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
          onInitialized((autCypress) => {
            autCypress.Screenshot.onAfterScreenshot = cy.stub()
            onAfterScreenshotListener = cy.stub()
            autCypress.on('after:screenshot', onAfterScreenshotListener)
          })
        })

        it('screenshot after failed test', () => {
          visit({
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
          .then(({ autCypress }) => {
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
        visit(simpleSingleTest)
        .then(() => {
          snapshotEvents(snapshots.SIMPLE_SINGLE_TEST)
        })
      })

      it('simple three tests', () => {
        visit(threeTestsWithHooks)
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

const shouldHaveTestResults = (expPassed, expFailed) => {
  return ({ failed }) => {
    expect(failed, 'resolve with failure count').eq(failed)
    expPassed = expPassed || '--'
    expFailed = expFailed || '--'
    cy.get('header .passed .num').should('have.text', `${expPassed}`)
    cy.get('header .failed .num').should('have.text', `${expFailed}`)
  }
}
