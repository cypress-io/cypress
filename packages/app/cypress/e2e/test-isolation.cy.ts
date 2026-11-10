describe('Test Isolation', () => {
  it('fires events in the right order with the right arguments - open mode', () => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.findBrowsers()
    cy.openProject('cypress-in-cypress')
    cy.startAppServer()

    cy.visitApp(`/specs/runner?file=cypress/e2e/test-isolation.spec.js`)

    cy.reporter().find('.passed > .num').should('contain', 3)
  })
})
