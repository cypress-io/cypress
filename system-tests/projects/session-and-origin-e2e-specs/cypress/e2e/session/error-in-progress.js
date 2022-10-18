/**
 * Used in cy-in-cy tests in @packages/app.
 */

before(async () => {
  Cypress.state('activeSessions', {})
  await Cypress.session.clearAllSavedSessions()
})

// afterEach(() => {
//   console.log(Cypress.state('runnable'))
//   expect(Cypress.state('runnable').ctx.currentTest.state).to.eq('failed')
// })

describe('create session', () => {
  describe('seems correct', () => {
    it('setup has failing command', () => {
      cy.session('session_1', () => {
        cy.get('does_not_exist', { timeout: 1 })
      })
    })

    it.only('created command validate threw error', () => {
      cy.session('session_4', () => {
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

    it('created command reject false', () => {
      cy.session('session_4', () => {
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

    it('recreated reject false', function () {
      let count = 0
      const validate = () => {
        return new Promise(async (resolve, reject) => {
          // Cypress.log('getCurrentSessionData') // throws uncaught exception
          const { cookies } = await Cypress.session.getCurrentSessionData()

          if (count === 0) {
            resolve(true)
          }

          if (count > 0 && cookies.length === 0) { // this is always zero! we aren't setting any :D
            reject(false)
          }
        })
      }

      cy.session('session_44', function () {
        cy.get('div').as('hello')
      }, { validate })

      cy.then(() => {
        console.log('ABOUT TO CREATE NEW SESSION')
        console.log('')
        count = 1
      })

      cy.session('session_44', function () {
        cy.get('div').as('hello')
      }, { validate })
    })

    // FIX ME!!!!
    it('created command validate has failing command', function () {
      cy.log('hi')
      cy.session('session_5', function () {
        cy.get('div').as('hello')
      }, {
        validate () {
          cy.get('does_not_exist', { timeout: 1 })
          // cy.get('does_not_exist_2', { timeout: 1 })
        },
      })
    })

    // FIX ME!!!!
    it('created command validate has failing command', function () {
      let count = 0

      cy.session('session_55', function () {
        cy.get('div').as('hello')
      }, {
        validate () {
          if (count > 0) {
            count++
            cy.get('does_not_exist', { timeout: 1 })
            // cy.get('does_not_exist_2', { timeout: 1 })
          }
        },
      })

      cy.then(() => {
        console.log('ABOUT TO CREATE NEW SESSION')
        console.log('')
        count = 1
      })

      cy.session('session_55', function () {
        cy.get('div').as('hello')
      }, {
        validate () {
          if (count > 0) {
            count++
            cy.get('does_not_exist', { timeout: 1 })
            // cy.get('does_not_exist_2', { timeout: 1 })
          }
        },
      })
    })

    // correct
    it('created command validate has .then yield false', () => {
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

    // correct
    it('recreated command validate has .then yield false ', () => {
      let yieldTF = true

      cy.session('session_66', () => {
        cy.get('div')
      }, {
        validate () {
          cy.then(() => {
            return yieldTF
          })
        },
      })

      cy.then(() => {
        yieldTF = false
      })

      cy.session('session_66', () => {
        cy.get('div')
      }, {
        validate () {
          cy.then(() => {
            return yieldTF
          })
        },
      })
    })

    // correct
    it('created command validate has .wrap yield false', () => {
      cy.session('session_7', () => {
        cy.get('div')
      }, {
        validate () {
          return cy.wrap(false)
        },
      })
    })

    // correct
    it('recreated command validate has .wrap yield false ', () => {
      let yieldTF = true

      cy.session('session_77', () => {
        cy.get('div')
      }, {
        validate () {
          cy.then(() => {
            return cy.wrap(yieldTF)
          })
        },
      })

      cy.then(() => {
        yieldTF = false
      })

      cy.session('session_77', () => {
        cy.get('div')
      }, {
        validate () {
          cy.then(() => {
            return cy.wrap(yieldTF)
          })
        },
      })
    })

    it('created command validate has .then with log before yield false ', () => {
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
  })

  // unhappy with stack trace
  // ISSUE: missing stack trace (no cy commands to reference)
  // FIX BY: could (should) fallback to cy.session stack trace but doesn't feel the best
  // FIXED BY DROPPING LAST COMMAND: also saying last command yielded false when it resolved false but maybe yielded false is fine
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

          if (cookies.length === 0) { // this is always zero! we aren't setting any :D
            resolve(false)
          }
        })
      },
    })
  })

  // correct
  it('created command resolves false', () => {
    let yeildTF = true

    cy.session('session_22', () => {
      cy.get('div')
    }, {
      async validate () {
        return new Promise(async (resolve, reject) => {
          const { cookies } = await Cypress.session.getCurrentSessionData()

          if (cookies.length === 0) { // this is always zero! we aren't setting any :D
            resolve(yeildTF)
          }
        })
      },
    })

    cy.then(() => {
      yeildTF = false
    })

    cy.session('session_22', () => {
      cy.get('div')
    }, {
      async validate () {
        return new Promise(async (resolve, reject) => {
          const { cookies } = await Cypress.session.getCurrentSessionData()

          if (cookies.length === 0) { // this is always zero! we aren't setting any :D
            resolve(yeildTF)
          }
        })
      },
    })
  })

  // missing stack trace (no cy commands)
  // unhappy with missing stack trace
  // duplicate logs to capture & also fail session
  // could just end curr command without failing the rest
  it('created command resolves false with log between', () => {
    cy.session('session_3', () => {
      cy.get('div')
      cy.window().then((win) => {
      // win.localStorage.setItem('hi', 'there')
      })
    }, {
      async validate () {
      // Cypress.log({
      //   name: 'getCurrentSessionData',
      //   message: '',
      //   type: 'system',
      //   state: 'passed',
      // })

        return new Promise(async (resolve, reject) => {
          Cypress.log('getCurrentSessionData') // throws uncaught exception

          const { cookies } = await Cypress.session.getCurrentSessionData()

          if (cookies.length === 0) { // this is always zero! we aren't setting any :D
            resolve(false)
          }
        })
      },
    })
  })

  it.skip('ref', () => {
    cy.then(() => {
      return new Promise(async (resolve, reject) => {
        Cypress.log('getCurrentSessionData') // throws uncaught exception

        const { cookies } = await Cypress.session.getCurrentSessionData()

        if (cookies.length === 0) { // this is always zero! we aren't setting any :D
          resolve(false)
        }
      })
    })
  })
})

// it('for reference', () => {
//   cy.get('does_not_exist', { timeout: 1 })
// })
