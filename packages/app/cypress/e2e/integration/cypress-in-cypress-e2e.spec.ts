describe('Cypress In Cypress', () => {
  it('test e2e', () => {
    // cy.pause()
    // cy.visit('cypress/e2e/integration/dom-content.html')
    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')
    // cy.pause()
    cy.startAppServer()
    // cy.pause()
    // cy.visitApp('/tests/cypress/e2e/integration/dom-content.spec.js')
    cy.visitApp()
    cy.contains('dom-content.spec').click()
    cy.location().should((location) => {
      expect(location.hash).to.contain('dom-content.spec')
    })

    cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')
  })
})
