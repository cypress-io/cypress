import Wizard from './Wizard.vue'
import { WizardFragmentDoc } from '../generated/graphql-test'

describe('Wizard', () => {
  it('works', () => {
    cy.mountFragment(WizardFragmentDoc, {
      type: (ctx) => {
        return ctx.stubQuery
      },
      render: (gqlVal) => {
        return <Wizard gql={gqlVal} />
      },
    })
  })
})
