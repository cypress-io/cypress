import type { $Cy } from '../../cypress/cy'
import type { SpecBridgeDomainCommunicator } from '../communicator'

let viewportChangedCallbackFn

export const handleMiscEvents = (Cypress: Cypress.Cypress, cy: $Cy, specBridgeCommunicator: SpecBridgeDomainCommunicator) => {
  Cypress.on('viewport:changed', (viewport, fn) => {
    viewportChangedCallbackFn = fn

    specBridgeCommunicator.toPrimary('viewport:changed', viewport)
  })

  specBridgeCommunicator.on('viewport:changed:end', () => {
    if (viewportChangedCallbackFn) viewportChangedCallbackFn()
  })

  // TODO: Should state syncing be built into cy.state instead of being explicitly called?
  specBridgeCommunicator.on('sync:state', (state) => {
    cy.state(state)
  })

  // Listen for window load events from the primary window to resolve page loads
  specBridgeCommunicator.on('window:load', ({ url }) => {
    cy.isStable(true, 'load')
    Cypress.emit('internal:window:load', { type: 'cross:domain', url })
  })

  // Forward url:changed Message to the primary domain to enable changing the url displayed in the AUT
  // @ts-ignore
  Cypress.on('url:changed', (url) => {
    specBridgeCommunicator.toPrimary('url:changed', { url })
  })
}
