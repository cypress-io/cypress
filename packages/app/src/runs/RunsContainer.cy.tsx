import RunsContainer from './RunsContainer.vue'
import { RunsContainerFragmentDoc } from '../generated/graphql-test'

describe('<RunsContainer />', { keystrokeDelay: 0 }, () => {
  const cloudViewer = {
    __typename: 'CloudUser',
    id: '1',
    email: 'test@test.test',
    fullName: 'Tester Test',
  } as const

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
