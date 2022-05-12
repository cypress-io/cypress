import { defaultMessages } from '@cy/i18n'
import { CloudUserStubs,
  CloudOrganizationConnectionStubs,
} from '@packages/graphql/test/stubCloudTypes'
import { CloudConnectModalsFragmentDoc } from '../../generated/graphql-test'
import CloudConnectModals from './CloudConnectModals.vue'

describe('<CloudConnectModals />', () => {
  function mountDialog (noOrg = false) {
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
          organizations: noOrg ? null : CloudOrganizationConnectionStubs,
        }
      },
      render (gql) {
        return (<div class="h-screen">
          <CloudConnectModals gql={gql}/>
        </div>)
      },
    })
  }

  it('shows the select org modal when orgs are added', () => {
    mountDialog()
    cy.contains(defaultMessages.runs.connect.modal.selectProject.connectProject).should('be.visible')

    cy.contains('a', defaultMessages.links.needHelp).should('have.attr', 'href', 'https://on.cypress.io/adding-new-project')
  })
})
