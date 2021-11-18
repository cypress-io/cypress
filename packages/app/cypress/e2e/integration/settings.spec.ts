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
    cy.withCtx(async (ctx) => {
      ctx.coreData.localSettings.availableEditors = [
        ...ctx.coreData.localSettings.availableEditors,
        // don't rely on CI machines to have specific editors installed
        // so just adding one here
        {
          id: 'well-known-editor',
          binary: '/usr/bin/well-known',
          name: 'Well known editor',
        },
      ]

      ctx.coreData.localSettings.preferences.preferredEditorBinary = undefined
    })

    cy.get('[href="#/settings"]').click()
    cy.contains('Device Settings').click()
    cy.findByPlaceholderText('Custom path...').clear().type('/usr/local/bin/vim')

    cy.intercept('POST', 'mutation-SetPreferredEditorBinary').as('SetPreferred')
    cy.get('[data-cy="use-custom-editor"]').click()
    cy.wait('@SetPreferred').its('request.body.variables.value').should('include', '/usr/local/bin/vim')

    cy.contains('Choose your editor...').click()
    cy.contains('Well known editor').click()
    cy.wait('@SetPreferred').its('request.body.variables.value').should('include', '/usr/bin/well-known')
  })
})
