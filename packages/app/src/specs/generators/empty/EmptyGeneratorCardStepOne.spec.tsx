import EmptyGeneratorCardStepOne from './EmptyGeneratorCardStepOne.vue'
import { EmptyGeneratorCardStepOneFragmentDoc } from '../../../generated/graphql-test'

describe('EmptyGeneratorCardStepOne', () => {
  it('renders', () => {
    cy.mountFragment(EmptyGeneratorCardStepOneFragmentDoc, {
      render: (gql) => <EmptyGeneratorCardStepOne gql={gql} title='title' />,
    })
  })
})
