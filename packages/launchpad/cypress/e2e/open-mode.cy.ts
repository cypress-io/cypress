import type { SinonStub } from 'sinon'
import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'
import { MAJOR_VERSION_FOR_CONTENT } from '@packages/types'

describe('Launchpad: Open Mode', () => {
  describe('global mode', () => {
    it('shows a loading spinner before application mounts, and cleans up after mount', () => {
      cy.openGlobalMode()

      // Since these elements are removed when JS runs and the app mounts,
      // they are gone by the time Cypress can assert about them
      // but we can still make sure they are provided in the HTML payload
      cy.request(`/__launchpad/index.html`)
      .should(({ body }) => {
        expect(body.includes('data-cy="plain-html-loading-spinner"')).to.be.true
        expect(body.includes('data-cy="plain-html-spinner-styles"')).to.be.true
      })

      cy.visitLaunchpad()
      cy.findByTestId('plain-html-loading-spinner').should('not.exist')
      cy.findByTestId('plain-html-spinner-styles').should('not.exist')
    })

    it('shows Add Project when no projects have been added', () => {
      cy.openGlobalMode()
      cy.visitLaunchpad()
      cy.get('h1').should('contain', defaultMessages.globalPage.empty.title)
    })

    it('shows the projects page when a project is not specified', () => {
      cy.openGlobalMode()
      cy.addProject('todos')
      cy.visitLaunchpad()
      cy.contains(defaultMessages.globalPage.recentProjectsHeader)
    })

    it('does not show Welcome screen on next Launchpad visit when it has already been dismissed', () => {
      cy.visitLaunchpad({ showWelcome: true })
      cy.skipWelcome()
      cy.visitLaunchpad({ showWelcome: true })
      cy.contains('button', 'Continue').should('not.exist')
      cy.get('h1').should('contain', defaultMessages.globalPage.empty.title)
    })
  })

  it('goes directly to e2e tests when launched with --e2e', () => {
    cy.scaffoldProject('todos')
    cy.openProject('todos', ['--e2e'])
    cy.visitLaunchpad()
    cy.get('[data-cy=header-bar-content]').contains('e2e testing', { matchCase: false })
    // e2e testing is configured for the todo project, so we don't expect an error.
    cy.get('h1').should('contain', 'Choose a browser')
  })

  describe('request for Cypress manifest', () => {
    beforeEach(() => {
      cy.withCtx((ctx, o) => {
        o.sinon.spy(ctx.util.fetch)
      })

      cy.withCtx((ctx, o) => {
        ctx.config.localSettingsApi.setPreferences({
          notifyWhenRunCompletes: ['failed'],
        })
      })

      cy.scaffoldProject('todos')
      cy.openProject('todos', ['--e2e'])
    })

    it('includes `x-framework`, `x-dev-server`, and `x-dependencies` headers, even when launched in e2e mode if this is the initial launch of Cypress', () => {
      cy.withCtx((ctx) => {
        ctx.versions['_initialLaunch'] = true
      })

      cy.visitLaunchpad({ showWelcome: true })
      cy.skipWelcome()
      cy.get('h1').should('contain', 'Choose a browser')
      cy.withCtx((ctx, o) => {
        expect(ctx.util.fetch).to.have.been.calledWithMatch('https://download.cypress.io/desktop.json', {
          headers: {
            'x-framework': 'react',
            'x-dev-server': 'webpack',
            'x-notifications': 'failed',
            'x-dependencies': 'typescript@5.3.3',
          },
        })
      })
    })

    it('does not include `x-dependencies` header, if this is not the initial launch of Cypress', () => {
      cy.withCtx((ctx) => {
        ctx.versions['_initialLaunch'] = false
      })

      cy.visitLaunchpad()
      cy.get('h1').should('contain', 'Choose a browser')
      cy.withCtx((ctx, o) => {
        expect(ctx.util.fetch).to.have.been.calledWithMatch('https://download.cypress.io/desktop.json', {
          headers: {
            'x-framework': 'react',
            'x-dev-server': 'webpack',
          },
        })
      })
    })

    describe('logged-in state', () => {
      it(`sends 'false' when not logged in`, () => {
        cy.visitLaunchpad()
        cy.get('h1').should('contain', 'Choose a browser')
        cy.withCtx((ctx, o) => {
          expect(ctx.util.fetch).to.have.been.calledWithMatch('https://download.cypress.io/desktop.json', {
            headers: {
              'x-logged-in': 'false',
            },
          })
        })
      })

      it(`sends 'true' when logged in`, () => {
        cy.loginUser()
        cy.visitLaunchpad()
        cy.get('h1').should('contain', 'Choose a browser')
        cy.withCtx((ctx, o) => {
          expect(ctx.util.fetch).to.have.been.calledWithMatch('https://download.cypress.io/desktop.json', {
            headers: {
              'x-logged-in': 'true',
            },
          })
        })
      })
    })
  })

  describe('when launched with --component and not configured', () => {
    beforeEach(() => {
      cy.scaffoldProject('react-vite-ts-unconfigured')
    })

    it('goes to component test onboarding', () => {
      cy.openProject('react-vite-ts-unconfigured', ['--component'])
      cy.visitLaunchpad()

      cy.get('[data-cy=header-bar-content]').contains('component testing', { matchCase: false })
      // Component testing is not configured for the todo project
      cy.get('h1').should('contain', 'Project setup')
    })

    it('detects CT project framework', () => {
      cy.withCtx(async (ctx, o) => {
        // Mock wizard initialization taking a long time by replacing
        // implementation with no-op and proceeding
        o.sinon.stub(ctx.actions.wizard, 'initialize').resolves()
      })

      cy.openProject('react-vite-ts-unconfigured', ['--component'])
      cy.visitLaunchpad()

      cy.get('[data-testid="select-framework"]').as('framework')

      // Validate that UI presents an "empty" state since auto-detection did not fire
      cy.get('@framework').within(() => {
        cy.contains('Pick a framework', { timeout: 100 }).should('be.visible')
      })

      cy.withCtx(async (ctx, o) => {
        // Trigger actual wizard initialization to occur
        (ctx.actions.wizard.initialize as SinonStub).wrappedMethod.apply(ctx.actions.wizard)
      })

      // Verify that auto-detection has fired via the real initialize call and updated data
      // has flowed through to populate UI
      cy.get('[data-testid="select-bundler"]').as('bundler')

      cy.get('@framework').within(() => {
        cy.contains('React.js').should('be.visible')
        cy.contains('(detected)').should('be.visible')
      })

      cy.get('@bundler').within(() => {
        cy.contains('Vite').should('be.visible')
        cy.contains('(detected)').should('be.visible')
      })
    })
  })

  // since circle cannot have firefox installed by default,
  // we need to skip this test relying on it
  // It is very unlikely that it would only fail on Windows though
  // (tested manually on Windows and it works fine)
  if (Cypress.platform !== 'win32') {
    it('auto-selects the browser when launched with --browser', () => {
      cy.scaffoldProject('launchpad')
      cy.openProject('launchpad', ['--browser', 'firefox'])
      cy.withCtx((ctx, o) => {
        o.sinon.stub(ctx._apis.projectApi, 'launchProject').rejects(new Error('should not launch project'))
      })

      // Need to visit after args have been configured, todo: fix in #18776
      cy.visitLaunchpad()
      cy.contains('E2E Testing').click()
      cy.get('h1').should('contain', 'Choose a browser')
      cy.get('[data-cy-browser=firefox]').should('have.attr', 'aria-checked', 'true')
      cy.get('button[data-cy=launch-button]').invoke('text').should('include', 'Start E2E Testing in Firefox')
    })

    it('auto-launches the browser when launched with --browser --testingType --project, after Major Version Welcome is dismissed', () => {
      cy.scaffoldProject('launchpad')
      cy.openProject('launchpad', ['--browser', 'firefox', '--e2e'])
      cy.withCtx((ctx, o) => {
        o.sinon.stub(ctx._apis.projectApi, 'launchProject').resolves()
      })

      // Need to visit after args have been configured, todo: fix in #18776
      cy.visitLaunchpad()

      cy.get('h1').should('contain', 'Choose a browser')
      cy.get('[data-cy-browser=firefox]').should('have.attr', 'aria-checked', 'true')
      cy.get('button[data-cy=launch-button]').invoke('text').should('include', 'Start E2E Testing in Firefox')

      cy.withRetryableCtx((ctx) => {
        expect(ctx._apis.projectApi.launchProject).to.be.calledOnce
      })
    })

    it('auto-launches the browser when launched with --browser --testingType --project if there is no major version welcome screen', () => {
      cy.withCtx((ctx, o) => {
        o.sinon.stub(ctx._apis.projectApi, 'launchProject').resolves()
        o.sinon.stub(ctx._apis.localSettingsApi, 'getPreferences').resolves({ majorVersionWelcomeDismissed: {
          [o.MAJOR_VERSION_FOR_CONTENT]: Date.now(),
        } })
      }, {
        MAJOR_VERSION_FOR_CONTENT,
      })

      cy.scaffoldProject('launchpad')
      cy.openProject('launchpad', ['--browser', 'firefox', '--e2e'])

      // Need to visit after args have been configured, todo: fix in #18776
      cy.visitLaunchpad()

      cy.get('h1').should('contain', 'Choose a browser')
      cy.get('[data-cy-browser=firefox]').should('have.attr', 'aria-checked', 'true')
      cy.get('button[data-cy=launch-button]').invoke('text').should('include', 'Start E2E Testing in Firefox')

      cy.withRetryableCtx((ctx) => {
        expect(ctx._apis.projectApi.launchProject).to.be.calledOnce
      })
    })
  }

  describe('when there is a list of projects', () => {
    it('goes to an active project if one is added', () => {
      cy.scaffoldProject('todos')
      cy.openProject('todos')
      cy.visitLaunchpad()

      cy.withCtx(async (ctx, o) => {
        ctx.emitter.toLaunchpad()
      })

      cy.get('h1').should('contain', 'Welcome to Cypress!')
    })
  })

  describe('when a user interacts with the header', () => {
    it('the Docs menu opens when clicked', () => {
      cy.scaffoldProject('todos')
      cy.openProject('todos')
      cy.visitLaunchpad()

      cy.contains('button', 'Docs').click()
      cy.contains(defaultMessages.topNav.docsMenu.gettingStartedTitle).should('be.visible')
    })
  })

  describe('open in ide', () => {
    beforeEach(() => {
      cy.scaffoldProject('todos')
      cy.openGlobalMode()
    })

    it('configures an editor if one is not configured', () => {
      cy.withCtx(async (ctx, o) => {
        ctx.coreData.localSettings.preferences.preferredEditorBinary = undefined
        ctx.coreData.localSettings.availableEditors = [
          // don't rely on CI machines to have specific editors installed
          // so just adding one here
          {
            id: 'well-known-editor',
            binary: '/usr/bin/well-known',
            name: 'Well known editor',
          },
        ]

        ctx.coreData.app.projects = [{ projectRoot: '/some/project', savedState: () => Promise.resolve({}) }]
      })

      cy.visitLaunchpad()
      cy.findByTestId('project-card')
      cy.get('[aria-label="Project actions"]').click()
      cy.get('button').contains('Open in IDE').click()

      cy.get('[data-cy="choose-editor-modal"]').as('modal')

      cy.get('@modal').contains('Cancel').click()
      cy.get('@modal').should('not.exist')

      cy.findByTestId('project-card')
      cy.get('[aria-label="Project actions"]').click()
      cy.get('button').contains('Open in IDE').click()

      cy.intercept('POST', 'mutation-ChooseExternalEditorModal_SetPreferredEditorBinary').as('SetPreferred')
      cy.get('@modal').contains('Choose your editor...').click()
      cy.get('@modal').contains('Well known editor').click()
      cy.get('@modal').contains('Save changes').click()
      cy.wait('@SetPreferred').its('request.body.variables.value').should('include', '/usr/bin/well-known')
    })

    it('opens using finder', () => {
      cy.withCtx(async (ctx, o) => {
        ctx.coreData.app.projects = [{ projectRoot: '/some/project', savedState: () => Promise.resolve({}) }]
      })

      cy.visitLaunchpad()
      cy.findByTestId('project-card')
      cy.get('[aria-label="Project actions"]').click()

      cy.intercept('POST', 'mutation-GlobalPage_OpenInFinder').as('OpenInFinder')
      cy.get('button').contains('Open in Finder').click()

      cy.wait('@OpenInFinder')

      cy.withCtx((ctx, o) => {
        expect((ctx.actions.electron.showItemInFolder as SinonStub).lastCall.lastArg).to.eql('/some/project')
      })
    })
  })

  it('opens an e2e project without a supportFile', () => {
    cy.scaffoldProject('no-support-file')
    cy.openProject('no-support-file', ['--e2e'])
    cy.visitLaunchpad()
    cy.contains(cy.i18n.launchpadErrors.generic.configErrorTitle)
    cy.contains('Your project does not contain a default supportFile.')
    cy.contains('If a support file is not necessary for your project, set supportFile to false.')
  })

  // Assert that we do not glob the absolute projectRoot
  // and fail supportFile lookups during project initialization.
  // https://github.com/cypress-io/cypress/issues/22040
  it('opens projects with paths that contain glob syntax', () => {
    cy.scaffoldProject('project-with-(glob)-[chars]')
    cy.openProject('project-with-(glob)-[chars]', ['--e2e'])
    cy.visitLaunchpad()

    cy.get('body').should('not.contain.text', 'Your project does not contain a default supportFile.')
    cy.get('h1').should('contain', 'Choose a browser')
  })

  it('opens project with spaces in path', () => {
    cy.scaffoldProject('simple with spaces')
    cy.openProject('simple with spaces', ['--e2e'])
    cy.visitLaunchpad()
    cy.get('h1').should('contain', 'Choose a browser')
  })
})
