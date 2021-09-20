import { Query } from '@packages/graphql'
import {
  TestingTypeCardsFragmentDoc,
} from '../generated/graphql-test'
import TestingTypeCards from './TestingTypeCards.vue'

describe('TestingTypeCards', () => {
  it('renders correct label depending if testingType has been configured', () => {
    cy.mountFragment(TestingTypeCardsFragmentDoc, {
      type: (ctx) => {
        return new Query(ctx)
      },
      render: (gqlVal) => {
        return <TestingTypeCards gql={gqlVal} />
      },
    }).then(() => {
      // CT has been configured so we should show "launch"
      cy.get('[role="launch-component-testing"]')

      // E2E has NOT been configured so we should show "setup"
      cy.get('[role="setup-e2e-testing"]')
    })
  })
})
