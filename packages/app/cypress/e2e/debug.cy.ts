import RelevantRunsDataSource_RunsByCommitShas from '../fixtures/gql-RelevantRunsDataSource_RunsByCommitShas.json'
import Debug from '../fixtures/gql-Debug.json'

describe('App - Debug Page', () => {
  it('works', () => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')
    cy.startAppServer('component')

    cy.loginUser()
    cy.withCtx((ctx) => {
      ctx.git?.__setGitHashesForTesting(
        ['commit1', 'commit2'],
      )

      ctx.git
    })

    cy.remoteGraphQLIntercept((obj, testState, options) => {
      if (obj.operationName === 'RelevantRunsDataSource_RunsByCommitShas') {
        obj.result.data = options.RelevantRunsDataSource_RunsByCommitShas
      }

      return obj.result
    }, { RelevantRunsDataSource_RunsByCommitShas })

    cy.visitApp()

    cy.intercept('POST', '/__cypress/graphql/query-Debug', (req) => {
      req.reply({
        data: Debug,
      })
    })

    cy.findByTestId('sidebar-link-debug-page').click()
    cy.findByTestId('debug-container').should('be.visible')

    cy.findByTestId('header-top').contains('wip - cypress testing')
    cy.findByTestId('debug-header-dashboard-link')
    .contains('View in Cypress Cloud')
    .should('have.attr', 'href', Debug.currentProject.cloudProject.runByNumber.url)

    cy.findByTestId('debug-runNumber-FAILED').contains('#130')
    cy.findByTestId('debug-commitsAhead').contains('You are 1 commit ahead')

    cy.findByTestId('metadata').within(() => {
      cy.get('[title="passed"]').contains('1')
      cy.get('[title="failed"]').contains('1')
      cy.get('[title="skipped"]').contains('0')
      cy.get('[title="pending"]').contains('0')
      cy.findByTestId('debug-header-branch').contains('main')
      cy.findByTestId('debug-header-commitHash').contains('commit1')
      cy.findByTestId('debug-header-author').contains('Lachlan Miller')
      cy.findByTestId('debug-header-createdAt').contains('00:33')
    })

    cy.findByTestId('spec-contents').within(() => {
      cy.contains('src/components/InfoPanel/InfoPanel.cy.ts')
      cy.findByTestId('metaData-Results-spec-duration').contains('00:04')
      cy.findByTestId('metaData-Results-operating-system').contains('Linux Ubuntu')
      cy.findByTestId('metaData-Results-browser').contains('Electron 106')
      cy.findByTestId('metaData-Results-testing-type').contains('Component')
    })

    // describe('InfoPanel', () => {
    //   it('renders', () => { ... })
    // })
    cy.findByTestId('test-row').contains('InfoPanel')
    cy.findByTestId('test-row').contains('renders')
  })
})
