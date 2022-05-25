describe('cy assertion', {
  numTestsKeptInMemory: 1,
}, () => {
  it('visits fixture', () => {
    cy.visit('cypress/fixtures/index.html')

    cy.get('html').should('exist')
  })
})
