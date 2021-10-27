describe('App', () => {
  beforeEach(() => {
    cy.setupE2E('component-tests')

    cy.initializeApp()
    cy.loginUser()
  })

  it('resolves the runs page', () => {
    cy.visitApp()
    cy.wait(1000)
    cy.get('[href="#/runs"]').click()
    cy.get('[data-cy="runs"]')
  })

  it('shows the loader', () => {
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
    cy.remoteGraphQLIntercept(async (obj) => {
      // Currently, all remote requests go through here, we want to use this to modify the
      // remote request before it's used
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
})
