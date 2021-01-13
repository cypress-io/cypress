const helpers = require('../support/helpers')

const { shouldHaveTestResults, createCypress } = helpers
const { runIsolatedCypress } = createCypress()

const fx_simpleSingleTest = {
  suites: { 'suite 1': { tests: [{ name: 'test 1' }] } },
}

const fx_failPass = {
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
}

const fx_passFailPassFail = {
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
}

describe('src/cypress/runner', () => {
  describe('tests finish with correct state', () => {
    it('simple 1 test', () => {
      runIsolatedCypress(fx_simpleSingleTest)
      .then(shouldHaveTestResults(1, 0))
    })

    it('simple 1 global test', () => {
      runIsolatedCypress(() => {
        it('foo', () => {
          expect(true).is.true
        })
      })
      .then(shouldHaveTestResults(1, 0))
    })

    it('simple 3 tests', () => {
      runIsolatedCypress({
        suites: {
          'suite 1': { tests: ['test 1', 'test 2', 'test 3'] },
        },
      })
      .then(shouldHaveTestResults(3, 0))
    })

    it('simple fail', () => {
      runIsolatedCypress({
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
      runIsolatedCypress(fx_passFailPassFail)
      .then(shouldHaveTestResults(2, 2))
    })

    it('fail pass', () => {
      runIsolatedCypress(fx_failPass)
      .then(shouldHaveTestResults(1, 1))
    })

    it('no tests', () => {
      runIsolatedCypress({})
      .then(shouldHaveTestResults(0, 0))

      cy.contains('No tests found in your file').should('be.visible')
      cy.get('.error-message p').invoke('text').should('eq', 'We could not detect any tests in the above file. Write some tests and re-run.')
    })

    it('ends test before nested suite', () => {
      runIsolatedCypress({
        suites: {
          'suite 1': { tests: ['test 1', 'test 2'],
            suites: {
              'suite 1-1': {
                tests: ['test 1'],
              },
            } },
        },
      }, {})
      .then(shouldHaveTestResults(3, 0))
    })

    it('simple fail, catch cy.on(fail)', () => {
      runIsolatedCypress({
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
      describe('test failures w/ hooks', () => {
        it('test [only]', () => {
          runIsolatedCypress({
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
          }).then(shouldHaveTestResults(1, 0))
        })

        it('test [pending]', () => {
          runIsolatedCypress(() => {
            before(() => {})
            it('t1')
            it('t2')
            it('t3')
            after(() => {})
          }).then(shouldHaveTestResults(0, 0, 3))
        })

        it('fail with [before]', () => {
          runIsolatedCypress({
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
          runIsolatedCypress({
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
          runIsolatedCypress({
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

      runIsolatedCypress(mochaTests)
      .then(shouldHaveTestResults(1, 3))
      .then(() => {
        cy.contains('.test', 'never gets here').should('have.class', 'runnable-failed')
        cy.contains('.command', 'beforeEach').should('have.class', 'command-state-failed')
        cy.contains('.runnable-err', 'beforeEach').scrollIntoView().should('be.visible')

        cy.contains('.test', 'is pending').should('have.class', 'runnable-pending')

        cy.contains('.test', 'fails this').should('have.class', 'runnable-failed')
        cy.contains('.command', 'afterEach').should('have.class', 'command-state-failed')
        cy.contains('.runnable-err', 'afterEach').should('be.visible')

        cy.contains('.test', 'does not run this').should('have.class', 'runnable-processing')

        cy.contains('.test', 'runs this').should('have.class', 'runnable-passed')

        cy.contains('.test', 'fails on this').should('have.class', 'runnable-failed')
        cy.contains('.command', 'after').should('have.class', 'command-state-failed')
        cy.contains('.runnable-err', 'after').should('be.visible')
      })
    })

    it('async timeout spec', () => {
      runIsolatedCypress({
        suites: {
          'async': {
            tests: [
              { name: 'bar fails',
                // eslint-disable-next-line
                fn (done) {
                  this.timeout(100)
                  cy.on('fail', () => {})
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

    it('scrolls each command into view', () => {
      // HACK to assert on the dom DURING the runIsolatedCypress run
      // we expect the last command item to be scrolled into view before
      // the test ends
      const result = cy.now('get', '.command-number:contains(25):visible').catch((e) => cy.state('reject')(e))

      runIsolatedCypress(() => {
        describe('s1', () => {
          // Passing in done forces the spec to timeout
          // eslint-disable-next-line
          it('t1', (done) => {
            cy.timeout(10)
            Cypress._.times(25, () => expect(true).ok)
          })
        })
      })

      cy.wrap(result)
    })
  })

  describe('reporter interaction', () => {
    // https://github.com/cypress-io/cypress/issues/8621
    it('user can stop test execution', (done) => {
      runIsolatedCypress(() => {
        // eslint-disable-next-line mocha/handle-done-callback
        it('test stops while running', (done) => {
          cy.timeout(200)
          cy.get('.not-exist')
          setTimeout(() => {
            cy.$$('button.stop', parent.document).click()
          }, 100)
        })

        afterEach(function () {
          this.currentTest.err = new Error('ran aftereach')
        })
      }, {
        onBeforeRun ({ autCypress }) {
          autCypress.on('test:after:run', (arg) => {
            expect(arg.err.message).not.contain('aftereach')
            done()
          })
        },
      })
    })

    it('supports disabling command log reporter with env var NO_COMMAND_LOG', () => {
      runIsolatedCypress(() => {
        it('foo', () => {
          // simulate a page load, ensures reporter state event is properly stubbed
          cy.then(() => Cypress.action('cy:collect:run:state'))
          cy.visit('/')

          // ensures runner doesn't wait for nonexist before:screenshot ack
          cy.screenshot({
            capture: 'runner',
          })
        })
      },
      {
        config: { env: { NO_COMMAND_LOG: '1' } },
      })

      cy.get('.reporter').should('not.exist')
    })
  })
})
