describe('runner', () => {
  beforeEach(() => {
    cy.setupE2E('component-tests')

    cy.initializeApp()
  })

  it('resolves the runs page', () => {
    cy.visitApp()
    cy.wait(1000)
    cy.get('span').contains('integration').click()
  })
})
