import { loadSpec } from './support/spec-loader'
import { snapshotReporter } from './support/snapshot-reporter'

// Returns wrapped attempt tag found within runnable containing selector
const getAttemptTag = (sel: string) => {
  return cy.get(`.test.runnable:contains(${sel}) .attempt-tag`)
}

describe('runner/cypress retries.ui.spec', {
  viewportWidth: 1024,
  viewportHeight: 900,
  numTestsKeptInMemory: 1,
}, () => {
  afterEach(() => {
    // @ts-ignore
    if (cy.state('test').state === 'passed') {
      snapshotReporter()
    }
  })

  it('collapses tests that retry and pass', () => {
    loadSpec({
      filePath: 'retries/collapse-after-pass.retries.cy.js',
      passCount: 2,
      failCount: 0,
    })

    cy.get('.test').should('have.length', 2)
  })

  it('collapses prev attempts and keeps final one open on failure', () => {
    loadSpec({
      filePath: 'retries/collapse-prev-attempts.retries.cy.js',
      passCount: 1,
      failCount: 1,
    })

    cy.get('.runnable-err-print').should('be.visible')
  })

  it('can toggle failed prev attempt open and log its error', { viewportHeight: 1200 }, () => {
    loadSpec({
      filePath: 'retries/all-retry-one-failure.retries.cy.js',
      passCount: 2,
      failCount: 1,
    })

    cy.window().then((win) => {
      cy.spy(win.console, 'error').as('console_error')
    })

    cy.contains('Attempt 1')
    .click()
    .closest('.attempt-item')
    .find('.runnable-err-print')
    .click()

    cy.get('@console_error').should('be.calledWithMatch', 'AssertionError: test 2')
  })

  // TODO: Determine how best to access the inner Cypress instance prior to test execution
  // spy on its actions during the test run (https://cypress-io.atlassian.net/browse/UNIFY-1153)
  it.skip('opens attempt on each attempt failure for the screenshot, and closes after test passes', () => {
    let stub
    const cyReject = (fn) => {
      return () => {
        try {
          fn()
        } catch (e) {
          // @ts-ignore
          cy.fail(e)
        }
      }
    }

    loadSpec({
      filePath: 'retries/opens-attempt-for-screenshot.retries.cy.js',
      passCount: 3,
      failCount: 0,
      setup: () => {
        let attempt = 0

        stub = cy.stub().callsFake(cyReject(() => {
          attempt++
          expect(cy.$$('.attempt-item > .is-open').length).to.equal(attempt)
        }))

        cy.window().then((win) => {
          // @ts-ignore
          win.Cypress.Screenshot.onAfterScreenshot = stub
        })
      },
    })

    cy.get('.test.runnable:contains(t2)').then(($el) => {
      expect($el).not.class('is-open')
      expect(stub).callCount(3)
    })
  })

  it('includes routes, spies, hooks, and commands in attempt', () => {
    const attemptTag = (sel) => `.attempt-tag:contains(Attempt ${sel})`

    loadSpec({
      filePath: 'retries/includes-all-in-attempt.retries.cy.js',
      passCount: 1,
      failCount: 0,
    })

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

  describe('only', () => {
    it('test retry with [only]', () => {
      loadSpec({
        filePath: 'retries/only.retries.cy.js',
        passCount: 1,
        failCount: 0,
      })

      cy.contains('test 2')
      cy.contains('test 1').should('not.exist')
      cy.contains('test 3').should('not.exist')
    })
  })

  describe('beforeAll', () => {
    it('tests do not retry when beforeAll fails', () => {
      loadSpec({
        filePath: 'retries/before-all-failure.retries.cy.js',
        passCount: 0,
        failCount: 1,
      })

      cy.contains('Although you have test retries')
    })

    it('before all hooks are not run on the second attempt when fails outside of beforeAll', () => {
      loadSpec({
        filePath: 'retries/before-all-called-once.retries.cy.js',
        passCount: 1,
        failCount: 0,
      })

      cy.contains('test')
      cy.contains('after all')
      cy.contains('before all').should('not.exist')
    })
  })

  describe('beforeEach', () => {
    it('beforeEach hooks retry on failure, but only run same-level afterEach hooks', { viewportHeight: 1550 }, () => {
      loadSpec({
        filePath: 'retries/before-each-failure.retries.cy.js',
        passCount: 1,
        failCount: 0,
      })

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

    it('beforeEach retried tests skip remaining tests in suite', () => {
      loadSpec({
        filePath: 'retries/before-each-skip.retries.cy.js',
        passCount: 0,
        failCount: 1,
        pendingCount: 0,
      })

      // ensure the page is loaded before taking snapshot
      cy.contains('skips this')
    })
  })

  describe('afterEach', () => {
    it('afterEach hooks retry on failure, but only run higher-level afterEach hooks', () => {
      const shouldBeOpen = ($el) => cy.wrap($el).parentsUntil('.collapsible').last().parent().should('have.class', 'is-open')

      loadSpec({
        filePath: 'retries/after-each-failure.retries.cy.js',
        passCount: 1,
        failCount: 0,
      })

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

    it('afterEach retried tests skip remaining tests in suite', () => {
      loadSpec({
        filePath: 'retries/after-each-skip.retries.cy.js',
        passCount: 0,
        failCount: 1,
        pendingCount: 0,
      })
    })
  })

  describe('afterAll', () => {
    it('only run afterAll hook on last attempt', () => {
      loadSpec({
        filePath: 'retries/after-all-once.retries.cy.js',
        passCount: 3,
        failCount: 0,
      })

      cy.contains('test 3').click()
      getAttemptTag('test 3').first().click()
      cy.contains('.attempt-1', 'after all').should('not.exist')
      cy.contains('.attempt-2', 'after all')
    })

    it('tests do not retry when afterAll fails', () => {
      loadSpec({
        filePath: 'retries/after-all-failure.retries.cy.js',
        passCount: 0,
        failCount: 1,
      })

      cy.window().then((win) => {
        cy.spy(win.console, 'error').as('console_error')
      })

      cy.contains('Although you have test retries')
      cy.get('.runnable-err-print').click()
      cy.get('@console_error').its('lastCall').should('be.calledWithMatch', 'Error')
    })
  })

  describe('can configure retries', () => {
    after(() => {
      // @ts-ignore
      window.top.__cySkipValidateConfig = false
    })

    const haveCorrectError = ($el) => {
      return (
        cy.wrap($el).last().parentsUntil('.collapsible').last().parent()
        .find('.runnable-err').should('contain', 'Unspecified AssertionError')
      )
    }

    const containText = (text) => {
      return (($el) => {
        expect($el[0]).property('innerText').contain(text)
      })
    }

    // @ts-ignore
    window.top.__cySkipValidateConfig = true

    it('via config value', () => {
      loadSpec({
        filePath: 'retries/configure-retries.retries.cy.js',
        passCount: 0,
        failCount: 7,
      })

      getAttemptTag('[no retry]').should('have.length', 1).then(haveCorrectError)
      getAttemptTag('[1 retry]').should('have.length', 2).then(haveCorrectError)
      getAttemptTag('[2 retries]').should('have.length', 3).then(haveCorrectError)
      getAttemptTag('[open mode, no retry]').should('have.length', 1).then(haveCorrectError)
      getAttemptTag('[run mode, retry]').should('have.length', 2).then(haveCorrectError)
      getAttemptTag('[open mode, 2 retries]').should('have.length', 3).then(haveCorrectError)
      getAttemptTag('[set retries on suite]').should('have.length', 2).then(haveCorrectError)
    })

    it('throws when set via this.retries in test', () => {
      loadSpec({
        filePath: 'retries/configure-in-test.retries.cy.js',
        passCount: 0,
        failCount: 1,
      })

      cy.get('.runnable-err')
      .should(containText(`it('tries to set mocha retries', { retries: 2 }, () => `))
    })

    it('throws when set via this.retries in hook', () => {
      loadSpec({
        filePath: 'retries/configure-in-hook.retries.cy.js',
        passCount: 0,
        failCount: 1,
      })

      cy.get('.runnable-err')
      .should(containText(`describe('suite 1', { retries: 0 }, () => `))
    })

    it('throws when set via this.retries in suite', () => {
      loadSpec({
        filePath: 'retries/configure-in-suite.retries.cy.js',
        passCount: 0,
        failCount: 1,
      })

      cy.get('.runnable-err')
      .should(containText(`describe('suite 1', { retries: 3 }, () => `))
    })
  })
})
