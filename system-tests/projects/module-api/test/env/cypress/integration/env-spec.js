/// <reference types="cypress" />
it('has expected env variables', () => {
  // this test checks environment variables
  // passed via "cypress.run" arguments
  cy.wrap(Cypress.env()).should('deep.include', {
    foo: {
      bar: 'baz',
    },
    another: 42,
  })
})
