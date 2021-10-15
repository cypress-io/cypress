describe('App', () => {
  beforeEach(() => {
    cy.setupE2E('component-tests')
    cy.initializeApp()
  })

  it('resolves the home page', () => {
    cy.visitApp()
    cy.wait(1000)
    cy.get('[href="#/runner"]').click()
    cy.get('[href="#/settings"]').click()
  })
})
