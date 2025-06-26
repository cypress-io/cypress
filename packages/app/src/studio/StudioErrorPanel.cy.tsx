import StudioErrorPanel from './StudioErrorPanel.vue'
import type { EventManager } from '../runner/event-manager'

describe('<StudioErrorPanel />', () => {
  it('renders error state with correct content', () => {
    const mockEventManager = {
      emit: cy.stub(),
    } as unknown as EventManager

    cy.mount(
      <StudioErrorPanel 
        eventManager={mockEventManager}
      />
    )

    // Check that the error panel is displayed
    cy.get('[data-cy="studio-error-panel"]').should('be.visible')
    
    // Check for the error icon
    cy.get('[data-cy="studio-error-panel"]')
      .find('svg')
      .should('be.visible')
    
    // Check for the error title
    cy.contains('Something went wrong').should('be.visible')
    
    // Check for the error description
    cy.contains('There was a problem with data loading').should('be.visible')
    cy.contains('Our team has been notified').should('be.visible')
    
    // Check for the retry button
    cy.get('[data-cy="studio-error-retry-button"]')
      .should('be.visible')
      .should('contain', 'Retry')
  })

  it('calls onRetry when retry button is clicked', () => {
    const mockEventManager = {
      emit: cy.stub(),
    } as unknown as EventManager
    
    const onRetry = cy.stub().as('onRetry')

    cy.mount(
      <StudioErrorPanel 
        eventManager={mockEventManager}
        onRetry={onRetry}
      />
    )

    cy.get('[data-cy="studio-error-retry-button"]').click()
    
    cy.get('@onRetry').should('have.been.calledOnce')
  })

  it('shows Studio button in header', () => {
    const mockEventManager = {
      emit: cy.stub(),
    } as unknown as EventManager

    cy.mount(
      <StudioErrorPanel 
        eventManager={mockEventManager}
      />
    )

    // Check that the Studio button is present in the header
    cy.get('[data-cy="studio-button"]').should('be.visible')
  })
}) 