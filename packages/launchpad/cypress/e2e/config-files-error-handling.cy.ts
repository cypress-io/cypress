import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'
import pkg from '../../../../package.json'

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
    cy.skipWelcome()

    cy.get('body').should('contain.text', 'Could not load a Cypress configuration file because there are multiple matches')
    expectStackToBe('closed')
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.removeFileInProject('cypress.config.js')
    })

    cy.findByRole('button', { name: 'Try again' }).click()

    cy.contains('h1', 'Welcome to Cypress', { timeout: 10000 })
  })

  it('shows the upgrade screen if there is a legacy config file', () => {
    cy.openProject('pristine-with-e2e-testing')
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.json', '{}')
      await ctx.actions.file.removeFileInProject('cypress.config.js')
    })

    cy.openProject('pristine-with-e2e-testing')

    cy.visitLaunchpad()
    cy.skipWelcome()

    cy.get('body').should('contain.text', defaultMessages.migration.wizard.title.replace('{version}', pkg.version.split('.')[0]))
    cy.get('body').should('contain.text', defaultMessages.migration.wizard.description)
  })

  it('handles config files with legacy config file in same project', () => {
    cy.openProject('pristine-with-e2e-testing')
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.json', '{}')
    })

    cy.openProject('pristine-with-e2e-testing')
    cy.visitLaunchpad()
    cy.skipWelcome()

    cy.contains('p', 'There is both a cypress.config.js and a cypress.json file at the location below:')
    cy.contains('body', 'Cypress no longer supports cypress.json')
    expectStackToBe('closed')

    cy.withCtx(async (ctx) => {
      await ctx.actions.file.removeFileInProject('cypress.json')
    })

    cy.findByRole('button', { name: 'Try again' }).click()

    cy.contains('h1', 'Welcome to Cypress', { timeout: 10000 })
  })

  it('handles deprecated config fields', () => {
    cy.openProject('pristine')
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.config.js', 'module.exports = { e2e: { supportFile: false, experimentalComponentTesting: true } }')
    })

    cy.openProject('pristine')

    cy.visitLaunchpad()
    cy.skipWelcome()
    cy.get('[data-cy-testingType=e2e]').click()
    cy.get('body', { timeout: 10000 }).should('contain.text', 'experimentalComponentTesting')
    expectStackToBe('closed')
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.config.js', 'module.exports = { e2e: { supportFile: false } }')
    })

    cy.findByRole('button', { name: 'Try again' }).click()

    cy.contains('h1', 'Choose a browser', { timeout: 10000 })
  })
})

