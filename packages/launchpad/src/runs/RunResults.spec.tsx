import { RunCardFragmentDoc } from '../generated/graphql-test'
import RunResults from './RunResults.vue'

describe('<RunResults />', () => {
  it('playground', () => {
    cy.mountFragment(RunCardFragmentDoc, {
      render (gql) {
        return <RunResults gql={gql} />
      },
    })
  })
})
