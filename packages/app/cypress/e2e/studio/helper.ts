export function launchStudio ({ specName = 'spec.cy.js', createNewTest = false, cliArgs = [''], enableCloudStudio = false } = {}) {
  cy.scaffoldProject('experimental-studio')
  cy.openProject('experimental-studio', cliArgs, {
    cloudStudio: enableCloudStudio,
  })

  cy.startAppServer('e2e')
  cy.visitApp()
  cy.specsPageIsVisible()
  cy.get(`[data-cy-row="${specName}"]`).click()

  cy.waitForSpecToFinish()

  // Should not show "Studio Commands" until we've started a new Studio session.
  cy.get('[data-cy="hook-name-studio commands"]').should('not.exist')

  if (createNewTest) {
    cy.contains('studio functionality').as('item')
  } else {
    cy.contains('visits a basic html page').as('item')
  }

  cy.get('@item')
  .closest('.runnable-wrapper').as('runnable-wrapper')
  .realHover()

  cy.get('@runnable-wrapper')
  .findByTestId('launch-studio')
  .click()

  // Studio re-executes spec before waiting for commands - wait for the spec to finish executing.
  cy.waitForSpecToFinish()

  if (createNewTest) {
    cy.get('span.runnable-title').contains('New Test').should('exist')
  } else {
    cy.get('[data-cy="hook-name-studio commands"]').should('exist')
  }
}
