import GlobalProjectCard from './GlobalProjectCard.vue'
import { GlobalProjectCardFragmentDoc } from '../generated/graphql-test'

describe('<GlobalProjectCard />', () => {
  it('renders', () => {
    cy.mountFragment(GlobalProjectCardFragmentDoc, {
      render: (gqlValue) => (
        <div class="p-12 overflow-auto resize-x max-w-600px">
          <GlobalProjectCard gql={gqlValue} />
        </div>
      ),
    })

    cy.findByText('Some Test Title').should('be.visible')
    cy.findByText('/usr/local/dev/projects/some-test-title').should('be.visible')
  })
})
