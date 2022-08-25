describe('Studio - create a new test in an empty suite', () => {
  // TODO: Can we somehow do the "Create Test" workflow within Cypress in Cypress?
  it('creates a brand new test', () => {
    cy.scaffoldProject('experimental-studio')
    cy.openProject('experimental-studio')
    cy.startAppServer('e2e')
    cy.visitApp()
    cy.visit(`http://localhost:4455/__/#/specs/runner?file=cypress/e2e/empty.cy.js`)

    cy.waitForSpecToFinish()

    cy.contains('Create test with Cypress Studio').click()
    cy.get('[data-cy="aut-url"]').as('urlPrompt')

    cy.get('@urlPrompt').within(() => {
      cy.contains('Continue ➜').should('be.disabled')
    })

    cy.get('@urlPrompt').type('http://localhost:4455/cypress/e2e/index.html')

    cy.get('@urlPrompt').within(() => {
      cy.contains('Continue ➜').should('not.be.disabled')
      cy.contains('Cancel').click()
    })

    // TODO: Can we somehow do the "Create Test" workflow within Cypress in Cypress?
    // If we hit "Continue" here, it updates the domain (as expected) but since we are
    // Cypress in Cypress, it redirects us the the spec page, which is not what normally
    // would happen in production.
  })
})
