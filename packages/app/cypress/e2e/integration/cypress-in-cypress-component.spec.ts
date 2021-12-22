describe('Cypress In Cypress', () => {
  it('test component', () => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')
    cy.startAppServer('component')
    cy.pause()
    cy.visitApp()
    cy.contains('TestComponent.spec').click()
  })
})
