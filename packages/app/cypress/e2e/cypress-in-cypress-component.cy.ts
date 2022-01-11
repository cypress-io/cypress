describe('Cypress In Cypress', () => {
  it('test component', () => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')
    cy.startAppServer('component')
    cy.visitApp()
    cy.contains('TestComponent.spec').click()
    //TODO: Validate that the test succeeds when we get CT in E2E cypress in cypress working
  })
})
