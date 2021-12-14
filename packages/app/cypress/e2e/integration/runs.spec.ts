describe('App: Runs Page', () => {
  beforeEach(() => {
    cy.scaffoldProject('component-tests')
    cy.openProject('component-tests')
    cy.startAppServer()
  })

  it('resolves the runs page', () => {
    cy.loginUser()
    cy.visitApp()
    cy.wait(1000)
    cy.get('[href="#/runs"]').click()
    cy.get('[data-cy="runs"]')
  })

  it('shows the loader', () => {
    cy.loginUser()
    cy.remoteGraphQLIntercept(async (obj) => {
      await new Promise((resolve) => setTimeout(resolve, 200))

      return obj.result
    })

    cy.visitApp()
    cy.get('[href="#/runs"]').click()
    cy.get('[data-cy="runs-loader"]')
    cy.get('[data-cy="runs"]')
  })

  it('when no runs, shows call to action', () => {
    cy.loginUser()
    cy.remoteGraphQLIntercept(async (obj) => {
      // Currently, all remote requests go through here, we want to use this to modify the
      // remote request before it's used and avoid touching the login query
      if (obj.result.data?.cloudProjectsBySlugs) {
        for (const proj of obj.result.data.cloudProjectsBySlugs) {
          if (proj.runs?.nodes) {
            proj.runs.nodes = []
          }
        }
      }

      return obj.result
    })

    cy.visitApp()
    cy.get('[href="#/runs"]').click()
    cy.get('[data-cy="no-runs"]')
  })

  it('when logged out, shows call to action', () => {
    cy.visitApp()
    cy.get('[href="#/runs"]').click()
    cy.contains('Log in').should('exist')
  })

  it('when no project Id in the config file, shows call to action', () => {
    cy.withCtx(async (ctx) => {
      if (ctx.currentProject) {
        ctx.currentProject.configChildProcess?.process.kill()
        ctx.currentProject.config = null
        ctx.currentProject.configChildProcess = null
      }

      await ctx.actions.file.writeFileInProject('cypress.config.js', 'module.exports = {}')
    })

    cy.loginUser()
    cy.visitApp()

    cy.get('[href="#/runs"]').click()
    cy.contains('Connect your project').should('exist')
  })

  it('if logged in and connected', { viewportWidth: 1200 }, () => {
    cy.loginUser()
    cy.visitApp()
    cy.intercept('mutation-ExternalLink_OpenExternal', { 'data': { 'openExternal': true } }).as('OpenExternal')

    cy.get('[href="#/runs"]').click()
    cy.contains('a', 'OVERLIMIT').click()
    cy.wait('@OpenExternal')
    .its('request.body.variables.url')
    .should('equal', 'http://dummy.cypress.io/runs/4')
  })
})
