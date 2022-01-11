import SpecPatterns from './SpecPatterns.vue'
import { SpecPatternsFragmentDoc } from '../generated/graphql-test'

describe('<SpecPatterns />', () => {
  it('renders spec patterns', () => {
    cy.mountFragment(SpecPatternsFragmentDoc, {
      render: (gql) => <SpecPatterns gql={gql} />,
    })

    cy.contains('**/*.spec.{js,ts,tsx,jsx}')
  })
})
