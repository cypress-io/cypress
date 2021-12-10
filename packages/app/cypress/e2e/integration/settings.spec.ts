describe('App: Settings', { viewportWidth: 600 }, () => {
  before(() => {
    cy.scaffoldProject('todos')
  })

  beforeEach(() => {
    cy.openProject('todos')
    cy.startAppServer('e2e')
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

    cy.visitApp()

    cy.get('[href="#/settings"]').click()
    cy.contains('Device Settings').click()

    cy.intercept('POST', 'mutation-ExternalEditorSettings_SetPreferredEditorBinary').as('SetPreferred')
    // doing invoke instead of `type` since `type` enters keys on-by-one, triggering a mutation
    // for each keystroke, making it hard to intercept **only** the final request, which I want to
    // assert contains `/usr/local/bin/vim'
    cy.findByPlaceholderText('Custom path...').clear().invoke('val', '/usr/local/bin/vim').trigger('input').trigger('change')
    cy.wait('@SetPreferred').its('request.body.variables.value').should('include', '/usr/local/bin/vim')

    cy.contains('Choose your editor...').click()
    cy.contains('Well known editor').click()
    cy.wait('@SetPreferred').its('request.body.variables.value').should('include', '/usr/bin/well-known')

    // navigate away and come back
    // preferred editor selected from dropdown should have been persisted
    cy.visitApp()
    cy.get('[href="#/settings"]').click()
    cy.wait(100)
    cy.get('[data-cy="Device Settings"]').click()

    cy.get('[data-cy="use-well-known-editor"]').should('be.checked')
    cy.get('[data-cy="use-custom-editor"]').should('not.be.checked')

    // change to custom editor using input
    cy.findByPlaceholderText('Custom path...').clear().invoke('val', '/usr/local/bin/vim').trigger('input').trigger('change')

    // navigate away and come back
    // preferred editor entered from input should have been persisted
    cy.get('[href="#/settings"]').click()
    cy.wait(100)
    cy.get('[data-cy="Device Settings"]').click()

    cy.get('[data-cy="use-well-known-editor"]').should('not.be.checked')
    cy.get('[data-cy="use-custom-editor"]').should('be.checked')

    // change to custom editor using input
    cy.get('[data-cy="custom-editor"]').should('have.value', '/usr/local/bin/vim')
  })
})
