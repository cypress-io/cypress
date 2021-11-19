import RunsContainer from './RunsContainer.vue'
import { RunsContainerFragmentDoc } from '../generated/graphql-test'

describe('<RunsContainer />', { keystrokeDelay: 0 }, () => {
  const cloudViewer = {
    __typename: 'CloudUser' as const,
    id: '1',
    email: 'test@test.test',
    fullName: 'Tester Test',
    organizations: {
      __typename: 'CloudOrganizationConnection' as const,
      nodes: [],
    },
  }

  it('playground', () => {
    cy.mountFragment(RunsContainerFragmentDoc, {
      onResult: (result) => {
        result.cloudViewer = cloudViewer
      },
      render (gqlVal) {
        return <RunsContainer gql={gqlVal} />
      },
    })
  })
})
