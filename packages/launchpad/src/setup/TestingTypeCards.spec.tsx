import {
  TestingTypeCardsFragmentDoc,
} from '../generated/graphql-test'
import TestingTypeCards from './TestingTypeCards.vue'

describe('TestingTypeCards', () => {
  it('renders correct label depending if testingType has been configured', () => {
    cy.mountFragment(TestingTypeCardsFragmentDoc, {
      onResult: (result, ctx) => {
        if (result.app.activeProject) {
          result.app.activeProject.isFirstTimeCT = false
          result.app.activeProject.isFirstTimeE2E = true
        }
      },
      render: (gqlVal) => {
        return <TestingTypeCards gql={gqlVal} />
      },
    }).then(() => {
      // CT has been configured so we should show "launch"
      cy.contains('LAUNCH').should('be.visible')

      // E2E has NOT been configured so we should show "setup"
      // TODO - pull this from i18n when wizard text is moved into i18n
      cy.contains('Click here to configure end-to-end testing with Cypress.').should('be.visible')
    })
  })
})
