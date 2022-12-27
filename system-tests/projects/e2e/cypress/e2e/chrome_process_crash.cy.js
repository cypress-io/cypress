it('crashes the chrome process', () => {
  Cypress.automation('remote:debugger:protocol', { command: 'Browser.crash', params: {} })
  cy.visit('localhost')
})
