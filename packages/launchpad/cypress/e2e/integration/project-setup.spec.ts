describe('Launchpad: Setup Project', () => {
  before(() => {
    cy.scaffoldProject('todos')
  })

  beforeEach(() => {
    cy.openProject('todos')
    cy.visitLaunchpad()
  })

  it('no initial setup displays welcome page', () => {
    cy.contains('Welcome to Cypress!').should('be.visible')
    cy.contains('E2E Testing').should('be.visible')
    cy.contains('Component Testing').should('be.visible')
  })

  it('welcome page has link to learn about testing types', () => {
    cy.intercept('POST', 'mutation-ExternalLink_OpenExternal').as('OpenExternal')

    cy.contains('Review the differences').click()
    cy.contains('Key Differences').should('be.visible')
    cy.contains('Need help?').click()

    cy.wait('@OpenExternal')
  })
})
