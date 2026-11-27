import type { SinonStub } from 'sinon'

describe('CreateCloudOrgModalSubscription', { viewportWidth: 1200 }, () => {
  beforeEach(() => {
    cy.scaffoldProject('component-tests')
    cy.openProject('component-tests', ['--component'])
    cy.startAppServer('component')
  })

  context('Runs - Connect Org', () => {
    it('opens create Org modal after clicking Connect Project button', () => {
      cy.scaffoldProject('component-tests')
      cy.openProject('component-tests', ['--config-file', 'cypressWithoutProjectId.config.js', '--component'])
      cy.startAppServer('component')

      cy.loginUser()

      // Simulate no orgs
      cy.remoteGraphQLIntercept(async (obj) => {
        if (obj.result.data?.cloudViewer?.organizations?.nodes) {
          obj.result.data.cloudViewer.organizations.nodes = []
        }

        if (obj.result.data?.cloudViewer?.firstOrganization?.nodes) {
          obj.result.data.cloudViewer.firstOrganization.nodes = []
        }

        return obj.result
      })

      cy.visitApp()
      cy.specsPageIsVisible()

      cy.findByTestId('sidebar-link-runs-page').click()

      cy.findByText('Connect a Cypress Cloud project').click()
      cy.get('[aria-modal="true"]').should('exist')

      cy.findByText('Create organization').click()

      cy.withRetryableCtx((ctx) => {
        expect((ctx.actions.electron.openExternal as SinonStub).lastCall.lastArg).to.eq(`http://dummy.cypress.io/organizations/create?port=${process.env.CYPRESS_INTERNAL_GRAPHQL_PORT}`)
      })

      cy.contains('button', 'Waiting for you to create an organization...').should('be.visible')
      cy.contains('a', 'Need help').should('have.attr', 'href', 'https://on.cypress.io/adding-new-project')

      // Clear the current intercept to simulate a response with orgs
      cy.remoteGraphQLIntercept((obj) => {
        return obj.result
      })

      cy.withCtx(async (ctx) => {
        await ctx.util.fetch(`http://127.0.0.1:${ctx.coreData.servers.gqlServerPort}/cloud-notification?operationName=orgCreated`)
      })

      cy.findByText('Manage organizations')
    })
  })
})
