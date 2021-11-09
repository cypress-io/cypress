describe('Launchpad: Open With Preferences', () => {
  beforeEach(() => {
    cy.setupE2E('todos')
  })

  it('it should open the app when there are saved preferences', () => {
    cy.withCtx((ctx, o) => {
      ctx.actions.project.setActiveProject(o.projectDir('todos'))
      if (!ctx.currentProject) {
        // ctx.currentProject.preferences = {
        //   testingType: 'component',
        //   browserId: ctx.browser.idForBrowser(ctx.browserList?[0]),
        // }
      }
    })

    cy.visitLaunchpad()
  })
})
