const helpers = require('../support/helpers')

const { runIsolatedCypress } = helpers.createCypress({ config: { experimentalSessionSupport: true } })

describe('runner/cypress sessions.ui.spec', { viewportWidth: 1000, viewportHeight: 660 }, () => {
  it('empty session with no data', () => {
    runIsolatedCypress(() => {
      it('t1', () => {
        cy.session('blank_session', () => {})
        assert(true)
      })
    })

    cy.get('.sessions-container').click()
    .should('contain', 'blank_session')

    cy.percySnapshot()
  })

  it('shows message for new, saved, and recreated session', () => {
    runIsolatedCypress(() => {
      const stub = Cypress.sinon.stub().callsFake(() => {
        if (stub.callCount === 3) {
          return false
        }
      })

      beforeEach(() => {
        cy.session('user1', () => {
          window.localStorage.foo = 'val'
        }, {
          validate: stub,
        })
      })

      it('t1', () => {
        assert(true)
      })

      it('t2', () => {
        assert(true)
      })

      it('t3', () => {
        assert(true)
      })
    })

    cy.get('.test').each(($el) => cy.wrap($el).click())

    cy.get('.sessions-container').eq(0).click()
    .should('contain', '1')

    cy.get('.sessions-container').eq(1).click()
    .should('contain', '1')

    cy.get('.test').eq(0)
    .should('contain', 'Sessions (1)')
    .should('contain', 'user1')
    .should('contain', '(new)')

    cy.get('.test').eq(1)
    .should('contain', 'Sessions (1)')
    .should('contain', 'user1')
    .should('contain', '(saved)')

    cy.get('.test').eq(2)
    .should('contain', 'Sessions (1)')
    .should('contain', 'user1')
    .should('contain', '(recreated)')

    cy.percySnapshot()
  })

  it('multiple sessions in a test', () => {
    runIsolatedCypress(() => {
      it('t1', () => {
        cy.session('user1', () => {
          window.localStorage.foo = 'val'
        })

        cy.session('user2', () => {
          window.localStorage.foo = 'val'
          window.localStorage.bar = 'val'
        })
      })
    })

    cy.get('.sessions-container').first().click()
    .should('contain', 'Sessions (2)')
    .should('contain', 'user1')
    .should('contain', 'user2')

    cy.percySnapshot()
  })
})
