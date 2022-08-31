import { defaultMessages } from '@cy/i18n'
import { CloudUserStubs,
  CloudOrganizationConnectionStubs,
} from '@packages/graphql/test/stubCloudTypes'
import { CloudConnectModalsFragmentDoc } from '../../generated/graphql-test'
import CloudConnectModals from './CloudConnectModals.vue'
import cloneDeep from 'lodash/cloneDeep'

describe('<CloudConnectModals />', () => {
  function mountDialog (hasOrg: boolean, hasProjects: boolean) {
    cy.mountFragment(CloudConnectModalsFragmentDoc, {
      onResult: (result) => {
        result.currentProject = {
          __typename: 'CurrentProject' as const,
          id: '1',
          title: 'Test Project',
          projectId: null,
        }

        result.cloudViewer = {
          ...CloudUserStubs.me,
          organizations: hasOrg ? cloneDeep(CloudOrganizationConnectionStubs) : null,
        }

        if (!hasProjects) {
          result.cloudViewer.organizations?.nodes.forEach((org) => {
            org.projects = {
              ...org.projects,
              nodes: [],
            }
          })
        }
      },
      render (gql) {
        return (<div class="h-screen">
          <CloudConnectModals gql={gql}/>
        </div>)
      },
    })
  }

  context('has no organization', () => {
    beforeEach(() => {
      mountDialog(false, false)
    })

    it('shows the create/select org modal when orgs are added', () => {
      cy.contains(defaultMessages.runs.connect.modal.createOrg.button).should('be.visible')

      cy.percySnapshot()
    })
  })

  context('has organizations', () => {
    context('with no projects', () => {
      beforeEach(() => {
        mountDialog(true, false)
      })

      it('shows the select project modal with create new project action', () => {
        cy.contains(defaultMessages.runs.connect.modal.selectProject.createProject).should('be.visible')

        cy.contains('a', defaultMessages.links.needHelp).should('have.attr', 'href', 'https://on.cypress.io/adding-new-project')

        cy.percySnapshot()
      })
    })

    context('with projects', () => {
      beforeEach(() => {
        mountDialog(true, true)
      })

      it('shows the select project modal with list of projects', () => {
        cy.contains(defaultMessages.runs.connect.modal.selectProject.connectProject).should('be.visible')

        cy.percySnapshot()
      })
    })
  })
})
