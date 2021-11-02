import RunsPage from './RunsPage.vue'
import { RunsPageFragmentDoc } from '../generated/graphql-test'

describe('<RunsPage />', { keystrokeDelay: 0 }, () => {
  const cloudViewer = {
    __typename: 'CloudUser',
    id: '1',
    email: 'test@test.test',
    fullName: 'Tester Test',
  } as const

  it('playground', () => {
    cy.mountFragment(RunsPageFragmentDoc, {
      onResult: (result) => {
        result.cloudViewer = cloudViewer
      },
      render (gqlVal) {
        return <RunsPage gql={gqlVal} />
      },
    })
  })
})