describe('Launchpad: Error System Tests', () => {
  it('Handles an error thrown from the root of the config file', () => {
    cy.scaffoldProject('plugins-root-sync-error')
    cy.openProject('plugins-root-sync-error', ['--e2e'])
    cy.visitLaunchpad()
    cy.skipWelcome()
    cy.contains('h1', cy.i18n.launchpadErrors.generic.configErrorTitle, { timeout: 10000 })
    expectStackToBe('open')
  })

  it('Handles a syntax error in the config file', () => {
    cy.scaffoldProject('plugins-root-syntax-error')
    cy.openProject('plugins-root-syntax-error', ['--e2e'])
    cy.visitLaunchpad()
    cy.skipWelcome()
    cy.contains('h1', cy.i18n.launchpadErrors.generic.configErrorTitle, { timeout: 10000 })
    expectStackToBe('open')
  })

  it('Handles an error thrown asynchronously in the root of the config', () => {
    cy.scaffoldProject('plugins-root-async-error')
    cy.openProject('plugins-root-async-error', ['--e2e'])
    cy.visitLaunchpad()
    cy.skipWelcome()
    cy.contains('h1', 'Unexpected Error', { timeout: 10000 })
    expectStackToBe('open')
  })

  it('Handles an synchronously in setupNodeEvents', () => {
    cy.scaffoldProject('plugins-function-sync-error')
    cy.openProject('plugins-function-sync-error', ['--e2e'])
    cy.visitLaunchpad()
    cy.skipWelcome()
    cy.contains('h1', cy.i18n.launchpadErrors.generic.configErrorTitle, { timeout: 10000 })
    expectStackToBe('open')
  })

  it('Handles an error thrown while validating config', () => {
    cy.scaffoldProject('config-with-invalid-browser')
    cy.openProject('config-with-invalid-browser', ['--e2e'])
    cy.visitLaunchpad()
    cy.skipWelcome()
    cy.contains('h1', cy.i18n.launchpadErrors.generic.configErrorTitle, { timeout: 10000 })
    expectStackToBe('closed')
  })

  it('Handles an error thrown from the tasks', () => {
    cy.scaffoldProject('plugins-function-sync-error')
    cy.openProject('plugins-function-sync-error', ['--e2e'])
    cy.visitLaunchpad()
    cy.skipWelcome()
    cy.contains('h1', cy.i18n.launchpadErrors.generic.configErrorTitle, { timeout: 10000 })
    expectStackToBe('open')
  })

  it('Handles a TS syntax error when loading the config', () => {
    cy.scaffoldProject('config-with-ts-syntax-error')
    cy.openProject('config-with-ts-syntax-error')
    cy.visitLaunchpad()
    cy.skipWelcome()
    cy.contains('h1', cy.i18n.launchpadErrors.generic.configErrorTitle, { timeout: 10000 })
    cy.percySnapshot()

    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.config.ts', 'export default { e2e: { supportFile: false } }')
    })

    cy.findByRole('button', { name: 'Try again' }).click()

    cy.contains('h1', 'Welcome to Cypress', { timeout: 10000 })
  })

  it(`clears the error correctly after first 'try again' attempt`, () => {
    cy.intercept('mutation-Main_ResetErrorsAndLoadConfig').as('resetErrorsAndLoadConfig')
    cy.scaffoldProject('config-with-ts-syntax-error')
    cy.openProject('config-with-ts-syntax-error')
    cy.visitLaunchpad()
    cy.skipWelcome()
    cy.contains('h1', cy.i18n.launchpadErrors.generic.configErrorTitle, { timeout: 10000 })

    // Try again while the config is still invalid
    cy.findByRole('button', { name: 'Try again' }).click()

    cy.wait('@resetErrorsAndLoadConfig')

    // Wait until config error is on screen again
    cy.contains('h1', cy.i18n.launchpadErrors.generic.configErrorTitle, { timeout: 10000 })

    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.config.ts', 'export default { e2e: { supportFile: false } }')
    })

    cy.findByRole('button', { name: 'Try again' }).click()

    cy.contains('h1', 'Welcome to Cypress')
  })

  it('shows correct user file instead of node file', () => {
    cy.scaffoldProject('config-with-import-error')
    cy.openProject('config-with-import-error')
    cy.visitLaunchpad()
    cy.skipWelcome()
    cy.contains('h1', cy.i18n.launchpadErrors.generic.configErrorTitle, { timeout: 10000 })
    cy.percySnapshot()

    cy.get('[data-testid="error-code-frame"]').should('contain', 'cypress.config.js:3:23')
  })

  it('shows correct stack trace when config with ts-module error', () => {
    cy.scaffoldProject('config-with-ts-module-error')
    cy.openProject('config-with-ts-module-error')
    cy.visitLaunchpad()
    cy.skipWelcome()
    cy.contains('h1', cy.i18n.launchpadErrors.generic.configErrorTitle, { timeout: 10000 })
    cy.percySnapshot()

    cy.get('[data-testid="error-code-frame"]').should('contain', 'cypress.config.ts:6:10')
  })
})

