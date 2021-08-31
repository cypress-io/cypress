import {
  TestingTypeCardsAppFragmentDoc,
  TestingTypeCardsWizardFragmentDoc,
} from '../generated/graphql'
import TestingTypeCards from './TestingTypeCards.vue'

describe('TestingTypeCards', () => {
  it('renders correct label depending if testingType has been configured', () => {
    cy.mountFragmentList([
      TestingTypeCardsAppFragmentDoc,
      TestingTypeCardsWizardFragmentDoc,
    ], {
      type: (ctx) => {
        const { app, wizard } = ctx

        return [app, wizard]
      },
      render: (gqlVal) => {
        // @ts-ignore - type is inferred as Frag1 | Frag2,
        // but in practice is { frag1: ..., frag2: ... }
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
