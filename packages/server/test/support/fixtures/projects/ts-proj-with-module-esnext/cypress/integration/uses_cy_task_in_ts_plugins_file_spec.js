describe('uses task that is in typescript plugins file', () => {
  it('calls task', () => {
    cy.task('hello', 'TS').should('equal', 'Hello, TS!')
  })
})
