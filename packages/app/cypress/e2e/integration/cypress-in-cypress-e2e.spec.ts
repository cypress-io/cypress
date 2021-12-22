describe('Cypress In Cypress', () => {
  it('test e2e', () => {
    // cy.visit('https://docs.cypress.io/guides/guides/command-line')
    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')
    cy.startAppServer()
    cy.visitApp()
    // cy.contains('dom-content.spec').click()
  })
})
