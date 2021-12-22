describe('App: Spec List', () => {
  beforeEach(() => {
    cy.scaffoldProject('cypress-in-cypress')
    // TODO: Figure out why this isn't injected properly
    cy.openProject('cypress-in-cypress', ['--config', JSON.stringify({
      clientRoute: '/__child/',
      namespace: '__child',
    })])

    cy.startAppServer()
    cy.visitApp()
  })

  it('highlights the currently running spec', () => {
    cy.contains('failing').click()

    cy.get('[data-selected-spec="true"]').should('contain', 'fails')
    cy.get('[data-selected-spec="false"]').should('contain', 'foo')
  })
})
