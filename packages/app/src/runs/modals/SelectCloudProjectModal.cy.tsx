import { defaultMessages } from '@cy/i18n'
import { CloudOrganizationConnectionStubs, CloudUserStubs } from '@packages/frontend-shared/cypress/support/mock-graphql/stubgql-CloudTypes'
import { SelectCloudProjectModalFragmentDoc } from '../../generated/graphql-test'
import SelectCloudProjectModal from '../modals/SelectCloudProjectModal.vue'

describe('<SelectCloudProjectModal />', () => {
  function mountDialog (currentProjectName = 'Test Project') {
    cy.mountFragment(SelectCloudProjectModalFragmentDoc, {
      onResult: (result) => {
        result.currentProject = {
          __typename: 'CurrentProject' as const,
          id: '1',
          title: currentProjectName,
          projectId: null,
        }

        result.cloudViewer = {
          ...CloudUserStubs.me,
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

    // Implicitly asserts that organizations are sorted by name. CloudOrganizationConnectionStubs contains [org 2, org 1],
    // while this ends up displayed as [org 1, org 2].
    cy.get('[data-cy="selectOrganization"] button').should('contain.text', 'Test Org 1')
    cy.get('[data-cy="external"]').should('have.attr', 'href').and('eq', 'https://on.cypress.io/adding-new-project')
    cy.get('[data-cy="selectProject"] button').should('have.text', 'Pick a project').click()

    // Asserting that projects should be sorted by name. CloudOrganizationConnectionStubs org 1 contains [project 2, project 1]
    // but we assert that project 1 is first in the list.
    cy.get('[role="listbox"] li').first().should('have.text', 'Test Project 1')
    cy.contains('Test Project 1').click()
  })

  it('preselects project matching current name if one exists', () => {
    mountDialog('Test Project 2')
    cy.get('[data-cy="selectProject"] button').should('have.text', 'Test Project 2')
  })

  it('prefills new project name with the current one', () => {
    mountDialog()
    cy.contains('a', defaultMessages.runs.connect.modal.selectProject.createNewProject).click()
    cy.findByLabelText(`${defaultMessages.runs.connect.modal.selectProject.projectName }*${defaultMessages.runs.connect.modal.selectProject.projectNameDisclaimer}`)
    .should('have.value', 'Test Project')

    cy.contains('a', defaultMessages.runs.connect.modal.selectProject.chooseExistingProject).should('be.visible')
    cy.contains('label', defaultMessages.runs.connect.modal.selectProject.privateDescription).should('be.visible')
    cy.contains('label', defaultMessages.runs.connect.modal.selectProject.publicDescription).should('be.visible')
  })

  it('can only choose an existing project if the organization has a project', () => {
    mountDialog()
    cy.get('[data-cy="selectOrganization"]').click()
    cy.findByRole('listbox').within(() => cy.findAllByText('Test Org 2').click())

    cy.contains('a', defaultMessages.runs.connect.modal.selectProject.chooseExistingProject).should('not.exist')
  })
})
