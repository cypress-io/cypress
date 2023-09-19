describe('a test suite with a browser crash', function () {
  it('navigates to about:blank', () => {
    cy.visit('/index.html')
  })

  it('crashes the chrome tab', () => {
    Cypress.automation('remote:debugger:protocol', { command: 'Page.navigate', params: { url: 'chrome://crash', transitionType: 'typed' } })
    cy.visit('localhost')
  })
})
