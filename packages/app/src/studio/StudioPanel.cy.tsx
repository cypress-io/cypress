import type { UserProjectStatusStore } from '@cy/store/user-project-status-store'
import type { EventManager } from '../runner/event-manager'
import type { UseMutationResponse } from '@urql/vue'
import StudioPanel from './StudioPanel.vue'
import type { SpecDirtyDataStore } from '../store/spec-dirty-data-store'
import { useSelectorPlaygroundStore } from '../store/selector-playground-store'

describe('StudioPanel', () => {
  it('renders the error panel with a certificate error', () => {
    const mockEventManager = {} as unknown as EventManager
    const mockUserProjectStatusStore = {} as unknown as UserProjectStatusStore
    const mockRequestProjectAccessMutation = {} as unknown as UseMutationResponse<any, any>
    const mockSpecDirtyDataStore = {} as unknown as SpecDirtyDataStore

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
      specDirtyDataStore={mockSpecDirtyDataStore}
    />)

    cy.findByTestId('studio-error-panel').should('be.visible')
    cy.findByTestId('studio-error-icon').should('be.visible')
    cy.findByTestId('studio-error-title').should('have.text', 'Configure your proxy to use Cypress Studio')
    cy.findByTestId('studio-error-message').should('have.text', 'Cypress Studio requires an internet connection. To continue, you may need to configure Cypress with your proxy settings.')
    cy.findByTestId('studio-error-learn-more-button').should('have.text', ' Learn more ')
    cy.findByTestId('studio-error-retry-button').should('have.text', ' Retry ')

    cy.percySnapshot()
  })

  describe('Selector Playground integration', () => {
    it('tracks Selector Playground state and passes it to Studio', () => {
      const selectorPlaygroundStore = useSelectorPlaygroundStore()
      const mockEventManager = {} as unknown as EventManager
      const mockUserProjectStatusStore = {} as unknown as UserProjectStatusStore
      const mockRequestProjectAccessMutation = {} as unknown as UseMutationResponse<any, any>
      const mockSpecDirtyDataStore = {} as unknown as SpecDirtyDataStore

      selectorPlaygroundStore.setShow(false)

      cy.mount(<StudioPanel
        eventManager={mockEventManager}
        studioStatus="ENABLED"
        onStudioPanelClose={() => {}}
        canAccessStudioAI={true}
        userProjectStatusStore={mockUserProjectStatusStore}
        hasRequestedProjectAccess={false}
        requestProjectAccessMutation={mockRequestProjectAccessMutation}
        autUrlSelector="https://example.com"
        specDirtyDataStore={mockSpecDirtyDataStore}
      />)

      // Component should render without errors
      cy.get('[data-cy="studio-panel"]')

      cy.then(() => {
        selectorPlaygroundStore.setShow(true)
      })

      // Component should handle state change without errors
      cy.get('[data-cy="studio-panel"]')

      cy.then(() => {
        selectorPlaygroundStore.setShow(false)
      })

      // Component should handle state change without errors
      cy.get('[data-cy="studio-panel"]')
    })
  })
})
