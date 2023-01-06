import { DebugNewRelevantRunBarFragmentDoc, DebugNewRelevantRunBar_MoveToNextDocument } from '../generated/graphql-test'
import DebugNewRelevantRunBar from './DebugNewRelevantRunBar.vue'
import type { CloudRunStatus } from '../generated/graphql'

describe('<DebugNewRelevantRunBar />', () => {
  [
    { viewportWidth: 300, description: 'small viewport' },
    { viewportWidth: 1028, description: 'large viewport' },
  ].forEach(({ viewportWidth, description }) => {
    context(description, { viewportWidth }, () => {
      ['PASSED', 'FAILED', 'RUNNING'].forEach((status) => {
        it(`handles ${status} status`, () => {
          cy.mountFragment(DebugNewRelevantRunBarFragmentDoc, {
            onResult (result) {
              result.status = status as CloudRunStatus
            },
            render: (gqlVal) => <DebugNewRelevantRunBar gql={gqlVal} />,
          })

          cy.percySnapshot()
        })
      })
    })
  })

  it('should show spec counts for RUNNING', () => {
    cy.mountFragment(DebugNewRelevantRunBarFragmentDoc, {
      onResult (result) {
        result.status = 'RUNNING'
        result.specs = [
          { id: '', status: 'CANCELLED', __typename: 'CloudSpecRun' },
          { id: '', status: 'RUNNING', __typename: 'CloudSpecRun' },
          { id: '', status: 'PASSED', __typename: 'CloudSpecRun' },
          { id: '', status: 'FAILED', __typename: 'CloudSpecRun' },
          { id: '', status: 'UNCLAIMED', __typename: 'CloudSpecRun' },
        ]
      },
      render: (gqlVal) => <DebugNewRelevantRunBar gql={gqlVal} />,
    })

    cy.contains('3 of 5').should('be.visible')
  })

  it('should call mutation when link is clicked', (done) => {
    cy.mountFragment(DebugNewRelevantRunBarFragmentDoc, {
      onResult (result) {
        result.status = 'PASSED'
      },
      render: (gqlVal) => <DebugNewRelevantRunBar gql={gqlVal} />,
    })

    cy.stubMutationResolver(DebugNewRelevantRunBar_MoveToNextDocument, (defineResult) => {
      done()
    })

    cy.contains('View run').click()
  })
})
