import { loadSpec } from './support/spec-loader'
import { snapshotReporter } from './support/snapshot-reporter'

const validateSessionsInstrumentPanel = (sessionIds: any[] = []) => {
  cy.get('.sessions-container')
  .should('contain', `Sessions (${sessionIds.length})`)
  .click()

  sessionIds.forEach((id) => {
    cy.contains('.sessions-container', id)
  })
}

const validateCreateNewSessionGroup = () => {
  cy.contains('Create New Session')
  .closest('.command.command-name-Create-New-Session').as('createNewSession')

  cy.get('@createNewSession').find('.command-expander')
  .should('have.class', 'command-expander-is-open')

  cy.get('@createNewSession').find('.command-alias').contains('runSetup')

  cy.contains('Create New Session')
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
      filePath: 'sessions/new_session.cy.js',
    })

    validateSessionsInstrumentPanel(['blank_session'])

    cy.get('.command-name-session')
    .first()
    .within(() => {
      cy.get('i.command-message-indicator-successful')
      .siblings()
      .should('contain', '(new) blank_session')

      cy.get('.command-name-session').contains('blank_session')
      validateCreateNewSessionGroup()
    })

    cy.percySnapshot()

    cy.get('.command-name-session').first().click('top')

    // FIXME: this should be length 2, not 3
    // the 'Clear Page' log should be nested under session group
    cy.get('.command-number-column:not(:empty)').should('have.length', 3)
  })

  it('creates new session with validation', () => {
    loadSpec({
      filePath: 'sessions/new_session_with_validation.cy.js',
    })

    validateSessionsInstrumentPanel(['blank_session'])

    cy.get('.command-name-session')
    .first()
    .within(() => {
      cy.get('i.command-message-indicator-successful')
      .siblings()
      .should('contain', '(new) blank_session')

      cy.get('.command-name-session').contains('blank_session')

      validateCreateNewSessionGroup()
    })

    cy.percySnapshot()

    // FIXME: this should be nested within the session command
    cy.contains('Validate Session: valid')
    .closest('.command').as('validateSession')

    cy.get('@validateSession')
    .find('.command-expander')
    .should('not.have.class', 'command-expander-is-open')
    .click()

    cy.get('@validateSession')
    .find('.command-alias')
    .contains('runValidation')

    cy.get('.command-name-session').first().click('top')

    // FIXME: this should be length 2, not 3
    // the validate session group should be nested under session group
    cy.get('.command-number-column:not(:empty)').should('have.length', 3)
  })

  it('creates new session and fails validation', () => {
    loadSpec({
      filePath: 'sessions/new_session_and_fails_validation.cy.js',
    })

    validateSessionsInstrumentPanel(['blank_session'])

    cy.get('.command-name-session')
    .first()
    .within(() => {
      cy.get('i.command-message-indicator-successful')
      .siblings()
      .should('contain', '(new) blank_session')

      cy.get('.command-name-session').contains('blank_session')

      validateCreateNewSessionGroup()
    })

    // FIXME: this should be nested within the session command
    // FIXME: this should be Validate Session: invalid
    cy.contains('Validate Session')
    .closest('.command').as('validateSession')

    cy.get('@validateSession')
    .find('.command-expander')
    .should('have.class', 'command-expander-is-open')

    cy.get('@validateSession')
    .find('.command-alias')
    .contains('runValidation')

    cy.contains('CypressError')

    cy.percySnapshot()
  })

  it('restores saved session', () => {
    loadSpec({
      filePath: 'sessions/restores_saved_session.cy.js',
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
      .first()
      .within(() => {
        cy.get('i.command-message-indicator-pending').siblings().should('contain', '(saved) user1')

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
        .closest('.command').as('validateSession')
        // FIXME: this validation group does not align with the
        // with Create New Session's validation group behavior
        // should be 'not.have.class' to align

        cy.get('@validateSession')
        .find('.command-expander')
        .should('have.class', 'command-expander-is-open')

        cy.get('@validateSession')
        .find('.command-alias')
        .contains('runValidation')
      })

      cy.get('.command-name-session').first().click('top')

      // FIXME: this should be length 2, not 3
      cy.get('.command-number-column:not(:empty)').should('have.length', 3)
    })
  })

  it('recreates session', () => {
    loadSpec({
      filePath: 'sessions/recreates_session.cy.js',
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
      .first()
      .within(() => {
        cy.get('i.command-message-indicator-bad').siblings().should('contain', '(recreated) user1')

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
        .closest('.command').as('validateSession')
        // FIXME: this validation group does not align with the
        // with Create New Session's validation group behavior
        // should be 'not.have.class' to align

        cy.get('@validateSession')
        .find('.command-expander')
        .should('have.class', 'command-expander-is-open')

        cy.get('@validateSession')
        .find('.command-alias')
        .contains('runValidation')
      })
      .percySnapshot()

      cy.get('.runnable-err').should('have.length', 1)

      cy.get('.command-name-session').first().click('top')

      // FIXME: this should be length 2, not 3
      cy.get('.command-number-column:not(:empty)').should('have.length', 3)
    })
  })

  it('recreates session and fails validation', () => {
    loadSpec({
      filePath: 'sessions/recreates_session_and_fails_validation.cy.js',
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
      .first()
      .within(() => {
        cy.get('i.command-message-indicator-bad').siblings().should('contain', '(recreated) user1')

        cy.get('.command-name-session').contains('user1')

        cy.contains('Restore Saved Session')
        .closest('.command').as('restoreSavedSession')

        cy.get('@restoreSavedSession')
        .contains('Clear Page')
        .should('have.length', 1)

        cy.get('@restoreSavedSession')
        .find('.alias-container')
        .contains('runValidation')
        .should('not.exist')

        cy.contains('Validate Session: invalid')

        validateCreateNewSessionGroup()

        // FIXME: this validation group should say 'Validate Session: valid'
        cy.contains('Validate Session')
        .closest('.command').as('validateSession')
        // FIXME: this validation group does not align with the
        // with Create New Session's validation group behavior
        // should be 'not.have.class' to align

        cy.get('@validateSession')
        .find('.command-expander')
        .should('have.class', 'command-expander-is-open')

        cy.get('@validateSession')
        .find('.command-alias')
        .contains('runValidation')
      })
      .percySnapshot()

      cy.get('.runnable-err').should('have.length', 2)
    })
  })

  it('multiple sessions in a test', () => {
    loadSpec({
      filePath: 'sessions/multiple_sessions.cy.js',
    })

    validateSessionsInstrumentPanel(['user1', 'user2'])
    cy.percySnapshot()
  })
})
