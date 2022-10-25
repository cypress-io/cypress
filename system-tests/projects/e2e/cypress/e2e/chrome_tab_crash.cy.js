it('crashes the chrome tab', () => {
  Cypress.automation('remote:debugger:protocol', { command: 'Page.navigate', params: { url: 'chrome://crash', transitionType: 'typed' } })
  cy.visit('localhost')
})
