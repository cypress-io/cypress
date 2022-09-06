function launchApp () {
  cy.scaffoldProject('selector-playground')
  cy.openProject('selector-playground')
  cy.startAppServer('e2e')
  cy.visitApp()
  cy.get(`[data-cy-row="spec.cy.js"]`).click()

  cy.waitForSpecToFinish()
}

describe('selector playground', () => {
  it('highlight the element when hover over it.', () => {
    launchApp()

    cy.get('[data-cy="playground-activator"]').click()

    cy.getAutIframe().within(() => {
      cy.get('h2').realHover()
      cy.get('.__cypress-selector-playground').shadow().within(() => {
        cy.get('.highlight').should('exist')
        // Space(' ') is added at the end of the text
        // because of the indentation to add arrow div in the vue template.
        cy.get('.tooltip').should('have.text', '[data-cy="h2-contents"] ')
      })
    })
  })
})
