import { defaultMessages } from '@cy/i18n'
import { CloudOrganizationConnectionStubs, CloudUserStubs } from '@packages/frontend-shared/cypress/support/mock-graphql/stubgql-CloudTypes'
import { SelectCloudProjectModalFragmentDoc } from '../../generated/graphql-test'
import SelectCloudProjectModal from '../modals/SelectCloudProjectModal.vue'

describe('<SelectCloudProjectModal />', () => {
  function mountDialog () {
    cy.mountFragment(SelectCloudProjectModalFragmentDoc, {
      onResult: (result) => {
        result.currentProject = {
          __typename: 'CurrentProject' as const,
          id: '1',
          title: 'Test Project',
          projectId: null,
        }

        result.cloudViewer = {
          ...CloudUserStubs.me,
          organizationControl: null,
          organizations: CloudOrganizationConnectionStubs,
        }
      },
      render (gql) {
        return (<div class="h-screen">
          <SelectCloudProjectModal gql={gql}/>
        </div>)
      },
    })
  }

  it('selects the first organization by default', () => {
    mountDialog()
    cy.get('[data-cy="selectOrganization"] button').should('contain.text', 'Test Org 1')
    cy.get('[data-cy="external"]').should('have.attr', 'href').and('eq', 'https://on.cypress.io/adding-new-project')
    cy.get('[data-cy="selectProject"] button').click()
    cy.contains('Test Project').click()
  })

  it('prefills new project name with the current one', () => {
    mountDialog()
    cy.contains('a', defaultMessages.runs.connect.modal.selectProject.createNewProject).click()
    cy.findByLabelText(`${defaultMessages.runs.connect.modal.selectProject.projectName }*${defaultMessages.runs.connect.modal.selectProject.projectNameDisclaimer}`)
    .should('have.value', 'Test Project')

    cy.contains('a', defaultMessages.runs.connect.modal.selectProject.chooseExistingProject).should('be.visible')
  })

  it('can only choose an existing project if the organization has a project', () => {
    mountDialog()
    cy.get('[data-cy="selectOrganization"]').click()
    cy.findByRole('listbox').within(() => cy.findAllByText('Test Org 2').click())

    cy.contains('a', defaultMessages.runs.connect.modal.selectProject.chooseExistingProject).should('not.exist')
  })
})
