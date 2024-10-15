import type { SinonStub } from 'sinon'

const SidebarSettingsLinkSelector = '[data-cy="sidebar-link-settings-page"]'
const isWindows = Cypress.platform === 'win32'

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
    cy.specsPageIsVisible()
    cy.get(SidebarSettingsLinkSelector).click()

    cy.contains('[data-cy="app-header-bar"]', 'Settings')
    cy.contains('[data-cy="app-header-bar"] button', 'Log in').should('be.visible')

    cy.findByText('Device settings').should('be.visible')
    cy.findByText('Project settings').should('be.visible')
    cy.findByText('Cypress Cloud settings').should('be.visible')
  })

  describe('Cloud Settings', () => {
    it('shows the projectId section when there is a projectId and shows override from CLI', () => {
      cy.withCtx(async (ctx, o) => {
        o.sinon.stub(ctx.config.electronApi, 'copyTextToClipboard')
      })

      cy.startAppServer('e2e')
      cy.visitApp()
      cy.specsPageIsVisible()
      cy.get(SidebarSettingsLinkSelector).click()
      cy.findByText('Cypress Cloud settings').click()
      cy.findByText('Project ID').should('be.visible')
      cy.get('[data-cy="code-box"]').should('contain', 'fromCli')
      cy.findByText('Copy').click()
      cy.findByText('Copied!').should('be.visible')
      cy.withRetryableCtx((ctx) => {
        expect(ctx.config.electronApi.copyTextToClipboard as SinonStub).to.have.been.calledWith('fromCli')
      })
    })

    it('shows the Record Keys section', () => {
      cy.startAppServer('e2e')
      cy.loginUser()

      cy.visitApp()
      cy.specsPageIsVisible()
      cy.get(SidebarSettingsLinkSelector).click()
      cy.findByText('Cypress Cloud settings').click()
      cy.findByText('Record key').should('be.visible')
    })

    it('obfuscates each Record Key and has a button to reveal the key', () => {
      cy.startAppServer('e2e')
      cy.loginUser()

      cy.visitApp()
      cy.specsPageIsVisible()
      cy.get(SidebarSettingsLinkSelector).click()
      cy.findByText('Cypress Cloud settings').click()
      cy.get('[data-cy="code-box"]').should('contain', '***')
      cy.get('[aria-label="Record Key Visibility Toggle"]').click()
      cy.get('[data-cy="code-box"]').should('contain', '2aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
    })

    it('opens cloud settings when clicking on "Manage Keys"', () => {
      cy.startAppServer('e2e')
      cy.loginUser()
      cy.visitApp('settings')
      cy.findByText('Cypress Cloud settings').click()
      cy.findByText('Manage keys').click()
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
      cy.specsPageIsVisible()
      cy.findByTestId('spec-list-container').scrollTo('bottom')
      // Visit the test to trigger the ws.off() for the TR websockets
      cy.contains('test1.js').click()
      cy.waitForSpecToFinish()
      // Wait for the test to pass, so the test is completed
      cy.get('.passed > .num').should('contain', 1)
      cy.get(SidebarSettingsLinkSelector).click()
      cy.contains('Cypress Cloud settings').click()
      // Assert the data is not there before it arrives
      cy.contains('Record key').should('not.exist')
      cy.contains('Record key')
    })

    it('clears nested cloud data (Record Key) upon logging out', () => {
      cy.startAppServer('e2e')
      cy.loginUser()
      cy.visitApp()
      cy.specsPageIsVisible()
      cy.withCtx((ctx, o) => {
        o.sinon.spy(ctx.actions.auth, 'logout')
      })

      cy.findByTestId('sidebar-link-settings-page').click()
      cy.contains('Cypress Cloud settings').click()
      cy.contains('Record key').should('exist')
      cy.findByTestId('sidebar-link-runs-page').click()
      cy.findByTestId('user-avatar-title').click()
      cy.findByRole('button', { name: 'Log out' }).click()

      cy.withRetryableCtx((ctx, o) => {
        expect(ctx.actions.auth.logout).to.have.been.calledOnce
      })

      cy.findByTestId('sidebar-link-settings-page').click()
      cy.contains('Cypress Cloud settings').click()
      cy.contains('Record key').should('not.exist')
    })
  })

  describe('Project settings', () => {
    it('shows the Spec Patterns section (default specPattern value)', () => {
      cy.scaffoldProject('simple-ct')
      cy.openProject('simple-ct', ['--component'])
      cy.startAppServer('component')
      cy.loginUser()

      cy.visitApp()
      cy.specsPageIsVisible()
      cy.findByTestId('sidebar-link-settings-page').click()
      cy.findByText('Project settings').click()
      cy.get('[data-cy="file-match-indicator"]').contains('2 matches')
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
      cy.specsPageIsVisible()
      cy.get(SidebarSettingsLinkSelector).click()
      cy.findByText('Project settings').click()
      cy.get('[data-cy="file-match-indicator"]').contains('19 matches')
      cy.get('[data-cy="spec-pattern"]').contains('tests/**/*.(js|ts|coffee)')
    })

    it('shows the Experiments section', () => {
      cy.startAppServer('e2e')
      cy.loginUser()

      cy.visitApp()
      cy.specsPageIsVisible()
      cy.get(SidebarSettingsLinkSelector).click()
      cy.findByText('Project settings').click()
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

        cy.get('[data-cy="experiment-experimentalSourceRewriting"]').within(() => {
          cy.validateExternalLink({
            name: '#5273',
            href: 'https://github.com/cypress-io/cypress/issues/5273',
          })
        })
      })

      // makes sure all experiments have an i18n header and description available.
      // @see https://github.com/cypress-io/cypress/issues/30126.
      cy.get('[data-cy="settings-experiments"] [role="row"][data-cy^="experiment-"]').each((experimentRow) => {
        cy.wrap(experimentRow[0]).get('[data-cy="experimentName"]').should('not.contain.text', 'settingsPage.')
        cy.wrap(experimentRow[0]).get('[data-cy="experimentDescription"]').should('not.contain.text', 'settingsPage.')
      })
    })

    it('shows the Resolved Configuration section', () => {
      cy.startAppServer('e2e')
      cy.loginUser()

      cy.visitApp()
      cy.specsPageIsVisible()
      cy.get(SidebarSettingsLinkSelector).click()
      cy.findByText('Project settings').click()
      cy.get('[data-cy="config-code"]').contains('{')
    })

    it('highlights values set via config file, envFile, env, or CLI in the appropriate color', () => {
      cy.startAppServer('e2e')
      cy.loginUser()

      cy.visitApp()
      cy.specsPageIsVisible()
      cy.get(SidebarSettingsLinkSelector).click()
      cy.findByText('Project settings').click()
      cy.get('[data-cy="config-legend"]').within(() => {
        cy.get('.bg-gray-50').contains('default')
        cy.get('.bg-teal-100').contains('config')
        cy.get('.bg-orange-100').contains('env')
        cy.get('.bg-red-50').contains('cli')
      })

      cy.get('[data-cy="config-code"]').within(() => {
        cy.get('[data-cy-config="config"]').contains('tests/_fixtures')
        cy.get('[data-cy-config="config"]').contains('tests/**/*.(js|ts|coffee)')
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
      cy.findByText('Project settings').click()
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
      cy.specsPageIsVisible()
      cy.get(SidebarSettingsLinkSelector).click()
      cy.findByText('Project settings').click()
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
      cy.contains('Device settings').click()
    })

    it('selects well known editor', () => {
      cy.contains('Choose your editor...').click()
      cy.contains('Well known editor').click()
      cy.withRetryableCtx((ctx) => {
        expect((ctx.actions.localSettings.setPreferences as SinonStub).lastCall.args[0]).to.include('/usr/bin/well-known')
      })

      // navigate away and come back
      // preferred editor selected from dropdown should have been persisted
      cy.visitApp()
      cy.specsPageIsVisible()
      cy.findByTestId('sidebar-link-settings-page').click()
      cy.wait(200)
      cy.get('[data-cy="Device settings"]').click()

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
        expect((ctx.actions.localSettings.setPreferences as SinonStub).lastCall.args[0]).to.include('/usr/local/bin/vim')
      })

      // navigate away and come back
      // preferred editor entered from input should have been persisted
      cy.findByTestId('sidebar-link-settings-page').click()
      cy.wait(100)
      cy.get('[data-cy="Device settings"]').click()

      cy.get('[data-cy="custom-editor"]').should('have.value', '/usr/local/bin/vim')
    })

    it('lists file browser as available editor', () => {
      cy.contains('Choose your editor...').click()
      cy.get('[data-cy="computer"]').click()

      cy.withRetryableCtx((ctx) => {
        expect((ctx.actions.localSettings.setPreferences as SinonStub).lastCall.args[0]).to.include('computer')
      })

      cy.get('[data-cy="custom-editor"]').should('not.exist')
    })

    it('handles null binary field in editor', () => {
      cy.contains('Choose your editor...').click()
      cy.contains('Null binary editor').click()
      cy.withRetryableCtx((ctx) => {
        expect((ctx.actions.localSettings.setPreferences as SinonStub).lastCall.args[0]).to.include('{"preferredEditorBinary":null')
      })

      // navigate away and come back
      // preferred editor selected from dropdown should have been persisted
      cy.visitApp()
      cy.specsPageIsVisible()
      cy.findByTestId('sidebar-link-settings-page').click()
      cy.wait(200)
      cy.get('[data-cy="Device settings"]').click()

      cy.get('[data-cy="custom-editor"]').should('not.exist')
    })
  })

  describe('notifications', () => {
    // Run notifications will initially be released without support for Windows
    // https://github.com/cypress-io/cypress/issues/26786
    const itSkipIfWindows = isWindows ? it.skip : it

    let setPreferencesStub
    let showSystemNotificationStub

    context('not enabled', () => {
      beforeEach(() => {
        cy.withCtx((ctx, o) => {
          setPreferencesStub = o.sinon.stub(ctx.actions.localSettings, 'setPreferences')
          showSystemNotificationStub = o.sinon.stub(ctx.actions.electron, 'showSystemNotification')
          ctx.coreData.localSettings.preferences.desktopNotificationsEnabled = null
        })
      })

      itSkipIfWindows('redirects to settings page and focuses notifications when enabling via banner', () => {
      // Make it really vertically narrow to ensure the "scrollTo" behavior is working as expected.
        cy.startAppServer('e2e')
        cy.loginUser()
        cy.visitApp()
        cy.specsPageIsVisible()
        cy.get('button').contains('Enable desktop notifications').click()
        // We specifically scroll this anchor into view when clicking the "Enable desktop notifications" button.
        cy.get('section#notifications').should('be.visible')
      })
    })

    context('are enabled', () => {
      function visitNotificationSettingsPage () {
        cy.startAppServer('e2e')
        cy.visitApp('settings')
        cy.contains('Device settings').click()
        cy.contains('Desktop notifications').scrollIntoView().should('be.visible')
      }

      beforeEach(() => {
        cy.withCtx((ctx, o) => {
          setPreferencesStub = o.sinon.stub(ctx.actions.localSettings, 'setPreferences')
          showSystemNotificationStub = o.sinon.stub(ctx.actions.electron, 'showSystemNotification')
          ctx.coreData.localSettings.preferences.notifyWhenRunStarts = false
          ctx.coreData.localSettings.preferences.notifyWhenRunStartsFailing = true
          ctx.coreData.localSettings.preferences.desktopNotificationsEnabled = true
        })
      })

      it('shows or hides notification settings based on operating system', () => {
        cy.startAppServer('e2e')
        cy.visitApp('settings')
        cy.contains('Device settings').click()

        if (isWindows) {
          cy.contains('Desktop notifications').should('not.exist')
        } else {
          cy.contains('Desktop notifications').scrollIntoView().should('be.visible')
        }
      })

      itSkipIfWindows('correctly sets default state', () => {
        visitNotificationSettingsPage()

        cy.findByLabelText('Notify me when a run starts').should('be.visible').should('have.attr', 'aria-checked', 'false')
        cy.findByLabelText('Notify me when a run begins to fail').should('be.visible').should('have.attr', 'aria-checked', 'true')

        cy.contains('Notify me when a run completes').should('be.visible')
        cy.findByLabelText('Passed').should('be.visible').should('not.be.checked')
        cy.findByLabelText('Failed').should('be.visible').should('be.checked')
        cy.findByLabelText('Canceled').should('be.visible').should('not.be.checked')
        cy.findByLabelText('Errored').should('be.visible').should('not.be.checked')
      })

      itSkipIfWindows('updates preferences', () => {
        visitNotificationSettingsPage()

        cy.findByLabelText('Notify me when a run starts').should('be.visible').should('have.attr', 'aria-checked', 'false').click()

        cy.withCtx((ctx) => {
          expect(setPreferencesStub).to.have.been.calledWith(JSON.stringify({ notifyWhenRunStarts: true }), 'global')
          setPreferencesStub.resetHistory()
        })

        cy.findByLabelText('Notify me when a run begins to fail').should('be.visible').should('have.attr', 'aria-checked', 'true').click()

        cy.withCtx((ctx) => {
          expect(setPreferencesStub).to.have.been.calledWith(JSON.stringify({ notifyWhenRunStartsFailing: false }), 'global')
          setPreferencesStub.resetHistory()
        })

        cy.contains('Notify me when a run completes').should('be.visible')
        cy.findByLabelText('Passed').should('be.visible').should('not.be.checked').click()

        // wait for debounce
        cy.wait(200)

        cy.withCtx((ctx) => {
          expect(setPreferencesStub).to.have.been.calledWith(JSON.stringify({ notifyWhenRunCompletes: ['failed', 'passed'] }), 'global')
          setPreferencesStub.resetHistory()
        })

        cy.findByLabelText('Failed').should('be.visible').should('be.checked').click()

        // wait for debounce
        cy.wait(200)

        cy.withCtx((ctx) => {
          expect(setPreferencesStub).to.have.been.calledWith(JSON.stringify({ notifyWhenRunCompletes: ['passed'] }), 'global')
          setPreferencesStub.resetHistory()
        })

        cy.findByLabelText('Canceled').should('be.visible').should('not.be.checked').click()

        // wait for debounce
        cy.wait(200)

        cy.withCtx((ctx) => {
          expect(setPreferencesStub).to.have.been.calledWith(JSON.stringify({ notifyWhenRunCompletes: ['passed', 'cancelled'] }), 'global')
          setPreferencesStub.resetHistory()
        })

        cy.findByLabelText('Errored').should('be.visible').should('not.be.checked').click()

        // wait for debounce
        cy.wait(200)

        cy.withCtx((ctx) => {
          expect(setPreferencesStub).to.have.been.calledWith(JSON.stringify({ notifyWhenRunCompletes: ['passed', 'cancelled', 'errored'] }), 'global')
          setPreferencesStub.resetHistory()
        })
      })

      itSkipIfWindows('sends test notification', () => {
        visitNotificationSettingsPage()

        cy.contains('button', 'Send a test notification').click()

        cy.withCtx((ctx) => {
          expect(showSystemNotificationStub).to.have.been.calledWith('Hello From Cypress', 'This is a test notification')
        })

        cy.contains('a', 'Troubleshoot').should('have.attr', 'href', 'https://on.cypress.io/notifications-troubleshooting')
      })
    })
  })
})

