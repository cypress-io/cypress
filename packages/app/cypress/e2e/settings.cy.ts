describe('App: Settings', () => {
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

    cy.get('div[data-cy="app-header-bar"]').should('contain', 'Settings')
    cy.findByText('Device Settings').should('be.visible')
    cy.findByText('Project Settings').should('be.visible')
  })

  it('shows the projectId section when there is a projectId', () => {
    cy.visitApp()
    cy.findByText('Settings').click()
    cy.findByText('Project Settings').click()
    cy.findByText('Project ID').should('be.visible')
  })

  it('shows the recordKeys section', () => {
    cy.loginUser()

    cy.visitApp()
    cy.findByText('Settings').click()
    cy.findByText('Project Settings').click()
    cy.findByText('Record Key').should('be.visible')
  })

  it('opens cloud settings when clicking on "Manage Keys"', () => {
    cy.loginUser()
    cy.intercept('mutation-ExternalLink_OpenExternal', { 'data': { 'openExternal': true } }).as('OpenExternal')
    cy.__incorrectlyVisitAppWithIntercept()
    cy.findByText('Settings').click()
    cy.findByText('Project Settings').click()
    cy.findByText('Manage Keys').click()
    cy.wait('@OpenExternal')
    .its('request.body.variables.url')
    .should('equal', 'http:/test.cloud/cloud-project/settings')
  })

  it('can reconfigure a project', () => {
    cy.__incorrectlyVisitAppWithIntercept('settings')

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

      cy.__incorrectlyVisitAppWithIntercept('settings')
      cy.contains('Device Settings').click()
    })

    it('selects well known editor', () => {
      cy.intercept('POST', 'mutation-ExternalEditorSettings_SetPreferredEditorBinary').as('SetPreferred')

      cy.contains('Choose your editor...').click()
      cy.contains('Well known editor').click()
      cy.wait('@SetPreferred').its('request.body.variables.value').should('include', '/usr/bin/well-known')

      // navigate away and come back
      // preferred editor selected from dropdown should have been persisted
      cy.__incorrectlyVisitAppWithIntercept()
      cy.get('[href="#/settings"]').click()
      cy.wait(200)
      cy.get('[data-cy="Device Settings"]').click()

      cy.get('[data-cy="custom-editor"]').should('not.exist')
    })

    it('allows custom editor', () => {
      cy.intercept('POST', 'mutation-ExternalEditorSettings_SetPreferredEditorBinary').as('SetPreferred')

      cy.contains('Choose your editor...').click()
      cy.contains('Custom').click()

      // doing invoke instead of `type` since `type` enters keys on-by-one, triggering a mutation
      // for each keystroke, making it hard to intercept **only** the final request, which I want to
      // assert contains `/usr/local/bin/vim'
      cy.findByPlaceholderText('/path/to/editor').clear().invoke('val', '/usr/local/bin/vim').trigger('input').trigger('change')
      cy.wait('@SetPreferred').its('request.body.variables.value').should('include', '/usr/local/bin/vim')

      // navigate away and come back
      // preferred editor entered from input should have been persisted
      cy.get('[href="#/settings"]').click()
      cy.wait(100)
      cy.get('[data-cy="Device Settings"]').click()

      cy.get('[data-cy="custom-editor"]').should('have.value', '/usr/local/bin/vim')
    })

    it('lists file browser as available editor', () => {
      cy.intercept('POST', 'mutation-ExternalEditorSettings_SetPreferredEditorBinary').as('SetPreferred')

      cy.contains('Choose your editor...').click()
      cy.get('[data-cy="computer"]').click()

      cy.wait('@SetPreferred').its('request.body.variables.value').should('include', 'computer')

      cy.get('[data-cy="custom-editor"]').should('not.exist')
    })
  })
})

describe('App: Settings without cloud', () => {
  it('hides the projectId section when there is no projectId', () => {
    cy.scaffoldProject('simple-ct')
    cy.openProject('simple-ct')
    cy.startAppServer('component')

    cy.visitApp()
    cy.findByText('Settings').click()
    cy.findByText('Project Settings').click()
    cy.findByText('Project ID').should('not.exist')
  })

  it('have returned browsers', () => {
    cy.scaffoldProject('simple-ct')
    cy.openProject('simple-ct')
    cy.startAppServer('component')

    cy.visitApp()
    cy.findByText('Settings').click()
    cy.findByText('Project Settings').click()

    cy.get('[data-cy=config-code]').within(() => {
      const { browsers } = Cypress.config()

      expect(browsers).to.have.length.greaterThan(1)

      cy.contains(`browsers: ${browsers.filter((b) => b.name !== 'electron').map((b) => b.name).join(', ')}`)
    })
  })
})
