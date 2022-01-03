// TODO: add when we land the lifecycle management
describe('Config files error handling', () => {
  beforeEach(() => {
    cy.scaffoldProject('pristine')
    cy.scaffoldProject('pristine-with-config-file')
  })

  it('shows an error when there are multiple config files', () => {
    cy.openProject('pristine-with-config-file')

    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.config.ts', 'module.exports = {}')
    })

    // Reopen the project, now that we have 2 config files
    cy.openProject('pristine-with-config-file')
    cy.visitLaunchpad()

    cy.get('body').should('contain.text', 'Something went wrong')
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.removeFileInProject('cypress.config.js')
    })

    cy.get('body')
    .should('not.contain.text', 'Something went wrong')
  })

  it('it shows the upgrade screen if there is a legacy config file', () => {
    cy.openProject('pristine-with-config-file')
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.json', '{}')
      await ctx.actions.file.removeFileInProject('cypress.config.js')
    })

    cy.openProject('pristine-with-config-file')

    cy.visitLaunchpad()

    cy.get('body').should('contain.text', 'Add a cypress.config.js to remove')
  })

  it('it handles config files with legacy config file in same project', () => {
    cy.openProject('pristine-with-config-file')
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.json', '{}')
    })

    cy.openProject('pristine-with-config-file')
    cy.visitLaunchpad()

    cy.get('body').should('contain.text', 'Cypress no longer supports')

    cy.withCtx(async (ctx) => {
      await ctx.actions.file.removeFileInProject('cypress.json')
    })

    cy.get('body').should('not.contain.text', 'Cypress no longer supports')
  })
})
