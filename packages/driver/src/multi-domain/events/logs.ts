import { preprocessLogForSerialization } from '../../util/serialization/log'

export const handleLogs = (Cypress: Cypress.Cypress) => {
  const onLogAdded = (attrs) => {
    Cypress.specBridgeCommunicator.toPrimary('log:added', preprocessLogForSerialization(attrs))
  }

  const onLogChanged = (attrs) => {
    Cypress.specBridgeCommunicator.toPrimary('log:changed', preprocessLogForSerialization(attrs))
  }

  Cypress.on('log:added', onLogAdded)
  Cypress.on('log:changed', onLogChanged)
}
