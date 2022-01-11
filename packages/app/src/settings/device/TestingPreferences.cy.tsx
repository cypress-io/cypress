import { TestingPreferencesFragmentDoc } from '../../generated/graphql-test'
import TestingPreferences from './TestingPreferences.vue'

describe('<TestingPreferences />', () => {
  it('renders', () => {
    cy.mountFragment(TestingPreferencesFragmentDoc, {
      render: (gql) => <TestingPreferences gql={gql} />,
    })
  })
})
