import DebugRunDetailedView from './DebugRunDetailedView.vue'
import { DebugRunDetailedViewFragmentDoc } from '../generated/graphql-test'
import { createCloudRun, createCloudRunCommitInfo } from '@packages/graphql/test/stubCloudTypes'
import type { CloudRunStatus } from '@packages/graphql/src/gen/test-cloud-graphql-types.gen'

const DebugSpecVariableTypes = {
  hasNextRun: 'Boolean',
  runNumber: 'Int',
  nextRunNumber: 'Int',
  commitShas: '[String!]!',
}

function createRun (data: { 
  runNumber: number, 
  status: CloudRunStatus, 
  sha: string,
  summary: string, 
  completedInstanceCount?: number, 
  totalInstanceCount?: number 
}) {
  return {
    ...createCloudRun({
      completedInstanceCount: data.completedInstanceCount ?? 10,
      totalInstanceCount: data.totalInstanceCount ?? 10,
    }),
    runNumber: data.runNumber,
    status: data.status,
    commitInfo: {
      ...createCloudRunCommitInfo({}),
      sha: data.sha,
      summary: data.summary,
    },
  }
}

describe('<DebugRunDetailedView />', () => {
  it('only one run on current commit which is RUNNING', () => {
    cy.mountFragment(DebugRunDetailedViewFragmentDoc, {
      variableTypes: DebugSpecVariableTypes,
      variables: {
        hasNextRun: false,
        runNumber: 1,
        nextRunNumber: -1,
        commitShas: ['sha-123', 'sha-456'],
      },
      onResult (result) {
        const latest = createRun({ runNumber: 2, status: 'RUNNING', sha: 'sha-123', summary: 'Update code', })

        if (
          result.currentProject?.cloudProject!.__typename === 'CloudProject'
        ) {
          result.currentProject.cloudProject.next = latest
          result.currentProject.cloudProject.current = latest
          result.currentProject.cloudProject.all = [
            latest,
            createRun({ runNumber: 1, status: 'PASSED', sha: 'sha-456', summary: 'Fixing tests', }),
          ]
        }
      },
      render (gqlData) {
        return (
          <div style="margin: 10px">
            <DebugRunDetailedView gql={gqlData} />
          </div>
        )
      },
    })

    cy.findByTestId('debug-historical-runs').should('not.exist')
  })

  it('groups by commits when latest is RUNNING', () => {
    cy.mountFragment(DebugRunDetailedViewFragmentDoc, {
      variableTypes: DebugSpecVariableTypes,
      variables: {
        hasNextRun: false,
        runNumber: 1,
        nextRunNumber: -1,
        commitShas: ['sha-123', 'sha-456'],
      },
      onResult (result) {
        const latest = createRun({ runNumber: 3, status: 'RUNNING', sha: 'sha-123', summary: 'Update code', })

        if (
          result.currentProject?.cloudProject!.__typename === 'CloudProject'
        ) {
          result.currentProject.cloudProject.next = latest
          result.currentProject.cloudProject.current = latest
          result.currentProject.cloudProject.all = [
            latest,
            createRun({ runNumber: 2, status: 'PASSED', sha: 'sha-123', summary: 'Update code', }),
            createRun({ runNumber: 1, status: 'PASSED', sha: 'sha-456', summary: 'Fixing tests', }),
          ]
        }
      },
      render (gqlData) {
        return (
          <div style="margin: 10px">
            <DebugRunDetailedView gql={gqlData} />
          </div>
        )
      },
    })

    cy.findByTestId('commit-sha-123').should('exist')
    cy.findByTestId('commit-sha-456').should('exist')
  })

  it('latest commit only has one run that is RUNNNING', () => {
    cy.mountFragment(DebugRunDetailedViewFragmentDoc, {
      variableTypes: DebugSpecVariableTypes,
      variables: {
        hasNextRun: false,
        runNumber: 1,
        nextRunNumber: -1,
        commitShas: ['sha-123', 'sha-456'],
      },
      onResult (result) {
        const latest = createRun({ 
          runNumber: 3, 
          status: 'RUNNING', 
          sha: 'sha-123', 
          summary: 'Try to add new feature', 
          completedInstanceCount: 5,
          totalInstanceCount: 12, 
        })

        if (result.currentProject?.cloudProject?.__typename === 'CloudProject') {
          result.currentProject.cloudProject.next = latest
          result.currentProject.cloudProject.current = latest
          result.currentProject.cloudProject.all = [
            latest,
            createRun({ runNumber: 2, status: 'PASSED', sha: 'sha-456', summary: 'Fixing tests', }),
            createRun({ runNumber: 1, status: 'PASSED', sha: 'sha-456', summary: 'Fixing tests', }),
          ]
        }

        return result
      },
      render (gqlData) {
        return (
          <div style="margin: 10px">
            <DebugRunDetailedView gql={gqlData} />
          </div>
        )
      },
    })

    cy.findByTestId('current-run').as('current').contains('#3')
    cy.get('@current').findByTestId('current-run-check')
    cy.get('@current').contains('5 of 12 specs completed')

    cy.findByTestId('run-2').as('run-2').contains('#2')
    cy.get('@run-2').contains('10 specs')

    cy.findByTestId('run-1').as('run-1').contains('#1')
    cy.get('@run-1').contains('10 specs')
  })

  it('only shows runs relevant to latest commit when it is in a non RUNNING state', () => {
    cy.mountFragment(DebugRunDetailedViewFragmentDoc, {
      variableTypes: DebugSpecVariableTypes,
      variables: {
        hasNextRun: false,
        runNumber: 1,
        nextRunNumber: -1,
        commitShas: ['sha-123', 'sha-456'],
      },
      onResult (result) {
        const latest = createRun({ runNumber: 3, status: 'PASSED', sha: 'sha-123', summary: 'Update code', })

        if (result.currentProject?.cloudProject?.__typename === 'CloudProject') {
          result.currentProject.cloudProject.next = latest
          result.currentProject.cloudProject.current = latest
          result.currentProject.cloudProject.all = [
            latest,
            createRun({ runNumber: 2, status: 'PASSED', sha: 'sha-123', summary: 'Update code', }),
            createRun({ runNumber: 1, status: 'PASSED', sha: 'sha-456', summary: 'Fixing tests', }),
          ]
        }

        return result
      },
      render (gqlData) {
        return (
          <div style="margin: 10px">
            <DebugRunDetailedView gql={gqlData} />
          </div>
        )
      },
    })

    cy.findByTestId('commit-sha-123').should('exist')
    cy.findByTestId('commit-sha-456').should('not.exist')
  })
})
