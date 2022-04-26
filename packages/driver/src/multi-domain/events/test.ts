export const handleTestEvents = (Cypress: Cypress.Cypress) => {
  Cypress.specBridgeCommunicator.on('test:before:run', (...args) => {
    Cypress.emit('test:before:run', ...args)
  })

  Cypress.specBridgeCommunicator.on('test:before:run:async', (...args) => {
    Cypress.emit('test:before:run:async', ...args)
  })
}