describe('setupNodeEvents', () => {
  it('throws an error when in setupNodeEvents updating a config value that was removed in 10.X', () => {
    cy.scaffoldProject('config-update-non-migrated-value')
    cy.openProject('config-update-non-migrated-value')
    cy.visitLaunchpad()
    cy.skipWelcome()
    cy.findByText('E2E Testing').click()
    cy.contains('h1', cy.i18n.launchpadErrors.generic.configErrorTitle, { timeout: 10000 })
    cy.percySnapshot()
  })

  it('throws an error when in setupNodeEvents updating a config value on a clone of config that was removed in 10.X', () => {
    cy.scaffoldProject('config-update-non-migrated-value-clone')
    cy.openProject('config-update-non-migrated-value-clone')
    cy.visitLaunchpad()
    cy.skipWelcome()
    cy.findByText('E2E Testing').click()
    cy.contains('h1', cy.i18n.launchpadErrors.generic.configErrorTitle, { timeout: 10000 })
    cy.percySnapshot()

    cy.get('[data-cy="alert-body"]').should('contain', 'integrationFolder')
  })

  it('throws an error when in setupNodeEvents updating an e2e config value that was removed in 10.X', () => {
    cy.scaffoldProject('config-update-non-migrated-value-e2e')
    cy.openProject('config-update-non-migrated-value-e2e')
    cy.visitLaunchpad()
    cy.skipWelcome()
    cy.findByText('E2E Testing').click()
    cy.contains('h1', cy.i18n.launchpadErrors.generic.configErrorTitle, { timeout: 10000 })
    cy.percySnapshot()
  })

  it('handles deprecated config fields in setupNodeEvents', () => {
    cy.scaffoldProject('pristine')
    cy.openProject('pristine')
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.config.js',
`module.exports = { 
  e2e: { 
    supportFile: false, 
    setupNodeEvents(on, config){
      config.testFiles = '**/*.spec.js'
      return config
    }
  }
}`)
    })

    cy.openProject('pristine')

    cy.visitLaunchpad()
    cy.skipWelcome()
    cy.get('[data-cy-testingType=e2e]').click()
    cy.get('body', { timeout: 10000 }).should('contain.text', 'testFiles')
    cy.get('body', { timeout: 10000 }).should('contain.text', 'setupNodeEvents')
    expectStackToBe('closed')
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.config.js', 'module.exports = { e2e: { supportFile: false } }')
    })

    cy.findByRole('button', { name: 'Try again' }).click()

    cy.contains('h1', 'Choose a browser', { timeout: 10000 })
  })

  it('handles multiple config errors and then recovers', () => {
    cy.scaffoldProject('pristine')
    cy.openProject('pristine')
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.config.js', `module.exports = { baseUrl: 'htt://ocalhost:3000', e2e: { supportFile: false } }`)
    })

    cy.openProject('pristine')

    cy.visitLaunchpad()
    cy.skipWelcome()
    cy.contains('h1', cy.i18n.launchpadErrors.generic.configErrorTitle, { timeout: 10000 })
    cy.get('[data-cy="alert-body"]').should('contain', 'Expected baseUrl to be a fully qualified URL')

    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.config.js', `module.exports = { baseUrl: 'http://ocalhost:3000', e2e: { supportFile: false } }`)
    })

    cy.findByRole('button', { name: 'Try again' }).click()
    cy.get('[data-cy-testingType=e2e]').click()
    cy.contains('h1', cy.i18n.launchpadErrors.generic.configErrorTitle, { timeout: 10000 })
    cy.get('[data-cy="alert-body"]').should('contain', 'The baseUrl configuration option is now invalid when set from the root of the config object')

    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.config.js', `module.exports = { e2e: { baseUrl: 'http://localhost:3000', supportFile: false } }`)
    })

    cy.findByRole('button', { name: 'Try again' }).click()
    cy.contains('h1', 'Choose a browser', { timeout: 10000 })
    cy.get('[data-cy="alert"]').should('contain', 'Warning: Cannot Connect Base Url Warning')
  })

  it('handles a devServer function returning wrong structure', () => {
    cy.scaffoldProject('dev-server-invalid')

    // sets the current project to enable writeFileInProject
    cy.openProject('dev-server-invalid')

    cy.visitLaunchpad()
    cy.skipWelcome()

    cy.get('[data-cy-testingtype=component]').click()

    cy.get('body')
    .should('contain.text', cy.i18n.launchpadErrors.generic.configErrorTitle)
    .and('contain.text', 'The returned value of the devServer function is not valid.')

    cy.get('[data-cy="collapsible-header"]')
    .should('have.attr', 'aria-expanded', 'true')
    .contains(cy.i18n.launchpadErrors.generic.stackTraceLabel)

    cy.log('Fix error and validate it reloads configuration')

    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.config.js',
        `module.exports = {
          devServer: () => ({ port: '3000' })
        }`)
    })

    cy.findByRole('button', { name: 'Try again' }).click()

    cy.get('body')
    .should('not.contain.text', cy.i18n.launchpadErrors.generic.configErrorTitle)
    .should('contain.text', 'Welcome to Cypress!')
  })
})
