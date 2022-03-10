import type { $Cy } from '../../cypress/cy'
import type { SpecBridgeDomainCommunicator } from '../communicator'

export const handleMiscEvents = (Cypress: Cypress.Cypress, cy: $Cy, specBridgeCommunicator: SpecBridgeDomainCommunicator) => {
  Cypress.on('viewport:changed', (viewport, callbackFn) => {
    specBridgeCommunicator.once('viewport:changed:end', () => {
      callbackFn()
    })

    specBridgeCommunicator.toPrimary('viewport:changed', viewport)
  })

  // TODO: Should state syncing be built into cy.state instead of being explicitly called?
  specBridgeCommunicator.on('sync:state', (state) => {
    cy.state(state)
  })

  // Forward url:changed Message to the primary domain to enable changing the url displayed in the AUT
  // @ts-ignore
  Cypress.on('url:changed', (url) => {
    specBridgeCommunicator.toPrimary('url:changed', url)
  })
}
