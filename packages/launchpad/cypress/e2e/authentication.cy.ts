describe('authentication.cy.ts', () => {
  it('visits acme', () => {
    cy.origin('https://acme.com', () => {
      cy.visit('/')
      cy.contains('ACME Laboratories')
    })
  })

  // TODO: What am I doing incorrectly?
  it('logs into dashboard', () => {
    cy.origin('dashboard-staging.cypress.io', () => {
      cy.visit('/login')
    })
  })
})
