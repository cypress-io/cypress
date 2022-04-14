import Wizard from './Wizard.vue'
import { WizardFragmentDoc } from '../generated/graphql-test'

describe('Wizard', () => {
  it('works', () => {
    cy.mountFragment(WizardFragmentDoc, {
      render: (gqlVal) => {
        return <Wizard gql={gqlVal} />
      },
    })
  })
})
