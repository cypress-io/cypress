import DebugRunDetailedView from './DebugRunDetailedView.vue'
import { DebugRunDetailedViewFragmentDoc } from '../generated/graphql-test'
import { createCloudRun, createCloudRunCommitInfo } from '@packages/graphql/test/stubCloudTypes'
import type { CloudRunStatus } from '@packages/graphql/src/gen/test-cloud-graphql-types.gen'

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
  it('groups by commits when latest is RUNNING', () => {
    cy.mountFragment(DebugRunDetailedViewFragmentDoc, {
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
      onResult (result) {
        const latest = createRun(3, 'PASSED', 'sha-123', 'Update code')

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
    cy.findByTestId('commit-sha-456').should('not.exist')
  })
})
