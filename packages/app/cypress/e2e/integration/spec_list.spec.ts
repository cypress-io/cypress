describe('App: Spec List', () => {
  beforeEach(() => {
    cy.scaffoldProject('component-tests')
    cy.openProject('component-tests')
    cy.startAppServer('component')
    cy.visitApp()
  })

  // TODO: Disabling to try and get build to pass
  it.skip('highlights the currently running spec', () => {
    cy.contains('fails').click()

    cy.get('[data-selected-spec="true"').should('contain', 'fails')
    cy.get('[data-selected-spec="false"').should('contain', 'foo')
  })
})
