/**
 * Used in cy-in-cy tests in @packages/app.
 */

before(async () => {
  Cypress.state('activeSessions', {})
  await Cypress.session.clearAllSavedSessions()
})

let sessionId

beforeEach(() => {
  sessionId = `session_${Cypress._.uniqueId()}`
})

it('setup has failing command', () => {
  cy.session(sessionId, () => {
    cy.get('does_not_exist', { timeout: 1 })
  })
})

it('created command - validate - has failing Cypress command', function () {
  cy.log('hi')
  cy.session(sessionId, function () {
    cy.get('div').as('hello')
  }, {
    validate () {
      cy.get('does_not_exist', { timeout: 1 })
      // cy.get('does_not_exist_2', { timeout: 1 })
    },
  })
})

it('created command - validate - command yields false', () => {
  cy.session(sessionId, () => {
    cy.get('div')
  }, {
    validate () {
      cy.then(() => {
        return false
      })
    },
  })
})

it('created command - validate - has multiple commands and yields false', () => {
  cy.session(sessionId, () => {
    cy.get('div')
  }, {
    validate () {
      cy.log('filler log')

      return cy.wrap(false)
    },
  })
})

it('created command - validate - rejects with false', () => {
  cy.session(sessionId, () => {
    cy.get('div')
  }, {
    async validate () {
      return new Promise(async (resolve, reject) => {
      // Cypress.log('getCurrentSessionData') // throws uncaught exception
        const { cookies } = await Cypress.session.getCurrentSessionData()

        if (cookies.length === 0) { // this is always zero! we aren't setting any :D
          reject(false)
        }
      })
    },
  })
})

it('created command - validate - promise resolves false', () => {
  cy.session(sessionId, () => {
    cy.get('div')
  }, {
    async validate () {
      return new Promise(async (resolve, reject) => {
        const { cookies } = await Cypress.session.getCurrentSessionData()

        if (cookies.length === 0) { // this is always zero! we aren't setting any :D
          resolve(false)
        }
      })
    },
  })
})

it('created command - validate - throws an error', () => {
  cy.session(sessionId, () => {
    cy.get('div')
  }, {
    async validate () {
      cy.get('div')
      .within(() => {
        throw new Error('Something went wrong!')
      })
    },
  })
})
