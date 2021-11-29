import RunsEmpty from './RunsEmpty.vue'
import { RunsEmptyFragmentDoc } from '../generated/graphql-test'

describe('<RunsEmpty />', () => {
  it('playground', () => {
    cy.mountFragment(RunsEmptyFragmentDoc, {
      render (gqlVal) {
        return (<div class="h-screen">
          <RunsEmpty gql={gqlVal} />
        </div>)
      },
    })
  })
})
