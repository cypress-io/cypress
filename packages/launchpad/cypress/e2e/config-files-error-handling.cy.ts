import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'

// TODO: add when we land the lifecycle management
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

    cy.get('body').should('contain.text', 'Something went wrong')
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.removeFileInProject('cypress.config.js')
    })

    cy.get('body')
    .should('not.contain.text', 'Something went wrong')
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

    cy.get('body').should('contain.text', 'Cypress no longer supports')

    cy.withCtx(async (ctx) => {
      await ctx.actions.file.removeFileInProject('cypress.json')
    })

    cy.get('body').should('not.contain.text', 'Cypress no longer supports')
  })

  it('handles deprecated config fields', () => {
    cy.openProject('pristine')

    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.config.js', 'module.exports = { experimentalComponentTesting: true, e2e: {} }')
    })

    cy.openProject('pristine')

    cy.visitLaunchpad()
    cy.get('[data-cy-testingType=e2e]').click()
    cy.get('body').should('contain.text', 'Something went wrong')
    cy.get('body').should('contain.text', 'It looks like there\'s some issues that need to be resolved before we continue.')
    cy.findByText('Error Loading Config')
  })

  it('handles deprecated fields on root config', () => {
    cy.openProject('pristine')

    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.config.js', `module.exports = { supportFile: 'cypress/support.ts', e2e: {} }`)
    })

    cy.openProject('pristine')

    cy.visitLaunchpad()
    cy.get('[data-cy-testingType=e2e]').click()
    cy.get('body').should('contain.text', 'Something went wrong')
    cy.get('body').should('contain.text', 'It looks like there\'s some issues that need to be resolved before we continue.')
    cy.findByText('Error Loading Config')
  })
})
