/// <reference types="cypress" />
describe('Trying to use cy.visit in component spec', () => {
  it('throws an error', () => {
    // https://github.com/bahmutov/@cypress/react/issues/286
    expect(() => {
      cy.visit('index.html')
    }).to.throw
  })
})
