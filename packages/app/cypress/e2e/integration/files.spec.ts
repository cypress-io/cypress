describe('App', () => {
  beforeEach(() => {
    cy.openModeSystemTest('component-tests', ['--e2e', '--browser', 'electron'])
  })

  it('resolves the home page', () => {
    cy.visitApp()
    cy.wait(1000)
    cy.get('[href="#/runs"]').click()
    cy.get('[href="#/settings"]').click()
  })
})
