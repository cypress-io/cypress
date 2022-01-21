import { ExperimentsFragmentDoc } from '../../generated/graphql-test'
import Experiments from './Experiments.vue'

describe('<Experiments />', () => {
  beforeEach(() => {
    cy.viewport(800, 600)
  })

  it('renders experiments that are passed in', () => {
    cy.mountFragment(ExperimentsFragmentDoc, {
      render (gql) {
        return (<div class="py-4 px-8">
          <Experiments gql={gql}/>
        </div>)
      },
    })

    cy.contains('[data-testid="experiment"]', 'Interactive Run Events')
    .should('contain', 'Enabled')
  })
})
