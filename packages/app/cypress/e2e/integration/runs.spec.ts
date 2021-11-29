describe('App', () => {
  beforeEach(() => {
    cy.openModeSystemTest('component-tests', ['--e2e', '--browser', 'electron'])
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
    cy.loginUser()
    cy.visitApp()
    cy.withCtx(async (ctx) => {
      // TODO: (Alejandro) This should be removed when we add a file listener to update the config file
      ctx.update((d) => {
        if (d.currentProject) {
          d.currentProject.config = ctx.loadingManager.projectConfig.reset().getState()
        }
      })

      await ctx.actions.file.writeFileInProject('cypress.config.js', 'module.exports = {}')
    })

    cy.get('[href="#/runs"]').click()
    cy.contains('Connect your project').should('exist')
  })
})
