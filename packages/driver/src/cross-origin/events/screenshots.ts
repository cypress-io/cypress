export const handleScreenshots = (Cypress: Cypress.Cypress) => {
  Cypress.on('before:screenshot', (config, callbackFn) => {
    Cypress.specBridgeCommunicator.once('before:screenshot:end', () => {
      callbackFn()
    })

    Cypress.specBridgeCommunicator.toPrimary('before:screenshot', config)
  })

  Cypress.on('after:screenshot', (config) => {
    Cypress.specBridgeCommunicator.toPrimary('after:screenshot', config)
  })
}
