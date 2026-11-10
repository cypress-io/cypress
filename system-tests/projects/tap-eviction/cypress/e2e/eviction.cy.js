// Three like-shaped tests under numTestsKeptInMemory: 1, each capturing
// snapshots and console properties — so by the time the run settles the driver
// holds details for the last one only.
describe('Eviction', () => {
  for (const nth of ['first', 'second', 'third']) {
    it(`is the ${nth} test`, () => {
      cy.visit('cypress/e2e/eviction.html')
      cy.get('#toggle').click()
      cy.get('#status').should('have.text', 'clicked')
    })
  }
})
