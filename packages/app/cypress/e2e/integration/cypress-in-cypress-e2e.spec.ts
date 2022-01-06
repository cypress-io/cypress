describe('Cypress In Cypress', () => {
  it('test e2e', () => {
    // cy.pause()
    // cy.visit('cypress/e2e/integration/dom-content.html')
    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')
    // cy.pause()
    cy.startAppServer()
    // cy.pause()
    cy.visitApp()
    cy.contains('dom-content.spec').click()
  })
})
