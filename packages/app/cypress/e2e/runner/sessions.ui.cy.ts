import { loadSpec } from './support/spec-loader'
import { snapshotReporter } from './support/snapshot-reporter'

const validateSessionsInstrumentPanel = (sessionIds: Array<string> = []) => {
  cy.get('.sessions-container')
  .should('contain', `Sessions (${sessionIds.length})`)
  .click()

  sessionIds.forEach((id) => {
    cy.contains('.sessions-container', id)
  })
}

const validateCreateNewSessionGroup = () => {
  cy.contains('Create New Session').closest('.command').as('createNewSession')

  cy.get('@createNewSession').find('.command-expander-is-open')
  cy.get('@createNewSession').find('.command-alias').contains('runSetup')

  return cy.contains('Create New Session')
  .closest('.command')
  .find('.command-name-Clear-Page')
  .should('have.length', 2)
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
    })

    validateSessionsInstrumentPanel(['blank_session'])

    cy.get('.command-name-session')
    .within(() => {
      cy.get('i.command-message-indicator-successful')
      .siblings()
      .should('contain', '(new) blank_session')

      validateCreateNewSessionGroup()
    })

    cy.percySnapshot()

    cy.get('.command-name-session').find('.command-expander-column').first().click()

    cy.get('.command').should('have.length', 2)
  })

  it('creates new session with validation', () => {
    loadSpec({
      projectName: 'session-and-origin-e2e-specs',
      filePath: 'session/new_session_with_validation.cy.js',
    })

    validateSessionsInstrumentPanel(['blank_session'])

    cy.get('.command-name-session')
    .within(() => {
      cy.get('i.command-message-indicator-successful')
      .siblings()
      .should('contain', '(new) blank_session')

      validateCreateNewSessionGroup()

      cy.contains('Validate Session: valid')
      .closest('.command').as('validateSession')

      cy.get('@validateSession')
      .find('.command-expander-is-open')

      cy.get('@validateSession')
      .find('.command-alias')
      .contains('runValidation')
    })

    cy.percySnapshot()

    cy.get('.command-name-session').get('.command-expander').first().click()

    cy.get('.command').should('have.length', 2)
  })

  it('creates new session and fails validation', () => {
    loadSpec({
      projectName: 'session-and-origin-e2e-specs',
      filePath: 'session/new_session_and_fails_validation.cy.js',
    })

    validateSessionsInstrumentPanel(['blank_session'])

    cy.get('.command-name-session')
    .within(() => {
      cy.get('i.command-message-indicator-successful')
      .siblings()
      .should('contain', '(new) blank_session')

      validateCreateNewSessionGroup()

      cy.contains('Validate Session: invalid')
      .closest('.command').as('validateSession')

      cy.get('@validateSession')
      .find('.command-expander')
      .should('have.class', 'command-expander-is-open')

      cy.get('@validateSession')
      .find('.command-alias')
      .contains('runValidation')
    })

    cy.contains('CypressError')

    cy.percySnapshot()
  })

  it('restores saved session', () => {
    loadSpec({
      projectName: 'session-and-origin-e2e-specs',
      filePath: 'session/restores_saved_session.cy.js',
    })

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
      .within(() => {
        cy.get('i.command-message-indicator-pending')
        .siblings().should('contain', '(saved) user1')

        cy.contains('Restore Saved Session')
        .closest('.command')
        .contains('Clear Page')
        .should('have.length', 1)

        cy.contains('Restore Saved Session')
        .closest('.command')
        .contains('runSetup')
        .should('not.exist')

        cy.contains('Validate Session: valid')
        .closest('.command').as('validateSession')

        cy.get('@validateSession')
        .find('.command-expander')
        // FIXME: this validation group does not align with the
        // with Create New Session's validation group behavior
        // should be 'not.have.class' to align
        .should('have.class', 'command-expander-is-open')

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
    })

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
      .within(() => {
        cy.get('i.command-message-indicator-bad')
        .siblings().should('contain', '(recreated) user1')

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
        .closest('.command').as('validateSession')

        cy.get('@validateSession')
        .find('.command-expander')
        // FIXME: this validation group does not align with the
        // with Create New Session's validation group behavior
        // should be 'not.have.class' to align
        .should('have.class', 'command-expander-is-open')

        cy.get('@validateSession')
        .find('.command-alias')
        .contains('runValidation')
      })
      .percySnapshot()

      cy.get('.runnable-err').should('have.length', 1)

      cy.get('.command-name-session').get('.command-expander').first().click()

      cy.get('.command').should('have.length', 2)
    })
  })

  it('recreates session and fails validation', () => {
    loadSpec({
      projectName: 'session-and-origin-e2e-specs',
      filePath: 'session/recreates_session_and_fails_validation.cy.js',
    })

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
      .within(() => {
        cy.get('i.command-message-indicator-bad')
        .siblings().should('contain', '(recreated) user1')

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
        .parent()
        .closest('.command')
        .next()
        .contains('Validate Session: invalid')
        .closest('.command').as('secondValidateSession')

        cy.get('@secondValidateSession')
        .find('.command-expander')
        // should be 'not.have.class' to align
        .should('have.class', 'command-expander-is-open')

        cy.get('@secondValidateSession')
        .find('.command-alias')
        .contains('runValidation')
      })
      .percySnapshot()

      cy.get('.runnable-err').should('have.length', 2)
    })
  })

  it('multiple sessions in a test', () => {
    loadSpec({
      projectName: 'session-and-origin-e2e-specs',
      filePath: 'session/multiple_sessions.cy.js',
    })

    validateSessionsInstrumentPanel(['user1', 'user2'])
    cy.percySnapshot()
  })
})
