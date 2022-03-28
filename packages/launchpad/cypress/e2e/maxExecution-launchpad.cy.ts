describe('maxExecution: launchpad', () => {
  beforeEach(() => {
    cy.scaffoldProject('todos')
    cy.openProject('todos')
  })

  it('loads through to the browser screen when the network is slow', () => {
    cy.setRemoteFetchDelay(60000)
    cy.loginUser()
    cy.visitLaunchpad()
    cy.get('[data-cy=top-nav-cypress-version-current-link]').should('not.exist')
    cy.contains('E2E Testing').click()
    cy.get('h1').should('contain', 'Choose a Browser')
  })

  it('shows the versions after they resolve', () => {
    cy.setRemoteFetchDelay(60000)
    cy.visitLaunchpad()
    cy.get('[data-cy=top-nav-cypress-version-current-link]').should('not.exist')
    cy.contains('E2E Testing')
    cy.clearRemoteFetchDelay()
    // This will show up after it resolves
    cy.get('[data-cy=top-nav-cypress-version-current-link]')
  })
})
