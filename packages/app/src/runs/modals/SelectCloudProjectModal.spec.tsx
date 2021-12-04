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

  function mountDialog (noorgs = false) {
    cy.mountFragment(SelectCloudProjectModalFragmentDoc, {
      onResult: (result) => {
        result.currentProject = {
          __typename: 'CurrentProject' as const,
          id: '1',
          title: 'Test Project',
        }

        result.cloudViewer = {
          __typename: 'CloudUser' as const,
          id: '2',
          organizations: noorgs ? null : organizations,
        }
      },
      render (gql) {
        return (<div class="h-screen">
          <SelectCloudProjectModal show gql={gql}/>
        </div>)
      },
    })
  }

  it('selects the first organization by default', () => {
    mountDialog()
    cy.get('[data-cy="selectOrganization"] button').should('contain.text', 'Test Org 1')
    cy.get('[data-cy="selectProject"] button').click()
    cy.contains('test-project').click()
  })

  it('prefills new project name with the current one', () => {
    mountDialog()
    cy.contains('a', defaultMessages.runs.connect.modal.selectProject.createNewProject).click()
    cy.get('#projectName').should('have.value', 'Test Project')
  })

  it('show the create org modal when no org is there', () => {
    mountDialog(true)
    cy.contains('button', defaultMessages.runs.connect.modal.createOrg.waitingButton).should('be.visible')
  })
})
