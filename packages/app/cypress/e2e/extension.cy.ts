describe('App: Extension', () => {
  it('can request a graphql endpoint via node ipc', () => {
    cy.scaffoldProject('no-specs')
    cy.openProject('no-specs')
    cy.startAppServer('e2e')
    cy.visitApp()

    cy.task('requestGraphQLEndpoint').then((result) => {
      expect(result).to.eq('http://localhost:4444/__launchpad/graphql')
    })
  })
})
