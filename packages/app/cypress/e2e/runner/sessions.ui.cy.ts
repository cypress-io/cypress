import { loadSpec } from './support/spec-loader'
import { snapshotReporter } from './support/snapshot-reporter'

const validateSessionsInstrumentPanel = (sessionIds: Array<string> = []) => {
  cy.get('.sessions-container')
  // there could be multiple retries where multiple session containers are rendered
  .first()
  .should('contain', `Sessions (${sessionIds.length})`)
  .as('instrument_panel')
  .click()

  sessionIds.forEach((id) => {
    cy.contains('.sessions-container', id)
  })
}

const validateSetupSessionGroup = (isNewSession = true) => {
  const groupText = isNewSession ? 'Create new session' : 'Recreate session'

  cy.contains(groupText).closest('.command').as('setupSession')
  cy.get('@setupSession').find('.command-expander').click()
  cy.get('@setupSession').find('.command-alias').contains('runSetup')

  return cy.get('@setupSession')
}

describe('runner/cypress sessions.ui.spec', {
  // Limiting tests kept in memory due to large memory cost
  // of nested spec snapshots
  numTestsKeptInMemory: 0,
  viewportWidth: 1000,
  viewportHeight: 1000,
}, () => {
  afterEach(function () {
    // @ts-ignore
    if (cy.state('test').state === 'passed') {
      snapshotReporter()
    }
  })

  it('creates new session', () => {
    loadSpec({
      projectName: 'session-and-origin-e2e-specs',
      filePath: 'session/new_session.cy.js',
      passCount: 1,
    })

    validateSessionsInstrumentPanel(['user1'])

    cy.get('.command-name-session')
    .within(() => {
      cy.get('.command-expander').first().click()
      cy.contains('user1')
      cy.contains('created')

      validateSetupSessionGroup()
    })

    // cy.percySnapshot() // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435

    cy.get('.command-name-session').eq(0).get('.command-expander').first().click()
    cy.get('.command').should('have.length', 2)
  })

  it('creates new session with validation', () => {
    loadSpec({
      projectName: 'session-and-origin-e2e-specs',
      filePath: 'session/new_session_with_validation.cy.js',
      passCount: 1,
    })

    validateSessionsInstrumentPanel(['blank_session'])

    cy.get('.command-name-session')
    .within(() => {
      cy.get('.command-expander').first().click()
      cy.contains('blank_session')
      cy.contains('created')

      validateSetupSessionGroup()

      cy.contains('Validate session')
      .closest('.command').as('validateSession')

      cy.get('@validateSession')
      .find('.command-expander')
      .click()

      cy.get('@validateSession')
      .find('.command-alias')
      .contains('runValidation')
    })

    // cy.percySnapshot() // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435

    cy.get('.command-name-session').eq(0).get('.command-expander').first().click()

    cy.get('.command').should('have.length', 2)
  })

  it('creates new session and fails validation', () => {
    loadSpec({
      projectName: 'session-and-origin-e2e-specs',
      filePath: 'session/new_session_and_fails_validation.cy.js',
      failCount: 1,
    })

    validateSessionsInstrumentPanel(['blank_session'])

    cy.get('.command-name-session')
    .first()
    .within(() => {
      cy.contains('blank_session')
      cy.contains('failed')

      validateSetupSessionGroup()

      cy.contains('Validate session')
      .closest('.command').as('validateSession')

      cy.get('@validateSession')
      .find('.command-expander')
      .should('have.class', 'command-expander-is-open')

      cy.get('@validateSession')
      .find('.command-alias')
      .contains('runValidation')
    })

    cy.contains('AssertionError')

    // cy.percySnapshot() // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435
  })

  // https://github.com/cypress-io/cypress/issues/24208
  it('does not save session when validation fails', () => {
    loadSpec({
      projectName: 'session-and-origin-e2e-specs',
      filePath: 'session/new_session_and_fails_validation_retries.cy.js',
      failCount: 1,
    })

    validateSessionsInstrumentPanel(['blank_session'])

    cy.contains('Attempt 1').click()
    cy.get('.attempt-item').eq(0).within(() => {
      cy.contains('validation error')
    })

    cy.get('.attempt-item').eq(1).within(() => {
      cy.contains('validation error')
      // when we stored sessions pre-validation, the 2nd attempt would fail
      // with this error instead of the validation failing again
      cy.contains('session already exists').should('not.exist')
    })
  })

  it('creates, not recreates, session when validation fails then succeeds', () => {
    loadSpec({
      projectName: 'session-and-origin-e2e-specs',
      filePath: 'session/new_session_and_fails_then_succeeds_validation_retries.cy.js',
      failCount: 1,
    })

    validateSessionsInstrumentPanel(['blank_session'])

    cy.get('.attempt-item').eq(1).within(() => {
      cy.contains('Create new session')
      // when we stored sessions pre-validation, the 2nd attempt would
      // say "Recreate session"
      cy.contains('Recreate session').should('not.exist')
    })
  })

  it('restores session as expected', () => {
    loadSpec({
      projectName: 'session-and-origin-e2e-specs',
      filePath: 'session/restores_saved_session.cy.js',
      passCount: 2,
    })

    cy.get('.test').each(($el, index) => {
      if (index < 5) { // don't click on failed test
        cy.wrap($el).click()
      }
    })

    cy.log('validate new session was created in first test')
    cy.get('.test').eq(0).within(() => {
      validateSessionsInstrumentPanel(['user1'])
      cy.get('.command-name-session').contains('created')
    })

    cy.log('validate saved session was used in second test')
    cy.get('.test').eq(1).within(() => {
      validateSessionsInstrumentPanel(['user1'])
      cy.get('.command-name-session')
      .within(() => {
        cy.get('.command-expander').first().click()
        cy.contains('user1')
        cy.contains('restored')

        cy.get('.command-name-Clear-page').should('have.length', 2)

        cy.contains('Restore saved session')

        cy.contains('Validate session')
        .closest('.command').as('validateSession')

        cy.get('@validateSession')
        .find('.command-expander')
        .should('not.have.class', 'command-expander-is-open')
        .click()

        cy.get('@validateSession')
        .find('.command-alias')
        .contains('runValidation')
      })

      cy.get('.command-name-session').get('.command-expander').first().click()

      cy.get('.command').should('have.length', 2)
    })
  })

  it('recreates session', () => {
    loadSpec({
      projectName: 'session-and-origin-e2e-specs',
      filePath: 'session/recreates_session.cy.js',
      passCount: 2,
    })

    cy.get('.test').each(($el) => cy.wrap($el).click())

    cy.log('validate new session was created in first test')
    cy.get('.test').eq(0).within(() => {
      validateSessionsInstrumentPanel(['user1'])

      cy.get('.command-name-session').contains('created')
    })

    cy.log('validate saved session was used in second test')
    cy.get('.test').eq(1).within(() => {
      validateSessionsInstrumentPanel(['user1'])

      cy.get('.command-name-session')
      .within(() => {
        cy.get('.command-expander').first().click()
        cy.contains('user1')
        cy.contains('recreated')

        cy.contains('Restore saved session')
        .parent()
        .closest('.command')
        .next()
        .contains('Validate session')
        .closest('.command').as('firstValidateSession')
        .find('.command-expander')
        .should('have.class', 'command-expander-is-open')

        cy.get('.command-name-Clear-page').should('have.length', 3)

        validateSetupSessionGroup(false)

        cy.contains('Validate session')
        .closest('.command').as('secondValidateSession')

        cy.get('@secondValidateSession')
        .find('.command-expander')
        .should('have.class', 'command-expander-is-open')

        cy.get('@secondValidateSession')
        .find('.command-alias')
        .contains('runValidation')
      })

      // cy.percySnapshot() // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435

      cy.get('.runnable-err')

      cy.get('.command-name-session').get('.command-expander').first().click()

      cy.get('.command').should('have.length', 2)
    })
  })

  it('recreates session and fails validation', () => {
    loadSpec({
      projectName: 'session-and-origin-e2e-specs',
      filePath: 'session/recreates_session_and_fails_validation.cy.js',
      passCount: 1,
      failCount: 1,
    })

    cy.log('validate new session was created in first test')
    cy.get('.test').eq(0).click().within(() => {
      validateSessionsInstrumentPanel(['user1'])

      cy.get('.command-name-session').contains('created')
    })

    cy.log('validate saved session was used in second test')
    cy.get('.test').eq(1).within(() => {
      validateSessionsInstrumentPanel(['user1'])

      cy.get('.command-name-session')
      .first()
      .within(() => {
        cy.contains('failed')

        cy.contains('Restore saved session')
        .parent()
        .closest('.command')
        .next()
        .contains('Validate session')
        .closest('.command').as('firstValidateSession')

        cy.get('@firstValidateSession')
        .find('.command-expander')
        .should('have.class', 'command-expander-is-open')

        cy.get('.command-name-Clear-page').should('have.length', 2)

        validateSetupSessionGroup(false)
        .next()
        .contains('Validate session')
        .closest('.command').as('secondValidateSession')

        cy.get('@secondValidateSession')
        .find('.command-expander')
        .should('have.class', 'command-expander-is-open')

        cy.get('@secondValidateSession')
        .find('.command-alias')
        .contains('runValidation')
      })
      // cy.percySnapshot() // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435

      cy.get('.runnable-err').should('have.length', 2)
    })
  })

  it('multiple sessions in a test', () => {
    loadSpec({
      projectName: 'session-and-origin-e2e-specs',
      filePath: 'session/multiple_sessions.cy.js',
      passCount: 1,
    })

    validateSessionsInstrumentPanel(['spec_session_1', 'spec_session_2', 'global_session_1'])
    // cy.percySnapshot() // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435
  })

  describe('errors', { testIsolation: false }, () => {
    describe('created session', () => {
      before(() => {
        cy.then(async () => {
          await Cypress.action('cy:url:changed', '')
          await Cypress.action('cy:visit:blank', { testIsolation: false })
        })
        .then(() => {
          loadSpec({
            projectName: 'session-and-origin-e2e-specs',
            filePath: 'session/errors.cy.js',
            failCount: 7,
          })
        })
      })

      it('setup has failing Cypress command', () => {
        cy.contains('.test', 'setup - has failing command').as('example_test')
        // test marked as failed and is expanded
        cy.get('@example_test').should('have.attr', 'data-model-state', 'failed')
        .children('.collapsible').should('have.class', 'is-open')
        .within(() => {
          // session is marked as 'failed' and is expanded
          // setup group is expanded
          cy.get('.command-name-session').eq(0).as('session_command')
          .children('.command-wrapper').find('.reporter-tag').should('contain', 'failed')

          cy.get('@session_command')
          .children('.command-child-container').should('exist')
          .within(() => {
            cy.contains('.command-wrapper', 'Create new session')
            .should('have.class', 'command-state-failed')
            .find('.failed-indicator')
            .should('exist')
          })
        })

        const setupErrorPostFix = 'This error occurred while creating the session. Because the session setup failed, we failed the test.'

        cy.get('@example_test')
        .find('.attempt-error-region')
        .contains('Expected to find element')
        .contains(setupErrorPostFix)

        cy.get('@example_test')
        .find('.attempt-error-region')
        .find('.test-err-code-frame')
        .should('exist')
      })

      describe('failed validation', () => {
        [
          {
            testCase: 'has failing Cypress command',
            systemTestTitle: 'validate - has failing Cypress command',
            errMessage: 'failed because it requires a DOM element',
          },
          {
            testCase: 'command yields false',
            systemTestTitle: 'validate - command yields false',
            errMessage: 'callback yielded false.',
          },
          {
            testCase: 'has multiple commands and yields false',
            systemTestTitle: 'validate - has multiple commands and yields false',
            errMessage: 'callback yielded false.',
          },
          {
            testCase: 'rejects with false',
            systemTestTitle: 'validate - rejects with false',
            errMessage: 'rejected with false.',
          },
          {
            testCase: 'promise resolved false',
            systemTestTitle: 'validate - promise resolves false',
            errMessage: 'promise resolved false.',
          },
          {
            testCase: 'throws an error',
            systemTestTitle: 'validate - throws an error',
            errMessage: 'Something went wrong!',
          },
        ].forEach((opts) => {
          const { testCase, systemTestTitle, errMessage } = opts

          it(`has test error when validate ${testCase}`, () => {
            cy.contains('.test', systemTestTitle).as('example_test')
            cy.get('@example_test')
            .should('have.attr', 'data-model-state', 'failed')
            .children('.collapsible')
            .should('have.class', 'is-open')
            .within(() => {
              // session is marked as 'failed' and is expanded
              // setup group is expanded
              cy.get('.command-name-session').eq(0).as('session_command')
              .children('.command-wrapper')
              .find('.reporter-tag')
              .should('contain', 'failed')

              cy.get('@session_command')
              .children('.command-child-container')
              .should('exist')
              .within(() => {
                // create session group is marked as 'passed' and is collapsed
                cy.contains('.command-wrapper', 'Create new session')
                .should('have.class', 'command-state-passed')
                .children('.command-child-container')
                .should('not.exist')

                cy.contains('.command-wrapper', 'Validate session').as('validateSessionGroup')
                .should('have.class', 'command-state-failed')
                .find('.failed-indicator')
                .should('exist')
              })
            })

            const validateErrPostFix = 'This error occurred while validating the created session. Because validation failed immediately after creating the session, we failed the test.'

            cy.get('@example_test')
            .find('.attempt-error-region')
            .contains(errMessage)
            .contains(validateErrPostFix)

            cy.get('@example_test')
            .find('.attempt-error-region')
            .find('.test-err-code-frame')
            .should('exist')
          })
        })
      })
    })

    describe('recreated session', () => {
      const assertRecreatedSession = (opts) => {
        const {
          testAlias,
          validationErrMessage,
          commandPassed,
          successfullyRecreatedSession,
        } = opts

        cy.get(testAlias)
        .should('have.attr', 'data-model-state', commandPassed ? 'passed' : 'failed')
        .children('.collapsible')
        .should(commandPassed ? 'not.have.class' : 'have.class', 'is-open')

        if (commandPassed) {
          cy.get(testAlias).scrollIntoView().click()
        }

        cy.get(testAlias)
        .within(() => {
          // second session is marked as 'failed' and is expanded
          cy.get('.command-name-session').eq(1).as('session_command')
          .children('.command-wrapper')
          .find('.reporter-tag')
          .should('contain', commandPassed ? 'recreated' : 'failed')

          if (commandPassed) {
            cy.get('@session_command')
            .scrollIntoView()
            .find('.command-expander')
            .click()
          }

          cy.get('@session_command')
          .children('.command-child-container')
          .should('exist')
          .within(() => {
            // restored session log
            cy.contains('.command-wrapper', 'Restore saved session')

            cy.contains('.command-wrapper', 'Validate session').as('validateSessionGroup')
            .should('have.class', 'command-state-failed')
            .find('.failed-indicator')
            .should('exist')

            const restoredMessagePostfix = 'This error occurred while validating the restored session. Because validation failed, we will try to recreate the session.'

            cy.get('@session_command')
            .find('.recovered-test-err')
            .contains(validationErrMessage)
            .contains(restoredMessagePostfix)

            cy.get('@session_command')
            .find('.recovered-test-err')
            .find('.test-err-code-frame')
            .should('exist')

            cy.contains('.command-wrapper', 'Recreate session')
            .should('have.class', successfullyRecreatedSession ? 'command-state-passed' : 'command-state-failed')
            .find('.failed-indicator')
            .should(successfullyRecreatedSession ? 'not.exist' : 'exist', 'is-open')
          })
        })
      }

      describe('successfully recreated session', () => {
        before(() => {
          cy.then(async () => {
            await Cypress.action('cy:url:changed', '')
            await Cypress.action('cy:visit:blank', { testIsolation: false })
          })
          .then(() => {
            loadSpec({
              projectName: 'session-and-origin-e2e-specs',
              filePath: 'session/errors.cy.js',
              passCount: 7,
              failCount: 0,
              setup () {
                cy.window().then((win) => {
                // @ts-ignore
                  return win.CYPRESS_TEST_DATA = {
                    restoreSessionWithValidationFailure: true,
                    successfullyRecreatedSession: true,
                  }
                })
              },
            })
          })
        })

        ;[
          {
            testCase: 'has failing Cypress command',
            systemTestTitle: 'validate - has failing Cypress command',
            errMessage: 'failed because it requires a DOM element',
          },
          {
            testCase: 'command yields false',
            systemTestTitle: 'validate - command yields false',
            errMessage: 'callback yielded false.',
          },
          {
            testCase: 'has multiple commands and yields false',
            systemTestTitle: 'validate - has multiple commands and yields false',
            errMessage: 'callback yielded false.',
          },
          {
            testCase: 'rejects with false',
            systemTestTitle: 'validate - rejects with false',
            errMessage: 'rejected with false.',
          },
          {
            testCase: 'promise resolved false',
            systemTestTitle: 'validate - promise resolves false',
            errMessage: 'promise resolved false.',
          },
          {
            testCase: 'throws an error',
            systemTestTitle: 'validate - throws an error',
            errMessage: 'Something went wrong!',
          },
        ].forEach(({ testCase, systemTestTitle, errMessage }, index) => {
          if (index !== 0) {
            return
          }

          it(`has test error when validate ${testCase}`, () => {
            cy.contains('.test', systemTestTitle).as('example_test')

            cy.get('@example_test').within(() => {
              assertRecreatedSession({
                testAlias: '@example_test',
                validationErrMessage: errMessage,
                commandPassed: true,
                successfullyRecreatedSession: true,
              })
            })

            cy.get('@example_test')
            .find('.attempt-error-region')
            .should('not.exist')
          })
        })
      })

      describe('failed to recreated session', () => {
        before(() => {
          cy.then(async () => {
            await Cypress.action('cy:url:changed', '')
            await Cypress.action('cy:visit:blank', { testIsolation: false })
          })
          .then(() => {
            loadSpec({
              projectName: 'session-and-origin-e2e-specs',
              filePath: 'session/errors.cy.js',
              passCount: 0,
              failCount: 7,
              setup () {
                cy.window().then((win) => {
                // @ts-ignore
                  return win.CYPRESS_TEST_DATA = {
                    restoreSessionWithValidationFailure: true,
                    successfullyRecreatedSession: false,
                  }
                })
              },
            })
          })
        })

        it('setup has failing command', () => {
          cy.contains('.test', 'setup - has failing command').as('example_test')

          cy.get('@example_test').within(() => {
            assertRecreatedSession({
              testAlias: '@example_test',
              validationErrMessage: 'callback yielded false',
              commandPassed: false,
              successfullyRecreatedSession: false,
            })
          })

          const recreatedErrPostfix = 'This error occurred while recreating the session. Because the session setup failed, we failed the test.'

          cy.get('@example_test')
          .find('.attempt-error-region')
          .contains('Expected to find element')
          .contains(recreatedErrPostfix)
        })

        describe('failed validation', () => {
          [
            {
              testCase: 'has failing Cypress command',
              systemTestTitle: 'validate - has failing Cypress command',
              errMessage: 'failed because it requires a DOM element',
            },
            {
              testCase: 'command yields false',
              systemTestTitle: 'validate - command yields false',
              errMessage: 'callback yielded false.',
            },
            {
              testCase: 'has multiple commands and yields false',
              systemTestTitle: 'validate - has multiple commands and yields false',
              errMessage: 'callback yielded false.',
            },
            {
              testCase: 'rejects with false',
              systemTestTitle: 'validate - rejects with false',
              errMessage: 'rejected with false.',
            },
            {
              testCase: 'promise resolved false',
              systemTestTitle: 'validate - promise resolves false',
              errMessage: 'promise resolved false.',
            },
            {
              testCase: 'throws an error',
              systemTestTitle: 'validate - throws an error',
              errMessage: 'Something went wrong!',
            },
          ].forEach(({ testCase, systemTestTitle, errMessage }) => {
            it(`has test error when validate ${testCase}`, () => {
              cy.contains('.test', systemTestTitle).as('example_test')

              cy.get('@example_test').within(() => {
                assertRecreatedSession({
                  testAlias: '@example_test',
                  validationErrMessage: errMessage,
                  commandPassed: false,
                  successfullyRecreatedSession: true,
                })
              })

              const recreatedErrPostfix = 'This error occurred while validating the recreated session. Because validation failed immediately after recreating the session, we failed the test.'

              cy.get('@example_test')
              .find('.attempt-error-region')
              .contains(errMessage)
              .contains(recreatedErrPostfix)
            })
          })
        })
      })
    })
  })
})

