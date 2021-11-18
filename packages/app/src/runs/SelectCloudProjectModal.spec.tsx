import { SelectCloudProjectModalFragmentDoc } from '../generated/graphql-test'
import SelectCloudProjectModal from './SelectCloudProjectModal.vue'

describe('<SelectCloudProjectModal />', () => {
  const organizations = {
    __typename: 'CloudOrganizationConnection' as const,
    nodes: [
      {
        __typename: 'CloudOrganization' as const,
        id: '1',
        name: 'Test Org',
        projects: {
          __typename: 'CloudProjectConnection' as const,
          nodes: [
            {
              __typename: 'CloudProject' as const,
              id: '1',
              slug: 'test-project',
            },
          ],
        },
      },
      {
        __typename: 'CloudOrganization' as const,
        id: '2',
        name: 'Test Org 2',
        projects: {
          __typename: 'CloudProjectConnection' as const,
          nodes: [],
        },
      },
    ],
  }

  it('playground', () => {
    cy.mountFragment(SelectCloudProjectModalFragmentDoc, {
      onResult: (result) => {
        result.organizations = organizations
      },
      render (gql) {
        return (<div class="h-screen">
          <SelectCloudProjectModal show gql={gql}/>
        </div>)
      },
    })

    cy.contains('Create new').click()
  })
})
