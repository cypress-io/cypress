describe('App', () => {
  beforeEach(() => {
    cy.setupE2E('component-tests')
    cy.withCtx(async (ctx) => {
      // TODO: Why do we need this?
      await ctx.actions.app.refreshBrowsers()
    })

    cy.initializeApp()
  })

  it('resolves the runs page', () => {
    cy.visitApp()
    cy.wait(1000)
    cy.get('[href="#/runs"]').click()
  })
})
