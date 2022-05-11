import type { $Cy } from '../../cypress/cy'

export const handleMiscEvents = (Cypress: Cypress.Cypress, cy: $Cy) => {
  Cypress.on('viewport:changed', (viewport, callbackFn) => {
    Cypress.specBridgeCommunicator.once('viewport:changed:end', () => {
      callbackFn()
    })

    Cypress.specBridgeCommunicator.toPrimary('viewport:changed', viewport)
  })

  Cypress.specBridgeCommunicator.on('sync:state', (state) => {
    cy.state(state)
  })

  // Forward url:changed Message to the primary origin to enable changing the url displayed in the AUT
  // @ts-ignore
  Cypress.on('url:changed', (url) => {
    Cypress.specBridgeCommunicator.toPrimary('url:changed', { url })
  })

  // Listen for any unload events in other origins, if any have unloaded we should also become unstable.
  Cypress.specBridgeCommunicator.on('before:unload', () => {
    cy.state('isStable', false)
  })
}
