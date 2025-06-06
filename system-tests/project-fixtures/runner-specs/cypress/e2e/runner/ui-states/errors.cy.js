describe('Errors', () => {
  it('simple error with docs link', () => {
    cy.visit('cypress/fixtures/commandsActions.html')
    cy.get('div')
    .click()
  })

  it('long error', () => {
    cy.request('http://httpstat.us/500')
  })
})
