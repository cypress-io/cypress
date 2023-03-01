import { CloudRunStatus, DebugNewRelevantRunBarFragmentDoc, DebugNewRelevantRunBar_MoveToNextDocument, DebugNewRelevantRunBar_SpecsDocument } from '../generated/graphql-test'
import DebugNewRelevantRunBar from './DebugNewRelevantRunBar.vue'
import { createRelevantRunSpecChangeEvent } from '@packages/graphql/test/stubCloudTypes'

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

          cy.contains('Switch to run')

          cy.percySnapshot()
        })
      })
    })
  })

  it('should show spec counts for RUNNING', () => {
    cy.mountFragment(DebugNewRelevantRunBarFragmentDoc, {
      onResult (result) {
        result.status = 'RUNNING'
      },
      render: (gqlVal) => <DebugNewRelevantRunBar gql={gqlVal} />,
    })

    cy.stubSubscriptionEvent(DebugNewRelevantRunBar_SpecsDocument, () => {
      return createRelevantRunSpecChangeEvent('next', 3, 5)
    })

    cy.contains('3 of 5').should('be.visible')
    cy.contains('Switch to run')
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

    cy.contains('Switch to run').click()
  })
})
