describe('special characters', () => {
  it('displays file name with decoded special characters', () => {
    cy.wrap(Cypress.$(window.top.document.body))
    .find('.reporter .runnable-header a')
    .should('have.text', 'cypress/integration/meta_&%_spec.ts')
  })
})
