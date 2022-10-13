/**
 * Used in cy-in-cy tests in @packages/app.
 */

before(async () => {
  Cypress.state('activeSessions', {})
  await Cypress.session.clearAllSavedSessions()
})

it('setup has failing command', () => {
  cy.session('session_1', () => {
    cy.get('does_not_exist', { timeout: 1 })
  })
})

it('created command resolves false', () => {
  cy.session('session_2', () => {
    cy.get('div')
  }, {
    async validate () {
      return new Promise(async (resolve, reject) => {
        // Cypress.log('getCurrentSessionData') // throws uncaught exception
        // Cypress.log({
        //   name: 'getCurrentSessionData',
        //   type: 'system',
        //   state: 'passed',
        // })
        const { cookies } = await Cypress.session.getCurrentSessionData()

        console.log(cookies)
        if (cookies.length === 0) { // this is always zero! we aren't setting any :D
          resolve(false)
        }
      })
    },
  })
})

it('created command resolves false with log between', () => {
  cy.session('session_3', () => {
    cy.get('div')
    cy.window().then((win) => {
      // win.localStorage.setItem('hi', 'there')
    })
  }, {
    async validate () {
      Cypress.log({
        name: 'getCurrentSessionData',
        message: '',
        type: 'system',
        state: 'passed',
      })

      return new Promise(async (resolve, reject) => {
        // Cypress.log('getCurrentSessionData') // throws uncaught exception

        const { cookies } = await Cypress.session.getCurrentSessionData()

        if (cookies.length === 0) { // this is always zero! we aren't setting any :D
          resolve(false)
        }
      })
    },
  })
})

it('created command reject false with log between', () => {
  cy.session('session_4', () => {
    cy.get('div')
  }, {
    async validate () {
      return new Promise(async (resolve, reject) => {
        // Cypress.log('getCurrentSessionData') // throws uncaught exception
        const { cookies } = await Cypress.session.getCurrentSessionData()

        console.log(cookies)
        if (cookies.length === 0) { // this is always zero! we aren't setting any :D
          reject(false)
        }
      })
    },
  })
})

it('created command has failing command in validate', () => {
  cy.session('session_5', () => {
    cy.get('div').as('hello')
  }, {
    validate () {
      cy.get('does_not_exist', { timeout: 1 })
    },
  })
})

it('created command has failing command in validate', () => {
  cy.session('session_6', () => {
    cy.get('div')
  }, {
    validate () {
      cy.then(() => {
        return false
      })
    },
  })
})

it('created command has failing command in validate', () => {
  cy.session('session_7', () => {
    cy.get('div')
  }, {
    validate () {
      return cy.wrap(false)
    },
  })
})

it('created command has failing command in validate', () => {
  cy.session('session_8', () => {
    cy.get('div')
  }, {
    validate () {
      cy.window().then((win) => {
        console.log(win)

        return false
      })
    },
  })
})

it('for reference', () => {
  cy.get('does_not_exist', { timeout: 1 })
})
