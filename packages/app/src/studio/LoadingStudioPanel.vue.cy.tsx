import { createEventManager } from '../../cypress/component/support/ctSupport'
import LoadingStudioPanel from './LoadingStudioPanel.vue'

describe('LoadingStudioPanel', () => {
  it('renders loading studio panel', () => {
    const eventManager = createEventManager()

    cy.mount(<LoadingStudioPanel eventManager={eventManager} />)

    cy.contains('Setting up Cypress Studio...')
    cy.get('[data-cy="studio-button"]').should('be.visible')
    cy.percySnapshot()
  })
})
