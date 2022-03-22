import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'

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
      cy.__incorrectlyVisitAppWithIntercept()

      cy.intercept('mutation-ExternalLink_OpenExternal').as('OpenExternal')

      cy.remoteGraphQLIntercept(async (obj) => {
        if ((obj.operationName === 'CheckCloudOrganizations_cloudViewerChange_cloudViewer' || obj.operationName === 'Runs_cloudViewer') && obj.callCount < 2) {
          if (obj.result.data?.cloudViewer?.organizations?.nodes) {
            obj.result.data.cloudViewer.organizations.nodes = []
          }
        }

        return obj.result
      })

      cy.get('[href="#/runs"]').click()

      cy.findByText(defaultMessages.runs.connect.buttonProject).click()
      cy.get('[aria-modal="true"]').should('exist')

      cy.findByText(defaultMessages.runs.connect.modal.createOrg.button).click()

      cy.wait('@OpenExternal')
      .its('request.body.variables.includeGraphqlPort')
      .should('equal', true)

      cy.contains('button', defaultMessages.runs.connect.modal.createOrg.waitingButton).should('be.visible')
      cy.contains('a', defaultMessages.links.needHelp).should('have.attr', 'href', 'https://on.cypress.io/adding-new-project')

      cy.withCtx(async (ctx) => {
        await ctx.util.fetch(`http://127.0.0.1:${ctx.gqlServerPort}/cloud-notification?operationName=orgCreated`)
      })

      cy.findByText(defaultMessages.runs.connect.modal.selectProject.manageOrgs)
    })
  })
})
