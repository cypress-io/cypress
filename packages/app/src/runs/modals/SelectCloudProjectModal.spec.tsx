import { SelectCloudProjectModalFragmentDoc } from '../../generated/graphql-test'
import SelectCloudProjectModal from '../modals/SelectCloudProjectModal.vue'
import { defaultMessages } from '@cy/i18n'

describe('<SelectCloudProjectModal />', () => {
  const organizations = {
    __typename: 'CloudOrganizationConnection' as const,
    nodes: [
      {
        __typename: 'CloudOrganization' as const,
        id: '1',
        name: 'Test Org 1',
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

  beforeEach(() => {
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
  })

  it('should disable the project selection when no organization is selected', () => {
    cy.get('[data-cy="selectProject"] button').should('be.disabled')
    cy.get('[data-cy="selectOrganization"] button').click()
    cy.contains('Test Org 1').click()
    cy.get('[data-cy="selectProject"] button').click()
    cy.contains('test-project').click()
  })

  it('should show an error when creating a project without an organization', () => {
    cy.contains('Create new').click()
    cy.get('#projectName').type('new project')
    cy.contains('button', 'Create project').click()
    cy.contains(defaultMessages.runs.connect.modal.selectProject.noOrganizationSelectedError).should('be.visible')
  })
})
