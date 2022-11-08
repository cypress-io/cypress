import { loadSpec } from './support/spec-loader'
import { snapshotReporter } from './support/snapshot-reporter'

const validateSessionsInstrumentPanel = (sessionIds: Array<string> = []) => {
  cy.get('.sessions-container')
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

  return cy.contains(groupText)
  .closest('.command')
  .find('.command-name-Clear-page')
  .should('have.length', 1)
}

describe('runner/cypress sessions.ui.spec', {
  // Limiting tests kept in memory due to large memory cost
  // of nested spec snapshots
  numTestsKeptInMemory: 1,
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

    cy.contains('CypressError')

    // cy.percySnapshot() // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435
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

        cy.get('.command-name-Clear-page').should('have.length', 1)

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

        cy.get('.command-name-Clear-page').should('have.length', 2)

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

      cy.get('.runnable-err').should('have.length', 1)

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
        .parent()
        .closest('.command')
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

  describe('errors', () => {
    it('test error when setup has failing Cypress command', () => {
      loadSpec({
        projectName: 'session-and-origin-e2e-specs',
        filePath: 'session/errors.cy.js',
        failCount: 1,
      })

      cy.contains('.test', 'setup has failing command').as('setup_failed')
      // test marked as failed and is expanded
      cy.get('@setup_failed').should('have.attr', 'data-model-state', 'failed')
      .children('.collapsible').should('have.class', 'is-open')
      .within(() => {
        // session is marked as 'failed' and is expanded
        // setup group is expanded
        cy.get('.command-name-session').eq(0).should('contain', 'session_1').as('session_command')
        .children('.command-wrapper').find('.reporter-tag').should('contain', 'failed')

        cy.get('@session_command')
        .children('.command-child-container').should('exist')
        .within(() => {
          cy.get('.command-name-session')
          .should('contain', 'Create new session')
          .get('.command-child-container').should('exist')
        })
      })

      // has error
      cy.get('@setup_failed').contains('This error occurred while creating session. Because the session setup failed, we failed the test.')
    })
  })
})

describe('runner/cypress sessions.open_mode.spec', () => {
  beforeEach(() => {
    cy.scaffoldProject('session-and-origin-e2e-specs')
    cy.openProject('session-and-origin-e2e-specs')
    cy.startAppServer('e2e')
    cy.visitApp()

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
