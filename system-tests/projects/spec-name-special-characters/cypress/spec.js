/// <reference types="cypress" />
describe('fixtures in subfolder', () => {
  it('works', () => {
    cy.fixture('example').should('deep.equal', {
      works: true,
    })
  })
})
