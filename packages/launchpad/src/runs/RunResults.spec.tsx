import RunResults from './RunResults.vue'
import { RunCardFragmentDoc } from '../generated/graphql-test'

describe('<RunResults />', () => {
  it('playground', () => {
    cy.mountFragment(RunCardFragmentDoc, {
      type: (ctx) => ({
        // TODO: move this into a test mock layer
        id: 'id1',
        totalDuration: 1000,
        totalPassed: 5,
        totalFailed: 0,
        totalSkipped: 0,
        totalPending: 4,
      }),
      render (gql) {
        return <RunResults gql={gql} />
      },
    })
  })
})