describe('runner/cypress sessions.open_mode.spec', () => {
  beforeEach(() => {
    cy.scaffoldProject('session-and-origin-e2e-specs')
    cy.openProject('session-and-origin-e2e-specs')
    cy.startAppServer('e2e')
    cy.visitApp()
    cy.specsPageIsVisible()

    cy.get('[data-cy-row="multiple_sessions.cy.js"]').click()
    cy.waitForSpecToFinish({
      passCount: 1,
    })

    cy.get('.reporter-tag').should('contain', 'created').should('length', 3)
  })

  it('persists global and spec sessions when clicking "rerun all tests" button', () => {
    cy.get('.restart').click()

    cy.waitForSpecToFinish({
      passCount: 1,
    })

    cy.get('.reporter-tag').should('contain', 'restored').should('length', 3)
  })

  it('persists global and spec sessions on refresh', () => {
    cy.get('body').type('r')

    cy.waitForSpecToFinish({
      passCount: 1,
    })

    cy.get('.reporter-tag').should('contain', 'restored').should('length', 3)
  })

  it('persists global session and does not persists spec session when selecting a different spec', () => {
    cy.get('body').type('f')
    cy.get('div[title="blank_session.cy.js"]').click()

    cy.waitForSpecToFinish({
      passCount: 1,
    })

    cy.get('.command-name-session').eq(0).should('contain', 'spec_session')
    .find('.reporter-tag').should('contain', 'created')

    cy.get('.command-name-session').eq(1).should('contain', 'global_session_1')
    .find('.reporter-tag').should('contain', 'restored')
  })

  it('clears all sessions when selecting "clear all sessions"', () => {
    cy.get('body').type('r')

    cy.waitForSpecToFinish({
      passCount: 1,
    })

    cy.get('.reporter-tag').should('contain', 'restored').should('length', 3)

    cy.contains('Clear All Sessions').click()

    cy.contains('Your tests are loading...')

    cy.waitForSpecToFinish({
      passCount: 1,
    })

    cy.get('.reporter-tag').should('contain', 'created').should('length', 3)
  })
})

describe('global sessions', () => {
  beforeEach(() => {
    cy.scaffoldProject('session-and-origin-e2e-specs')
    cy.openProject('session-and-origin-e2e-specs')
    cy.startAppServer('e2e')
    cy.visitApp()
    cy.specsPageIsVisible()

    cy.get('[data-cy-row="global_sessions.cy.js"]').click()
    cy.waitForSpecToFinish({
      passCount: 2,
    })
  })

  it('creates global session', () => {
    cy.contains('.test', 'creates global session').as('creates_global').click()
    cy.get('@creates_global').within(() => {
      cy.get('.command-name-session').should('contain', 'global_session_1')
      .find('.reporter-tag').should('contain', 'created')
    })
  })

  it('restores global session', () => {
    cy.contains('.test', 'restores global session').as('restores_global').click()
    cy.get('@restores_global').within(() => {
      cy.get('.command-name-session').should('contain', 'global_session_1')
      .find('.reporter-tag').should('contain', 'restored')
    })
  })
})
