import StudioErrorPanel from './StudioErrorPanel.vue'
import type { EventManager } from '../runner/event-manager'
import { IconCypressStudio } from '@cypress-design/vue-icon'
import { h } from 'vue'

describe('<StudioErrorPanel />', () => {
  it('renders error state with correct content', () => {
    const mockEventManager = {} as unknown as EventManager

    cy.mount(
      <StudioErrorPanel
        eventManager={mockEventManager}
        onRetry={() => {}}
      />,
    )

    // Check that the error panel is displayed
    cy.findByTestId('studio-error-panel').should('be.visible')

    // Check for the error icon
    cy.findByTestId('studio-error-panel')
    .find('svg')
    .should('be.visible')

    // Check for the error description
    cy.findByTestId('studio-error-panel').should('contain.text', 'There was a problem with Cypress Studio. Our team has been notified. If the problem persists, please try again later.')
    cy.contains('Our team has been notified').should('be.visible')

    // Check for the retry button
    cy.findByTestId('studio-error-retry-button')
    .should('be.visible')
    .should('contain', 'Retry')
  })

  it('renders error state with custom content', () => {
    const mockEventManager = {
      ws: {
        emit: cy.stub().as('emit'),
      },
    } as unknown as EventManager

    cy.mount(
      <StudioErrorPanel
        eventManager={mockEventManager}
        onRetry={() => {}}
        title="Custom title"
        message="Custom message"
        icon={() => {
          return h(IconCypressStudio, {
            size: '48',
            'fill-color': 'gray-500',
          })
        }}
        learnMoreUrl="https://on.cypress.io/custom-learn-more-url"
      />,
    )

    // Check that the error panel is displayed
    cy.findByTestId('studio-error-panel').should('be.visible')

    // Check for the error icon
    cy.findByTestId('studio-error-panel')
    .find('svg')
    .should('be.visible')

    // Check for the error title
    cy.findByTestId('studio-error-title').should('contain.text', 'Custom title')
    // Check for the error description
    cy.findByTestId('studio-error-message').should('contain.text', 'Custom message')

    // Check for the learn more button
    cy.findByTestId('studio-error-learn-more-button')
    .should('be.visible')
    .should('contain', 'Learn more')
    .click()

    cy.get('@emit').should('have.been.calledOnceWith', 'external:open', 'https://on.cypress.io/custom-learn-more-url')

    // Check for the retry button
    cy.findByTestId('studio-error-retry-button')
    .should('be.visible')
    .should('contain', 'Retry')
  })

  it('calls onRetry when retry button is clicked', () => {
    const mockEventManager = {} as unknown as EventManager

    const onRetry = cy.stub().as('onRetry')

    cy.mount(
      <StudioErrorPanel
        eventManager={mockEventManager}
        onRetry={onRetry}
      />,
    )

    cy.findByTestId('studio-error-retry-button').click()

    cy.get('@onRetry').should('have.been.calledOnce')
  })

  it('shows Studio button in header', () => {
    const mockEventManager = {} as unknown as EventManager

    cy.mount(
      <StudioErrorPanel
        eventManager={mockEventManager}
        onRetry={() => {}}
      />,
    )

    // Check that the Studio button is present in the header
    cy.findByTestId('studio-button').should('be.visible')
  })
})
