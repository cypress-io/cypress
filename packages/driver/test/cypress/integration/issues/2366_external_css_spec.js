const _ = Cypress._

describe('lots of assertions run against an HTML page with a large external stylesheet', () => {
  beforeEach(() => {
    cy.visit('/fixtures/issue-2366-external-css.html')
  })
  _.range(1, 101).forEach((n) => {
    it(`assertion ${n}`, () => {
      cy.get('#lots-of-css').should('be.visible')
    })
  })

  describe('CSS changes via JavaScript', () => {
    it('caches the original rules', () => {
      cy.get('#lots-of-css').should('be.visible')
    })

    it('changes the rules, so they should be updated in the snapshot', () => {
      cy.window().then((win) => {
        cy.log('change css rules')
        win.changeRules()
      })
      cy.get('#external').should('not.have.css', 'margin-right', '2px')
      cy.get('#external').should('have.css', 'margin-right', '20px')
    })

    it('does not change the rules, so they should be back to the originals', () => {
      cy.get('#lots-of-css').should('be.visible')
    })
  })
})
