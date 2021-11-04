import { SpecPatternsFragmentDoc } from '../../generated/graphql-test'
import SpecPatterns from './SpecPatterns.vue'

describe('<SpecPatterns />', () => {
  beforeEach(() => {
    cy.viewport(1000, 600)
  })

  it('renders the SpecPatterns', () => {
    cy.mountFragment(SpecPatternsFragmentDoc, {
      render: (gqlVal) => (
        <div class="py-4 px-8">
          <SpecPatterns
            gql={gqlVal}
          />
        </div>
      ),
    })
  })
})
