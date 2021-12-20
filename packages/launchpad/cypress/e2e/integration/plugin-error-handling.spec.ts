describe('Plugin error handling', () => {
  it('it handles a plugin error', () => {
    cy.scaffoldProject('unify-plugin-errors')
    cy.openProject('unify-plugin-errors')
    cy.loginUser()

    cy.visitLaunchpad()

    cy.get('[data-cy-testingType=e2e]').click()

    cy.get('body')
    .should('contain.text', 'Cypress Configuration Error')
    .and('contain.text', 'The function exported by the plugins file threw an error')

    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress.config.js', `module.exports = { e2e: { baseUrl: 'https://cypress.com' } }`)
    })

    cy.get('[data-testid=error-retry-button]').click()

    cy.get('body')
    .should('not.contain.text', 'Cypress Configuration Error')
  })
})
