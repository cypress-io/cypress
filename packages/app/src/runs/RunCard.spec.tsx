import { RunCardFragmentDoc } from '../generated/graphql-test'
import RunCard from './RunCard.vue'

describe('<RunCard />', { viewportHeight: 400 }, () => {
  it('playground', () => {
    cy.mountFragment(RunCardFragmentDoc, {
      render: (gqlVal) => {
        return (
          <div class="bg-gray-100 h-screen p-3">
            <RunCard gql={gqlVal} />
          </div>
        )
      },
    })
  })
})
