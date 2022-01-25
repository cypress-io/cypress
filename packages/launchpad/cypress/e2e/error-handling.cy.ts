describe('Error handling', () => {
  it('handles sync error when loading the config (top level)', () => {
    cy.scaffoldProject('config-with-uncaught-exception-sync')
    cy.openProject('config-with-uncaught-exception-sync')
    cy.visitLaunchpad()
  })

  it('displays errors in the setupNodeEvents function with proper stack trace', () => {
    cy.scaffoldProject('config-with-setup-function-error')
    cy.openProject('config-with-setup-function-error', ['--e2e'])
    cy.visitLaunchpad()
  })

  it('it reloads the after the user fixes an error in setupNodeEvents', () => {
    cy.scaffoldProject('config-with-setup-function-error')
    cy.openProject('config-with-setup-function-error')
    cy.loginUser()

    cy.visitLaunchpad()

    cy.get('[data-cy-testingType=e2e]').click()

    cy.get('body')
    .should('contain.text', 'Please confirm that everything looks correct in your cypress.config.js file.')
    .should('contain.text', 'Error Loading Config')
    .and('contain.text', 'The function exported by the plugins file threw an error')

    cy.get('[data-cy="collapsible-header"]')
    .should('have.attr', 'aria-expanded', 'true')
    .contains('Stack Trace')

    cy.log('Fix error and validate it reloads configuration')
    cy.withCtx(async (ctx) => {
      ctx.actions.file.writeFileInProject('cypress.config.js', `module.exports = { e2e: { baseUrl: 'https://cypress.com', supportFile: false } }`)
    })

    cy.get('body')
    .should('not.contain.text', 'Error Loading Config')
  })

  it('it handles a configuration file error', () => {
    cy.scaffoldProject('pristine')
    .then(() => {
      cy.openProject('pristine')
      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject('cypress.config.js', 'throw new Error("Error thrown from Config")')
      })
    })

    cy.visitLaunchpad()

    cy.get('body')
    .should('contain.text', 'Please confirm that everything looks correct in your cypress.config.js file.')
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
