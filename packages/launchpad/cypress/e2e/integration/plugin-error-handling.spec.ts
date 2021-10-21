describe('Plugin error handling', () => {
  it('it handles a plugin error', () => {
    cy.setupE2E('unify-plugin-errors')
    cy.visitLaunchpad()

    cy.get('[data-cy-testingType=e2e]').click()
    cy.wait(2000)

    cy.get('body')
    .should('contain.text', 'Cypress Configuration Error')
    .and('contain.text', 'The function exported by the plugins file threw an error')

    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress/plugins/index.js', `module.exports = (on, config) => {}`)
    })

    cy.get('[data-testid=error-retry-button]').click()
    cy.wait(2000)

    cy.get('body')
    .should('not.contain.text', 'Cypress Configuration Error')
  })
})
