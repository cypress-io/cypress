import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'
import { createCloudOrganization } from '../../../../frontend-shared/cypress/support/mock-graphql/stubgql-CloudTypes'

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
      cy.visitApp()

      // TODO: Update with query count to change the returned value after the
      // subscription is called
      cy.remoteGraphQLIntercept(async (obj) => {
        if (obj.result.data?.cloudViewer?.organizations?.nodes) {
          obj.result.data.cloudViewer.organizations.nodes = []
        } else if (obj.result.data?.cloudViewer?.organizations && !obj.result.data?.cloudViewer?.organizations?.nodes.length) {
          obj.result.data.cloudViewer.organizations = {
            __typename: 'CloudOrganizationConnection',
            nodes: [createCloudOrganization({})],
            edges: [{
              __typename: 'CloudOrganizationEdge',
              cursor: 'cursor',
              node: createCloudOrganization({}),
            }],
            pageInfo: {
              __typename: 'PageInfo',
              hasNextPage: false,
              hasPreviousPage: false,
            },
          }
        }

        return obj.result
      })

      cy.get('[href="#/runs"]').click()

      cy.findByText(defaultMessages.runs.connect.buttonProject).click()
      cy.get('[aria-modal="true"]').should('exist')

      cy.findByText(defaultMessages.runs.connect.modal.createOrg.button).click()
      cy.contains('button', defaultMessages.runs.connect.modal.createOrg.waitingButton).should('be.visible')
      cy.contains('a', defaultMessages.links.needHelp).should('have.attr', 'href', 'https://on.cypress.io/adding-new-project')

      cy.withCtx(async (ctx) => {
        await ctx.util.fetch(`http://127.0.0.1:${ctx.gqlServerPort}/cloud-notification?operationName=orgCreated`)
      })

      cy.pause()
    })
  })
})
