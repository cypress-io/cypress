import type { UserProjectStatusStore } from '@cy/store/user-project-status-store'
import type { EventManager } from '../runner/event-manager'
import type { UseMutationResponse } from '@urql/vue'
import StudioPanel from './StudioPanel.vue'

describe('StudioPanel', () => {
  it('renders the error panel with a certificate error', () => {
    const mockEventManager = {} as unknown as EventManager
    const mockUserProjectStatusStore = {} as unknown as UserProjectStatusStore
    const mockRequestProjectAccessMutation = {} as unknown as UseMutationResponse<any, any>

    cy.mount(<StudioPanel
      isCertError={true}
      eventManager={mockEventManager}
      studioStatus="IN_ERROR"
      onStudioPanelClose={() => {}}
      canAccessStudioAI={true}
      userProjectStatusStore={mockUserProjectStatusStore}
      hasRequestedProjectAccess={false}
      requestProjectAccessMutation={mockRequestProjectAccessMutation}
      autUrlSelector="https://example.com"
    />)

    cy.findByTestId('studio-error-panel').should('be.visible')
    cy.findByTestId('studio-error-icon').should('be.visible')
    cy.findByTestId('studio-error-title').should('have.text', 'Configure your proxy to use Cypress Studio')
    cy.findByTestId('studio-error-message').should('have.text', 'Cypress Studio requires an internet connection. To continue, you may need to configure Cypress with your proxy settings.')
    cy.findByTestId('studio-error-learn-more-button').should('have.text', ' Learn more ')
    cy.findByTestId('studio-error-retry-button').should('have.text', ' Retry ')

    cy.percySnapshot()
  })
})
