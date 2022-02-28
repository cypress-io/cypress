import { loadSpec } from './support/spec-loader'

describe('src/cypress/runner', () => {
  describe('tests finish with correct state', () => {
    it('simple 1 test', () => {
      loadSpec({
        fileName: 'simple-single-test.runner.cy.js',
        passCount: 1,
        failCount: 0,
      })
    })

    it('simple 1 global test', () => {
      loadSpec({
        fileName: 'simple-single-global-test.runner.cy.js',
        passCount: 1,
        failCount: 0,
      })
    })

    it('simple 3 tests', () => {
      loadSpec({
        fileName: 'three-simple-tests.runner.cy.js',
        passCount: 3,
        failCount: 0,
      })
    })

    it('simple fail', () => {
      loadSpec({
        fileName: 'simple-fail.runner.cy.js',
        passCount: 0,
        failCount: 1,
      })

      // render exactly one error
      cy.get('.runnable-err:contains(AssertionError)').should('have.length', 1)
    })

    it('pass fail pass fail', () => {
      loadSpec({
        fileName: 'pass-fail-pass-fail.runner.cy.js',
        passCount: 2,
        failCount: 2,
      })
    })

    it('fail pass', () => {
      loadSpec({
        fileName: 'fail-pass.runner.cy.js',
        passCount: 1,
        failCount: 1,
      })
    })

    it('no tests', () => {
      loadSpec({
        fileName: 'no-tests.runner.cy.js',
        passCount: 0,
        failCount: 0,
      })

      cy.contains('No tests found.').should('be.visible')
      cy.contains('p', 'Cypress could not detect tests in this file.').should('be.visible')
    })

    it('executes nested suite', () => {
      loadSpec({
        fileName: 'nested-suite.runner.cy.js',
        passCount: 3,
        failCount: 0,
      })
    })

    it('simple fail, catch cy.on(fail)', () => {
      loadSpec({
        fileName: 'catch-fail.runner.cy.js',
        passCount: 1,
        failCount: 0,
      })
    })

    it('pins cy assertion when clicked', () => {
      loadSpec({
        fileName: 'simple-cy-assert.runner.cy.js',
        passCount: 1,
        failCount: 0,
      })

      cy.contains('li.command-name-assert', 'assert')
      .find('.command-wrapper')
      .should('not.have.class', 'command-is-pinned')
      .click()
      .should('have.class', 'command-is-pinned')
    })

    it('renders spec name and runtime in header', () => {
      loadSpec({
        fileName: 'simple-cy-assert.runner.cy.js',
        passCount: 1,
        failCount: 0,
        hasPreferredIde: true,
      })

      cy.intercept('mutation-SpecRunnerOpenMode_OpenFileInIDE', { data: { 'openFileInIDE': true } }).as('OpenIDE')

      cy.contains('a', 'simple-cy-assert.runner')
      .click()

      cy.wait('@OpenIDE').then(({ request }) => {
        expect(request.body.variables.input.filePath).to.include('simple-cy-assert.runner.cy.js')
      })

      cy.get('[data-cy="runnable-header"] [data-cy="spec-duration"]').should('exist')
    })

    describe('hook failures', () => {
      describe('test failures w/ hooks', () => {
        it('test [only]', () => {
          loadSpec({
            fileName: 'test-only.runner.cy.js',
            passCount: 1,
            failCount: 0,
          })
        })

        it('test [pending]', () => {
          loadSpec({
            fileName: 'test-pending.runner.cy.js',
            passCount: 0,
            failCount: 0,
            pendingCount: 3,
          })
        })

        it('fail with [before]', () => {
          loadSpec({
            fileName: 'fail-with-before.runner.cy.js',
            passCount: 1,
            failCount: 1,
          })
        })

        it('fail with [after]', () => {
          loadSpec({
            fileName: 'fail-with-after.runner.cy.js',
            passCount: 1,
            failCount: 1,
          })
        })

        it('fail with all hooks', () => {
          loadSpec({
            fileName: 'fail-with-all-hooks.runner.cy.js',
            passCount: 0,
            failCount: 1,
          })
        })
      })
    })
  })

  describe('other specs', () => {
    it('simple failing hook spec', () => {
      loadSpec({
        fileName: 'failing-hooks.runner.cy.js',
        passCount: 1,
        failCount: 3,
        pendingCount: 1,
      })

      cy.contains('.test', 'never gets here').should('have.class', 'runnable-failed')
      cy.contains('.command', 'beforeEach').find('.command-state-failed')
      cy.contains('.runnable-err', 'beforeEach').scrollIntoView().should('be.visible')

      cy.contains('.test', 'is pending').should('have.class', 'runnable-pending')

      cy.contains('.test', 'fails this').should('have.class', 'runnable-failed')
      cy.contains('.command', 'afterEach').find('.command-state-failed')
      cy.contains('.runnable-err', 'afterEach').scrollIntoView().should('be.visible')

      cy.contains('.test', 'does not run this').should('have.class', 'runnable-processing')

      cy.contains('.test', 'runs this').should('have.class', 'runnable-passed')

      cy.contains('.test', 'fails on this').should('have.class', 'runnable-failed')
      cy.contains('.command', 'after').find('.command-state-failed')
      cy.contains('.runnable-err', 'after').scrollIntoView().should('be.visible')
    })

    it('async timeout spec', () => {
      loadSpec({
        fileName: 'async-timeout.runner.cy.js',
        passCount: 0,
        failCount: 1,
      })
    })

    it('scrolls each command into view', () => {
      loadSpec({
        fileName: 'scrolls-command-log.runner.cy.js',
        passCount: 0,
        failCount: 1,
      })

      cy.get('.command-number:contains(25)').should('be.visible')
    })

    it('file with empty suites only displays no tests found', () => {
      loadSpec({
        fileName: 'empty-suites.runner.cy.js',
        passCount: 0,
        failCount: 0,
      })

      cy.get('.reporter').contains('No tests found')
    })
  })

  describe('reporter interaction', () => {
    // https://github.com/cypress-io/cypress/issues/8621
    it('user can stop test execution', () => {
      loadSpec({
        fileName: 'stop-execution.runner.cy.js',
        passCount: 0,
        failCount: 1,
      })

      cy.get('.runnable-err-message').should('not.contain', 'ran afterEach even though specs were stopped')
    })

    // TODO: blocked by UNIFY-1077
    it.skip('supports disabling command log reporter with env var NO_COMMAND_LOG', () => {
      loadSpec({
        fileName: 'disabled-command-log.runner.cy.js',
        passCount: 0,
        failCount: 0,
      })

      cy.get('.reporter').should('not.exist')
    })
  })
})
