describe('Failing', () => {
  // A failed verdict is still a settled run, so the app under test stays readable.
  it('fails after loading the fixture page', () => {
    cy.visit('cypress/e2e/aut-content.html')
    cy.get('#status').should('have.text', 'this is not what the page says')
  })
})
