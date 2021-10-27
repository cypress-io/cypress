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
  })
})
