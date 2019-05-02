const _ = Cypress._

describe('lots of assertions run against an HTML page with a large external stylesheet', () => {
  beforeEach(() => {
    cy.visit('/fixtures/issue-2366-external-css.html')
  })
  _.range(1, 101).forEach((n) => {
    it(`assertion ${n}`, () => {
      cy.get('#test').should('be.visible')
    })
  })
})
