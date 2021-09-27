import {
  TestingTypeCardsFragmentDoc,
} from '../generated/graphql-test'
import TestingTypeCards from './TestingTypeCards.vue'

describe('TestingTypeCards', () => {
  it('renders correct label depending if testingType has been configured', () => {
    cy.mountFragment(TestingTypeCardsFragmentDoc, {
      type: (ctx) => {
        return {
          ...ctx.stubQuery,
          app: {
            ...ctx.stubApp,
            activeProject: {
              ...ctx.stubData.project,
              isFirstTimeE2E: true,
              isFirstTimeCT: false,
            },
          },
        }
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
