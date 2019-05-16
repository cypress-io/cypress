/**
 * This spec is for manually testing snapshot CSS performance and memory usage
 * The entire suite should be run and the memory and performance tested
 * The second suite can be run on its own to manually check each snapshot and
 *   ensure the CSS is applied as expected
 */

const _ = Cypress._

describe('issue #2366 - snapshot CSS memory and performance improvements', () => {
  beforeEach(() => {
    cy.visit('/fixtures/issue-2366-external-css.html')
  })

  describe('lots of assertions run against an HTML page with a large external stylesheet', () => {
    _.range(1, 101).forEach((n) => {
      it(`assertion ${n}`, () => {
        cy.get('#lots-of-css').should('be.visible')
      })
    })
  })

  describe('CSS changes via JavaScript', () => {
    it('caches the original rules', () => {
      cy.get('#external-1').should('be.visible')
    })

    it('changes the rules for a single stylesheet, so they should be updated in the snapshot', () => {
      cy.window().then((win) => {
        cy.log('change css rules')
        win.changeRules(0)
      })
      cy.get('#external-1')
      .should('not.have.css', 'margin-right', '1px')
      .should('have.css', 'margin-right', '10px')
    })

    it('does not change the rules, so they should be back to the originals', () => {
      cy.get('#external-1').should('be.visible')
    })

    it('changes the rules for multiple stylesheets, so they should be updated in the snapshot', () => {
      cy.window().then((win) => {
        cy.log('change css rules for external-1')
        win.changeRules(0)
      })
      cy.get('#external-1')
      .should('not.have.css', 'margin-right', '1px')
      .should('have.css', 'margin-right', '10px')

      cy.window().then((win) => {
        cy.log('change css rules for external-2')
        win.changeRules(1)
      })
      cy.get('#external-2')
      .should('not.have.css', 'margin-right', '2px')
      .should('have.css', 'margin-right', '20px')
    })

    it('does not change the rules, so they should be back to the originals', () => {
      cy.get('#external-1').should('be.visible')
    })
  })
})
