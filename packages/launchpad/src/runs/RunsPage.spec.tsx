import { RunsPageFragmentDoc } from '../generated/graphql-test'
import RunsPage from './RunsPage.vue'

describe('<RunsPage />', () => {
  it('playground', () => {
    cy.mountFragment(RunsPageFragmentDoc, {
      type: (ctx) => {
        return ctx.stubData.CloudProjectStubs.componentProject
      },
      render: (gql) => (
        <RunsPage gql={gql} />
      ),
    })
  })
})
