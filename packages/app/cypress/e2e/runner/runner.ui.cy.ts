import * as specLoader from './support/spec-loader'

describe('src/cypress/runner', () => {
  describe('tests finish with correct state', () => {
    it('simple 1 test', () => {
      specLoader.loadSpec({
        fileName: 'simple-single-test.runner.cy.js',
        passCount: 1,
        failCount: 0,
      })
    })

    it('simple 1 global test', () => {
      specLoader.loadSpec({
        fileName: 'simple-single-global-test.runner.cy.js',
        passCount: 1,
        failCount: 0,
      })
    })

    it('simple 3 tests', () => {
      specLoader.loadSpec({
        fileName: 'three-simple-tests.runner.cy.js',
        passCount: 3,
        failCount: 0,
      })
    })

    it('simple fail', () => {
      specLoader.loadSpec({
        fileName: 'simple-fail.runner.cy.js',
        passCount: 0,
        failCount: 1,
      })

      // render exactly one error
      cy.get('.runnable-err:contains(AssertionError)').should('have.length', 1)
    })

    it('pass fail pass fail', () => {
      specLoader.loadSpec({
        fileName: 'pass-fail-pass-fail.runner.cy.js',
        passCount: 2,
        failCount: 2,
      })
    })

    it('fail pass', () => {
      specLoader.loadSpec({
        fileName: 'fail-pass.runner.cy.js',
        passCount: 1,
        failCount: 1,
      })
    })

    it('no tests', () => {
      specLoader.loadSpec({
        fileName: 'no-tests.runner.cy.js',
        passCount: 0,
        failCount: 0,
      })

      cy.contains('No tests found.').should('be.visible')
      cy.contains('p', 'Cypress could not detect tests in this file.').should('be.visible')
    })

    it('executes nested suite', () => {
      specLoader.loadSpec({
        fileName: 'nested-suite.runner.cy.js',
        passCount: 3,
        failCount: 0,
      })
    })

    it('simple fail, catch cy.on(fail)', () => {
      specLoader.loadSpec({
        fileName: 'catch-fail.runner.cy.js',
        passCount: 1,
        failCount: 0,
      })
    })

    describe('hook failures', () => {
      describe('test failures w/ hooks', () => {
        it('test [only]', () => {
          specLoader.loadSpec({
            fileName: 'test-only.runner.cy.js',
            passCount: 1,
            failCount: 0,
          })
        })

        it('test [pending]', () => {
          specLoader.loadSpec({
            fileName: 'test-pending.runner.cy.js',
            passCount: 0,
            failCount: 0,
            pendingCount: 3,
          })
        })

        it('fail with [before]', () => {
          specLoader.loadSpec({
            fileName: 'fail-with-before.runner.cy.js',
            passCount: 1,
            failCount: 1,
          })
        })

        it('fail with [after]', () => {
          specLoader.loadSpec({
            fileName: 'fail-with-after.runner.cy.js',
            passCount: 1,
            failCount: 1,
          })
        })

        it('fail with all hooks', () => {
          specLoader.loadSpec({
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
      specLoader.loadSpec({
        fileName: 'failing-hooks.runner.cy.js',
        passCount: 1,
        failCount: 3,
        pendingCount: 1,
      })

      cy.contains('.test', 'never gets here').should('have.class', 'runnable-failed')
      cy.contains('.command', 'beforeEach').should('have.class', 'command-state-failed')
      cy.contains('.runnable-err', 'beforeEach').scrollIntoView().should('be.visible')

      cy.contains('.test', 'is pending').should('have.class', 'runnable-pending')

      cy.contains('.test', 'fails this').should('have.class', 'runnable-failed')
      cy.contains('.command', 'afterEach').should('have.class', 'command-state-failed')
      cy.contains('.runnable-err', 'afterEach').scrollIntoView().should('be.visible')

      cy.contains('.test', 'does not run this').should('have.class', 'runnable-processing')

      cy.contains('.test', 'runs this').should('have.class', 'runnable-passed')

      cy.contains('.test', 'fails on this').should('have.class', 'runnable-failed')
      cy.contains('.command', 'after').should('have.class', 'command-state-failed')
      cy.contains('.runnable-err', 'after').scrollIntoView().should('be.visible')
    })

    it('async timeout spec', () => {
      specLoader.loadSpec({
        fileName: 'async-timeout.runner.cy.js',
        passCount: 0,
        failCount: 1,
      })
    })

    it('scrolls each command into view', () => {
      specLoader.loadSpec({
        fileName: 'scrolls-command-log.runner.cy.js',
        passCount: 0,
        failCount: 1,
      })

      cy.get('.command-number:contains(25)').should('be.visible')
    })

    it('file with empty suites only displays no tests found', () => {
      specLoader.loadSpec({
        fileName: 'empty-suites.runner.cy.js',
        passCount: 0,
        failCount: 0,
      })

      cy.get('.reporter').contains('No tests found')
    })
  })

  // TODO: determine coverage provided by inflight changes
  // describe('runner header', () => {
  //   context('viewport dropdown', () => {
  //     it('shows on click', () => {
  //       runIsolatedCypress({})
  //       cy.get('.viewport-menu').should('not.be.visible')
  //       cy.get('.viewport-info button').click()
  //       cy.get('.viewport-menu').should('be.visible')

  //       cy.percySnapshot()
  //     })
  //   })

  //   context('selector playground', () => {
  //     it('shows on click', () => {
  //       runIsolatedCypress({})

  //       cy.get('.selector-playground').should('not.be.visible')
  //       cy.get('.selector-playground-toggle').click()
  //       cy.get('.selector-playground').should('be.visible')

  //       cy.percySnapshot()
  //     })

  //     it('closes on restart', () => {
  //       runIsolatedCypress({})

  //       cy.get('.selector-playground-toggle').click()
  //       cy.get('.selector-playground').should('be.visible')

  //       cy.get('.restart').click()
  //       cy.get('.selector-playground').should('not.be.visible')
  //     })
  //   })
  // })

  describe('reporter interaction', () => {
    // https://github.com/cypress-io/cypress/issues/8621
    it('user can stop test execution', () => {
      specLoader.loadSpec({
        fileName: 'stop-execution.runner.cy.js',
        passCount: 0,
        failCount: 1,
      })

      cy.get('.runnable-err-message').should('not.contain', 'ran afterEach even though specs were stopped')
    })

    // TODO: determine intended function in new runner
    // it('supports disabling command log reporter with env var NO_COMMAND_LOG', () => {
    //   specLoader.loadSpec({
    //     fileName: 'disabled-command-log.runner.cy.js',
    //     passCount: 0,
    //     failCount: 0,
    //   })

    //   cy.get('.reporter').should('not.exist')
    // })
  })
})
