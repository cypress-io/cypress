import RunsContainer from './RunsContainer.vue'
import { RunsContainerFragmentDoc } from '../generated/graphql-test'
import { CloudUserStubs } from '@packages/frontend-shared/cypress/support/mock-graphql/stubgql-CloudTypes'

describe('<RunsContainer />', { keystrokeDelay: 0 }, () => {
  const cloudViewer = {
    ...CloudUserStubs.me,
    id: '1',
    email: 'test@test.test',
    fullName: 'Tester Test',
    cloudOrganizationsUrl: null,
    createCloudOrganizationUrl: null,
    organizations: null,
    organizationControl: null,
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
