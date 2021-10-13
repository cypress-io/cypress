describe('App', () => {
  beforeEach(() => {
    cy.setupE2E('config-with-ts')
    cy.initializeApp()
  })

  it('resolves the home page', () => {
    cy.visitApp()
    cy.get('[href="#/runner"]').click()
    cy.get('[href="#/settings"]').click()
    cy.visitLaunchpad()
    cy.get('h1')
  })

  it('resolves the home page, with a different server port?', () => {
    cy.visitApp()
    cy.get('[href="#/runner"]').click()
    cy.get('[href="#/settings"]').click()
  })
})
