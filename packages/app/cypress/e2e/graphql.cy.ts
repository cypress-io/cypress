const errorMessage = 'This is an intentional error for testing purposes'

describe('GraphQL', () => {
  it('fatally errors if GraphQL query errors', (done) => {
    cy.on('uncaught:exception', (error, runnable, p) => {
      // We expect the uncaught exception, since we are intentionally
      // querying a bad endpoint and expect a specific message.
      // in another other scenario, the test would fail and the run would
      // end (we want GraphQL errors to be treated as bugs; they should not
      // happen).
      expect(error.message).to.contain(errorMessage)
      done()

      return false
    })

    cy.on('fail', (error, runnable) => {
      // Actually fail if the error is anything other
      // than what we expected!
      if (!error.message.includes(errorMessage)) {
        throw error
      }

      return false
    })

    cy.scaffoldProject('todos')
    cy.openProject('todos')
    cy.startAppServer()
    cy.visitApp()

    cy.get('[data-e2e-href="/testerror"]').click({ force: true })
    cy.contains('Error page for testing')
  })
})
