describe('App', () => {
  beforeEach(() => {
    cy.openE2E('component-tests')
    cy.initializeApp()
  })

  it('resolves the home page', () => {
    cy.visitApp()
    cy.wait(1000)
    cy.get('[href="#/runs"]').click()
    cy.get('[href="#/settings"]').click()
  })
})
