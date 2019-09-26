describe('async timeouts', () => {
  it('does not timeout during cypress command', (done) => {
    cy.timeout(100)
    cy.wait(200)
    cy.then(() => done())
  })
})
