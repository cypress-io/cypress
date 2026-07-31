describe('parallel intercepted subresources', () => {
  it('loads when parallel intercepted subresources exceed the browser connection pool', () => {
    cy.intercept('**', (req) => {
      req.continue()
    })

    cy.visit('/')

    cy.get('#done', { timeout: 30000 })
  })
})
