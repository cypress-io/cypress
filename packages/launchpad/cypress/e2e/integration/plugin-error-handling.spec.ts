describe('Plugin error handling', () => {
  it('it handles a plugin error', () => {
    cy.setupE2E('unify-plugin-errors')
    cy.visitLaunchpad()
    // TODO(alejandro): use this to test against error flow
    cy.get('[data-cy-testingType=e2e]').click()
    cy.wait(2000)

    cy.withCtx((ctx) => {
      ctx.actions.file.writeFileInProject('cypress/plugins/index.js', `module.exports = (on, config) => {}`)
    })

    cy.reload()
    cy.wait(2000)
  })
})
