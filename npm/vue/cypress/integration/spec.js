describe('kek', () => {
  it('has dummy integration spec', () => {
    // just to avoid cypress run from failing
    cy.visit('http://localhost:4444/__/#/tests/integration/spec.js')
  })
})
