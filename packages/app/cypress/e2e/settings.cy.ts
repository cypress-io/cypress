import type { SinonStub } from 'sinon'

const SidebarSettingsLinkSelector = '[data-cy="sidebar-link-settings-page"]'

describe('App: Settings', () => {
  before(() => {
    cy.scaffoldProject('todos', { timeout: 50 * 1000 })
  })

  beforeEach(() => {
    cy.openProject('todos', ['--config', 'projectId=fromCli'])
  })

  it('visits settings page', () => {
    cy.startAppServer('e2e')
    cy.visitApp()
    cy.get(SidebarSettingsLinkSelector).click()

    cy.get('div[data-cy="app-header-bar"]').should('contain', 'Settings')
    cy.findByText('Device Settings').should('be.visible')
    cy.findByText('Project Settings').should('be.visible')
  })

  it('shows a button to log in if user is not connected', () => {
    cy.startAppServer('e2e')
    cy.visitApp()
    cy.get(SidebarSettingsLinkSelector).click()
    cy.findByText('Project Settings').click()
    cy.get('button').contains('Log In')
  })

  describe('Cloud Settings', () => {
    it('shows the projectId section when there is a projectId and shows override from CLI', () => {
      cy.withCtx(async (ctx, o) => {
        o.sinon.stub(ctx.electronApi, 'copyTextToClipboard')
      })

      cy.startAppServer('e2e')
      cy.visitApp()
      cy.get(SidebarSettingsLinkSelector).click()
      cy.findByText('Dashboard Settings').click()
      cy.findByText('Project ID').should('be.visible')
      cy.get('[data-cy="code-box"]').should('contain', 'fromCli')
      cy.findByText('Copy').click()
      cy.findByText('Copied!').should('be.visible')
      cy.withRetryableCtx((ctx) => {
        expect(ctx.electronApi.copyTextToClipboard as SinonStub).to.have.been.calledWith('fromCli')
      })
    })

    it('shows the Record Keys section', () => {
      cy.startAppServer('e2e')
      cy.loginUser()

      cy.visitApp()
      cy.get(SidebarSettingsLinkSelector).click()
      cy.findByText('Dashboard Settings').click()
      cy.findByText('Record Key').should('be.visible')
    })

    it('obfuscates each record key and has a button to reveal the key', () => {
      cy.startAppServer('e2e')
      cy.loginUser()

      cy.visitApp()
      cy.get(SidebarSettingsLinkSelector).click()
      cy.findByText('Dashboard Settings').click()
      cy.get('[data-cy="code-box"]').should('contain', '***')
      cy.get('[aria-label="Record Key Visibility Toggle"]').click()
      cy.get('[data-cy="code-box"]').should('contain', '2aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
    })

    it('opens cloud settings when clicking on "Manage Keys"', () => {
      cy.startAppServer('e2e')
      cy.loginUser()
      cy.visitApp('settings')
      cy.findByText('Dashboard Settings').click()
      cy.findByText('Manage Keys').click()
      cy.withRetryableCtx((ctx) => {
        expect((ctx.actions.electron.openExternal as SinonStub).lastCall.lastArg).to.eq('http:/test.cloud/cloud-project/settings')
      })
    })

    it('shows deferred remote cloud data after navigating from a run', { retries: 0 }, () => {
      cy.remoteGraphQLIntercept(async (obj) => {
        // Simulate a timeout so we don't resolve immediately, previously visiting the test runner
        // and then leaving would cause this to fail, because it removed the event listeners
        // for graphql-refetch. By namespacing the socket layer, we avoid the events of the
        // runner from impacting the cloud behavior
        await new Promise((resolve) => setTimeout(resolve, 500))

        return obj.result
      })

      cy.startAppServer('e2e')
      cy.loginUser()
      cy.visitApp()
      cy.get('.spec-list-container').scrollTo('bottom')
      // Visit the test to trigger the ws.off() for the TR websockets
      cy.contains('test1.js').click()
      cy.waitForSpecToFinish()
      // Wait for the test to pass, so the test is completed
      cy.get('.passed > .num').should('contain', 1)
      cy.get(SidebarSettingsLinkSelector).click()
      cy.contains('Dashboard Settings').click()
      // Assert the data is not there before it arrives
      cy.contains('Record Key').should('not.exist')
      cy.contains('Record Key')
    })

    it('clears nested cloud data (record key) upon logging out', () => {
      cy.startAppServer('e2e')
      cy.loginUser()
      cy.visitApp()
      cy.withCtx((ctx, o) => {
        o.sinon.spy(ctx.actions.auth, 'logout')
      })

      cy.findByTestId('sidebar-link-settings-page').click()
      cy.contains('Dashboard Settings').click()
      cy.contains('Record Key').should('exist')
      cy.findByTestId('sidebar-link-runs-page').click()
      cy.findByTestId('user-avatar-title').click()
      cy.findByRole('button', { name: 'Log Out' }).click()

      cy.withRetryableCtx((ctx, o) => {
        expect(ctx.actions.auth.logout).to.have.been.calledOnce
      })

      cy.findByTestId('sidebar-link-settings-page').click()
      cy.contains('Dashboard Settings').click()
      cy.contains('Record Key').should('not.exist')
    })
  })

  describe('Project Settings', () => {
    it('shows the Spec Patterns section (default specPattern value)', () => {
      cy.scaffoldProject('simple-ct')
      cy.openProject('simple-ct')
      cy.startAppServer('component')
      cy.loginUser()

      cy.visitApp()
      cy.findByTestId('sidebar-link-settings-page').click()
      cy.findByText('Project Settings').click()
      cy.get('[data-cy="file-match-indicator"]').contains('2 Matches')
      cy.get('[data-cy="spec-pattern"]').contains('**/*.cy.{js,jsx,ts,tsx}')

      cy.get('[data-cy="settings-specPatterns"').within(() => {
        cy.validateExternalLink({
          name: 'Learn more.',
          href: 'https://on.cypress.io/test-type-options',
        })
      })
    })

    it('shows the Spec Patterns section (edited specPattern value)', () => {
      cy.startAppServer('e2e')
      cy.loginUser()

      cy.visitApp()
      cy.get(SidebarSettingsLinkSelector).click()
      cy.findByText('Project Settings').click()
      cy.get('[data-cy="file-match-indicator"]').contains('41 Matches')
      cy.get('[data-cy="spec-pattern"]').contains('tests/**/*')
    })

    it('shows the Experiments section', () => {
      cy.startAppServer('e2e')
      cy.loginUser()

      cy.visitApp()
      cy.get(SidebarSettingsLinkSelector).click()
      cy.findByText('Project Settings').click()
      cy.get('[data-cy="settings-experiments"]').within(() => {
        cy.validateExternalLink({
          name: 'Learn more.',
          href: 'https://on.cypress.io/experiments',
        })

        cy.get('[data-cy="experiment-experimentalFetchPolyfill"]').within(() => {
          cy.validateExternalLink({
            name: 'cy.intercept()',
            href: 'https://on.cypress.io/intercept',
          })
        })

        cy.get('[data-cy="experiment-experimentalInteractiveRunEvents"]').within(() => {
          cy.validateExternalLink({
            name: 'before:run',
            href: 'https://on.cypress.io/before-run',
          })

          cy.validateExternalLink({
            name: 'after:run',
            href: 'https://on.cypress.io/after-run',
          })

          cy.validateExternalLink({
            name: 'before:spec',
            href: 'https://on.cypress.io/before-spec',
          })

          cy.validateExternalLink({
            name: 'after:spec',
            href: 'https://on.cypress.io/after-spec',
          })
        })

        cy.get('[data-cy="experiment-experimentalSessionAndOrigin"]').within(() => {
          cy.validateExternalLink({
            name: 'cy.session()',
            href: 'https://on.cypress.io/session',
          })

          cy.validateExternalLink({
            name: 'cy.origin()',
            href: 'https://on.cypress.io/origin',
          })
        })

        cy.get('[data-cy="experiment-experimentalSourceRewriting"]').within(() => {
          cy.validateExternalLink({
            name: '#5273',
            href: 'https://github.com/cypress-io/cypress/issues/5273',
          })
        })
      })
    })

    it('shows the Resolved Configuration section', () => {
      cy.startAppServer('e2e')
      cy.loginUser()

      cy.visitApp()
      cy.get(SidebarSettingsLinkSelector).click()
      cy.findByText('Project Settings').click()
      cy.get('[data-cy="config-code"]').contains('{')
    })

    it('highlights values set via config file, envFile, env, or CLI in the appropriate color', () => {
      cy.startAppServer('e2e')
      cy.loginUser()

      cy.visitApp()
      cy.get(SidebarSettingsLinkSelector).click()
      cy.findByText('Project Settings').click()
      cy.get('[data-cy="config-legend"]').within(() => {
        cy.get('.bg-gray-50').contains('default')
        cy.get('.bg-teal-100').contains('config')
        cy.get('.bg-orange-100').contains('env')
        cy.get('.bg-red-50').contains('cli')
      })

      cy.get('[data-cy="config-code"]').within(() => {
        cy.get('[data-cy-config="config"]').contains('tests/_fixtures')
        cy.get('[data-cy-config="config"]').contains('tests/**/*')
        cy.get('[data-cy-config="config"]').contains('tests/_support/spec_helper.js')
        cy.get('[data-cy-config="env"]').contains('REMOTE_DEBUGGING_PORT')
        cy.get('[data-cy-config="env"]').contains('INTERNAL_E2E_TESTING_SELF')
        cy.get('[data-cy-config="env"]').contains('INTERNAL_GRAPHQL_PORT')
        cy.get('[data-cy-config="cli"]').contains('fromCli')
        cy.get('[data-cy-config="cli"]').contains('4455')
      })
    })

    it('opens cypress.config.js file after clicking "Edit" button', () => {
      cy.startAppServer('e2e')
      cy.withCtx((ctx, o) => {
        ctx.coreData.localSettings.preferences.preferredEditorBinary = 'computer'
        o.sinon.stub(ctx.actions.file, 'openFile')
      })

      cy.visitApp('/settings')
      cy.findByText('Project Settings').click()
      cy.findByRole('button', { name: 'Edit' }).click()
      cy.withRetryableCtx((ctx) => {
        expect((ctx.actions.file.openFile as SinonStub).lastCall.args[0]).to.eq(ctx.lifecycleManager.configFilePath)
      })
    })

    it('highlights values set via config file, envFile, env, or CLI in the appropriate color with default specPattern', () => {
      cy.scaffoldProject('config-with-js')
      cy.openProject('config-with-js')
      cy.startAppServer('e2e')
      cy.loginUser()

      cy.visitApp()
      cy.get(SidebarSettingsLinkSelector).click()
      cy.findByText('Project Settings').click()
      cy.get('[data-cy="config-legend"]').within(() => {
        cy.get('.bg-gray-50').contains('default')
        cy.get('.bg-teal-100').contains('config')
        cy.get('.bg-orange-100').contains('env')
        cy.get('.bg-red-50').contains('cli')
      })

      cy.get('[data-cy="config-code"]').within(() => {
        cy.get('[data-cy-config="default"]').contains('cypress/e2e/**/*.cy.{js,jsx,ts,tsx}')
        cy.get('[data-cy-config="config"]').contains('500')
        cy.get('[data-cy-config="config"]').contains('10000')
        cy.get('[data-cy-config="config"]').contains('false')
        cy.get('[data-cy-config="config"]').contains('20')
        cy.get('[data-cy-config="env"]').contains('REMOTE_DEBUGGING_PORT')
        cy.get('[data-cy-config="env"]').contains('INTERNAL_E2E_TESTING_SELF')
        cy.get('[data-cy-config="env"]').contains('INTERNAL_GRAPHQL_PORT')
        cy.get('[data-cy-config="cli"]').contains('4455')
      })
    })
  })

  describe('external editor', () => {
    beforeEach(() => {
      cy.startAppServer('e2e')
      cy.withCtx((ctx, o) => {
        o.sinon.stub(ctx.actions.localSettings, 'setPreferences')
        o.sinon.stub(ctx.actions.file, 'openFile')
        ctx.coreData.localSettings.availableEditors = [
          ...ctx.coreData.localSettings.availableEditors,
          // don't rely on CI machines to have specific editors installed
          // so just adding one here
          {
            id: 'well-known-editor',
            binary: '/usr/bin/well-known',
            name: 'Well known editor',
          },
          {
            id: 'null-binary-editor',
            name: 'Null binary editor',
          },
        ]

        ctx.coreData.localSettings.preferences.preferredEditorBinary = undefined
      })

      cy.visitApp('settings')
      cy.contains('Device Settings').click()
    })

    it('selects well known editor', () => {
      cy.contains('Choose your editor...').click()
      cy.contains('Well known editor').click()
      cy.withRetryableCtx((ctx) => {
        expect((ctx.actions.localSettings.setPreferences as SinonStub).lastCall.lastArg).to.include('/usr/bin/well-known')
      })

      // navigate away and come back
      // preferred editor selected from dropdown should have been persisted
      cy.visitApp()
      cy.findByTestId('sidebar-link-settings-page').click()
      cy.wait(200)
      cy.get('[data-cy="Device Settings"]').click()

      cy.get('[data-cy="custom-editor"]').should('not.exist')
    })

    it('allows custom editor', () => {
      cy.contains('Choose your editor...').click()
      cy.contains('Custom').click()

      // doing invoke instead of `type` since `type` enters keys on-by-one, triggering a mutation
      // for each keystroke, making it hard to intercept **only** the final request, which I want to
      // assert contains `/usr/local/bin/vim'
      cy.findByPlaceholderText('/path/to/editor').clear().invoke('val', '/usr/local/bin/vim').trigger('input').trigger('change')
      cy.withRetryableCtx((ctx) => {
        expect((ctx.actions.localSettings.setPreferences as SinonStub).lastCall.lastArg).to.include('/usr/local/bin/vim')
      })

      // navigate away and come back
      // preferred editor entered from input should have been persisted
      cy.findByTestId('sidebar-link-settings-page').click()
      cy.wait(100)
      cy.get('[data-cy="Device Settings"]').click()

      cy.get('[data-cy="custom-editor"]').should('have.value', '/usr/local/bin/vim')
    })

    it('lists file browser as available editor', () => {
      cy.contains('Choose your editor...').click()
      cy.get('[data-cy="computer"]').click()

      cy.withRetryableCtx((ctx) => {
        expect((ctx.actions.localSettings.setPreferences as SinonStub).lastCall.lastArg).to.include('computer')
      })

      cy.get('[data-cy="custom-editor"]').should('not.exist')
    })

    it('handles null binary field in editor', () => {
      cy.contains('Choose your editor...').click()
      cy.contains('Null binary editor').click()
      cy.withRetryableCtx((ctx) => {
        expect((ctx.actions.localSettings.setPreferences as SinonStub).lastCall.lastArg).to.include('{"preferredEditorBinary":null')
      })

      // navigate away and come back
      // preferred editor selected from dropdown should have been persisted
      cy.visitApp()
      cy.findByTestId('sidebar-link-settings-page').click()
      cy.wait(200)
      cy.get('[data-cy="Device Settings"]').click()

      cy.get('[data-cy="custom-editor"]').should('not.exist')
    })
  })
})

describe('App: Settings without cloud', () => {
  it('the projectId section shows a prompt to connect when there is no projectId', () => {
    cy.scaffoldProject('simple-ct')
    cy.openProject('simple-ct')
    cy.startAppServer('component')

    cy.visitApp()
    cy.get(SidebarSettingsLinkSelector).click()
    cy.findByText('Dashboard Settings').click()
    cy.findByText('Project ID').should('exist')
    cy.contains('button', 'Log in to the Cypress Dashboard').should('be.visible')
  })

  it('have returned browsers', () => {
    cy.scaffoldProject('simple-ct')
    cy.openProject('simple-ct')
    cy.startAppServer('component')

    cy.visitApp()
    cy.get(SidebarSettingsLinkSelector).click()
    cy.findByText('Project Settings').click()

    cy.get('[data-cy=config-code]').within(() => {
      const { browsers } = Cypress.config()

      expect(browsers).to.have.length.greaterThan(1)

      cy.contains(`browsers: [`)
      cy.contains(`name: 'chrome',`)
      cy.contains(`family: 'chromium',`)
      cy.contains(`channel: 'stable',`)
      cy.contains(`displayName: 'Chrome',`)

      cy.percySnapshot()
    })
  })
})
