import type { Interception } from '@packages/net-stubbing/lib/external-types'
import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'

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
      cy.intercept('mutation-ExternalLink_OpenExternal', { 'data': { 'openExternal': true } }).as('OpenExternal')

      cy.get('[href="#/runs"]').click()
      cy.contains('a', 'OVERLIMIT').click()
      cy.wait('@OpenExternal')
      .its('request.body.variables.url')
      .should('equal', 'http://dummy.cypress.io/runs/4')
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
      cy.remoteGraphQLIntercept(async (obj) => {
        // Currently, all remote requests go through here, we want to use this to modify the
        // remote request before it's used and avoid touching the login query

        if (obj.result.data?.cloudProjectsBySlugs) {
          for (const proj of obj.result.data.cloudProjectsBySlugs) {
            proj.__typename = 'CloudProjectUnauthorized'
            proj.message = 'Cloud Project Unauthorized'
            proj.hasRequestedAccess = false
          }
        }

        return obj.result
      })

      cy.visitApp()

      cy.get('[href="#/runs"]').click()
    })

    it('if project Id is specified in config file that is not accessible, shows call to action', () => {
      cy.findByText(defaultMessages.runs.errors.unauthorized.button).should('be.visible')
    })

    it('clicking on the call to action should call the mutation', () => {
      cy.intercept('mutation-RunsErrorRenderer_RequestAccess').as('RequestAccess')
      cy.findByText(defaultMessages.runs.errors.unauthorized.button).click()
      cy.wait('@RequestAccess').then((interception: Interception) => {
        expect(interception.request.url).to.include('graphql/mutation-RunsErrorRenderer_RequestAccess')
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

    it('displays a copy button', { browser: 'electron' }, () => {
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
      cy.get('[data-cy="copy-button"]').click()
      cy.contains('Copied!')
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
      cy.get('@firstRun').contains(`3:17`)
      cy.get('@firstRun').contains('span', 'skipped')
      cy.get('@firstRun').get('span').contains('pending')
      cy.get('@firstRun').get('span').contains('passed')
      cy.get('@firstRun').get('span').contains('failed')
    })

    it('opens the run page if a run is clicked', () => {
      cy.loginUser()
      cy.visitApp()
      cy.get('[href="#/runs"]').click()
      cy.intercept('mutation-ExternalLink_OpenExternal', { 'data': { 'openExternal': true } }).as('OpenExternal')
      cy.get('[data-cy^="runCard-"]').first().click()
      cy.wait('@OpenExternal').then((interception: Interception) => {
        expect(interception.request.url).to.include('graphql/mutation-ExternalLink_OpenExternal')
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
