import gqlDebug from '../fixtures/query-Debug.json'

Cypress.on('window:before:load', (win) => {
  win.__CYPRESS_GQL_NO_SOCKET__ = 'true'
})

describe('App: Debug', { viewportWidth: 1200 }, () => {
  it('resolves the debug page', () => {
    // TODO: For some reason if we constantly intercept and reply with the same mock,
    // it endlessly re-fetches.
    // I'm using a flag to prevent that from happening.
    let intercepted = false

    cy.intercept('POST', '/__cypress/graphql/query-Debug', (req) => {
      if (intercepted) {
        req.continue()
      } else {
        intercepted = true
        req.reply({
          data: gqlDebug
        })
      }
    })

    cy.remoteGraphQLIntercept(async (obj) => {
      // Mock the request to Cypress Cloud for failed runs
      if (obj.operationName === 'RelevantRunsDataSource_RunsByCommitShas') {
        if (obj.result?.data?.cloudProjectBySlug) {
          obj.result.data.cloudProjectBySlug.runsByCommitShas = [
            {
              id: 'Q2xvdWRSdW46a0wzRVBlNTBHdw==',
              runNumber: 129,
              status: 'FAILED',
              commitInfo: {
                sha: '7f70914881637df321edbeb398cdfd5e54de74ef',
                __typename: 'CloudRunCommitInfo',
              },
              __typename: 'CloudRun',
            },
          ]
        }
      }

      return obj.result
    })

    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')
    cy.startAppServer('component')
    cy.withCtx((ctx) => {
      ctx.git!.__testSetGitHashes(['7f70914881637df321edbeb398cdfd5e54de74ef'])
    })

    cy.loginUser()
    cy.visitApp()

    // Move to debug page
    cy.findByTestId('sidebar-link-debug-page').click()
    cy.findByTestId('debug-container').should('be.visible')

    cy.findByTestId("header-top").contains('chore: add failing test')
    cy.findByTestId("debug-header-dashboard-link").should('have.attr', 'href', gqlDebug.currentProject.cloudProject.runByNumber.url)
  })
})
