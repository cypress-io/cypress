import EmptyGeneratorCardStepOne from './EmptyGeneratorCardStepOne.vue'
import { EmptyGeneratorCardStepOneFragmentDoc } from '../../../generated/graphql-test'

describe('', () => {
  it('', () => {
    cy.mountFragment(EmptyGeneratorCardStepOneFragmentDoc, {
      render: (gql) => <EmptyGeneratorCardStepOne gql={gql} />,
    })
  })
})
