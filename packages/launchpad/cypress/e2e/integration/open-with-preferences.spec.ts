describe('Launchpad: Open With Preferences', () => {
  beforeEach(() => {
    cy.scaffoldProject('todos')
    cy.openProject('todos')
  })

  it('it should open the app when there are saved preferences', () => {
    cy.visitLaunchpad()
  })
})
