import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'
import type { SinonStub } from 'sinon'

describe('App: Runs', { viewportWidth: 1200 }, () => {
  beforeEach(() => {
    cy.scaffoldProject('component-tests')
    cy.openProject('component-tests')
    cy.startAppServer('component')
  })

  context('Runs Page', () => {
    it('resolves the runs page', () => {
      cy.loginUser()
      cy.visitApp()
      cy.get('[href="#/runs"]', { timeout: 1000 }).click()
      cy.get('[data-cy="runs"]')
      cy.get('[data-cy="app-header-bar"]').findByText('Runs').should('be.visible')
    })

    it('shows the loader', () => {
      cy.loginUser()
      cy.remoteGraphQLIntercept(async (obj) => {
        await new Promise((resolve) => setTimeout(resolve, 200))

        return obj.result
      })

      cy.visitApp()
      cy.get('[href="#/runs"]').click()
      cy.get('[data-cy="runs-loader"]')
      cy.get('[data-cy="runs"]')
    })
  })

  context('Runs - Login', () => {
    it('when logged out, shows call to action', () => {
      cy.visitApp()
      cy.get('[href="#/runs"]').click()
      cy.contains(defaultMessages.runs.connect.buttonUser).should('exist')
    })

    it('clicking the login button will open the login modal', () => {
      cy.visitApp()
      cy.get('[href="#/runs"]').click()
      cy.contains('Log In').click()
      cy.findByRole('dialog', { name: 'Log in to Cypress' }).within(() => {
        cy.get('button').contains('Log In')
      })
    })

    it('if logged in and connected', { viewportWidth: 1200 }, () => {
      cy.loginUser()
      cy.visitApp()

      cy.withCtx((ctx, o) => {
        o.sinon.stub(ctx.actions.electron, 'openExternal')
      })

      cy.get('[href="#/runs"]').click()
      cy.contains('a', 'OVERLIMIT').click()

      cy.withCtx((ctx) => {
        expect(ctx.actions.electron.openExternal).to.have.been.calledWith('http://dummy.cypress.io/runs/4')
      })
    })
  })

  context('Runs - Connect Org', () => {
    it('opens create Org modal after clicking Connect Project button', () => {
      cy.scaffoldProject('component-tests')
      cy.openProject('component-tests', ['--config-file', 'cypressWithoutProjectId.config.js'])
      cy.startAppServer('component')

      cy.loginUser()
      cy.visitApp()

      cy.remoteGraphQLIntercept(async (obj) => {
        if (obj.result.data?.cloudViewer?.organizations?.nodes) {
          obj.result.data.cloudViewer.organizations.nodes = []
        }

        return obj.result
      })

      cy.get('[href="#/runs"]').click()

      cy.findByText(defaultMessages.runs.connect.buttonProject).click()
      cy.get('[aria-modal="true"]').should('exist')

      cy.findByText(defaultMessages.runs.connect.modal.createOrg.button).click()
      cy.contains('button', defaultMessages.runs.connect.modal.createOrg.waitingButton).should('be.visible')
      cy.contains('a', defaultMessages.links.needHelp).should('have.attr', 'href', 'https://on.cypress.io/adding-new-project')

      cy.get('button').get('[aria-label="Close"').click()
      cy.get('[aria-modal="true"]').should('not.exist')
    })
  })

  context('Runs - Connect Project', () => {
    it('when no project Id in the config file, shows call to action', () => {
      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject('cypress.config.js', 'module.exports = {}')
      })

      cy.loginUser()
      cy.visitApp()

      cy.get('[href="#/runs"]').click()
      cy.contains(defaultMessages.runs.connect.buttonProject).should('exist')
    })

    it('opens Connect Project modal after clicking Connect Project button', () => {
      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject('cypress.config.js', 'module.exports = {}')
      })

      cy.loginUser()
      cy.visitApp()

      cy.get('[href="#/runs"]').click()
      cy.findByText(defaultMessages.runs.connect.buttonProject).click()
      cy.get('[aria-modal="true"]').should('exist')
      cy.get('button').get('[aria-label="Close"').click()
      cy.get('[aria-modal="true"]').should('not.exist')
    })
  })

  context('Runs - Cannot Find Project', () => {
    beforeEach(() => {
      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject('cypress.config.js', 'module.exports = {\'projectId\': \'abcdef42\'}')
      })

      cy.loginUser()
      cy.remoteGraphQLIntercept(async (obj) => {
        // Currently, all remote requests go through here, we want to use this to modify the
        // remote request before it's used and avoid touching the login query

        if (obj.result.data?.cloudProjectsBySlugs && obj.variables._v0_slugs.includes('abcdef42')) {
          for (const proj of obj.result.data.cloudProjectsBySlugs) {
            proj.__typename = 'CloudProjectNotFound'
            proj.message = 'Cloud Project Not Found'
          }
        }

        if (obj.result.data?.cloudViewer?.organizations?.nodes) {
          const projectNodes = obj.result.data?.cloudViewer.organizations.nodes[0].projects.nodes

          projectNodes.push({
            id: '1',
            slug: 'ghijkl',
            name: 'Mock Project',
          })
        }

        return obj.result
      })

      cy.visitApp()

      cy.get('[href="#/runs"]').click()
    })

    it('if project Id is specified in config file that does not exist, shows call to action', () => {
      cy.findByText(defaultMessages.runs.errors.notfound.button).should('be.visible')
    })

    it('opens Connect Project modal after clicking Reconnect Project button', () => {
      cy.findByText(defaultMessages.runs.errors.notfound.button).click()
      cy.get('[aria-modal="true"]').should('exist')
      cy.get('[data-cy="selectProject"] button').click()
      cy.findByText('Mock Project').click()
      cy.findByText(defaultMessages.runs.connect.modal.selectProject.connectProject).click()
      cy.get('[data-cy="runs"]')
    })
  })

  context('Runs - Unauthorized Project', () => {
    beforeEach(() => {
      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject('cypress.config.js', 'module.exports = {\'projectId\': \'abcdef\'}')
      })

      cy.loginUser()
    })

    it('if project Id is specified in config file that is not accessible, shows call to action', () => {
      cy.remoteGraphQLIntercept(async (obj) => {
        if (obj.result.data?.cloudProjectsBySlugs) {
          for (const proj of obj.result.data.cloudProjectsBySlugs) {
            proj.__typename = 'CloudProjectUnauthorized'
            proj.message = 'Cloud Project Unauthorized'
            proj.hasRequestedAccess = false
          }
        }

        return obj.result
      })

      cy.visitApp('/runs')
      cy.findByText(defaultMessages.runs.errors.unauthorized.button).should('be.visible')
    })

    it('clicking on the call to action should call the mutation', () => {
      cy.remoteGraphQLIntercept(async (obj, testState) => {
        if (obj.operationName === 'RunsErrorRenderer_RequestAccess_cloudProjectRequestAccess') {
          obj.result.data!.cloudProjectRequestAccess = {
            __typename: 'CloudProject',
            message: 'Cloud Project',
            hasRequestedAccess: true,
          }

          testState.cloudProjectRequestAccessWasCalled = true

          return obj.result
        }

        if (obj.result.data?.cloudProjectsBySlugs) {
          for (const proj of obj.result.data.cloudProjectsBySlugs) {
            proj.__typename = 'CloudProjectUnauthorized'
            proj.message = 'Cloud Project Unauthorized'
            proj.hasRequestedAccess = false
          }
        }

        return obj.result
      })

      cy.visitApp('/runs')

      cy.findByText(defaultMessages.runs.errors.unauthorized.button).click()

      cy.withCtx((ctx, o) => {
        expect(o.testState.cloudProjectRequestAccessWasCalled).to.eql(true)
      })
    })
  })

  context('Runs - Unauthorized Project Requested', () => {
    beforeEach(() => {
      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject('cypress.config.js', 'module.exports = {\'projectId\': \'abcdef\' }')
      })

      cy.loginUser()
      cy.remoteGraphQLIntercept(async (obj) => {
        // Currently, all remote requests go through here, we want to use this to modify the
        // remote request before it's used and avoid touching the login query

        if (obj.result.data?.cloudProjectsBySlugs) {
          for (const proj of obj.result.data.cloudProjectsBySlugs) {
            proj.__typename = 'CloudProjectUnauthorized'
            proj.message = 'Cloud Project Unauthorized'
            proj.hasRequestedAccess = true
          }
        }

        return obj.result
      })

      cy.visitApp()

      cy.get('[href="#/runs"]').click()
    })

    it('if project Id is specified in config file that is not accessible, shows call to action', () => {
      cy.findByText(defaultMessages.runs.errors.unauthorizedRequested.button).should('be.visible')
    })
  })

  context('Runs - No Runs', () => {
    it('when no runs and not connected, shows connect to dashboard button', () => {
      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject('cypress.config.js', 'module.exports = {projectId: null }')
      })

      cy.loginUser()
      cy.remoteGraphQLIntercept(async (obj) => {
        // Currently, all remote requests go through here, we want to use this to modify the
        // remote request before it's used and avoid touching the login query
        if (obj.result.data?.cloudProjectsBySlugs) {
          for (const proj of obj.result.data.cloudProjectsBySlugs) {
            if (proj.runs?.nodes) {
              proj.runs.nodes = []
            }
          }
        }

        return obj.result
      })

      cy.visitApp()
      cy.get('[href="#/runs"]').click()
      cy.findByText(defaultMessages.runs.connect.buttonProject).should('exist')
    })

    it('displays how to record prompt when connected and no runs', () => {
      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject('cypress.config.js', 'module.exports = {projectId: \'abcdef\'}')
      })

      cy.loginUser()
      cy.remoteGraphQLIntercept(async (obj) => {
        if (obj.result.data?.cloudProjectsBySlugs) {
          for (const proj of obj.result.data.cloudProjectsBySlugs) {
            if (proj.runs?.nodes) {
              proj.runs.nodes = []
            }
          }
        }

        return obj.result
      })

      cy.visitApp()
      cy.get('[href="#/runs"]').click()
      cy.contains(defaultMessages.runs.empty.title)
      cy.contains(defaultMessages.runs.empty.description)
      cy.contains('--record --key 2aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
    })

    it('displays a copy button', () => {
      cy.withCtx(async (ctx, o) => {
        await ctx.actions.file.writeFileInProject('cypress.config.js', 'module.exports = {projectId: \'abcdef\'}')
        o.sinon.stub(ctx.electronApi, 'copyTextToClipboard')
      })

      cy.loginUser()
      cy.remoteGraphQLIntercept(async (obj) => {
        if (obj.result.data?.cloudProjectsBySlugs) {
          for (const proj of obj.result.data.cloudProjectsBySlugs) {
            if (proj.runs?.nodes) {
              proj.runs.nodes = []
            }
          }
        }

        return obj.result
      })

      cy.visitApp()
      cy.get('[href="#/runs"]').click()
      cy.get('[data-cy="copy-button"]').click()
      cy.contains('Copied!')
      cy.withRetryableCtx((ctx) => {
        expect(ctx.electronApi.copyTextToClipboard as SinonStub).to.have.been.calledWith('cypress run --record --key 2aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
      })
    })
  })

  context('Runs - Runs List', () => {
    it('displays a list of recorded runs if a run has been recorded', () => {
      cy.loginUser()
      cy.visitApp()
      cy.get('[href="#/runs"]').click()
      cy.get('[data-cy="runs"]')
    })

    it('displays each run with correct information', () => {
      cy.loginUser()
      cy.visitApp()
      cy.get('[href="#/runs"]').click()

      cy.get('[href="http://dummy.cypress.io/runs/0"]').first().within(() => {
        cy.findByText('fix: make gql work CANCELLED')
        cy.get('[data-cy="run-card-icon"]')
      })

      cy.get('[href="http://dummy.cypress.io/runs/1"]').first().within(() => {
        cy.findByText('fix: make gql work ERRORED')
        cy.get('[data-cy="run-card-icon"]')
      })

      cy.get('[href="http://dummy.cypress.io/runs/2"]').first().within(() => {
        cy.findByText('fix: make gql work FAILED')
        cy.get('[data-cy="run-card-icon"]')
      })

      cy.get('[href="http://dummy.cypress.io/runs/0"]').first().as('firstRun')

      cy.get('@firstRun').get('[data-cy="run-card-author"]').contains('John Appleseed')
      cy.get('@firstRun').get('[data-cy="run-card-avatar')
      cy.get('@firstRun').get('[data-cy="run-card-branch"]').contains('main')

      // the exact timestamp string will depend on the user's browser's locale settings
      const localeTimeString = (new Date('2022-02-02T08:17:00.005Z')).toLocaleTimeString()

      cy.get('@firstRun').contains(localeTimeString)
      cy.get('@firstRun').contains('span', 'skipped')
      cy.get('@firstRun').get('span').contains('pending')
      cy.get('@firstRun').get('span').contains('passed')
      cy.get('@firstRun').get('span').contains('failed')
    })

    it('opens the run page if a run is clicked', () => {
      cy.loginUser()
      cy.visitApp()

      cy.withCtx((ctx, o) => {
        o.sinon.stub(ctx.actions.electron, 'openExternal')
      })

      cy.get('[href="#/runs"]').click()
      cy.get('[data-cy^="runCard-"]').first().click()

      cy.withCtx((ctx) => {
        expect(ctx.actions.electron.openExternal).to.have.been.calledWith('http://dummy.cypress.io/runs/0')
      })
    })
  })

  describe('no internet connection', () => {
    afterEach(() => {
      cy.goOnline()
    })

    it('shows alert warning if runs have been returned already', () => {
      cy.loginUser()
      cy.visitApp()
      cy.wait(1000)
      cy.get('[href="#/runs"]').click()
      cy.get('[data-cy="runs"]')

      cy.goOffline()

      cy.get('[data-cy=warning-alert]')
      .should('contain.text', 'You have no internet connection')
      .and('contain.text', 'Check your internet connection to pull the latest data from the dashboard')
    })

    it('should remove the alert warning if the app reconnects to the internet', () => {
      cy.loginUser()
      cy.visitApp()
      cy.wait(1000)
      cy.get('[href="#/runs"]').click()
      cy.get('[data-cy="runs"]')

      cy.goOffline()

      cy.get('[data-cy=warning-alert]')
      .should('contain.text', 'You have no internet connection')
      .and('contain.text', 'Check your internet connection to pull the latest data from the dashboard')

      cy.goOnline()

      cy.get('[data-cy=warning-alert]').should('not.exist')
    })
  })
})
