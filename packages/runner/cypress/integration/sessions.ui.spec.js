const helpers = require('../support/helpers')
const path = require('path')

const { runIsolatedCypress } = helpers.createCypress({ config: { experimentalSessionAndOrigin: true } })

const validateSessionsInstrumentPanel = (sessionIds = []) => {
  cy.get('.sessions-container')
  .should('contain', `Sessions (${sessionIds.length})`)
  .click()

  sessionIds.forEach((id) => {
    cy.contains('.sessions-container', id)
  })
}

const validateCreateNewSessionGroup = () => {
  cy.contains('Create New Session')
  .closest('.command')
  .should('have.class', 'command-is-open')
  .contains('runSetup')

  cy.contains('Create New Session')
  .closest('.command')
  .find('.command-name-Clear-Page')
  .should('have.length', 2)
}

describe('runner/cypress sessions.ui.spec', { viewportWidth: 1000, viewportHeight: 1000 }, () => {
  it('creates new session', () => {
    runIsolatedCypress(path.join(__dirname, '../../../../system-tests/projects/runner-e2e-specs/cypress/e2e/sessions/new_session.cy'))

    validateSessionsInstrumentPanel(['blank_session'])

    cy.get('.command-name-session')
    .first()
    .within(() => {
      cy.get('i.successful')
      .siblings()
      .should('contain', '(new) blank_session')

      cy.get('.command-name-session').contains('blank_session')
      validateCreateNewSessionGroup()
    })

    cy.percySnapshot()

    cy.get('.command-name-session').first().click('top')

    // FIXME: this should be length 2, not 3
    // the 'Clear Page' log should be nested under session group
    cy.get('.command').should('have.length', 3)
  })

  it('creates new session with validation', () => {
    runIsolatedCypress(path.join(__dirname, '../../../../system-tests/projects/runner-e2e-specs/cypress/e2e/sessions/new_session_with_validation.cy'))

    validateSessionsInstrumentPanel(['blank_session'])

    cy.get('.command-name-session')
    .first()
    .within(() => {
      cy.get('i.successful')
      .siblings()
      .should('contain', '(new) blank_session')

      cy.get('.command-name-session').contains('blank_session')

      validateCreateNewSessionGroup()
    })

    cy.percySnapshot()

    // FIXME: this should be nested within the session command
    cy.contains('Validate Session: valid')
    .closest('.command')
    .should('not.have.class', 'command-is-open')
    .click()
    .contains('runValidation')

    cy.get('.command-name-session').first().click('top')

    // FIXME: this should be length 2, not 5
    // the validate session group should be nested under session group
    cy.get('.command').should('have.length', 5)
  })

  it('creates new session and fails validation', () => {
    runIsolatedCypress(path.join(__dirname, '../../../../system-tests/projects/runner-e2e-specs/cypress/e2e/sessions/new_session_and_fails_validation.cy'))

    validateSessionsInstrumentPanel(['blank_session'])

    cy.get('.command-name-session')
    .first()
    .within(() => {
      cy.get('i.successful')
      .siblings()
      .should('contain', '(new) blank_session')

      cy.get('.command-name-session').contains('blank_session')

      validateCreateNewSessionGroup()
    })

    // FIXME: this should be nested within the session command
    // FIXME: this should be Validate Session: invalid
    cy.contains('Validate Session')
    .closest('.command')
    .should('have.class', 'command-is-open')
    .contains('runValidation')

    cy.contains('CypressError')

    cy.percySnapshot()
  })

  it('restores saved session', () => {
    runIsolatedCypress(path.join(__dirname, '../../../../system-tests/projects/runner-e2e-specs/cypress/e2e/sessions/restores_saved_session.cy'))

    cy.get('.test').each(($el) => cy.wrap($el).click())

    cy.log('validate new session was created in first test')
    cy.get('.test').eq(0).within(() => {
      validateSessionsInstrumentPanel(['user1'])
      validateCreateNewSessionGroup()
    })

    cy.log('validate saved session was used in second test')
    cy.get('.test').eq(1).within(() => {
      validateSessionsInstrumentPanel(['user1'])

      cy.get('.command-name-session')
      .first()
      .within(() => {
        cy.get('i.pending').siblings().should('contain', '(saved) user1')

        cy.get('.command-name-session').contains('user1')

        cy.contains('Restore Saved Session')
        .closest('.command')
        .contains('Clear Page')
        .should('have.length', 1)

        cy.contains('Restore Saved Session')
        .closest('.command')
        .contains('runSetup')
        .should('not.exist')

        cy.contains('Validate Session: valid')
        .closest('.command')
        // FIXME: this validation group does not align with the
        // with Create New Session's validation group behavior
        // should be 'not.have.class' to align
        .should('have.class', 'command-is-open')
        .contains('runValidation')
      })

      cy.get('.command-name-session').first().click('top')

      cy.get('.command').should('have.length', 2)
    })
  })

  it('recreates session', () => {
    runIsolatedCypress(path.join(__dirname, '../../../../system-tests/projects/runner-e2e-specs/cypress/e2e/sessions/recreates_session.cy'))

    cy.get('.test').each(($el) => cy.wrap($el).click())

    cy.log('validate new session was created in first test')
    cy.get('.test').eq(0).within(() => {
      validateSessionsInstrumentPanel(['user1'])

      cy.contains('Create New Session')
    })

    cy.log('validate saved session was used in second test')
    cy.get('.test').eq(1).within(() => {
      validateSessionsInstrumentPanel(['user1'])

      cy.get('.command-name-session')
      .first()
      .within(() => {
        cy.get('i.bad').siblings().should('contain', '(recreated) user1')

        cy.get('.command-name-session').contains('user1')

        cy.contains('Restore Saved Session')
        .closest('.command')
        .contains('Clear Page')
        .should('have.length', 1)

        cy.contains('Restore Saved Session')
        .closest('.command')
        .contains('runSetup')
        .should('not.exist')

        cy.contains('Validate Session: invalid')

        validateCreateNewSessionGroup()

        cy.contains('Validate Session: valid')
        .closest('.command')
        // FIXME: this validation group does not align with the
        // with Create New Session's validation group behavior
        // should be 'not.have.class' to align
        .should('have.class', 'command-is-open')
        .contains('runValidation')
      })
      .percySnapshot()

      cy.get('.runnable-err').should('have.length', 1)

      cy.get('.command-name-session').first().click('top')

      cy.get('.command').should('have.length', 2)
    })
  })

  it('recreates session and fails validation', () => {
    runIsolatedCypress(path.join(__dirname, '../../../../system-tests/projects/runner-e2e-specs/cypress/e2e/sessions/recreates_session_and_fails_validation.cy'))

    cy.get('.test').each(($el) => cy.wrap($el).click())

    cy.log('validate new session was created in first test')
    cy.get('.test').eq(0).within(() => {
      validateSessionsInstrumentPanel(['user1'])

      cy.contains('Create New Session')
    })

    cy.log('validate saved session was used in second test')
    cy.get('.test').eq(1).within(() => {
      validateSessionsInstrumentPanel(['user1'])

      cy.get('.command-name-session')
      .first()
      .within(() => {
        cy.get('i.bad').siblings().should('contain', '(recreated) user1')

        cy.get('.command-name-session').contains('user1')

        cy.contains('Restore Saved Session')
        .closest('.command')
        .contains('Clear Page')
        .should('have.length', 1)

        cy.contains('Restore Saved Session')
        .closest('.command')
        .contains('runSetup')
        .should('not.exist')

        cy.contains('Validate Session: invalid')

        validateCreateNewSessionGroup()

        // FIXME: this validation group should say 'Validate Session: valid'
        cy.contains('Validate Session')
        .closest('.command')
        // FIXME: this validation group does not align with the
        // with Create New Session's validation group behavior
        //' should be 'not.have.class' to align
        .should('have.class', 'command-is-open')
        .contains('runValidation')
      })
      .percySnapshot()

      cy.get('.runnable-err').should('have.length', 2)
    })
  })

  it('multiple sessions in a test', () => {
    runIsolatedCypress(path.join(__dirname, '../../../../system-tests/projects/runner-e2e-specs/cypress/e2e/sessions/multiple_sessions.cy'))

    validateSessionsInstrumentPanel(['user1', 'user2'])
    cy.percySnapshot()
  })
})
