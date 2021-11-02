describe('Settings', { viewportWidth: 1200 }, () => {
  beforeEach(() => {
    cy.setupE2E('component-tests')

    cy.initializeApp()
  })

  it('displays the settings for the current project', () => {
    cy.visitApp()
    cy.get('[href="#/settings"]').click()
    cy.findByText('Project Settings').click()

    cy.findByText('projectId')
    .parent()
    .parent()
    .findByText('abc123')
    .should('be.visible')

    cy.findByText('Resolved Configuration')
    .parent()
    .contains('code span', 'animationDistanceThreshold')
  })

  it('displays the settings for the current device', () => {
    cy.visitApp()
    cy.get('[href="#/settings"]').click()
    cy.findByText('Device Settings').click()

    cy.findByText('External Editor').should('be.visible')
    cy.findByText('Testing Preferences').should('be.visible')
    cy.findByText('Proxy Settings').should('be.visible')
  })
})
