// this ensures that special characters in the spec title are displayed
// properly. it tests the actual reporter instead of the AUT like other tests
describe('special characters', () => {
  it('displays file name with decoded special characters', () => {
    cy.wrap(Cypress.$(window.top.document.body))
    .find('.reporter .runnable-header a')
    .should('have.text', 'cypress/integration/meta_&%_spec.ts')
  })
})
