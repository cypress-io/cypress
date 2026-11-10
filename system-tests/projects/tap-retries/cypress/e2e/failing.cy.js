// Keep the failure on a two-digit line so the reporter snapshot distinguishes
// file:line:column locations from mm:ss durations.

const expectedText = 'this is not what the page says'

describe('Failing', () => {
  // A failed verdict is still a settled run, so the app under test stays readable.
  it('fails after loading the fixture page', () => {
    cy.visit('cypress/e2e/aut-content.html')
    cy.get('#status').should('have.text', expectedText)
  })
})
