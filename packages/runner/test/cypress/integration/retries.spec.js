const { _ } = Cypress
const helpers = require('../support/helpers')

const snapshots = require('../support/eventSnapshots').EventSnapshots

const sinon = require('sinon')

const threeTestsWithRetry = {
  suites: {
    'suite 1': {
      hooks: ['before', 'beforeEach', 'afterEach', 'after'],
      tests: [
        'test 1',
        { name: 'test 2', fail: 2 },
        'test 3',
      ],
    },
  },
}

/**
 * @type {sinon.SinonMatch}
 */
const match = Cypress.sinon.match

const { visit, snapshotEvents, onInitialized, getAutCypress } = helpers.createCypress()

describe('src/cypress/runner', () => {
  describe('isolated test runner', () => {
    describe('test events', function () {
      // NOTE: for test-retries
      describe('retries', () => {
        it('can set retry config', () => {
          visit({}, { config: { retries: 1 } })
          .then(({ autCypress }) => {
            expect(autCypress.config()).to.has.property('retries', 1)
          })
        })

        describe('retry ui', () => {
          beforeEach(() => {
            visit({
              suites: {
                'suite 1': {
                  tests: [
                    { name: 'test 1', fail: 1 },
                    { name: 'test 2', fail: 2 },
                    { name: 'test 3', fail: 1 },
                  ],
                },
              },
            }, { config: { retries: 1, isTextTerminal: false, enableTestRetriesInOpenMode: true } })
            .then(shouldHaveTestResults(2, 1))
          })

          it('empty', () => {})

          it('can toggle failed attempt', () => {
            cy.contains('.runnable-wrapper', 'test 3').click().within(() => {
              cy.get('.runnable-err-print').should('not.be.visible')
              cy.contains('Attempt 1').click()
              cy.get('.runnable-err-print').should('be.visible')
              cy.contains('Attempt 1').click()
              // .find('i:last').pseudo(':before').should('have.property', 'content', '""')
              cy.get('.runnable-err-print').should('not.be.visible')
            })
          })

          it('can view error for failed attempt', () => {
            cy.contains('Attempt 1')
            .click()
            .closest('.attempt-item')
            .find('.runnable-err-print')
            .click()

            cy.get('@console_log').should('be.calledWithMatch', 'Command')
          })
        })

        it('simple retry', () => {
          visit({
            suites: {
              'suite 1': {
                tests: [
                  { name: 'test 1',
                    fail: 1,
                  },
                ],
              },
            },
          }, { config: { retries: 1 } })
          .then(shouldHaveTestResults(1, 0))
          .then(() => snapshotEvents(snapshots.RETRY_PASS_IN_TEST))
        })

        it('test retry with hooks', () => {
          visit({
            suites: {
              'suite 1': {
                hooks: ['before', 'beforeEach', 'afterEach', 'after'],
                tests: [{ name: 'test 1', fail: 1 }],
              },
            },
          }, { config: { retries: 1 } })
          .then(shouldHaveTestResults(1, 0))
          .then(() => {
            cy.contains('test')
            cy.contains('after all')
          })
        })

        it('test retry with [only]', () => {
          visit({
            suites: {
              'suite 1': {
                hooks: ['before', 'beforeEach', 'afterEach', 'after'],
                tests: [
                  { name: 'test 1' },
                  { name: 'test 2', fail: 1, only: true },
                  { name: 'test 3' },
                ],
              },
            },
          }, { config: { retries: 1 } })
          .then(shouldHaveTestResults(1, 0))
        })

        it('test retry with many hooks', () => {
          visit({
            suites: {
              'suite 1': {
                hooks: [
                  'before',
                  'beforeEach',
                  'afterEach',
                  'after',
                ],
                tests: [
                  { name: 'test 1' },
                  { name: 'test 2', fail: 1 },
                  { name: 'test 3' },
                ],
              },
            },
          }, { config: { retries: 1 } })
          .then(shouldHaveTestResults(3, 0))
        })

        it('can retry from [beforeEach]', () => {
          visit({
            suites: {
              'suite 1': {
                hooks: [
                  'before',
                  'beforeEach',
                  { type: 'beforeEach', fail: 1 },
                  'beforeEach',
                  'afterEach',
                  'after',
                ],
                tests: [{ name: 'test 1' }],
              },
            },
          }, { config: { retries: 1 } })
          .then(shouldHaveTestResults(1, 0))
          .then(() => {
            cy.contains('Attempt 1').click()
            cy.get('.runnable-err-print').click()
            cy.get('@reporterBus').its('lastCall.args').should('contain', 'runner:console:error')
          })
          .then(() => {
            snapshotEvents(snapshots.RETRY_PASS_IN_BEFOREEACH)
          })
        })

        it('can retry from [afterEach]', () => {
          visit({
            hooks: [{ type: 'afterEach', fail: 1 }],
            suites: {
              'suite 1': {
                hooks: [
                  'before',
                  'beforeEach',
                  'beforeEach',
                  'afterEach',
                  'after',
                ],
                tests: [{ name: 'test 1' }, 'test 2', 'test 3'],
              },
              'suite 2': {
                hooks: [{ type: 'afterEach', fail: 2 }],
                tests: ['test 1'],
              },
              'suite 3': {
                tests: ['test 1'],
              },
            },
          }, { config: { retries: 2 } })
          .then(shouldHaveTestResults(5, 0))
          .then(() => {
            cy.contains('test 1')
            cy.contains('Attempt 1').click()
            cy.get('.runnable-err-print').click()
            cy.get('@reporterBus').its('lastCall.args').should('contain', 'runner:console:error')
          })
          .then(() => {
            snapshotEvents(snapshots.RETRY_PASS_IN_AFTEREACH)
          })
        })

        it('cant retry from [before]', () => {
          visit({
            suites: {
              'suite 1': {
                hooks: [
                  { type: 'before', fail: 1 },
                  'beforeEach',
                  'beforeEach',
                  'afterEach',
                  'afterEach',
                  'after',
                ],
                tests: [{ name: 'test 1' }],
              },
            },
          }, { config: { retries: 1, isTextTerminal: false, enableTestRetriesInOpenMode: true } })
          .then(shouldHaveTestResults(0, 1))
          .then(() => {
            // cy.contains('Attempt 1').click()
            cy.contains('Although you have test retries')
            cy.get('.runnable-err-print').click()
            cy.get('@console_log').its('lastCall').should('be.calledWithMatch', 'Error')
          })
        })

        it('cant retry from [after]', () => {
          visit({
            suites: {
              'suite 1': {
                hooks: [
                  'before',
                  'beforeEach',
                  'beforeEach',
                  'afterEach',
                  'afterEach',
                  { type: 'after', fail: 1 },
                ],
                tests: [{ name: 'test 1' }],
              },
            },
          }, { config: { retries: 1, isTextTerminal: false, enableTestRetriesInOpenMode: true } })
          .then(shouldHaveTestResults(0, 1))
          .then(() => {
            cy.contains('Although you have test retries')
            cy.get('.runnable-err-print').click()
            cy.get('@console_log').its('lastCall').should('be.calledWithMatch', 'Error')
          })
        })

        // NOTE: for test-retries
        describe('can configure retries', () => {
          const getAttemptTag = (sel) => {
            return cy.get(`.runnable-wrapper:contains(${sel}) .attempt-tag`)
          }

          it('via config value', () => {
            visit({
              suites: {
                'suite 1': () => {
                  Cypress.config('retries', 0)
                  it('[no retry]', () => assert(false))
                  Cypress.config('retries', 1)
                  it('[1 retry]', () => assert(false))
                  Cypress.config('retries', 2)
                  it('[2 retries]', () => assert(false))

                  // it('[test-config no retries]', { retries: 0 }, () => assert(false))
                  // it('[test-config 1 retry]', { retries: 1 }, () => assert(false))

                  Cypress.config('retries', { runMode: 2, openMode: 0 })
                  Cypress.config('isInteractive', true)
                  it('[open mode, no retry]', () => assert(false))

                  Cypress.config('retries', { runMode: 0, openMode: 2 })
                  Cypress.config('isInteractive', false)
                  it('[run mode, no retry]', () => assert(false))

                  Cypress.config('retries', { runMode: 0, openMode: 2 })
                  Cypress.config('isInteractive', true)
                  it('[open mode, 2 retries]', () => assert(false))
                },
              },
            })

            .then(shouldHaveTestResults(0, 6))
            .then(() => {
              getAttemptTag('[no retry]').should('not.be.visible')
              getAttemptTag('[1 retry]').should('have.length', 2)
              getAttemptTag('[2 retries]').should('have.length', 3)
              //   getAttemptTag('[test-config no retries]').should('not.be.visible')
              //   getAttemptTag('[test-config 1 retry]').should('have.length', 2)
              getAttemptTag('[open mode, no retry]').should('not.be.visible')
              getAttemptTag('[run mode, no retry]').should('not.be.visible')
              getAttemptTag('[open mode, 2 retries]').should('have.length', 3)
            })
          })

          it('throws when set via this.retries in test', () => {
            visit({
              suites: {
                'suite 1' () {
                  it('test 1', function () {
                    this.retries(0)
                  })
                },
              },
            })
            .then(shouldHaveTestResults(0, 1))
            .then(() => {
              cy.get('.runnable-err').should(containText('retries'))
            })
          })

          it('throws when set via this.retries in hook', () => {
            visit({
              suites: {
                'suite 1' () {
                  beforeEach(function () {
                    this.retries(0)
                  })

                  it('foo', () => {})
                },
              },
            })
            .then(shouldHaveTestResults(0, 1))
            .then(() => {
              cy.get('.runnable-err').should(containText('retries'))
            })
          })

          it('throws when set via this.retries in suite', () => {
            visit({
              suites: {
                'suite 1' () {
                  this.retries(0)
                  it('test 1', function () {
                  })
                },
              },
            })
            .then(shouldHaveTestResults(0, 1))
            .then(() => {
              cy.get('.runnable-err').should(containText('retries'))
            })
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

        // NOTE: for test-retries
        describe('retries', () => {
          let realState

          let runCount = 0
          const failThenSerialize = () => {
            if (!runCount++) {
              assert(false, 'stub 3 fail')
            }

            assert(true, 'stub 3 pass')

            return realState = serializeState()
          }

          let runCount2 = 0
          const failOnce = () => {
            if (!runCount2++) {
              assert(false, 'stub 2 fail')
            }

            assert(true, 'stub 2 pass')
          }

          const stub1 = sinon.stub()
          const stub2 = sinon.stub().callsFake(failOnce)
          const stub3 = sinon.stub().callsFake(failThenSerialize)

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
            }, { config: { retries: 1 } },
          ]

          it('serialize state', () => {
            visit(...cypressConfig)
            .then(shouldHaveTestResults(4, 0))
            .then(() => {
              expect(realState).to.matchSnapshot(cleanseRunStateMap, 'serialize state - retries')
            })
          })

          it('load state', () => {
            loadStateFromSnapshot(cypressConfig, 'serialize state - retries')
            visit(...cypressConfig)
            .then(shouldHaveTestResults(4, 0))
            .then(() => {
              expect(stub1).to.calledOnce
              expect(stub2).to.calledTwice
              expect(stub3).calledThrice
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

        // NOTE: for test-retries
        describe('retries', () => {
          it('retry screenshot in test body', () => {
            visit({
              suites: {
                'suite 1': {
                  tests: [
                    {
                      name: 'test 1',
                      fn: () => {
                        cy.screenshot()
                        cy.then(() => assert(false))
                      },
                      eval: true,
                    },
                  ],
                },
              },
            }, { config: { retries: 1 } })
            .then(({ autCypress }) => {
              expect(autCypress.automation.withArgs('take:screenshot')).callCount(4)
              expect(autCypress.automation.withArgs('take:screenshot').args).matchDeep([
                { 1: { testAttemptIndex: 0 } },
                { 1: { testAttemptIndex: 0 } },
                { 1: { testAttemptIndex: 1 } },
                { 1: { testAttemptIndex: 1 } },
              ])

              expect(autCypress.automation.withArgs('take:screenshot').args[0]).matchSnapshot({ startTime: match.string, testAttemptIndex: match(0) })
              expect(onAfterScreenshotListener.args[0][0]).to.matchSnapshot({ testAttemptIndex: match(0) })
              expect(onAfterScreenshotListener.args[2][0]).to.matchDeep({ testAttemptIndex: 1 })
              // expect(autCypress.Screenshot.onAfterScreenshot.args[0]).to.matchSnapshot(
              //   { '^.0': stringifyShort, 'test': stringifyShort, takenAt: match.string },
              // )
            })
          })

          it('retry screenshot in hook', () => {
            visit({
              suites: {
                'suite 1': {
                  hooks: [
                    {
                      type: 'beforeEach',
                      fn: () => {
                        cy.screenshot()
                        cy.then(() => assert(false))
                      },
                      eval: true,
                    },
                  ],
                  tests: [
                    {
                      name: 'test 1',
                    },
                  ],
                },
              },
            }, { config: { retries: 1 } })
            .then(({ autCypress }) => {
              expect(autCypress.automation.withArgs('take:screenshot')).callCount(4)
              expect(autCypress.automation.withArgs('take:screenshot').args).matchDeep([
                { 1: { testAttemptIndex: 0 } },
                { 1: { testAttemptIndex: 0 } },
                { 1: { testAttemptIndex: 1 } },
                { 1: { testAttemptIndex: 1 } },
              ])

              expect(onAfterScreenshotListener.args[0][0]).matchDeep({ testAttemptIndex: 0 })
              expect(onAfterScreenshotListener.args[3][0]).matchDeep({ testAttemptIndex: 1 })
            })
          })
        })
      })
    })

    describe('mocha events', () => {
      it('three tests with retry', () => {
        visit(threeTestsWithRetry, { config: {
          retries: 2,
        } })
        .then(() => {
          snapshotEvents(snapshots.THREE_TESTS_WITH_RETRY)
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

const containText = (text) => {
  return (($el) => {
    expect($el[0]).property('innerText').contain(text)
  })
}
