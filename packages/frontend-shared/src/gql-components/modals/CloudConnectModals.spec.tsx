// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'
import { CloudUserStubs,
  CloudOrganizationConnectionStubs,
} from '@packages/graphql/test/stubCloudTypes'
import { CloudConnectModalsFragmentDoc } from '../../generated/graphql-test'
import CloudConnectModals from './CloudConnectModals.vue'
import cloneDeep from 'lodash/cloneDeep'

type MountOptions = {
  hasOrg: boolean
  hasProjects: boolean
}

describe('<CloudConnectModals />', () => {
  function mountDialog ({ hasOrg, hasProjects }: MountOptions) {
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
          firstOrganization: {
            __typename: 'CloudOrganizationConnection',
            nodes: [],
          },
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
          <CloudConnectModals utmMedium="testing" gql={gql}/>
        </div>)
      },
    })
  }

  context('has no organization', () => {
    beforeEach(() => {
      mountDialog({ hasOrg: false, hasProjects: false })
    })

    it('shows the create/select org modal when orgs are added', () => {
      cy.contains(defaultMessages.runs.connect.modal.createOrg.button).should('be.visible')

      cy.percySnapshot()
    })
  })

  context('has organizations', () => {
    context('with no projects', () => {
      beforeEach(() => {
        mountDialog({ hasOrg: true, hasProjects: false })
      })

      it('shows the select project modal with create new project action', () => {
        cy.contains(defaultMessages.runs.connect.modal.selectProject.createProject).should('be.visible')

        cy.contains('a', defaultMessages.links.needHelp).should('have.attr', 'href', 'https://on.cypress.io/adding-new-project')

        cy.percySnapshot()
      })
    })

    context('with projects', () => {
      beforeEach(() => {
        mountDialog({ hasOrg: true, hasProjects: true })
      })

      it('shows the select project modal with list of projects', () => {
        cy.contains(defaultMessages.runs.connect.modal.selectProject.connectProject).should('be.visible')

        cy.percySnapshot()
      })
    })
  })
})
