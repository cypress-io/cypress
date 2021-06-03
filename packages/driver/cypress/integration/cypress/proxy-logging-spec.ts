describe('Proxy Logging', () => {
  it('intercepted cy.visits do not wait for a pre-request', () => {
    cy.intercept('*', () => {})

    cy.visit('/fixtures/empty.html', { timeout: 1000 })
  })
})
