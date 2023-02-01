import { DebugPendingRunSplash_SpecsDocument } from '../generated/graphql'
import DebugPendingRunSplash from './DebugPendingRunSplash.vue'

describe('<DebugPendingRunSplash />', () => {
  it('renders as expected', () => {
    cy.mount(<DebugPendingRunSplash/>)

    const createEvent = (completed: number, total: number) => {
      return {
        __typename: 'Subscription' as const,
        relevantRunSpecChange: {
          __typename: 'Query' as const,
          currentProject: {
            __typename: 'CurrentProject' as const,
            id: 'fake',
            relevantRunSpecs: {
              __typename: 'CurrentProjectRelevantRunSpecs' as const,
              current: {
                __typename: 'RelevantRunSpecs' as const,
                completedSpecs: completed,
                totalSpecs: total,
              },
            },
          },
        },
      }
    }

    cy.stubSubscriptionEvent(DebugPendingRunSplash_SpecsDocument, () => {
      return createEvent(3, 5)
    })

    cy.contains('3 of 5').should('be.visible')

    cy.stubSubscriptionEvent(DebugPendingRunSplash_SpecsDocument, () => {
      return createEvent(5, 5)
    })

    cy.contains('5 of 5').should('be.visible')

    cy.percySnapshot()
  })
})
