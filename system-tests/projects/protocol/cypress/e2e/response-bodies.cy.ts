describe('response bodies', () => {
  it('loads every asset on the page', () => {
    cy.visit('http://localhost:3232/response-bodies.html')

    cy.window().its('assetsLoaded', { timeout: 20000 }).should('deep.equal', {
      image: true,
      font: true,
      stylesheet: true,
      json: { name: 'Avery Lindqvist', email: 'avery.lindqvist@example.com' },
      emptyBytes: 0,
      largeBytes: 12 * 1024 * 1024,
    })
  })
})
