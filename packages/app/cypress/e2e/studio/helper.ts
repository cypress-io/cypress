import type { ProjectFixtureDir } from '@tooling/system-tests'

export function loadProjectAndRunSpec ({ projectName = 'experimental-studio' as ProjectFixtureDir, specName = 'spec.cy.js', cliArgs = [''], enableCloudStudio = false, specSelector = 'data-cy-row' } = {}) {
  cy.scaffoldProject(projectName)
  cy.openProject(projectName, cliArgs, {
    cloudStudio: enableCloudStudio,
  })

  cy.startAppServer('e2e')
  cy.visitApp()
  cy.specsPageIsVisible()
  cy.get(`[${specSelector}="${specName}"]`).click()

  cy.waitForSpecToFinish()
}

export function launchStudio ({ specName = 'spec.cy.js', createNewTest = false, cliArgs = [''], enableCloudStudio = false } = {}) {
  loadProjectAndRunSpec({ specName, cliArgs, enableCloudStudio })

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

export function assertClosingPanelWithoutChanges () {
  // Cypress re-runs after you cancel Studio.
  // Original spec should pass
  cy.waitForSpecToFinish({ passCount: 1 })

  cy.get('.command').should('have.length', 1)

  // Assert the spec was executed without any new commands.
  cy.get('.command-name-visit').within(() => {
    cy.contains('visit')
    cy.contains('cypress/e2e/index.html')
  })

  cy.findByTestId('hook-name-studio commands').should('not.exist')

  cy.withCtx(async (ctx) => {
    const spec = await ctx.actions.file.readFileInProject('cypress/e2e/spec.cy.js')

    // No change, since we closed studio
    expect(spec.trim().replace(/\r/g, '')).to.eq(`
describe('studio functionality', () => {
  it('visits a basic html page', () => {
    cy.visit('cypress/e2e/index.html')
  })
})`.trim())
  })
}
