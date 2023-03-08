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

function createRun (runNumber: number, status: CloudRunStatus, sha: string, summary: string) {
  return {
    ...createCloudRun({}),
    runNumber,
    status,
    commitInfo: {
      ...createCloudRunCommitInfo({}),
      sha,
      summary,
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
        const latest = createRun(2, 'RUNNING', 'sha-123', 'Update code')

        if (
          result.currentProject?.cloudProject!.__typename === 'CloudProject'
        ) {
          result.currentProject.cloudProject.next = latest
          result.currentProject.cloudProject.current = latest
          result.currentProject.cloudProject.all = [
            latest,
            createRun(1, 'PASSED', 'sha-456', 'Fixing tests'),
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
        const latest = createRun(3, 'RUNNING', 'sha-123', 'Update code')

        if (
          result.currentProject?.cloudProject!.__typename === 'CloudProject'
        ) {
          result.currentProject.cloudProject.next = latest
          result.currentProject.cloudProject.current = latest
          result.currentProject.cloudProject.all = [
            latest,
            createRun(2, 'PASSED', 'sha-123', 'Update code'),
            createRun(1, 'PASSED', 'sha-456', 'Fixing tests'),
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
        const latest = createRun(3, 'PASSED', 'sha-123', 'Update code')

        if (result.currentProject?.cloudProject?.__typename === 'CloudProject') {
          result.currentProject.cloudProject.next = latest
          result.currentProject.cloudProject.current = latest
          result.currentProject.cloudProject.all = [
            latest,
            createRun(2, 'PASSED', 'sha-123', 'Update code'),
            createRun(1, 'PASSED', 'sha-456', 'Fixing tests'),
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
