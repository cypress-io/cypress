describe('Plugin error handling', () => {
  it('it handles a plugin error', () => {
    cy.openModeSystemTest('unify-plugin-errors')
    cy.visitLaunchpad()
    cy.wait(1000)
    cy.get('[data-cy-testingType=e2e]').click()

    cy.get('body')
    .should('contain.text', 'Cypress Configuration Error')
    .and('contain.text', 'The function exported by the plugins file threw an error')

    cy.withCtx((ctx) => {
      ctx.actions.file.writeFileInProject('cypress.config.js', `module.exports = { e2e: { baseUrl: 'https://cypress.com' } }`)
    })

    cy.get('[data-testid=error-retry-button]').click()

    cy.get('body')
    .should('not.contain.text', 'Cypress Configuration Error')

    cy.get('body').should('contain', 'Choose a Browser')
  })
})
