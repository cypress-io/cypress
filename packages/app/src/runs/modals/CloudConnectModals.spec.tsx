import { defaultMessages } from '@cy/i18n'
import { CloudUserStubs,
  CloudOrganizationConnectionStubs,
} from '@packages/frontend-shared/cypress/support/mock-graphql/stubgql-CloudTypes'
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
          organizationControl: null,
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

  it('show the create org modal when no org is there', () => {
    mountDialog(true)
    cy.findByText(defaultMessages.runs.connect.modal.createOrg.button).click()
    cy.contains('button', defaultMessages.runs.connect.modal.createOrg.waitingButton).should('be.visible')
  })

  it('shows the select org modal when orgs are added', () => {
    mountDialog()
    cy.contains(defaultMessages.runs.connect.modal.selectProject.connectProject).should('be.visible')
  })
})
