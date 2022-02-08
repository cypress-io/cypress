describe('GraphQL', () => {
  it('fatally errors if GraphQL query errors', () => {
    cy.on('fail', (error, runnable) => {
      // This test would normally fail, since we have an
      // unhandled GraphQL error. We don't actually want it
      // to fail though, just to prove there is an unhandled fail
      // that WOULD cause CI to fail, so we catch it here and verify
      // the fail is due to the expected reason.
      if (error.message.includes('This is an intentional error for testing purposes')) {
        return
      }

      throw error
    })

    cy.scaffoldProject('todos')
    cy.openProject('todos')
    cy.startAppServer()
    cy.visitApp()

    cy.get('[data-e2e-href="/testerror"]').click({ force: true })
    cy.contains('Error page for testing')
  })
})
