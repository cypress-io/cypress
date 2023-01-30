import RelevantRunsDataSource_RunsByCommitShas from '../fixtures/gql-RelevantRunsDataSource_RunsByCommitShas.json'
import Debug from '../fixtures/gql-Debug.json'
import CloudViewerAndProject_RequiredData from '../fixtures/gql-CloudViewerAndProject_RequiredData.json'
import MainApp from '../fixtures/gql-MainAppQuery.json'
import SideBarNavigationContainer from '../fixtures/gql-SideBarNavigationContainer.json'
import HeaderBar from '../fixtures/gql-HeaderBar_HeaderBarQuery.json'
import SpecsPageContainer from '../fixtures/gql-SpecsPageContainer.json'
import SetTestsForDebug from '../fixtures/gql-Mutation-SetTestsForDebug.json'

Cypress.on('window:before:load', (win) => {
  win.__CYPRESS_GQL_NO_SOCKET__ = 'true'
})

describe('App - Debug Page', () => {
  it('works', () => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')
    cy.startAppServer('component')

    cy.loginUser()
    cy.withCtx((ctx) => {
      ctx.git?.__setGitHashesForTesting(['commit1', 'commit2'])
    })

    cy.remoteGraphQLIntercept((obj, testState, options) => {
      if (obj.operationName === 'RelevantRunsDataSource_RunsByCommitShas') {
        obj.result.data = options.RelevantRunsDataSource_RunsByCommitShas
      }

      return obj.result
    }, { RelevantRunsDataSource_RunsByCommitShas })

    cy.visitApp()

    cy.intercept('POST', '/__cypress/graphql/query-Debug', (req) => {
      req.reply(
        Debug,
      )
    })

    cy.intercept('POST', '/__cypress/graphql/query-CloudViewerAndProject_RequiredData', (req) => {
      req.reply(
        CloudViewerAndProject_RequiredData,
      )
    })

    cy.intercept('POST', '/__cypress/graphql/query-MainAppQuery', (req) => {
      req.reply(
        MainApp,
      )
    })

    cy.intercept('POST', '/__cypress/graphql/query-SideBarNavigationContainer', (req) => {
      req.reply(SideBarNavigationContainer)
    })

    cy.intercept('POST', '/__cypress/graphql/query-HeaderBar_HeaderBarQuery', (req) => {
      req.reply(HeaderBar)
    })

    cy.intercept('POST', '/__cypress/graphql/query-HeaderBar_HeaderBarQuery', (req) => {
      req.reply(HeaderBar)
    })

    cy.intercept('POST', '/__cypress/graphql/query-SpecsPageContainer', (req) => {
      req.reply(SpecsPageContainer)
    })

    cy.intercept('POST', '/__cypress/graphql/query-RunAllSpecsData', (req) => {
      req.reply(SpecsPageContainer)
    })

    cy.intercept('POST', '/__cypress/graphql/mutation-SetTestsForDebug', (req) => {
      req.reply(SetTestsForDebug)
    })

    cy.findByTestId('sidebar-link-debug-page').click()
    cy.findByTestId('debug-container').should('be.visible')

    cy.findByTestId('header-top').contains('chore: testing cypress')
    cy.findByTestId('debug-header-dashboard-link')
    .contains('View in Cypress Cloud')
    .should('have.attr', 'href', Debug.data.currentProject.cloudProject.runByNumber.url)

    cy.findByTestId('debug-runNumber-FAILED').contains('#136')
    cy.findByTestId('debug-commitsAhead').contains('You are 1 commit ahead')

    cy.findByTestId('metadata').within(() => {
      cy.get('[title="passed"]').contains('1')
      cy.get('[title="failed"]').contains('1')
      cy.get('[title="skipped"]').contains('0')
      cy.get('[title="pending"]').contains('0')
      cy.findByTestId('debug-header-branch').contains('main')
      cy.findByTestId('debug-header-commitHash').contains('6895fdc')
      cy.findByTestId('debug-header-author').contains('Lachlan Miller')
      cy.findByTestId('debug-header-createdAt').contains('00:19')
    })

    cy.findByTestId('spec-contents').within(() => {
      cy.contains('src/components/InfoPanel/InfoPanel.cy.ts')
      cy.findByTestId('metaData-Results-spec-duration').contains('00:04')
      cy.findByTestId('metaData-Results-operating-system').contains('Linux Ubuntu')
      cy.findByTestId('metaData-Results-browser').contains('Electron 106')
      cy.findByTestId('metaData-Results-testing-type').contains('Component')
    })

    cy.findByTestId('test-row').contains('InfoPanel')
    cy.findByTestId('test-row').contains('renders')
  })
})
