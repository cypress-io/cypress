/// <reference types="cypress" />
it('has expected env variables', () => {
  // this test checks environment variables
  // passed via "cypress.run" arguments
  cy.env(['foo', 'another']).then(({ foo, another }) => {
    cy.wrap(foo).should('deep.include', {
      bar: 'baz',
    })

    cy.wrap(another).should('equal', 42)
  })
})
