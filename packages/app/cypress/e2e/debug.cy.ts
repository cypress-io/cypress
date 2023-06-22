import type { OpenFileInIdeQuery } from '../../src/generated/graphql-test'
import RelevantRunsDataSource_RunsByCommitShas from '../fixtures/gql-RelevantRunsDataSource_RunsByCommitShas.json'
import DebugDataPassing from '../fixtures/debug-Passing/gql-Debug.json'
import DebugDataFailing from '../fixtures/debug-Failing/gql-Debug.json'

Cypress.on('window:before:load', (win) => {
  win.__CYPRESS_GQL_NO_SOCKET__ = 'true'
})

// These mocks all the responses so we can get deterministic
// results to test the debug page.
// The JSON fixtures were generated by using a real app and capturing
// the responses.
describe('App - Debug Page', () => {
  beforeEach(() => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')
    cy.startAppServer('component')

    cy.loginUser()
    cy.withCtx((ctx, o) => {
      ctx.git?.__setGitHashesForTesting(['commit1', 'commit2'])
      o.sinon.stub(ctx.lifecycleManager.git!, 'currentBranch').value('fakeBranch')
    })
  })

  it('all tests passed', () => {
    cy.remoteGraphQLIntercept((obj, _testState, options) => {
      if (obj.operationName === 'RelevantRunsDataSource_RunsByCommitShas') {
        obj.result.data = options.RelevantRunsDataSource_RunsByCommitShas.data
      }

      if (obj.operationName === 'Debug_currentProject_cloudProject_cloudProjectBySlug') {
        if (obj.result.data) {
          obj.result.data.cloudProjectBySlug.runByNumber = options.DebugDataPassing.data.currentProject.cloudProject.runByNumber
        }
      }

      return obj.result
    }, { RelevantRunsDataSource_RunsByCommitShas, DebugDataPassing })

    cy.visitApp()

    cy.findByTestId('sidebar-link-debug-page').click()
    cy.findByTestId('debug-container').should('be.visible')

    cy.findByTestId('header-top').contains('update projectId')
    cy.findByTestId('debug-header-dashboard-link')
    .contains('View in Cypress Cloud')
    .should('have.attr', 'href', 'https://cloud.cypress.io/projects/7p5uce/runs/2?utm_medium=Debug+Tab&utm_campaign=View+in+Cypress+Cloud&utm_source=Binary%3A+App')

    cy.findByTestId('debug-runNumber-PASSED').contains('#2')
    cy.findByTestId('debug-commitsAhead').contains('You are 1 commit ahead')

    cy.findByTestId('metadata').within(() => {
      cy.get('[title="passed"]').contains('2')
      cy.get('[title="failed"]').contains('0')
      cy.get('[title="skipped"]').contains('0')
      cy.get('[title="pending"]').contains('2')
      cy.findByTestId('debug-header-branch').contains('main')
      cy.findByTestId('debug-header-commitHash').contains('e9d176f')
      cy.findByTestId('debug-header-author').contains('Lachlan Miller')
      cy.findByTestId('debug-header-createdAt').contains('02h 00m 10s')
    })

    cy.findByTestId('debug-passed').contains('Well Done!')
    cy.findByTestId('debug-passed').contains('All your tests passed.')
    cy.findByLabelText('Relevant run passed').should('be.visible').contains('0')
    cy.findByTestId('run-failures').should('not.exist')

    cy.get('[data-cy="debug-badge"]').should('be.visible').contains('0')
  })

  it('shows information about a failed spec', () => {
    cy.remoteGraphQLIntercept((obj, _testState, options) => {
      if (obj.operationName === 'RelevantRunsDataSource_RunsByCommitShas') {
        obj.result.data = options.RelevantRunsDataSource_RunsByCommitShas.data
      }

      if (obj.operationName === 'Debug_currentProject_cloudProject_cloudProjectBySlug') {
        if (obj.result.data) {
          obj.result.data.cloudProjectBySlug.runByNumber = options.DebugDataFailing.data.currentProject.cloudProject.runByNumber
        }
      }

      return obj.result
    }, { RelevantRunsDataSource_RunsByCommitShas, DebugDataFailing })

    cy.intercept('query-OpenFileInIDE', (req) => {
      req.on('response', (res) => {
        const gqlData = res.body.data as OpenFileInIdeQuery

        gqlData.localSettings.preferences.preferredEditorBinary = 'code'
      })
    })

    cy.intercept('mutation-OpenFileInIDE_Mutation').as('openFileInIDE')

    cy.withCtx((ctx, { sinon }) => {
      sinon.stub(ctx.actions.file, 'openFile')
    })

    cy.visitApp()

    cy.findByTestId('sidebar-link-debug-page').click()
    cy.findByTestId('debug-container').should('be.visible')

    cy.findByTestId('header-top').contains('chore: testing cypress')
    cy.findByTestId('debug-header-dashboard-link')
    .contains('View in Cypress Cloud')
    .should('have.attr', 'href', 'https://cloud.cypress.io/projects/vgqrwp/runs/136?utm_medium=Debug+Tab&utm_campaign=View+in+Cypress+Cloud&utm_source=Binary%3A+App')

    cy.findByLabelText('Relevant run had 1 test failure').should('be.visible').contains('1')

    cy.findByTestId('debug-runNumber-FAILED').contains('#136')
    cy.findByTestId('debug-commitsAhead').contains('You are 1 commit ahead')

    cy.findByTestId('metadata').within(() => {
      cy.get('[title="passed"]').contains('1')
      cy.get('[title="failed"]').contains('1')
      cy.get('[title="skipped"]').contains('0')
      cy.get('[title="pending"]').contains('0')
      cy.findByTestId('debug-header-branch').contains('main')
      cy.findByTestId('debug-header-commitHash').contains('commit1')
      cy.findByTestId('debug-header-author').contains('Lachlan Miller')
      cy.findByTestId('debug-header-createdAt').contains('00m 19s')
    })

    cy.findByTestId('spec-contents').within(() => {
      cy.contains('src/NewComponent.spec.jsx')
      cy.findByTestId('metaData-Results-spec-duration').contains('00:04')
      cy.findByTestId('metaData-Results-operating-system').contains('Linux Ubuntu')
      cy.findByTestId('metaData-Results-browser').contains('Electron 106')
      cy.findByTestId('metaData-Results-testing-type').contains('Component')
    })

    cy.findByTestId('test-row').contains('InfoPanel')
    cy.findByTestId('test-row').contains('renders')
    cy.findByTestId('run-failures').should('exist').should('have.attr', 'href', '#/specs/runner?file=src/NewComponent.spec.jsx&mode=debug')

    cy.findByLabelText('Open in IDE').click()
    cy.wait('@openFileInIDE')
    cy.withCtx((ctx) => {
      expect(ctx.actions.file.openFile).to.have.been.calledWith('src/NewComponent.spec.jsx', 1, 1)
    })
  })

  it('shows running and updating build', () => {
    cy.remoteGraphQLIntercept((obj, _testState, options) => {
      if (obj.operationName === 'RelevantRunsDataSource_RunsByCommitShas') {
        obj.result.data = options.RelevantRunsDataSource_RunsByCommitShas.data
      }

      const originalRun = options.DebugDataFailing.data.currentProject.cloudProject.runByNumber

      if (options.testRun === undefined) {
        options.testRun = JSON.parse(JSON.stringify(originalRun))
      }

      const run = options.testRun

      run.totalInstanceCount = 5
      if (run.completedInstanceCount === undefined) {
        run.completedInstanceCount = 0
        run.createdAt = (new Date()).toISOString()
      }

      if (run.totalInstanceCount === run.completedInstanceCount) {
        run.status = 'FAILED'
      } else {
        run.status = 'RUNNING'
      }

      if (run.completedInstanceCount < 3) {
        run.testsForReview = []
      } else {
        run.testsForReview = originalRun.testsForReview
      }

      run.totalFailed = run.testsForReview.length
      run.totalPassed = run.completedInstanceCount - run.totalFailed

      if (obj.operationName === 'Debug_currentProject_cloudProject_cloudProjectBySlug') {
        if (obj.result.data) {
          obj.result.data.cloudProjectBySlug.runByNumber = run
        }
      }

      if (obj.operationName === 'RelevantRunSpecsDataSource_Specs' && obj.result.data) {
        //NOTE Figure out how to manually trigger polling instead of adjusting polling intervals
        obj.result.data.pollingIntervals = {
          __typename: 'CloudPollingIntervals',
          runByNumber: 1, //Increase polling interval for debugging test
        }

        if (run.totalInstanceCount === run.completedInstanceCount) {
          obj.result.data.pollingIntervals.runByNumber = 100
        } else {
          run.completedInstanceCount = run.completedInstanceCount !== undefined ? ++run.completedInstanceCount : 0
        }

        obj.result.data.cloudNodesByIds = [
          run,
        ]
      }

      return obj.result
    }, { RelevantRunsDataSource_RunsByCommitShas, DebugDataFailing })

    cy.visitApp()

    cy.findByTestId('sidebar-link-debug-page').click()
    cy.findByTestId('debug-container').should('be.visible')

    cy.findByTestId('header-top').contains('chore: testing cypress')

    cy.findByTestId('debug-testing-progress').as('progress')

    cy.get('@progress').contains('Testing in progress...')
    cy.get('[data-cy="debug-badge"]').contains('0').should('be.visible')
    cy.get('@progress').contains('1 of 5 specs completed')
    cy.get('@progress').contains('2 of 5 specs completed')
    cy.get('@progress').contains('3 of 5 specs completed')
    cy.get('[data-cy="debug-badge"]').contains('1').should('be.visible')

    cy.findByTestId('spec-contents').within(() => {
      cy.contains('src/NewComponent.spec.jsx')
    })
  })
})
