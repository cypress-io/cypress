import Wizard from './Wizard.vue'
import { WizardFragmentDoc } from '../generated/graphql-test'
import { Query } from '@packages/graphql/src/entities/Query'

describe('Wizard', () => {
  it('works', () => {
    cy.mountFragment(WizardFragmentDoc, {
      type: (ctx) => {
        return new Query()
      },
      render: (gqlVal) => {
        return <Wizard query={gqlVal} />
      },
    })
  })
})
