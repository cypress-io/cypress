import { loadSpec } from './support/spec-loader'
import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'

describe('src/cypress/runner', () => {
  describe('tests finish with correct state', () => {
    it('simple 1 test', () => {
      loadSpec({
        filePath: 'runner/simple-single-test.runner.cy.js',
        passCount: 1,
        failCount: 0,
      })
    })

    it('simple 1 global test', () => {
      loadSpec({
        filePath: 'runner/simple-single-global-test.runner.cy.js',
        passCount: 1,
        failCount: 0,
      })
    })

    it('simple 3 tests', () => {
      loadSpec({
        filePath: 'runner/three-simple-tests.runner.cy.js',
        passCount: 3,
        failCount: 0,
      })
    })

    it('simple fail', () => {
      loadSpec({
        filePath: 'runner/simple-fail.runner.cy.js',
        passCount: 0,
        failCount: 1,
      })

      // render exactly one error
      cy.get('.runnable-err:contains(AssertionError)').should('have.length', 1)
    })

    it('pass fail pass fail', () => {
      loadSpec({
        filePath: 'runner/pass-fail-pass-fail.runner.cy.js',
        passCount: 2,
        failCount: 2,
      })
    })

    it('fail pass', () => {
      loadSpec({
        filePath: 'runner/fail-pass.runner.cy.js',
        passCount: 1,
        failCount: 1,
      })
    })

    it('no tests', () => {
      loadSpec({
        filePath: 'runner/no-tests.runner.cy.js',
        passCount: 0,
        failCount: 0,
      })

      cy.contains('No tests found.').should('be.visible')
      cy.contains('p', 'Cypress could not detect tests in this file.').should('be.visible')
    })

    it('executes nested suite', () => {
      loadSpec({
        filePath: 'runner/nested-suite.runner.cy.js',
        passCount: 3,
        failCount: 0,
      })
    })

    it('simple fail, catch cy.on(fail)', () => {
      loadSpec({
        filePath: 'runner/catch-fail.runner.cy.js',
        passCount: 1,
        failCount: 0,
      })
    })

    it('pins cy assertion when clicked', () => {
      loadSpec({
        filePath: 'runner/simple-cy-assert.runner.cy.js',
        passCount: 1,
        failCount: 0,
      })

      cy.contains('li.command-name-assert', 'assert')
      .find('.command-wrapper')
      .should('not.have.class', 'command-is-pinned')
      .click()
      .should('have.class', 'command-is-pinned')
    })

    it('correctly resets highlight toggle state when pinning new command', () => {
      loadSpec({
        filePath: 'runner/simple-cy-snapshot.runner.cy.js',
        passCount: 3,
        failCount: 0,
      })

      cy.findByText('clicks button').click()

      // pin command that features highlights
      cy.contains('li.command-name-click', 'click')
      .find('.command-wrapper')
      .should('not.have.class', 'command-is-pinned')
      .click()
      .should('have.class', 'command-is-pinned')

      const { highlightsLabel } = defaultMessages.runner.snapshot

      // disable highlights
      cy.findByLabelText(highlightsLabel)
      .should('have.attr', 'aria-checked', 'true')
      .click()
      .should('have.attr', 'aria-checked', 'false')

      // pin another command, expect highlights be enabled for new snapshot
      cy.contains('li.command-name-get', 'get')
      .find('.command-wrapper')
      .should('not.have.class', 'command-is-pinned')
      .click()
      .should('have.class', 'command-is-pinned')

      cy.findByLabelText(highlightsLabel)
      .should('have.attr', 'aria-checked', 'true')
    })

    it('correctly resets named snapshot toggle state when pinning new command', () => {
      loadSpec({
        filePath: 'runner/simple-cy-snapshot.runner.cy.js',
        passCount: 3,
        failCount: 0,
      })

      cy.findByText('clicks button').click()

      // pin command that features multiple snapshots
      cy.contains('li.command-name-click', 'click')
      .find('.command-wrapper')
      .click()
      .should('have.class', 'command-is-pinned')

      // change active snapshot
      cy.get('[data-cy-active-snapshot-toggle="true"').should('contain', 'before')
      cy.get('[data-cy="snapshot-toggle"]').contains('after').click()
      cy.get('[data-cy-active-snapshot-toggle="true"').should('contain', 'after')

      // pin another command, expect active snapshot index to be reset
      cy.contains('li.command-name-type', 'type')
      .find('.command-wrapper')
      .click()
      .should('have.class', 'command-is-pinned')

      cy.get('[data-cy-active-snapshot-toggle="true"').should('contain', 'before')
    })

    it('renders spec name and runtime in header', () => {
      loadSpec({
        filePath: 'runner/simple-cy-assert.runner.cy.js',
        passCount: 1,
        failCount: 0,
        hasPreferredIde: true,
      })

      cy.withCtx((ctx, o) => {
        o.sinon.stub(ctx.actions.file, 'openFile')
      })

      cy.contains('a', 'simple-cy-assert.runner')
      .click()

      cy.withCtx((ctx, o) => {
        expect(ctx.actions.file.openFile).to.have.been.calledWith(o.sinon.match(new RegExp(`simple-cy-assert\.runner\.cy\.js$`)), 1, 1)
      })

      cy.get('[data-cy="runnable-header"] [data-cy="spec-duration"]').should('exist')
    })

    describe('hook failures', () => {
      describe('test failures w/ hooks', () => {
        it('test [only]', () => {
          loadSpec({
            filePath: 'runner/test-only.runner.cy.js',
            passCount: 1,
            failCount: 0,
          })
        })

        it('test [pending]', () => {
          loadSpec({
            filePath: 'runner/test-pending.runner.cy.js',
            passCount: 0,
            failCount: 0,
            pendingCount: 3,
          })
        })

        it('fail with [before]', () => {
          loadSpec({
            filePath: 'runner/fail-with-before.runner.cy.js',
            passCount: 1,
            failCount: 1,
          })
        })

        it('fail with [after]', () => {
          loadSpec({
            filePath: 'runner/fail-with-after.runner.cy.js',
            passCount: 1,
            failCount: 1,
          })
        })

        it('fail with all hooks', () => {
          loadSpec({
            filePath: 'runner/fail-with-all-hooks.runner.cy.js',
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
        filePath: 'runner/failing-hooks.runner.cy.js',
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
        filePath: 'runner/async-timeout.runner.cy.js',
        passCount: 0,
        failCount: 1,
      })
    })

    it('scrolls each command into view', () => {
      loadSpec({
        filePath: 'runner/scrolls-command-log.runner.cy.js',
        passCount: 0,
        failCount: 1,
      })

      cy.get('.command-number-column:contains(25)').should('be.visible')
    })

    it('file with empty suites only displays no tests found', () => {
      loadSpec({
        filePath: 'runner/empty-suites.runner.cy.js',
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
        filePath: 'runner/stop-execution.runner.cy.js',
        passCount: 0,
        failCount: 1,
      })

      cy.get('.runnable-err-message').should('not.contain', 'ran afterEach even though specs were stopped')
      cy.get('.runnable-err-message').should('contain', 'Cypress test was stopped while running this command.')
    })
  })
})
