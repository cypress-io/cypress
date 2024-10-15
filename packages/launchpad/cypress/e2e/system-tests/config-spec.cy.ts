describe('config-spec', () => {
  it('can filter browsers from config', () => {
    cy.scaffoldProject('plugin-filter-browsers')
    cy.findBrowsers()
    cy.openProject('plugin-filter-browsers', ['--e2e'])
    cy.withCtx(async (ctx) => {
      expect(await ctx.browser.machineBrowsers()).to.have.length(12) // stubbed list of all browsers
    })

    cy.visitLaunchpad()
    // Filtered down to the electron browser in the plugin
    cy.get('[data-cy="open-browser-list"]').children().should('have.length', 1)
  })
})
