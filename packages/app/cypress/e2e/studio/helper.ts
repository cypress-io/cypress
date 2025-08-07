import type { ProjectFixtureDir } from '@tooling/system-tests'

export function loadProjectAndRunSpec ({ projectName = 'experimental-studio' as ProjectFixtureDir, specName = 'spec.cy.js', cliArgs = [''], specSelector = 'data-cy-row' } = {}) {
  cy.viewport(1500, 1000)

  cy.scaffoldProject(projectName)
  cy.openProject(projectName, cliArgs)

  cy.startAppServer('e2e')
  cy.visitApp()
  cy.specsPageIsVisible()
  cy.get(`[${specSelector}="${specName}"]`).click()

  cy.waitForSpecToFinish()
}

export function launchStudio ({ specName = 'spec.cy.js', createNewTestFromSuite = false, createNewTestFromSpecHeader = false, cliArgs = [''] } = {}) {
  loadProjectAndRunSpec({ specName, cliArgs })

  const testTitle = 'visits a basic html page'

  if (createNewTestFromSuite || createNewTestFromSpecHeader) {
    cy.contains('studio functionality').as('item')
  } else {
    cy.contains(testTitle).as('item')
  }

  cy.get('@item')
  .closest('.runnable-wrapper').as('runnable-wrapper')

  if (createNewTestFromSuite || createNewTestFromSpecHeader) {
    if (createNewTestFromSpecHeader) {
      cy.findByTestId('create-new-test-from-spec-header').click()
    } else {
      cy.get('@runnable-wrapper').realHover().findByTestId('create-new-test-from-suite').click()
    }

    cy.findByTestId('studio-panel').should('be.visible')
    cy.findByTestId('new-test-button').should('be.visible')
  } else {
    cy.get('@runnable-wrapper')
    .findByTestId('launch-studio')
    .click()

    // Studio re-executes spec before waiting for commands - wait for the spec to finish executing.
    cy.waitForSpecToFinish()

    cy.get('[data-cy="studio-single-test-title"]').contains(testTitle)

    // verify recording is enabled to ensure the panel is fully ready
    cy.findByTestId('record-button-recording').should('have.text', 'Recording...')
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
