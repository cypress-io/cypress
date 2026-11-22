import type { UserProjectStatusStore } from '@cy/store/user-project-status-store'
import type { EventManager } from '../runner/event-manager'
import type { UseMutationResponse } from '@urql/vue'
import StudioPanel from './StudioPanel.vue'
import type { SpecDirtyDataStore } from '../store/spec-dirty-data-store'
import type { SnapshotStore } from '../runner/snapshot-store'

describe('StudioPanel', () => {
  const mountCertErrorPanel = (certErrorCode?: string) => {
    const mockEventManager = {} as unknown as EventManager
    const mockUserProjectStatusStore = {} as unknown as UserProjectStatusStore
    const mockRequestProjectAccessMutation = {} as unknown as UseMutationResponse<any, any>
    const mockSpecDirtyDataStore = {} as unknown as SpecDirtyDataStore
    const mockAutSnapshotStore = {} as unknown as SnapshotStore

    cy.mount(<StudioPanel
      isCertError={true}
      certErrorCode={certErrorCode}
      eventManager={mockEventManager}
      studioStatus="IN_ERROR"
      onStudioPanelClose={() => {}}
      canAccessStudioAI={true}
      userProjectStatusStore={mockUserProjectStatusStore}
      hasRequestedProjectAccess={false}
      requestProjectAccessMutation={mockRequestProjectAccessMutation}
      autUrlSelector="https://example.com"
      specDirtyDataStore={mockSpecDirtyDataStore}
      autSnapshotStore={mockAutSnapshotStore}
    />)
  }

  it('renders the error panel with a certificate error', () => {
    mountCertErrorPanel('SELF_SIGNED_CERT_IN_CHAIN')

    cy.findByTestId('studio-error-panel').should('be.visible')
    cy.findByTestId('studio-error-icon').should('be.visible')
    cy.findByTestId('studio-error-title').should('have.text', 'Cypress Studio can\'t verify the Cypress Cloud certificate')
    cy.findByTestId('studio-error-message').should('have.text', 'Cypress Studio loads from Cypress Cloud, but the certificate for that connection could not be verified (SELF_SIGNED_CERT_IN_CHAIN). If your network inspects HTTPS traffic, trust your organization\'s certificate authority with NODE_EXTRA_CA_CERTS. If you connect through a proxy, configure Cypress with your proxy settings.')
    cy.findByTestId('studio-error-learn-more-button').should('have.text', ' Learn more ')
    cy.findByTestId('studio-error-retry-button').should('have.text', ' Retry ')

    cy.percySnapshot()
  })

  it('omits the error code from the certificate error when none is provided', () => {
    mountCertErrorPanel()

    cy.findByTestId('studio-error-message').should('have.text', 'Cypress Studio loads from Cypress Cloud, but the certificate for that connection could not be verified. If your network inspects HTTPS traffic, trust your organization\'s certificate authority with NODE_EXTRA_CA_CERTS. If you connect through a proxy, configure Cypress with your proxy settings.')
  })
})
