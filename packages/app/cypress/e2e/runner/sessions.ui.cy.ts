import { loadSpec } from './support/spec-loader'
import { snapshotReporter } from './support/snapshot-reporter'

const validateSessionsInstrumentPanel = (sessionIds: Array<string> = []) => {
  cy.get('.sessions-container')
  .should('contain', `Sessions (${sessionIds.length})`)
  .as('instrument_panel')

  cy.pause()

  cy.get('@instrument_panel').scrollIntoView()
  cy.pause()

  cy.get('@instrument_panel').click()

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

  describe('restores saved session', () => {
    beforeEach(() => {
      loadSpec({
        projectName: 'session-and-origin-e2e-specs',
        filePath: 'session/restores_saved_session.cy.js',
        passCount: 5,
        failCount: 1,
      })
    })

    it('restores session as expected', () => {
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

    // https://github.com/cypress-io/cypress/issues/22381
    it('ensures sessionid integrity is maintained across tests', () => {
      cy.contains('test sessionid integrity is maintained').closest('.runnable').should('have.class', 'runnable-failed')
      cy.get('.test').should('have.length', 6)

      cy.get('.test').eq(2).should('have.class', 'runnable-passed')
      cy.get('.test').eq(3).should('have.class', 'runnable-passed')
      cy.get('.test').eq(4).should('have.class', 'runnable-passed')
      cy.get('.test').eq(5).should('have.class', 'runnable-failed')
      cy.contains('This session already exists.').should('exist')
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

    cy.get('.command-name-session').should('contain', 'spec_session_1')
    .find('.reporter-tag').should('contain', 'created')

    cy.get('.command-name-session').should('contain', 'spec_session_2')
    .find('.reporter-tag').should('contain', 'created')

    cy.get('.command-name-session').should('contain', 'global_session_1')
    .find('.reporter-tag').should('contain', 'created')
  })

  it('persists global and spec sessions when clicking "rerun all tests" button', () => {
    cy.get('.restart').click()

    cy.waitForSpecToFinish({
      passCount: 1,
    })

    cy.get('.command-name-session').should('contain', 'spec_session_1')
    .find('.reporter-tag').should('contain', 'restored')

    cy.get('.command-name-session').should('contain', 'spec_session_2')
    .find('.reporter-tag').should('contain', 'restored')

    cy.get('.command-name-session').should('contain', 'global_session_1')
    .find('.reporter-tag').should('contain', 'restored')
  })

  it('persists global and spec sessions on refresh', () => {
    cy.get('body').type('r')

    cy.waitForSpecToFinish({
      passCount: 1,
    })

    cy.get('.command-name-session').should('contain', 'spec_session_1')
    .find('.reporter-tag').should('contain', 'restored')

    cy.get('.command-name-session').should('contain', 'spec_session_2')
    .find('.reporter-tag').should('contain', 'restored')

    cy.get('.command-name-session').should('contain', 'global_session_1')
    .find('.reporter-tag').should('contain', 'restored')
  })

  it('does not persists spec sessions when selecting a different spec', () => {
    cy.get('body').type('f')
    cy.get('div[title="new_session.cy.js"]').click()

    cy.waitForSpecToFinish({
      passCount: 1,
    })

    cy.get('.command-name-session').should('contain', 'user1')
    .find('.reporter-tag').should('contain', 'created')

    cy.get('.command-name-session').should('contain', 'user1')
    .find('.reporter-tag').should('contain', 'created')
  })

  it('clears all sessions when selecting "clear all sessions"', () => {
    cy.get('body').type('r')

    cy.waitForSpecToFinish({
      passCount: 1,
    })

    cy.get('.command-name-session').should('contain', 'spec_session_1')
    .find('.reporter-tag').should('contain', 'restored')

    cy.get('.command-name-session').should('contain', 'spec_session_2')
    .find('.reporter-tag').should('contain', 'restored')

    cy.get('.reporter-tag').should('contain', 'restored').should('length', 3)

    cy.contains('Clear All Sessions').click()

    cy.contains('Your tests are loading...')
    // FIXME: fixture out why the remaining part of this test is hanging. the `on('restart')`
    // listener is not executing

    // cy.waitForSpecToFinish({
    //   passCount: 1,
    // })

    // cy.get('.command-name-session').should('contain', 'spec_session_1')
    // .find('.reporter-tag').should('contain', 'created')

    // cy.get('.command-name-session').should('contain', 'spec_session_2')
    // .find('.reporter-tag').should('contain', 'created')

    // cy.get('.command-name-session').should('contain', 'global_session_1')
    // .find('.reporter-tag').should('contain', 'created')
  })

  it('persists global sessions when selecting a different spec', () => {
    cy.get('body').type('f')
    cy.get('div[title="blank_session.cy.js"]').click()

    cy.waitForSpecToFinish({
      passCount: 1,
    })

    cy.get('.command-name-session').should('contain', 'spec_session')
    .find('.reporter-tag').should('contain', 'created')

    cy.get('.command-name-session').should('contain', 'global_session_1')
    .find('.reporter-tag').should('contain', 'restored')
  })
})

describe('global sessions', () => {
  beforeEach(() => {
    cy.scaffoldProject('session-and-origin-e2e-specs')
    cy.openProject('session-and-origin-e2e-specs')
    cy.startAppServer('e2e')
    cy.visitApp()
  })

  it('creates global session', () => {
    cy.get('[data-cy-row="global_session_persist_1.cy.js"]').click()
    cy.waitForSpecToFinish({
      passCount: 4,
    })

    cy.contains('.test', 'creates global session').as('creates_global').click()
    cy.get('@creates_global').within(() => {
      cy.get('.command-name-session').should('contain', 'global_1')
      .find('.reporter-tag').should('contain', 'created')
    })
  })

  it('restores global session', () => {
    cy.get('[data-cy-row="global_session_persist_1.cy.js"]').click()
    cy.waitForSpecToFinish({
      passCount: 4,
    })

    cy.contains('.test', 'restores global session').as('restores_global').click()
    cy.get('@restores_global').within(() => {
      cy.get('.command-name-session').should('contain', 'global_1')
      .find('.reporter-tag').should('contain', 'restored')
    })
  })

  it('persists global session', () => {
    cy.get('[data-cy-row="global_session_persist_1.cy.js"]').click()
    cy.waitForSpecToFinish({
      passCount: 4,
    })

    cy.contains('.test', 'creates global session').as('creates_global').click()
    cy.get('@creates_global').within(() => {
      cy.get('.command-name-session').should('contain', 'global_1')
      .find('.reporter-tag').should('contain', 'created')
    })

    cy.get('body').type('f')
    cy.get('div[title="global_session_persist_2.cy.js"]').click()

    cy.waitForSpecToFinish({
      passCount: 1,
    })

    cy.get('.command-name-session').should('contain', 'global_1')
    .find('.reporter-tag').should('contain', 'restored')
  })

  it('has clear error when creating global session with duplicate id')

  it('clears all sessions when selecting "clear all sessions"', () => {
    cy.get('[data-cy-row="global_session_persist_1.cy.js"]').click()
    cy.waitForSpecToFinish({
      passCount: 4,
    })
    .then(() => {
      expect(Cypress.state('activeSessions')).to.deep.contain({
        global_1: 'hi',
      })
    })
  })
})
