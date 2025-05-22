import { runSpec } from './support/spec-loader'

describe('src/cypress/runner ui states', { retries: 0, defaultCommandTimeout: 600000 }, () => {
  beforeEach(() => {
    cy.viewport(1000, 1500)
  })

  it('hooks', () => {
    runSpec({
      fileName: 'ui-states/hooks.cy.js',
    })
    .then((win) => {
      return new Promise<void>((resolve) => {
        win.getEventManager().on('cypress:in:cypress:run:complete', () => {
          resolve()
        })
      }).then(() => {
        cy.contains('test hooks').should('be.visible')
        cy.percySnapshot()
      })
    })
  })

  it('nested tests', () => {
    runSpec({
      fileName: 'ui-states/nested-tests.cy.js',
    })
    .then((win) => {
      return new Promise<void>((resolve) => {
        win.getEventManager().on('cypress:in:cypress:run:complete', () => {
          resolve()
        })
      }).then(() => {
        cy.contains('Nested Tests').should('be.visible')
        cy.percySnapshot()
      })
    })
  })

  describe('commands', () => {
    it('commands that dont display in UI', () => {
      runSpec({
        fileName: 'ui-states/commands.cy.js',
      })
      .then((win) => {
        return new Promise<void>((resolve) => {
          win.getEventManager().on('cypress:in:cypress:run:complete', () => {
            resolve()
          })
        }).then(() => {
          cy.contains('commands that dont display in UI').should('be.visible').click()
          cy.percySnapshot()
        })
      })
    })

    it('commands that display in UI - part 1', () => {
      runSpec({
        fileName: 'ui-states/commandsToDisplay.cy.js',
      })
      .then((win) => {
        return new Promise<void>((resolve) => {
          win.getEventManager().on('cypress:in:cypress:run:complete', () => {
            resolve()
          })
        }).then(() => {
          cy.contains('commands that display in UI - part 1').should('be.visible')
          .click()

          cy.percySnapshot()
        })
      })
    })

    it('commands that display in UI - part 2', () => {
      runSpec({
        fileName: 'ui-states/commandsToDisplay.cy.js',
      })
      .then((win) => {
        return new Promise<void>((resolve) => {
          win.getEventManager().on('cypress:in:cypress:run:complete', () => {
            resolve()
          })
        }).then(() => {
          cy.contains('commands that display in UI - part 2').should('be.visible')
          .click()

          cy.percySnapshot()
        })
      })
    })

    it('commands that display in UI - part 3', () => {
      runSpec({
        fileName: 'ui-states/commandsToDisplay.cy.js',
      })
      .then((win) => {
        return new Promise<void>((resolve) => {
          win.getEventManager().on('cypress:in:cypress:run:complete', () => {
            resolve()
          })
        }).then(() => {
          cy.contains('commands that display in UI - part 3').should('be.visible')
          .click()

          cy.percySnapshot()
        })
      })
    })

    it('commands that display in UI - part 4', () => {
      runSpec({
        fileName: 'ui-states/commandsToDisplay.cy.js',
      })
      .then((win) => {
        return new Promise<void>((resolve) => {
          win.getEventManager().on('cypress:in:cypress:run:complete', () => {
            resolve()
          })
        }).then(() => {
          cy.contains('commands that display in UI - part 3').should('be.visible')
          .click()

          cy.percySnapshot()
        })
      })
    })

    it('command options - part 1', () => {
      runSpec({
        fileName: 'ui-states/commands.cy.js',
      })
      .then((win) => {
        return new Promise<void>((resolve) => {
          win.getEventManager().on('cypress:in:cypress:run:complete', () => {
            resolve()
          })
        }).then(() => {
          cy.contains('command options - part 1').should('be.visible').click()
          cy.percySnapshot()
        })
      })
    })

    it('command options - part 2', () => {
      runSpec({
        fileName: 'ui-states/commands.cy.js',
      })
      .then((win) => {
        return new Promise<void>((resolve) => {
          win.getEventManager().on('cypress:in:cypress:run:complete', () => {
            resolve()
          })
        }).then(() => {
          cy.contains('command options - part 2').should('be.visible').click()
          cy.percySnapshot()
        })
      })
    })

    it('command options - part 3', () => {
      runSpec({
        fileName: 'ui-states/commands.cy.js',
      })
      .then((win) => {
        return new Promise<void>((resolve) => {
          win.getEventManager().on('cypress:in:cypress:run:complete', () => {
            resolve()
          })
        }).then(() => {
          cy.contains('command options - part 3').should('be.visible').click()
          cy.percySnapshot()
        })
      })
    })

    it('Element Visibility', () => {
      runSpec({
        fileName: 'ui-states/commands.cy.js',
      })
      .then((win) => {
        return new Promise<void>((resolve) => {
          win.getEventManager().on('cypress:in:cypress:run:complete', () => {
            resolve()
          })
        }).then(() => {
          cy.contains('Element Visibility').should('be.visible').click()
          cy.percySnapshot()
        })
      })
    })
  })

  it('status codes', () => {
    runSpec({
      fileName: 'ui-states/status-codes.cy.js',
    })
    .then((win) => {
      return new Promise<void>((resolve) => {
        win.getEventManager().on('cypress:in:cypress:run:complete', () => {
          resolve()
        })
      }).then(() => {
        cy.contains('Request Statuses').should('be.visible')
        cy.percySnapshot()
      })
    })
  })

  it('page events', () => {
    runSpec({
      fileName: 'ui-states/page-events.cy.js',
    })
    .then((win) => {
      return new Promise<void>((resolve) => {
        win.getEventManager().on('cypress:in:cypress:run:complete', () => {
          resolve()
        })
      }).then(() => {
        cy.contains('events - page events').should('be.visible')
        cy.percySnapshot()
      })
    })
  })

  describe('errors', () => {
    it('simple error with docs link', () => {
      runSpec({
        fileName: 'ui-states/errors.cy.js',
      })
      .then((win) => {
        return new Promise<void>((resolve) => {
          win.getEventManager().on('cypress:in:cypress:run:complete', () => {
            resolve()
          })
        }).then(() => {
          cy.contains('simple error with docs link').should('be.visible')
          cy.percySnapshot()
        })
      })
    })

    it('long error', () => {
      runSpec({
        fileName: 'ui-states/errors.cy.js',
      })
      .then((win) => {
        return new Promise<void>((resolve) => {
          win.getEventManager().on('cypress:in:cypress:run:complete', () => {
            resolve()
          })
        }).then(() => {
          cy.contains('simple error with docs link').click()
          cy.contains('long error').should('be.visible')
          cy.percySnapshot()
        })
      })
    })
  })
})
