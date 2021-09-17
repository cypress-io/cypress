import { RunsPageFragmentDoc } from '../generated/graphql-test'
import RunsPage from './RunsPage.vue'

describe('<RunsPage />', () => {
  it('playground', () => {
    cy.mountFragment(RunsPageFragmentDoc, {
      type: (ctx) => {
        return ({
          __typename: 'CloudProject' as const,
          id: '',
          slug: '',
        })
      },
      render: (gql) => (
        <RunsPage gql={gql} />
      ),
    })
  })
})
