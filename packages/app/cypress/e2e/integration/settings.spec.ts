describe('App: Settings', { viewportWidth: 600 }, () => {
  before(() => {
    cy.scaffoldProject('todos')
  })

  beforeEach(() => {
    cy.openProject('todos')
    cy.startAppServer('e2e')
  })

  it('visits settings page', () => {
    cy.visitApp()
    cy.findByText('Settings').click()

    cy.get('div[data-testid="header-bar"]').should('contain', 'Settings')
    cy.findByText('Device Settings').should('be.visible')
    cy.findByText('Project Settings').should('be.visible')
  })

  it('can reconfigure a project', () => {
    cy.visitApp('#settings')

    cy.intercept('mutation-SettingsContainer_ReconfigureProject', { 'data': { 'reconfigureProject': true } }).as('ReconfigureProject')
    cy.findByText('Reconfigure Project').click()
    cy.wait('@ReconfigureProject')
  })

  describe('external editor', () => {
    beforeEach(() => {
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

      cy.visitApp('#settings')
      cy.contains('Device Settings').click()
    })

    it('selects well known editor', () => {
      cy.intercept('POST', 'mutation-ExternalEditorSettings_SetPreferredEditorBinary').as('SetPreferred')

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
    })

    it('allows custom editor', () => {
      cy.intercept('POST', 'mutation-ExternalEditorSettings_SetPreferredEditorBinary').as('SetPreferred')

      // doing invoke instead of `type` since `type` enters keys on-by-one, triggering a mutation
      // for each keystroke, making it hard to intercept **only** the final request, which I want to
      // assert contains `/usr/local/bin/vim'
      cy.findByPlaceholderText('Custom path...').clear().invoke('val', '/usr/local/bin/vim').trigger('input').trigger('change')
      cy.wait('@SetPreferred').its('request.body.variables.value').should('include', '/usr/local/bin/vim')

      // navigate away and come back
      // preferred editor entered from input should have been persisted
      cy.get('[href="#/settings"]').click()
      cy.wait(100)
      cy.get('[data-cy="Device Settings"]').click()

      cy.get('[data-cy="use-well-known-editor"]').should('not.be.checked')
      cy.get('[data-cy="use-custom-editor"]').should('be.checked')
      cy.get('[data-cy="custom-editor"]').should('have.value', '/usr/local/bin/vim')
    })

    it('lists file browser as available editor', () => {
      cy.intercept('POST', 'mutation-ExternalEditorSettings_SetPreferredEditorBinary').as('SetPreferred')

      cy.contains('Choose your editor...').click()
      cy.get('[data-cy="computer"]').click()

      cy.wait('@SetPreferred').its('request.body.variables.value').should('include', 'computer')
      cy.get('[data-cy="use-well-known-editor"]').should('be.checked')
      cy.get('[data-cy="use-custom-editor"]').should('not.be.checked')
    })
  })
})
