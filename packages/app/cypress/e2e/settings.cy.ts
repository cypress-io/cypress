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

  it('shows a button to log in if user is not connected', () => {
    cy.visitApp()
    cy.findByText('Settings').click()
    cy.findByText('Project Settings').click()
    cy.get('button').contains('Log In')
  })

  it('can reconfigure a project', () => {
    cy.__incorrectlyVisitAppWithIntercept('settings')

    cy.intercept('mutation-SettingsContainer_ReconfigureProject', { 'data': { 'reconfigureProject': true } }).as('ReconfigureProject')
    cy.findByText('Reconfigure Project').click()
    cy.wait('@ReconfigureProject')
  })

  describe('Project Settings', () => {
    it('shows the projectId section when there is a projectId', () => {
      cy.visitApp()
      cy.findByText('Settings').click()
      cy.findByText('Project Settings').click()
      cy.findByText('Project ID').should('be.visible')
    })

    it('shows the Record Keys section', () => {
      cy.loginUser()

      cy.visitApp()
      cy.findByText('Settings').click()
      cy.findByText('Project Settings').click()
      cy.findByText('Record Key').should('be.visible')
    })

    it('obfuscates each record key and has a button to reveal the key', () => {
      cy.loginUser()

      cy.visitApp()
      cy.findByText('Settings').click()
      cy.findByText('Project Settings').click()
      cy.get('[data-cy="record-key"]').should('contain', '***')
      cy.get('[aria-label="Record Key Visibility Toggle"]').click()
      cy.get('[data-cy="record-key"]').should('contain', '2aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
    })

    // TODO: Check that 'Default values' are indicated when the specPattern is not edited
    it('shows the Spec Patterns section (default specPattern value)', () => {
      cy.scaffoldProject('simple-ct')
      cy.openProject('simple-ct')
      cy.startAppServer('component')
      cy.loginUser()

      cy.visitApp()
      cy.findByText('Settings').click()
      cy.findByText('Project Settings').click()
      cy.get('[data-cy="file-match-indicator"]').contains('2 Matches')
      cy.get('[data-cy="spec-pattern"]').contains('**/*.cy.{js,jsx,ts,tsx}')
    })

    it('shows the Spec Patterns section (edited specPattern value)', () => {
      cy.loginUser()

      cy.visitApp()
      cy.findByText('Settings').click()
      cy.findByText('Project Settings').click()
      cy.get('[data-cy="file-match-indicator"]').contains('41 Matches')
      cy.get('[data-cy="spec-pattern"]').contains('tests/**/*')
    })

    it('shows the Experiments section', () => {
      cy.loginUser()

      cy.visitApp()
      cy.findByText('Settings').click()
      cy.findByText('Project Settings').click()
      cy.get('[data-cy="settings-experiments"]').within(() => {
        cy.get('[data-cy="experiment-experimentalFetchPolyfill"]')
        cy.get('[data-cy="experiment-experimentalInteractiveRunEvents"]')
        cy.get('[data-cy="experiment-experimentalSessionSupport"]')
        cy.get('[data-cy="experiment-experimentalSourceRewriting"]')
      })
    })

    it('shows the Resolved Configuration section', () => {
      cy.loginUser()

      cy.visitApp()
      cy.findByText('Settings').click()
      cy.findByText('Project Settings').click()
      cy.get('[data-cy="config-code"]').contains('{')
    })

    it('highlights values set via config file, envFile, env, or CLI in the appropriate color', () => {
      cy.loginUser()

      cy.visitApp()
      cy.findByText('Settings').click()
      cy.findByText('Project Settings').click()
      cy.get('[data-cy="config-legend"]').within(() => {
        cy.get('.bg-gray-50').contains('default')
        cy.get('.bg-teal-100').contains('config')
        cy.get('.bg-yellow-100').contains('env')
        cy.get('.bg-red-50').contains('cli')
      })

      cy.get('[data-cy="config-code"]').within(() => {
        cy.get('.bg-teal-100').contains('tests/_fixtures')
        cy.get('.bg-teal-100').contains('abc123')
        cy.get('.bg-teal-100').contains('specFilePattern')
        cy.get('.bg-teal-100').contains('supportFile')
        cy.get('.bg-yellow-100').contains('REMOTE_DEBUGGING_PORT')
        cy.get('.bg-yellow-100').contains('KONFIG_ENV')
        cy.get('.bg-yellow-100').contains('INTERNAL_E2E_TESTING_SELF')
        cy.get('.bg-yellow-100').contains('INTERNAL_GRAPHQL_PORT')
        cy.get('.bg-red-50').contains('4455')
      })
    })

    it('opens cypress.config.js file after clicking "Edit" button', () => {
      cy.loginUser()
      cy.intercept('query-OpenConfigFileInIDE', { 'data': { 'openExternal': true } }).as('OpenExternal')

      cy.__incorrectlyVisitAppWithIntercept('settings')
      cy.findByText('Project Settings').click()
      cy.get('[data-cy="config-code"]').within(() => {
        cy.get('button').contains('Edit').click()
        cy.wait('@OpenExternal')
        .its('response.body.data.openExternal')
        .should('equal', true)
      })
    })

    it('opens cloud settings when clicking on "Manage Keys"', () => {
      cy.loginUser()
      cy.intercept('mutation-ExternalLink_OpenExternal', { 'data': { 'openExternal': true } }).as('OpenExternal')
      cy.__incorrectlyVisitAppWithIntercept('settings')
      cy.findByText('Project Settings').click()
      cy.findByText('Manage Keys').click()
      cy.wait('@OpenExternal')
      .its('request.body.variables.url')
      .should('equal', 'http:/test.cloud/cloud-project/settings')
    })
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
