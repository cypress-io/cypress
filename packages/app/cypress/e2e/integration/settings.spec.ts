describe('Settings', { viewportWidth: 600 }, () => {
  beforeEach(() => {
    cy.setupE2E('component-tests')

    cy.initializeApp()
  })

  it('displays the settings for the current project', () => {
    cy.visitApp()
    cy.get('[href="#/settings"]').click()
    cy.findByText('Project Settings').click()

    cy.get('[data-cy="settings-projectId"]')

    .findByText('abc123')
    .should('be.visible')

    cy.get('[data-cy="settings-config"]')
    .scrollIntoView()
    .should('be.visible')
    .contains('animationDistanceThreshold')
  })

  it('displays the settings for the current device', () => {
    cy.visitApp()
    cy.get('[href="#/settings"]').click()
    cy.findByText('Device Settings').click()

    cy.findByText('External Editor').should('be.visible')
    cy.findByText('Testing Preferences').should('be.visible')
    cy.findByText('Proxy Settings').should('be.visible')
  })

  it('calls a reconfigure mutation when click on the footer button', () => {
    cy.visitApp()
    cy.get('[href="#/settings"]').click()
    cy.intercept('mutation-SettingsContainer_ReconfigureProject', { 'data': { 'reconfigureProject': true } }).as('ReconfigureProject')
    cy.findByText('Reconfigure Project').click()
    cy.wait('@ReconfigureProject')
  })

  it('selects well known editor', () => {
    cy.visitApp()
    cy.get('[href="#/settings"]').click()
    cy.contains('Device Settings').click()
    cy.findByPlaceholderText('Custom path...').clear().type('/usr/local/bin/vim')

    cy.intercept('POST', 'mutation-SetPreferredEditorBinary', (req) => {
      expect(req.body.variables).to.eql({ 'value': '/usr/local/bin/vim' })
    }).as('SetPreferred')

    cy.get('[data-cy="use-custom-editor"]').click()
    cy.wait('@SetPreferred')
  })
})
