import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'
import type { SinonStub } from 'sinon'

describe('App: Runs', { viewportWidth: 1200 }, () => {
  beforeEach(() => {
    cy.scaffoldProject('component-tests')
    cy.openProject('component-tests')
    cy.startAppServer('component')
  })

  context('Runs - Connect Org', () => {
    it('opens create Org modal after clicking Connect Project button', () => {
      cy.scaffoldProject('component-tests')
      cy.openProject('component-tests', ['--config-file', 'cypressWithoutProjectId.config.js'])
      cy.startAppServer('component')

      cy.loginUser()

      // Simulate no orgs
      cy.remoteGraphQLIntercept(async (obj) => {
        if ((obj.operationName === 'CheckCloudOrganizations_cloudViewerChange_cloudViewer' || obj.operationName === 'Runs_cloudViewer' || obj.operationName === 'SpecsPageContainer_cloudViewer')) {
          if (obj.result.data?.cloudViewer?.organizations?.nodes) {
            obj.result.data.cloudViewer.organizations.nodes = []
          }
        }

        return obj.result
      })

      cy.visitApp()

      cy.findByTestId('sidebar-link-runs-page').click()

      cy.findByText(defaultMessages.runs.connect.buttonProject).click()
      cy.get('[aria-modal="true"]').should('exist')

      cy.findByText(defaultMessages.runs.connect.modal.createOrg.button).click()

      cy.withRetryableCtx((ctx) => {
        expect((ctx.actions.electron.openExternal as SinonStub).lastCall.lastArg).to.eq(`http://dummy.cypress.io/organizations/create?port=${process.env.CYPRESS_INTERNAL_GRAPHQL_PORT}`)
      })

      cy.contains('button', defaultMessages.runs.connect.modal.createOrg.waitingButton).should('be.visible')
      cy.contains('a', defaultMessages.links.needHelp).should('have.attr', 'href', 'https://on.cypress.io/adding-new-project')

      // Clear the current intercept to simulate a response with orgs
      cy.remoteGraphQLIntercept((obj) => {
        return obj.result
      })

      cy.withCtx(async (ctx) => {
        await ctx.util.fetch(`http://127.0.0.1:${ctx.gqlServerPort}/cloud-notification?operationName=orgCreated`)
      })

      cy.findByText(defaultMessages.runs.connect.modal.selectProject.manageOrgs)
    })
  })
})
