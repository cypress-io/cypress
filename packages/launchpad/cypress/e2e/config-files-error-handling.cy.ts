import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'

const expectStackToBe = (mode: 'open' | 'closed') => {
  cy.get(`[data-cy="stack-open-${mode === 'open' ? 'true' : 'false'}"]`)
}

describe('Config files error handling', () => {
  beforeEach(() => {
    cy.scaffoldProject('pristine')
    cy.scaffoldProject('pristine-with-e2e-testing')
  })

  it('shows an error when there are multiple config files', () => {
    cy.openProject('pristine-with-e2e-testing')

    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.config.ts', 'module.exports = {}')
    })

    // Reopen the project, now that we have 2 config files
    cy.openProject('pristine-with-e2e-testing')
    cy.visitLaunchpad()

    cy.get('body').should('contain.text', 'Could not load a Cypress configuration file because there are multiple matches')
    expectStackToBe('closed')
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.removeFileInProject('cypress.config.js')
    })

    cy.findByRole('button', { name: 'Try again' }).click()

    cy.get('h1').should('contain', 'Welcome to Cypress')
  })

  it('shows the upgrade screen if there is a legacy config file', () => {
    cy.openProject('pristine-with-e2e-testing')
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.json', '{}')
      await ctx.actions.file.removeFileInProject('cypress.config.js')
    })

    cy.openProject('pristine-with-e2e-testing')

    cy.visitLaunchpad()

    cy.get('body').should('contain.text', defaultMessages.migration.wizard.title)
    cy.get('body').should('contain.text', defaultMessages.migration.wizard.description)
  })

  it('handles config files with legacy config file in same project', () => {
    cy.openProject('pristine-with-e2e-testing')
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.json', '{}')
    })

    cy.openProject('pristine-with-e2e-testing')
    cy.visitLaunchpad()

    cy.contains('p', 'There is both a cypress.config.js and a cypress.json file at the location below:')
    cy.contains('body', 'Cypress no longer supports cypress.json')
    expectStackToBe('closed')

    cy.withCtx(async (ctx) => {
      await ctx.actions.file.removeFileInProject('cypress.json')
    })

    cy.findByRole('button', { name: 'Try again' }).click()

    cy.get('h1').should('contain', 'Welcome to Cypress')
  })

  it('handles deprecated config fields', () => {
    cy.openProject('pristine')
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.config.js', 'module.exports = { e2e: { supportFile: false, experimentalComponentTesting: true } }')
    })

    cy.openProject('pristine')

    cy.visitLaunchpad()
    cy.get('[data-cy-testingType=e2e]').click()
    cy.get('body', { timeout: 10000 }).should('contain.text', 'was removed in Cypress version')
    expectStackToBe('closed')
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.config.js', 'module.exports = { e2e: { supportFile: false } }')
    })

    cy.findByRole('button', { name: 'Try again' }).click()

    cy.get('h1').should('contain', 'Choose a Browser')
  })
})

describe('Launchpad: Error System Tests', () => {
  it('Handles an error thrown from the root of the config file', () => {
    cy.scaffoldProject('plugins-root-sync-error')
    cy.openProject('plugins-root-sync-error', ['--e2e'])
    cy.visitLaunchpad()
    cy.get('h1').should('contain', 'Error')
    expectStackToBe('open')
  })

  it('Handles an error thrown asynchronously in the root of the config', () => {
    cy.scaffoldProject('plugins-root-async-error')
    cy.openProject('plugins-root-async-error', ['--e2e'])
    cy.visitLaunchpad()
    cy.get('h1').should('not.exist') // No title set on unhandled error
    expectStackToBe('open')
  })

  it('Handles an synchronously in setupNodeEvents', () => {
    cy.scaffoldProject('plugins-function-sync-error')
    cy.openProject('plugins-function-sync-error', ['--e2e'])
    cy.visitLaunchpad()
    cy.get('h1').should('contain', 'Error Loading Config')
    expectStackToBe('open')
  })

  it('Handles an error thrown while validating config', () => {
    cy.scaffoldProject('config-with-invalid-browser')
    cy.openProject('config-with-invalid-browser', ['--e2e'])
    cy.visitLaunchpad()
    cy.get('h1').should('contain', 'Error Loading Config')
    expectStackToBe('closed')
  })

  it('Handles an error thrown from the tasks', () => {
    cy.scaffoldProject('plugins-function-sync-error')
    cy.openProject('plugins-function-sync-error', ['--e2e'])
    cy.visitLaunchpad()
    cy.get('h1').should('contain', 'Error Loading Config')
    expectStackToBe('open')
  })

  it('Handles a TS syntax error when loading the config', () => {
    cy.scaffoldProject('config-with-ts-syntax-error')
    cy.openProject('config-with-ts-syntax-error')
    cy.visitLaunchpad()
    cy.get('h1').should('contain', 'Error Loading Config')
    cy.percySnapshot()
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.config.ts', 'module.exports = { e2e: { supportFile: false } }')
    })

    cy.findByRole('button', { name: 'Try again' }).click()

    cy.get('h1').should('contain', 'Welcome to Cypress')
  })

  it('shows correct user file instead of node file', () => {
    cy.scaffoldProject('config-with-import-error')
    cy.openProject('config-with-import-error')
    cy.visitLaunchpad()
    cy.get('h1').should('contain', 'Error Loading Config')
    cy.percySnapshot()

    cy.get('[data-testid="error-code-frame"]').should('contain', 'cypress.config.js:4:23')
  })

  it('shows correct stack trace when config with ts-module error', () => {
    cy.scaffoldProject('config-with-ts-module-error')
    cy.openProject('config-with-ts-module-error')
    cy.visitLaunchpad()
    cy.get('h1').should('contain', 'Error Loading Config')
    cy.percySnapshot()

    cy.get('[data-testid="error-code-frame"]').should('contain', 'cypress.config.ts:6:9')
  })
})

describe('setupNodeEvents', () => {
  it('throws an error when in setupNodeEvents updating a config value that was removed in 10.X', () => {
    cy.scaffoldProject('config-update-non-migrated-value')
    cy.openProject('config-update-non-migrated-value')
    cy.visitLaunchpad()
    cy.findByText('E2E Testing').click()
    cy.get('h1').should('contain', 'Error Loading Config')
    cy.percySnapshot()

    cy.get('[data-testid="error-code-frame"]').should('contain', 'cypress.config.js:5:32')
  })

  it('throws an error when in setupNodeEvents updating a config value on a clone of config that was removed in 10.X', () => {
    cy.scaffoldProject('config-update-non-migrated-value-clone')
    cy.openProject('config-update-non-migrated-value-clone')
    cy.visitLaunchpad()
    cy.findByText('E2E Testing').click()
    cy.get('h1').should('contain', 'Error Loading Config')
    cy.percySnapshot()

    cy.get('[data-cy="alert-body"]').should('contain', 'integrationFolder')
  })

  it('throws an error when in setupNodeEvents updating an e2e config value that was removed in 10.X', () => {
    cy.scaffoldProject('config-update-non-migrated-value-e2e')
    cy.openProject('config-update-non-migrated-value-e2e')
    cy.visitLaunchpad()
    cy.findByText('E2E Testing').click()
    cy.get('h1').should('contain', 'Error Loading Config')
    cy.percySnapshot()

    cy.get('[data-testid="error-code-frame"]').should('contain', 'cypress.config.ts:5:35')
  })
})
