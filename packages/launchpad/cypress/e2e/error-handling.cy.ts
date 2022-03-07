describe('Error handling', () => {
  it('it handles a config error', () => {
    cy.scaffoldProject('unify-plugin-errors')
    cy.openProject('unify-plugin-errors')
    cy.loginUser()

    cy.visitLaunchpad()

    cy.get('[data-cy-testingType=e2e]').click()

    cy.get('body')
    .and('contain.text', 'threw an error from')

    cy.get('[data-cy="collapsible-header"]')
    .should('have.attr', 'aria-expanded', 'true')
    .contains('Stack Trace')

    cy.log('Fix error and validate it reloads configuration')
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.config.js', `module.exports = { e2e: { baseUrl: 'https://cypress.com', supportFile: false } }`)
    })

    cy.get('body')
    .should('not.contain.text', 'Error Loading Config')
  })

  it('it handles a configuration file error', () => {
    cy.scaffoldProject('pristine')

    // sets the current project to enable writeFileInProject
    cy.openProject('pristine')

    // write a bad config file
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.config.js', 'throw new Error("Error thrown from Config")')
    })

    // reopens the project with the new config file (CircleCI does not react to the addition of a file)
    cy.openProject('pristine')

    cy.visitLaunchpad()

    cy.get('body')
    .should('contain.text', 'Error Loading Config')
    .and('contain.text', 'Error thrown from Config')

    cy.get('[data-cy="collapsible-header"]')
    .should('have.attr', 'aria-expanded', 'true')
    .contains('Stack Trace')

    cy.log('Fix error and validate it reloads configuration')

    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.config.js', 'module.exports = {}')
    })

    cy.get('body')
    .should('not.contain.text', 'Error Loading Config')
  })
})
