const helpers = require('../support/helpers')

const { runIsolatedCypress } = helpers.createCypress({ config: { experimentalLoginFlows: true } })

describe('runner/cypress sessions.ui.spec', { viewportWidth: 1000, viewportHeight: 660 }, () => {
  it('empty session with no data', () => {
    runIsolatedCypress(() => {
      it('t1', () => {
        cy.session('blank_session', () => {})
        assert(true)
      })
    })

    cy.get('.sessions-container')
    .should('contain', 'Sessions (1)')
    .click()
    .should('contain', 'blank_session')

    cy.get('.command-name-session')
    .first()
    .find('i.successful')
    .siblings()
    .should('contain', '(new) blank_session')

    cy.get('.command-name-session')
    .last()
    .contains('blank_session')
    .click()

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
        expect(window.localStorage.foo).to.eq('val')
      })

      it('t2', () => {
        expect(window.localStorage.foo).to.eq('val')
      })

      it('t3', () => {
        expect(window.localStorage.foo).to.eq('val')
      })
    })

    cy.get('.test').each(($el) => cy.wrap($el).click())

    cy.log('validating new session was created')
    cy.get('.test').eq(0).within(() => {
      cy.get('.sessions-container')
      .should('contain', 'Sessions (1)')
      .click()
      .should('contain', 'user1')

      cy.get('.command-name-session')
      .first()
      .find('i.successful')
      .siblings()
      .should('contain', '(new) user1')

      cy.get('.command-name-session')
      .last()
      .contains('user1')
      .click()

      cy.get('.command-name-assert')
      .should('have.class', 'command-state-passed')
    })

    cy.log('validating previous session was used')
    cy.get('.test').eq(1).within(() => {
      cy.get('.sessions-container')
      .should('contain', 'Sessions (1)')
      .click()
      .should('contain', 'user1')

      cy.get('.command-name-session')
      .first()
      .find('i.pending')
      .siblings()
      .should('contain', '(saved) user1')

      cy.get('.command-name-session')
      .last()
      .contains('user1')
    })

    cy.log('validating session was recreated after it failed to verify')
    cy.get('.test').eq(2).within(() => {
      cy.get('.sessions-container')
      .should('contain', 'Sessions (1)')
      .click()
      .should('contain', 'user1')

      cy.get('.command-name-session')
      .first()
      .find('i.bad')
      .siblings()
      .should('contain', '(recreated) user1')

      cy.get('.command-name-session')
      .last()
      .contains('user1')
    })

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
