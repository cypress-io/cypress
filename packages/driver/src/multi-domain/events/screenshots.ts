import type { SpecBridgeDomainCommunicator } from '../communicator'

export const handleScreenshots = (Cypress: Cypress.Cypress, specBridgeCommunicator: SpecBridgeDomainCommunicator) => {
  Cypress.on('before:screenshot', (config, callbackFn) => {
    specBridgeCommunicator.once('before:screenshot:end', () => {
      callbackFn()
    })

    specBridgeCommunicator.toPrimary('before:screenshot', config)
  })

  Cypress.on('after:screenshot', (config) => {
    specBridgeCommunicator.toPrimary('after:screenshot', config)
  })
}
