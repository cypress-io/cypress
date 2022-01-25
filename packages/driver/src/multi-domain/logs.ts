import type { SpecBridgeDomainCommunicator } from './communicator'

import $Log from '../cypress/log'

export const handleLogs = (Cypress: Cypress.Cypress, specBridgeCommunicator: SpecBridgeDomainCommunicator) => {
  const onLogAdded = (attrs) => {
    specBridgeCommunicator.toPrimary('log:added', attrs, $Log.toSerializedJSON)
  }

  const onLogChanged = (attrs) => {
    specBridgeCommunicator.toPrimary('log:changed', attrs, $Log.toSerializedJSON)
  }

  Cypress.on('log:added', onLogAdded)
  Cypress.on('log:changed', onLogChanged)
}
