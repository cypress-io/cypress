import type { SpecBridgeDomainCommunicator } from '../communicator'

export const handleScreenshots = (Cypress: Cypress.Cypress, specBridgeCommunicator: SpecBridgeDomainCommunicator) => {
  let beforeScreenshotCallback

  Cypress.on('before:screenshot', (config, cb) => {
    beforeScreenshotCallback = cb

    specBridgeCommunicator.toPrimary('before:screenshot', config)
  })

  specBridgeCommunicator.on('before:screenshot:end', () => {
    if (beforeScreenshotCallback) {
      beforeScreenshotCallback()
      beforeScreenshotCallback = null
    }
  })

  Cypress.on('after:screenshot', (config) => {
    specBridgeCommunicator.toPrimary('after:screenshot', config)
  })
}
