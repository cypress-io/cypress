describe('Network', () => {
  // Exercises the three network shapes the reporter renders inline: a stubbed
  // cy.intercept, a real request to origin, and a cy.request. tap commands
  // should surface the same high-level detail for each.
  it('records intercept, real request, and cy.request detail', () => {
    cy.intercept('GET', '/api/users', { statusCode: 200, body: { ok: true } }).as('getUsers')
    cy.visit('cypress/e2e/network.html')
    cy.wait('@getUsers')
    cy.get('#status').should('have.text', 'stubbed-ok')

    cy.location('href').then((href) => {
      cy.request(href).its('status').should('eq', 200)
    })
  })
})
