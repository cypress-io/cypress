// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'
import {
  CloudOrganizationConnectionStubs,
  CloudUserStubs,
} from '@packages/graphql/test/stubCloudTypes'
import { SelectCloudProjectModalFragmentDoc } from '../../generated/graphql-test'
import SelectCloudProjectModal from '../modals/SelectCloudProjectModal.vue'
import { SelectCloudProjectModal_CreateCloudProjectDocument, SelectCloudProjectModal_SetProjectIdDocument } from '../../generated/graphql'

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
          <SelectCloudProjectModal utmMedium="test" utmContent="A" gql={gql}/>
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

  it('auto selects a project if it is the only project in the organization', () => {
    mountDialog()
    cy.get('[data-cy="selectOrganization"]').click()
    cy.findByRole('listbox').within(() => cy.findAllByText('Test Org 3').click())

    cy.get('[data-cy="selectProject"] button').should('have.text', 'Test Project 3')
  })

  it(`doesn't auto select a project if there are more than 1 projects in the org`, () => {
    mountDialog()
    cy.get('[data-cy="selectOrganization"]').click()
    cy.findByRole('listbox').within(() => cy.findAllByText('Test Org 1').click())
    cy.get('[data-cy="selectProject"] button').should('have.text', 'Pick a project')
  })

  it('shows the selected project when selecting from a list of >= 2 projects', () => {
    mountDialog()
    cy.get('[data-cy="selectOrganization"]').click()
    cy.findByRole('listbox').within(() => cy.findAllByText('Test Org 1').click())
    cy.get('[data-cy="selectProject"] button').click()
    cy.contains('Test Project 2').click()
    cy.get('[data-cy="selectProject"] button').should('have.text', 'Test Project 2').click()
    cy.contains('Test Project 1').click()
    cy.get('[data-cy="selectProject"] button').should('have.text', 'Test Project 1')
  })

  describe('create or connect project', () => {
    beforeEach(() => {
      const createMutation = cy.stub().as('createMutation')
      const setProjectIdMutation = cy.stub().as('setProjectIdMutation')

      cy.stubMutationResolver(SelectCloudProjectModal_CreateCloudProjectDocument, (defineResult, payload) => {
        createMutation(payload)

        return defineResult({
          cloudProjectCreate: {
            __typename: 'CloudProject',
            id: '123',
            slug: '123',
          },
        })
      })

      cy.stubMutationResolver(SelectCloudProjectModal_SetProjectIdDocument, (defineResult, payload) => {
        setProjectIdMutation(payload)

        return defineResult({
          setProjectIdInConfigFile: {
            __typename: 'Query',
            currentProject: {
              __typename: 'CurrentProject',
              id: '123',
              projectId: '123',
              cloudProject: {
                __typename: 'CloudProjectUnauthorized',
              },
            } as any,
          },
        })
      })

      mountDialog()
    })

    it('can switch between organizations with and without projects', () => {
      cy.get('[data-cy="selectOrganization"]').click()
      cy.findByRole('listbox').within(() => cy.findAllByText('Test Org 2').click())

      cy.contains('button', defaultMessages.runs.connect.modal.selectProject.connectProject).should('not.exist')
      cy.contains('button', defaultMessages.runs.connect.modal.selectProject.createProject).should('be.visible')

      cy.get('[data-cy="selectOrganization"]').click()
      cy.findByRole('listbox').within(() => cy.findAllByText('Test Org 1').click())

      cy.contains('button', defaultMessages.runs.connect.modal.selectProject.createProject).should('not.exist')
      cy.contains('button', defaultMessages.runs.connect.modal.selectProject.connectProject).should('be.visible')
    })

    context('create new project', () => {
      beforeEach(() => {
        cy.contains('a', defaultMessages.runs.connect.modal.selectProject.createNewProject).click()
        cy.contains('button', defaultMessages.runs.connect.modal.selectProject.createProject).click()
      })

      it('should call create project mutation with expected values', () => {
        cy.get('@createMutation').should('have.been.calledOnceWith', {
          campaign: 'Create project',
          cohort: 'A',
          medium: 'test',
          name: 'Test Project',
          orgId: '1',
          public: false,
          source: 'Binary: Launchpad',
        })
      })

      it('should call setProjectId mutation', () => {
        cy.get('@setProjectIdMutation').should('have.been.calledOnceWith', {
          projectId: '123',
        })
      })
    })

    context('select existing project', () => {
      beforeEach(() => {
        cy.get('[data-cy="selectOrganization"]').click()
        cy.findByRole('listbox').within(() => cy.findAllByText('Test Org 1').click())
        cy.get('[data-cy="selectProject"] button').click()
        cy.contains('Test Project 2').click()

        cy.contains('button', defaultMessages.runs.connect.modal.selectProject.connectProject).click()
      })

      it('should not call create project mutation', () => {
        cy.get('@createMutation').should('have.not.have.been.called')
      })

      it('should call setProjectId mutation', () => {
        cy.get('@setProjectIdMutation').should('have.been.calledOnceWith', {
          projectId: 'test-project-2',
        })
      })
    })
  })
})
