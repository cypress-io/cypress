describe('docs url', () => {
  it('displays as link in interactive mode', () => {
    Cypress.config('isInteractive', true)
    cy.viewport()
  })

  it('is text in error message in run mode', () => {
    Cypress.config('isInteractive', false)
    cy.viewport()
  })
})
