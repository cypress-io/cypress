import type { SpecBridgeDomainCommunicator } from '../communicator'

export const handleTestEvents = (Cypress: Cypress.Cypress, specBridgeCommunicator: SpecBridgeDomainCommunicator) => {
  specBridgeCommunicator.on('test:before:run', (...args) => {
    Cypress.emit('test:before:run', ...args)
  })
}
