import type { SpecBridgeDomainCommunicator } from './communicator'

import $Log from '../cypress/log'

export const handleLogs = (Cypress: Cypress.Cypress, specBridgeCommunicator: SpecBridgeDomainCommunicator) => {
  const onLogAdded = (attrs) => {
    specBridgeCommunicator.toPrimary('log:added', $Log.toSerializedJSON(attrs))
  }

  const onLogChanged = (attrs) => {
    specBridgeCommunicator.toPrimary('log:changed', $Log.toSerializedJSON(attrs))
  }

  Cypress.on('log:added', onLogAdded)
  Cypress.on('log:changed', onLogChanged)
}
