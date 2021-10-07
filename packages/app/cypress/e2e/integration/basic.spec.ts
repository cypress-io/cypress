let SERVER_PORT

describe('App', () => {
  before(() => {
    cy.withCtx(async (ctx) => {
      ctx.actions.project.setActiveProject(ctx.launchArgs.projectRoot)
      ctx.actions.wizard.setTestingType('component')
      await ctx.actions.project.initializeActiveProject()
      await ctx.actions.project.launchProject({
        skipBrowserOpen: true,
      })

      return ctx.appServerPort
    }).then((port) => {
      SERVER_PORT = port
    })
  })

  it('resolves the home page', () => {
    expect(SERVER_PORT).to.be.a('number')
    cy.visit('dist-e2e/index.html')
    cy.get('[href="#/runs"]').click()
    cy.get('[href="#/settings"]').click()
  })
})
