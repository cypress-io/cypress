describe('experimentalStudio', () => {
  it('should show experimentalStudio warning if Cypress detects experimentalStudio config has been set', () => {
    cy.scaffoldProject('experimental-studio')
    cy.openProject('experimental-studio')
    cy.visitLaunchpad()

    cy.get('[data-cy-testingtype="e2e"]').click()
    cy.get('[data-cy="warning-alert"]').contains('Warning: Experimental Studio Removed')
  })
})
