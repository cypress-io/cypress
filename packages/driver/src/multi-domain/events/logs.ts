import { LogUtils } from '../../cypress/log'

export const handleLogs = (Cypress: Cypress.Cypress) => {
  const onLogAdded = (attrs) => {
    Cypress.specBridgeCommunicator.toPrimary('log:added', LogUtils.getDisplayProps(attrs))
  }

  const onLogChanged = (attrs) => {
    Cypress.specBridgeCommunicator.toPrimary('log:changed', LogUtils.getDisplayProps(attrs))
  }

  Cypress.on('log:added', onLogAdded)
  Cypress.on('log:changed', onLogChanged)
}
