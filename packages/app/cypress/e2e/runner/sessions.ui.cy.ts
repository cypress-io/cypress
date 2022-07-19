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

const validateSetupSessionGroup = (isNewSession = true) => {
  const groupText = isNewSession ? 'Create new session' : 'Recreate session'

  cy.contains(groupText).closest('.command').as('setupSession')
  cy.get('@setupSession').find('.command-expander-is-open')
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
    })

    validateSessionsInstrumentPanel(['blank_session'])

    cy.get('.command-name-session')
    .within(() => {
      cy.get('.command-expander').first().click()
      cy.contains('blank_session')
      cy.contains('CREATED')

      validateSetupSessionGroup()
    })

    cy.percySnapshot()

    cy.get('.command-name-session').eq(0).get('.command-expander').first().click()
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
      cy.get('.command-expander').first().click()
      cy.contains('blank_session')
      cy.contains('CREATED')

      validateSetupSessionGroup()

      cy.contains('Validate session')
      .closest('.command').as('validateSession')

      cy.get('@validateSession')
      .find('.command-expander-is-open')

      cy.get('@validateSession')
      .find('.command-alias')
      .contains('runValidation')
    })

    cy.percySnapshot()

    cy.get('.command-name-session').eq(0).get('.command-expander').first().click()

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
      cy.contains('blank_session')
      cy.contains('FAILED')

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
      cy.get('.command-name-session').contains('CREATED')
    })

    cy.log('validate saved session was used in second test')
    cy.get('.test').eq(1).within(() => {
      validateSessionsInstrumentPanel(['user1'])

      cy.get('.command-name-session')
      .within(() => {
        cy.get('.command-expander').first().click()
        cy.contains('user1')
        cy.contains('RESTORED')

        cy.get('.command-name-Clear-page').should('have.length', 2)

        cy.contains('Restore saved session')

        cy.contains('Validate session')
        .closest('.command').as('validateSession')

        cy.get('@validateSession')
        .find('.command-expander')
        // FIXME: this validation group does not align with the
        // with Create new session's validation group behavior
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

      cy.get('.command-name-session').contains('CREATED')
    })

    cy.log('validate saved session was used in second test')
    cy.get('.test').eq(1).within(() => {
      validateSessionsInstrumentPanel(['user1'])

      cy.get('.command-name-session')
      .within(() => {
        cy.get('.command-expander').first().click()
        cy.contains('user1')
        cy.contains('RECREATED')

        cy.contains('Restore saved session')

        cy.get('.command-name-Clear-page').should('have.length', 4)

        cy.contains('Validate session')

        validateSetupSessionGroup(false)

        cy.contains('Validate session')
        .closest('.command').as('validateSession')

        cy.get('@validateSession')
        .find('.command-expander')
        // FIXME: this validation group does not align with the
        // with Create new session's validation group behavior
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

      cy.get('.command-name-session').contains('CREATED')
    })

    cy.log('validate saved session was used in second test')
    cy.get('.test').eq(1).within(() => {
      validateSessionsInstrumentPanel(['user1'])

      cy.get('.command-name-session')
      .within(() => {
        cy.contains('FAILED')

        cy.contains('Restore saved session')

        cy.get('.command-name-Clear-page').should('have.length', 3)

        cy.contains('Validate session')

        validateSetupSessionGroup(false)
        .parent()
        .closest('.command')
        .next()
        .contains('Validate session')
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