describe('App: Settings without cloud', () => {
  it('the projectId section shows a prompt to log in when there is no projectId, and uses correct UTM params', () => {
    cy.scaffoldProject('simple-ct')
    cy.openProject('simple-ct', ['--component'])
    cy.startAppServer('component')

    cy.visitApp()
    cy.specsPageIsVisible()
    cy.get(SidebarSettingsLinkSelector).click()
    cy.findByText('Cypress Cloud settings').click()
    cy.findByText('Project ID').should('not.exist')
    cy.withCtx((ctx, o) => {
      o.sinon.stub(ctx._apis.authApi, 'logIn')
    })

    cy.contains('button', 'Connect to Cypress Cloud').click()
    cy.findByRole('dialog', { name: 'Log in to Cypress' }).within(() => {
      cy.contains('button', 'Log in').click()
    })

    cy.withCtx((ctx, o) => {
      // validate utmSource
      expect((ctx._apis.authApi.logIn as SinonStub).lastCall.args[1]).to.eq('Binary: App')
      // validate utmMedium
      expect((ctx._apis.authApi.logIn as SinonStub).lastCall.args[2]).to.eq('Settings Tab')
    })
  })

  it('have returned browsers', () => {
    cy.scaffoldProject('simple-ct')
    cy.openProject('simple-ct', ['--component'])
    cy.startAppServer('component')

    cy.visitApp()
    cy.specsPageIsVisible()
    cy.get(SidebarSettingsLinkSelector).click()
    cy.findByText('Project settings').click()

    cy.get('[data-cy=config-code]').within(() => {
      const { browsers } = Cypress.config()

      expect(browsers).to.have.length.greaterThan(1)

      cy.contains(`browsers: [`)
      cy.contains(`name: 'chrome',`)
      cy.contains(`family: 'chromium',`)
      cy.contains(`channel: 'stable',`)
      cy.contains(`displayName: 'Chrome',`)

    // cy.percySnapshot() // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435
    })
  })
})
