const helpers = require('../support/helpers')

const { runIsolatedCypress } = helpers.createCypress({ config: { experimentalSessionSupport: true } })

describe('runner/cypress sessions.ui.spec', { viewportWidth: 1000, viewportHeight: 660 }, () => {
  it('empty session with no data', () => {
    runIsolatedCypress(() => {
      const blankSession = cy.defineSession('blankSession', () => {})

      it('t1', () => {
        cy.useSession(blankSession)
        assert(true)
      })
    })

    cy.get('.sessions-container').click()
    .should('contain', 'no session data')

    cy.percySnapshot()
  })

  it('tests sharing session', () => {
    runIsolatedCypress(() => {
      cy.defineSession('user1', () => {
        window.localStorage.foo = 'val'
      })

      beforeEach(() => {
        cy.useSession('user1')
      })

      it('t1', () => {
        assert(true)
      })

      it('t2', () => {
        assert(true)
      })
    })

    cy.get('.test').each(($el) => cy.wrap($el).click())

    cy.get('.sessions-container').eq(0).click()
    .should('contain', '1')

    cy.get('.sessions-container').eq(1).click()
    .should('contain', '1')

    cy.get('.test').eq(0)
    .should('contain', 'Session (user1)')

    cy.get('.test').eq(1)
    .should('contain', 'Session (user1)')
    .should('contain', 'using saved session')

    cy.percySnapshot()
  })

  it('multiple sessions in a test', () => {
    runIsolatedCypress(() => {
      cy.defineSession('user1', () => {
        window.localStorage.foo = 'val'
      })

      cy.defineSession('user2', () => {
        window.localStorage.foo = 'val'
        window.localStorage.bar = 'val'
      })

      it('t1', () => {
        cy.useSession('user1')
        cy.useSession('user2')
      })
    })

    cy.get('.sessions-container').first().click()
    .should('contain', '1')

    cy.get('.sessions-container').eq(1).click()
    .should('contain', '2')

    cy.percySnapshot()
  })

  describe('errors', () => {
    it('experimentalSessionSupport not enabled', () => {
      runIsolatedCypress(() => {
        cy.defineSession('user1', () => {
        })
      }, { config: { experimentalSessionSupport: false } })

      cy.get('.runnable-err').should('contain', 'experimentalSessionSupport is not enabled')

      cy.percySnapshot()
    })

    it('defineSession called with duplicate name', () => {
      runIsolatedCypress(() => {
        cy.defineSession('user1', () => {
        })

        cy.defineSession('user1', () => {
        })

        it('t1', () => {
          cy.useSession('user1')
        })
      })

      // TODO: add test for codeframe. Because of the way the tests are
      // executed in isolated-runner, codeframes are not shown.
      cy.get('.runnable-err').should('contain', 'cy.defineSession')

      cy.percySnapshot()
    })

    it('defineSession called without steps option', () => {
      runIsolatedCypress(() => {
        cy.defineSession('user1')

        it('t1', () => {
          cy.useSession('user1')
        })
      })

      // TODO: add test for codeframe. Because of the way the tests are
      // executed in isolated-runner, codeframes are not shown.
      cy.get('.runnable-err')
      .should('contain', 'cy.defineSession')
      .should('contain', 'steps')

      cy.percySnapshot()
    })

    it('defineSession called without name option', () => {
      runIsolatedCypress(() => {
        cy.defineSession()

        it('t1', () => {
          cy.useSession('user1')
        })
      })

      // TODO: add test for codeframe. Because of the way the tests are
      // executed in isolated-runner, codeframes are not shown.
      cy.get('.runnable-err')
      .should('contain', 'cy.defineSession')
      .should('contain', 'name')

      cy.percySnapshot()
    })

    // it('navigates to blank page before each test', () => {
    //   runIsolatedCypress(() => {
    //     it('t1', () => {
    //       cy.visit('/')
    //     })

    //     it('t2', () => {
    //     })
    //   })

    //   // TODO: add test for codeframe. Because of the way the tests are
    //   // executed in isolated-runner, codeframes are not shown.
    //   cy.get('.runnable-err')
    //   .should('contain', 'cy.defineSession')
    //   .should('contain', 'name')

    //   cy.percySnapshot()
    // })
  })
})
