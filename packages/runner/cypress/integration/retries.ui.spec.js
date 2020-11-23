const helpers = require('../support/helpers')

const { shouldHaveTestResults, containText } = helpers
const { runIsolatedCypress } = helpers.createCypress({ config: { retries: 2 } })

const getAttemptTag = (sel) => {
  return cy.get(`.test.runnable:contains(${sel}) .attempt-tag`)
}

const shouldBeOpen = ($el) => cy.wrap($el).parentsUntil('.collapsible').last().parent().should('have.class', 'is-open')

const attemptTag = (sel) => `.attempt-tag:contains(Attempt ${sel})`
const cyReject = (fn) => {
  return () => {
    try {
      fn()
    } catch (e) {
      cy.state('reject')(e)
    }
  }
}

describe('runner/cypress retries.ui.spec', { viewportWidth: 600, viewportHeight: 900 }, () => {
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

    cy.get('.test').should('have.length', 2)
    cy.percySnapshot()
  })

  it('collapses prev attempts and keeps final one open on failure', () => {
    runIsolatedCypress({
      suites: {
        'suite 1': {
          tests: [
            { name: 'test 1',
              fail: true,
            },
            { name: 'test 2',

            },
          ],
        },
      },
    }, { config: { retries: 2 } })
    .then(shouldHaveTestResults(1, 1))

    cy.percySnapshot()
  })

  it('can toggle failed prev attempt open and log its error', () => {
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
      cy.contains('Attempt 1')
      .click()
      .closest('.attempt-item')
      .find('.runnable-err-print')
      .click()

      cy.get('@console_error').should('be.calledWithMatch', 'AssertionError: test 2')
    })

    cy.percySnapshot()
  })

  it('opens attempt on each attempt failure for the screenshot, and closes after test passes', { retries: 2 }, () => {
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

          stub = cy.stub().callsFake(cyReject(() => {
            attempt++
            expect(cy.$$('.attempt-item > .is-open').length).to.equal(attempt)
          }))

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
      cy.get(attemptTag(1)).click().parentsUntil('.collapsible').last().parent().within(() => {
        cy.get('.instruments-container').should('contain', 'Spies / Stubs (1)')
        cy.get('.instruments-container').should('contain', 'Routes (1)')
        cy.get('.runnable-err').should('contain', 'AssertionError')
      })

      cy.get(attemptTag(2)).click().parentsUntil('.collapsible').last().parent().within(() => {
        cy.get('.instruments-container').should('contain', 'Spies / Stubs (2)')
        cy.get('.instruments-container').should('contain', 'Routes (2)')
        cy.get('.runnable-err').should('contain', 'AssertionError')
      })

      cy.get(attemptTag(3)).parentsUntil('.collapsible').last().parent().within(() => {
        cy.get('.instruments-container').should('contain', 'Spies / Stubs (2)')
        cy.get('.instruments-container').should('contain', 'Routes (2)')
        cy.get('.runnable-err').should('not.exist')
      })
    })

    cy.percySnapshot()
  })

  describe('only', () => {
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
      .then(() => {
        cy.contains('test 2')
        cy.contains('test 1').should('not.exist')
        cy.contains('test 3').should('not.exist')
      })

      cy.percySnapshot()
    })
  })

  describe('beforeAll', () => {
    // TODO: make beforeAll hooks retry
    it('tests do not retry when beforeAll fails', () => {
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
            tests: ['test 1'],
          },
        },
      }, { config: { retries: 1 } })
      .then(shouldHaveTestResults(0, 1))
      .then(() => {
        cy.contains('Although you have test retries')
      })

      cy.percySnapshot()
    })

    // TODO: future versions should run all hooks associated with test on retry
    it('before all hooks are not run on the second attempt when fails outside of beforeAll', () => {
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
        cy.contains('before all').should('not.exist')
      })

      cy.percySnapshot()
    })
  })

  describe('beforeEach', () => {
    it('beforeEach hooks retry on failure, but only run same-level afterEach hooks', () => {
      runIsolatedCypress({
        hooks: [{ type: 'beforeEach', fail: 1 }],
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
      }, { config: { retries: 2 } })
      .then(shouldHaveTestResults(1, 0))
      .then(() => {
        cy.contains('Attempt 1').click()
        cy.get('.attempt-1 .hook-item .collapsible:contains(before each)').find('.command-state-failed')
        cy.get('.attempt-1 .hook-item .collapsible:contains(before each (2))').should('not.exist')
        cy.get('.attempt-1 .hook-item .collapsible:contains(test body)').should('not.exist')
        cy.get('.attempt-1 .hook-item .collapsible:contains(after each)').should('not.exist')
        cy.get('.attempt-1 .hook-item .collapsible:contains(after all)').should('not.exist')

        cy.contains('Attempt 2').click()
        cy.get('.attempt-2 .hook-item .collapsible:contains(before each)')
        cy.get('.attempt-2 .hook-item .collapsible:contains(before each (2))')
        cy.get('.attempt-2 .hook-item .collapsible:contains(before each (3))').find('.command-state-failed')
        cy.get('.attempt-2 .hook-item .collapsible:contains(test body)').should('not.exist')
        cy.get('.attempt-2 .hook-item .collapsible:contains(after each)')
        cy.get('.attempt-2 .hook-item .collapsible:contains(after all)').should('not.exist')

        cy.get('.attempt-3 .hook-item .collapsible:contains(before each)')
        cy.get('.attempt-3 .hook-item .collapsible:contains(before each (2))')
        cy.get('.attempt-3 .hook-item .collapsible:contains(before each (3))')
        cy.get('.attempt-3 .hook-item .collapsible:contains(before each (4))')
        cy.get('.attempt-3 .hook-item .collapsible:contains(test body)')
        cy.get('.attempt-3 .hook-item .collapsible:contains(after each)')
        cy.get('.attempt-3 .hook-item .collapsible:contains(after all)')
      })

      cy.percySnapshot()
    })

    it('beforeEach retried tests skip remaining tests in suite', () => {
      runIsolatedCypress({ suites: {
        'beforeEach hooks': {
          hooks: [{ type: 'beforeEach', fail: true }],
          tests: ['fails in beforeEach', 'skips this'],
        },

      } }, { config: { retries: 1 } })
      .then(shouldHaveTestResults(0, 1, 0))

      cy.percySnapshot()
    })
  })

  describe('afterEach', () => {
    it('afterEach hooks retry on failure, but only run higher-level afterEach hooks', () => {
      runIsolatedCypress({
        hooks: [{ type: 'afterEach', fail: 2 }],
        suites: {
          's1': {
            hooks: [{ type: 'afterEach', fail: 1 }, 'afterEach', 'after'],
            tests: ['t1'],
          },

        },
      }, { config: { retries: 2 } })
      .then(shouldHaveTestResults(1, 0))
      .then(() => {
        cy.contains('Attempt 1')
        .click()
        .then(shouldBeOpen)

        cy.get('.attempt-1 .hook-item .collapsible:contains(after each (1))').find('.command-state-failed')
        cy.get('.attempt-1 .hook-item .collapsible:contains(after each (2))')
        cy.get('.attempt-1 .hook-item .collapsible:contains(after each (3))').should('not.exist')
        cy.get('.attempt-1 .hook-item .collapsible:contains(after all)').should('not.exist')

        cy.contains('Attempt 2').click()
        .then(shouldBeOpen)

        cy.get('.attempt-2 .hook-item .collapsible:contains(after each (1))')
        cy.get('.attempt-2 .hook-item .collapsible:contains(after each (2))')
        cy.get('.attempt-2 .hook-item .collapsible:contains(after each (3))').find('.command-state-failed')
        cy.get('.attempt-2 .hook-item .collapsible:contains(after all)').should('not.exist')

        cy.get('.attempt-tag').should('have.length', 3)
        cy.get('.attempt-2 .hook-item .collapsible:contains(after each (1))')
        cy.get('.attempt-2 .hook-item .collapsible:contains(after each (2))')
        cy.get('.attempt-2 .hook-item .collapsible:contains(after each (3))')
        cy.get('.attempt-3 .hook-item .collapsible:contains(after all)')
      })

      cy.percySnapshot()
    })

    it('afterEach retried tests skip remaining tests in suite', () => {
      runIsolatedCypress({ suites: {
        'afterEach hooks': {
          hooks: [{ type: 'afterEach', fail: true }],
          tests: ['fails in afterEach', 'skips this'],
        },

      } }, { config: { retries: 1 } })
      .then(shouldHaveTestResults(0, 1, 0))

      cy.percySnapshot()
    })
  })

  describe('afterAll', () => {
    it('only run afterAll hook on last attempt', () => {
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
              { name: 'test 2' },
              { name: 'test 3', fail: 1 },
            ],
          },
        },
      }, { config: { retries: 1 } })
      .then(shouldHaveTestResults(3, 0))
      .then(() => {
        cy.contains('test 3').click()
        getAttemptTag('test 3').first().click()
        cy.contains('.attempt-1', 'after all').should('not.exist')
        cy.contains('.attempt-2', 'after all')
      })
    })

    it('tests do not retry when afterAll fails', () => {
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

      cy.percySnapshot()
    })
  })

  describe('can configure retries', () => {
    const haveCorrectError = ($el) => cy.wrap($el).last().parentsUntil('.collapsible').last().parent().find('.runnable-err').should('contain', 'Unspecified AssertionError')

    it('via config value', () => {
      runIsolatedCypress({
        suites: {
          'suite 1': () => {
            it('[no retry]', { retries: 0 }, () => assert(false))
            it('[1 retry]', { retries: 1 }, () => assert(false))
            it('[2 retries]', { retries: 2 }, () => assert(false))
            it('[open mode, no retry]', { retries: { runMode: 2, openMode: 0 } }, () => assert(false))
            it('[run mode, retry]', { retries: { runMode: 1, openMode: 0 }, isInteractive: false }, () => assert(false))
            it('[open mode, 2 retries]', { isInteractive: true }, () => assert(false))
            describe('suite 2', { retries: 1 }, () => {
              it('[set retries on suite]', () => assert(false))
            })
          },
        },
      })
      .then(shouldHaveTestResults(0, 7))
      .then(() => {
        getAttemptTag('[no retry]').should('have.length', 1).then(haveCorrectError)
        getAttemptTag('[1 retry]').should('have.length', 2).then(haveCorrectError)
        getAttemptTag('[2 retries]').should('have.length', 3).then(haveCorrectError)
        getAttemptTag('[open mode, no retry]').should('have.length', 1).then(haveCorrectError)
        getAttemptTag('[run mode, retry]').should('have.length', 2).then(haveCorrectError)
        getAttemptTag('[open mode, 2 retries]').should('have.length', 3).then(haveCorrectError)
        getAttemptTag('[set retries on suite]').should('have.length', 2).then(haveCorrectError)
      })
    })

    it('throws when set via this.retries in test', () => {
      runIsolatedCypress({
        suites: {
          'suite 1' () {
            it('tries to set mocha retries', function () {
              this.retries(null)
            })
          },
        },
      })
      .then(shouldHaveTestResults(0, 1))
      .then(() => {
        cy.get('.runnable-err').should(containText(`it('tries to set mocha retries', { retries: 2 }, () => `))
      })

      cy.percySnapshot()
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
        cy.get('.runnable-err').should(containText(`describe('suite 1', { retries: 0 }, () => `))
      })

      cy.percySnapshot()
    })

    it('throws when set via this.retries in suite', () => {
      runIsolatedCypress({
        suites: {
          'suite 1' () {
            this.retries(3)
            it('test 1', () => {
            })
          },
        },
      })
      .then(shouldHaveTestResults(0, 1))
      .then(() => {
        cy.get('.runnable-err')
        .should(containText(`describe('suite 1', { retries: 3 }, () => `))
      })

      cy.percySnapshot()
    })
  })
})
