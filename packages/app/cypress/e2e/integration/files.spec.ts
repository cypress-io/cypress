describe('App', () => {
  beforeEach(() => {
    cy.setupE2E('component-tests')
    cy.withCtx(async (ctx) => {
      // TODO: Why do we need this?
      await ctx.actions.app.refreshBrowsers()
    })

    cy.initializeApp()
  })

  it('resolves the home page', () => {
    cy.visitApp()
    cy.get('[href="#/runs"]').click()
    cy.get('[href="#/settings"]').click()
  })
})
