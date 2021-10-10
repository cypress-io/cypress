let GQL_PORT
let SERVER_PORT

describe('App', () => {
  beforeEach(() => {
    cy.withCtx(async (ctx) => {
      await ctx.dispose()
      await ctx.actions.project.setActiveProject(ctx.launchArgs.projectRoot)
      ctx.actions.wizard.setTestingType('e2e')
      await ctx.actions.project.initializeActiveProject({
        skipPluginIntializeForTesting: true,
      })

      await ctx.actions.project.launchProject({
        skipBrowserOpenForTest: true,
      })

      return [
        ctx.gqlServerPort,
        ctx.appServerPort,
      ]
    }).then(([gqlPort, serverPort]) => {
      GQL_PORT = gqlPort
      SERVER_PORT = serverPort
    })
  })

  it('resolves the home page', () => {
    cy.visit(`dist/index.html?serverPort=${SERVER_PORT}&gqlPort=${GQL_PORT}`)
    cy.get('[href="#/runner"]').click()
    cy.get('[href="#/settings"]').click()
  })

  it('resolves the home page, with a different server port?', () => {
    cy.visit(`dist/index.html?serverPort=${SERVER_PORT}&gqlPort=${GQL_PORT}`)
    cy.get('[href="#/runner"]').click()
    cy.get('[href="#/settings"]').click()
  })
})
