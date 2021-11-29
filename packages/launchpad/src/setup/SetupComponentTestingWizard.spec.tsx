import SetupComponentTestingWizard from './SetupComponentTestingWizard.vue'
import { SetupComponentTestingWizardFragmentDoc } from '../generated/graphql-test'

describe('Wizard', () => {
  it('works', () => {
    cy.mountFragment(SetupComponentTestingWizardFragmentDoc, {
      render: (gqlVal) => {
        return <SetupComponentTestingWizard gql={gqlVal} />
      },
    })
  })
})
