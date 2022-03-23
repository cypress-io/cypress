import type { SinonStub } from 'sinon'

describe('App: Settings', () => {
  before(() => {
    cy.scaffoldProject('todos', { timeout: 50 * 1000 })
  })

  beforeEach(() => {
    cy.openProject('todos')
  })

  it('visits settings page', () => {
    cy.startAppServer('e2e')
    cy.visitApp()
    cy.findByText('Settings').click()

    cy.get('div[data-cy="app-header-bar"]').should('contain', 'Settings')
    cy.findByText('Device Settings').should('be.visible')
    cy.findByText('Project Settings').should('be.visible')
  })

  it('shows a button to log in if user is not connected', () => {
    cy.startAppServer('e2e')
    cy.visitApp()
    cy.findByText('Settings').click()
    cy.findByText('Project Settings').click()
    cy.get('button').contains('Log In')
  })

  it('can reconfigure a project', () => {
    cy.startAppServer('e2e')
    cy.visitApp('settings')
    cy.withCtx((ctx, o) => {
      o.sinon.stub(ctx.actions.project, 'reconfigureProject')
    })

    cy.findByText('Reconfigure Project').click()
    cy.withRetryableCtx((ctx) => {
      expect(ctx.actions.project.reconfigureProject).to.have.been.called
    })
  })

  describe('Cloud Settings', () => {
    it('shows the projectId section when there is a projectId', () => {
      cy.withCtx(async (ctx, o) => {
        o.sinon.stub(ctx.electronApi, 'copyTextToClipboard')
      })

      cy.startAppServer('e2e')
      cy.visitApp()
      cy.findByText('Settings').click()
      cy.findByText('Dashboard Settings').click()
      cy.findByText('Project ID').should('be.visible')
      cy.findByText('Copy').click()
      cy.findByText('Copied!').should('be.visible')
      cy.withRetryableCtx((ctx) => {
        expect(ctx.electronApi.copyTextToClipboard as SinonStub).to.have.been.calledWith('abc123')
      })
    })

    it('shows the Record Keys section', () => {
      cy.startAppServer('e2e')
      cy.loginUser()

      cy.visitApp()
      cy.findByText('Settings').click()
      cy.findByText('Dashboard Settings').click()
      cy.findByText('Record Key').should('be.visible')
    })

    it('obfuscates each record key and has a button to reveal the key', () => {
      cy.startAppServer('e2e')
      cy.loginUser()

      cy.visitApp()
      cy.findByText('Settings').click()
      cy.findByText('Dashboard Settings').click()
      cy.get('[data-cy="record-key"]').should('contain', '***')
      cy.get('[aria-label="Record Key Visibility Toggle"]').click()
      cy.get('[data-cy="record-key"]').should('contain', '2aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
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
  })

  describe('Project Settings', () => {
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
      cy.findByText('Settings').click()
      cy.findByText('Project Settings').click()
      cy.get('[data-cy="file-match-indicator"]').contains('41 Matches')
      cy.get('[data-cy="spec-pattern"]').contains('tests/**/*')
    })

    it('shows the Experiments section', () => {
      cy.startAppServer('e2e')
      cy.loginUser()

      cy.visitApp()
      cy.findByText('Settings').click()
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

        cy.get('[data-cy="experiment-experimentalSessionSupport"]').within(() => {
          cy.validateExternalLink({
            name: 'cy.session()',
            href: 'https://on.cypress.io/session',
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
      cy.findByText('Settings').click()
      cy.findByText('Project Settings').click()
      cy.get('[data-cy="config-code"]').contains('{')
    })

    it('highlights values set via config file, envFile, env, or CLI in the appropriate color', () => {
      cy.startAppServer('e2e')
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
        cy.get('.bg-yellow-100').contains('INTERNAL_E2E_TESTING_SELF')
        cy.get('.bg-yellow-100').contains('INTERNAL_GRAPHQL_PORT')
        cy.get('.bg-red-50').contains('4455')
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
      cy.get('[href="#/settings"]').click()
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
      cy.get('[href="#/settings"]').click()
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
  })
})

describe('App: Settings without cloud', () => {
  it('the projectId section shows a prompt to connect when there is no projectId', () => {
    cy.scaffoldProject('simple-ct')
    cy.openProject('simple-ct')
    cy.startAppServer('component')

    cy.visitApp()
    cy.findByText('Settings').click()
    cy.findByText('Dashboard Settings').click()
    cy.findByText('Project ID').should('exist')
    cy.contains('button', 'Log in to the Cypress Dashboard').should('be.visible')
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
