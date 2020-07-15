const helpers = require('../support/helpers')

const { shouldHaveTestResults, containText } = helpers
const { runIsolatedCypress } = helpers.createCypress({ config: { retries: 2 } })

const getAttemptTag = (sel) => {
  return cy.get(`.test.runnable:contains(${sel}) .attempt-tag`)
}

const attemptTag = (sel) => `.test.runnable .attempt-tag:contains(Attempt ${sel})`

describe('src/cypress/runner retries ui', () => {
  // NOTE: for test-retries
  it('collapses tests that retry and pass', () => {
    runIsolatedCypress({
      suites: {
        'suite 1': {
          tests: [
            { name: 'test pass', fail: 0 },
            { name: 'test pass on 2nd attempt', fail: 1 },
          ],
        },
      },
    })
    .then(shouldHaveTestResults(2, 0))

    cy.percySnapshot()
  })

  it('can set retry config', () => {
    runIsolatedCypress({}, { config: { retries: 1 } })
    .then(({ autCypress }) => {
      expect(autCypress.config()).to.has.property('retries', 1)
    })
  })

  it('can toggle failed attempt', () => {
    runIsolatedCypress({
      suites: {
        'suite 1': {
          tests: [
            { name: 'test 1', fail: 1 },
            { name: 'test 2', fail: 2 },
            { name: 'test 3', fail: 1 },
          ],
        },
      },
    }, { config: { retries: 1 } })
    .then(shouldHaveTestResults(2, 1))
    .then(() => {
      cy.contains('.test.runnable', 'test 3').click().within(() => {
        cy.get('.runnable-err-print').should('not.be.visible')
        cy.contains('Attempt 1').click()
        cy.get('.runnable-err-print').should('be.visible')
        cy.contains('Attempt 1').click()
        // .find('i:last').pseudo(':before').should('have.property', 'content', '""')
        cy.get('.runnable-err-print').should('not.be.visible')
      })

      cy.contains('Attempt 1')
      .click()
      .closest('.attempt-item')
      .find('.runnable-err-print')
      .click()

      cy.get('@console_error').should('be.calledWithMatch', 'AssertionError: test 2')
    })
  })

  it('simple retry', () => {
    runIsolatedCypress({
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
  })

  it('takes screenshots properly on every attempt failure', () => {
    let stub

    runIsolatedCypress(
      {
        suites: {
          's1': {
            tests: [
              't1',
              {
                name: 't2',
                fail: 3,
              },
              't3',
            ],
          },
        },
      }, { config: { retries: 3, isTextTerminal: true },
        onBeforeRun ({ autCypress }) {
          let attempt = 0

          stub = cy.stub().callsFake(() => {
            try {
              attempt++
              if (attempt === 1) {
                expect(cy.$$('.hooks-container:contains(t2) .command')).exist.and.visible

                return
              }

              const $attemptCollapsible = cy.$$(`.attempt-tag:contains(Attempt ${attempt})`)
              .parentsUntil('.collapsible').last().parent()

              expect($attemptCollapsible).have.class('is-open')
            } catch (e) {
              cy.state('reject')(e)
            }
          })

          autCypress.Screenshot.onAfterScreenshot = stub
        },
      },
    ).then(() => {
      expect(stub).callCount(3)
      cy.get('.test.runnable:contains(t2)').then(($el) => {
        expect($el).not.class('is-open')
      })
    })
  })

  it('test retry with hooks', () => {
    runIsolatedCypress({
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
    runIsolatedCypress({
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
    runIsolatedCypress({
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
    runIsolatedCypress({
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
  })

  it('can retry from [afterEach]', () => {
    runIsolatedCypress({
      hooks: [{ type: 'afterEach', fail: 1 }],
      suites: {
        's1': {
          hooks: [
            'before',
            'beforeEach',
            'beforeEach',
            'afterEach',
            'after',
          ],
          tests: [{ name: 't1' }, 't2', 't3'],
        },
        's2': {
          hooks: [{ type: 'afterEach', fail: 2 }],
          tests: ['t4'],
        },
        's3': {
          tests: ['t5'],
        },
      },
    }, { config: { retries: 2 } })
    .then(shouldHaveTestResults(5, 0))
    .then(() => {
      cy.contains('t1').click()
      cy.contains('Attempt 1').click()
      cy.get('.runnable-err-print').click()
      cy.get('@reporterBus').its('lastCall.args').should('contain', 'runner:console:error')
    })
  })

  it('cant retry from [before]', () => {
    runIsolatedCypress({
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
    }, { config: { retries: 1 } })
    .then(shouldHaveTestResults(0, 1))
    .then(() => {
      // cy.contains('Attempt 1').click()
      cy.contains('Although you have test retries')
      cy.get('.runnable-err-print').click()
      cy.get('@console_error').its('lastCall').should('be.calledWithMatch', 'Error')
    })
  })

  it('cant retry from [after]', () => {
    runIsolatedCypress({
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
    }, { config: { retries: 1 } })
    .then(shouldHaveTestResults(0, 1))
    .then(() => {
      cy.contains('Although you have test retries')
      cy.get('.runnable-err-print').click()
      cy.get('@console_error').its('lastCall').should('be.calledWithMatch', 'Error')
    })
  })

  it('includes routes, spies, hooks, and commands in attempt', () => {
    runIsolatedCypress({
      suites: {
        's1': {
          hooks: [{ type: 'beforeEach', fail: 1, agents: true }],
          tests: [{ name: 't1', fail: 1, agents: true }],
        },
      },
    })
    .then(shouldHaveTestResults(1, 0))
    .then(() => {
      cy.get(attemptTag`1`).click().parentsUntil('.collapsible').last().parent().within(() => {
        cy.get('.instruments-container').should('contain', 'Spies / Stubs (1)')
        cy.get('.instruments-container').should('contain', 'Routes (1)')
        cy.get('.runnable-err').should('contain', 'AssertionError')
      })

      cy.get(attemptTag`2`).click().parentsUntil('.collapsible').last().parent().within(() => {
        cy.get('.instruments-container').should('contain', 'Spies / Stubs (2)')
        cy.get('.instruments-container').should('contain', 'Routes (2)')
        cy.get('.runnable-err').should('contain', 'AssertionError')
      })

      cy.get(attemptTag`3`).parentsUntil('.collapsible').last().parent().within(() => {
        cy.get('.instruments-container').should('contain', 'Spies / Stubs (2)')
        cy.get('.instruments-container').should('contain', 'Routes (2)')
        cy.get('.runnable-err').should('not.contain', 'AssertionError')
      })
    })
  })

  it('simple failing hook spec', () => {
    const mochaTests = {
      suites: {
        'simple failing hook spec': {
          suites: {
            'beforeEach hooks': {
              hooks: [{ type: 'beforeEach', fail: true }],
              tests: ['fails in beforeEach'],
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

    runIsolatedCypress(mochaTests, { config: { retries: 1 } })
    .then(shouldHaveTestResults(1, 3))
    .then(() => {
      cy.contains('.test', 'fails on this').should('have.class', 'runnable-failed')
      .within(() => {
        cy.contains('.command', 'after').should('have.class', 'command-state-failed')
        cy.contains('.runnable-err', 'AssertionError').should('be.visible')
      })

      cy.contains('.test', 'fails in beforeEach').should('have.class', 'runnable-failed')
      .within(() => {
        cy.contains('.command', 'beforeEach').should('have.class', 'command-state-failed')
        // make sure Attempt 1 is collapsed
        cy.get('.attempt-item').first().find('.commands-container').should('not.exist')
      })

      cy.contains('.test', 'is pending').should('have.class', 'runnable-pending')

      cy.contains('.test', 'fails this').should('have.class', 'runnable-failed')
      .within(() => {
        cy.contains('.command', 'afterEach').should('have.class', 'command-state-failed')
        cy.contains('.runnable-err', 'AssertionError').should('be.visible')
      })

      cy.contains('.test', 'does not run this').should('have.class', 'runnable-processing')

      cy.contains('.test', 'runs this').should('have.class', 'runnable-passed')
    })
  })

  // NOTE: for test-retries
  describe('can configure retries', () => {
    it('via config value', () => {
      runIsolatedCypress({
        suites: {
          'suite 1': () => {
            it('[no retry]', { retries: 0 }, () => assert(false))
            it('[1 retry]', { retries: 1 }, () => assert(false))
            it('[2 retries]', { retries: 2 }, () => assert(false))
            it('[open mode, no retry]', { retries: { runMode: 2, openMode: 0 } }, () => assert(false))
            it('[run mode, retry]', { retries: { runMode: 1, openMode: 0 }, isInteractive: false }, () => assert(false))
            it('[open mode, 2 retries]', 2, () => assert(false))
            describe('suite 2', { retries: 1 }, () => {
              it('[set retries on suite]', () => assert(false))
            })
          },
        },
      })

      .then(shouldHaveTestResults(0, 7))
      .then(() => {
        getAttemptTag('[no retry]').should('not.be.visible')
        getAttemptTag('[1 retry]').should('have.length', 2)
        getAttemptTag('[2 retries]').should('have.length', 3)
        //   getAttemptTag('[test-config no retries]').should('not.be.visible')
        //   getAttemptTag('[test-config 1 retry]').should('have.length', 2)
        getAttemptTag('[open mode, no retry]').should('not.be.visible')
        getAttemptTag('[run mode, retry]').should('have.length', 2)
        getAttemptTag('[open mode, 2 retries]').should('have.length', 3)

        getAttemptTag('[set retries on suite]').should('have.length', 2)
      })
    })

    it('throws when set via this.retries in test', () => {
      runIsolatedCypress({
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
        cy.get('.runnable-err').should(containText(`it('test', { retries: n }, () => {...})`))
      })
    })

    it('throws when set via this.retries in hook', () => {
      runIsolatedCypress({
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
        cy.get('.runnable-err').should(containText(`describe('suite', { retries: n }, () => {...})`))
      })
    })

    it('throws when set via this.retries in suite', () => {
      runIsolatedCypress({
        suites: {
          'suite 1' () {
            this.retries(0)
            it('test 1', () => {
            })
          },
        },
      })
      .then(shouldHaveTestResults(0, 1))
      .then(() => {
        cy.get('.runnable-err')
        .should(containText(`describe('suite', { retries: n }, () => {...})`))
      })
    })
  })
})
