import type { Interception } from '@packages/net-stubbing/lib/external-types'

describe('App: Runs', () => {
  beforeEach(() => {
    cy.scaffoldProject('component-tests')
    cy.openProject('component-tests')
    cy.startAppServer()
  })

  context('Runs Page', () => {
    it('resolves the runs page', () => {
      cy.loginUser()
      cy.visitApp()
      cy.wait(1000)
      cy.get('[href="#/runs"]').click()
      cy.get('[data-cy="runs"]')
      cy.get('[data-testid="header-bar"]').findByText('Runs').should('be.visible')
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
      cy.contains('Log In').should('exist')
    })

    it('clicking the login button will open the login modal', () => {
      cy.visitApp()
      cy.get('[href="#/runs"]').click()
      cy.contains('Log In').click()
      cy.get('h2').contains('Log In To Cypress')
      cy.get('button').contains('Log In')
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
        if (ctx.currentProject) {
          ctx.currentProject.configChildProcess?.process.kill()
          ctx.currentProject.config = null
          ctx.currentProject.configChildProcess = null
        }

        await ctx.actions.file.writeFileInProject('cypress.config.js', 'module.exports = {}')
      })

      cy.loginUser()
      cy.visitApp()

      cy.get('[href="#/runs"]').click()
      cy.contains('Connect your project').should('exist')
    })

    // TODO: does not open modal
    it.skip('opens Connect Project modal after clicking Connect Project button', () => {
      cy.withCtx(async (ctx) => {
        if (ctx.currentProject) {
          ctx.currentProject.configChildProcess?.process.kill()
          ctx.currentProject.config = null
          ctx.currentProject.configChildProcess = null
        }

        await ctx.actions.file.writeFileInProject('cypress.config.js', 'module.exports = {}')
      })

      cy.loginUser()
      cy.visitApp()

      cy.get('[href="#/runs"]').click()
      cy.findByText('Connect your project to the Cypress Dashboard').click()
    })
  })

  context('Runs - Cannot Find Project', () => {
    // TODO: still generates run list regardless of projectID
    it.skip('if project Id is specified in config file that does not exist, shows call to action', () => {
      cy.withCtx(async (ctx) => {
        if (ctx.currentProject) {
          ctx.currentProject.configChildProcess?.process.kill()
          ctx.currentProject.config = null
          ctx.currentProject.configChildProcess = null
        }

        await ctx.actions.file.writeFileInProject('cypress.config.js', 'module.exports = {\'projectId\': \'abcdef\'}')
      })

      cy.loginUser()
      cy.visitApp()

      cy.get('[href="#/runs"]').click()
      cy.contains('Reconnect project').should('exist')
    })

    // TODO: does not open modal
    it.skip('opens Connect Project modal after clicking Reconnect Project button', () => {
      cy.withCtx(async (ctx) => {
        if (ctx.currentProject) {
          ctx.currentProject.configChildProcess?.process.kill()
          ctx.currentProject.config = null
          ctx.currentProject.configChildProcess = null
        }

        await ctx.actions.file.writeFileInProject('cypress.config.js', 'module.exports = {\'projectId\': \'abcdef\'}')
      })

      cy.loginUser()
      cy.visitApp()

      cy.get('[href="#/runs"]').click()
      cy.findByText('Connect your project to the Cypress Dashboard').click()
    })
  })

  context('Runs - No Runs', () => {
    it('when no runs, shows call to action', () => {
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
      cy.get('[data-cy="no-runs"]')
    })

    it('displays the projectId as it is in their config file', () => {
      cy.withCtx(async (ctx) => {
        if (ctx.currentProject) {
          ctx.currentProject.configChildProcess?.process.kill()
          ctx.currentProject.config = null
          ctx.currentProject.configChildProcess = null
        }

        await ctx.actions.file.writeFileInProject('cypress.config.js', 'module.exports = {\'projectId\': \'abcdef\'}')
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
      cy.contains('projectId: \'abcdef\'')
    })

    it('displays correct source control instructions', () => {
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
      cy.contains('Ensure that your cypress.config.js file is checked into source control:')
      cy.get('[data-cy="copy-button"]').first().click()
      cy.contains('Copied!')
    })

    it('displays correct instructions on how to record a run', () => {
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
      cy.contains('Run this command in your local development terminal or in CI:')
      cy.contains('--record --key 2aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
      cy.get('[data-cy="copy-button"]').last().click()
      cy.contains('Copied!')
    })
  })

  context('Runs - Runs List', () => {
    it('if a run has been recorded, a list of recorded runs is displayed', () => {
      cy.loginUser()
      cy.visitApp()
      cy.get('[href="#/runs"]').click()
      cy.get('[data-cy="runs"]')
    })

    it('displays each run with correct information', () => {
      cy.loginUser()
      cy.visitApp()
      cy.get('[href="#/runs"]').click()
      cy.get('[href="http://dummy.cypress.io/runs/0"]').first().findByText('fix: make gql work CANCELLED')
      cy.get('[href="http://dummy.cypress.io/runs/0"]').first().get('[data-cy="run-card-icon"]').get('path').get('[stroke="#BFC2D4"]')

      cy.get('[href="http://dummy.cypress.io/runs/1"]').first().findByText('fix: make gql work ERRORED')
      cy.get('[href="http://dummy.cypress.io/runs/1"]').first().get('[data-cy="run-card-icon"]').get('path').get('[fill="#DB7903"]')

      cy.get('[href="http://dummy.cypress.io/runs/2"]').first().findByText('fix: make gql work FAILED')
      cy.get('[href="http://dummy.cypress.io/runs/2"]').first().get('[data-cy="run-card-icon"]').get('path').get('[fill="#E45770"]')

      cy.get('[href="http://dummy.cypress.io/runs/0"]').first().get('[data-cy="run-card-author"]').contains('John Appleseed')
      cy.get('[href="http://dummy.cypress.io/runs/0"]').first().get('[data-cy="run-card-avatar')
      cy.get('[href="http://dummy.cypress.io/runs/0"]').first().get('[data-cy="run-card-branch"]').contains('main')
      cy.get('[href="http://dummy.cypress.io/runs/0"]').first().contains(`${new Date().getHours()}:${new Date().getMinutes()}`)
      cy.get('[href="http://dummy.cypress.io/runs/0"]').first().get('span').contains('skipped')
      cy.get('[href="http://dummy.cypress.io/runs/0"]').first().get('span').contains('pending')
      cy.get('[href="http://dummy.cypress.io/runs/0"]').first().get('span').contains('passed')
      cy.get('[href="http://dummy.cypress.io/runs/0"]').first().get('span').contains('failed')
    })

    it('opens the run page if a run is clicked', () => {
      cy.loginUser()
      cy.visitApp()
      cy.get('[href="#/runs"]').click()
      cy.intercept('mutation-ExternalLink_OpenExternal').as('OpenExternal')
      cy.get('[data-cy="external"]').first().click()
      cy.wait('@OpenExternal').then((interception: Interception) => {
        expect(interception.request.url).to.include('graphql/mutation-ExternalLink_OpenExternal')
      })
    })
  })
})
