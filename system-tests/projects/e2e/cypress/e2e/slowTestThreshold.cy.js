/* eslint-disable no-undef */
describe('slowTestThreshold', () => {
  it('passes inherited', () => {
    cy.wait(5)
    cy.wrap(true).should('be.true')
  })

  it('passes quickly', { slowTestThreshold: 10000 }, () => {
    cy.wrap(true).should('be.true')
  })

  it('passes slowly', { slowTestThreshold: 1 }, () => {
    cy.wait(5)
    cy.wrap(true).should('be.true')
  })
})
