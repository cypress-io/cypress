export const handleLogs = (Cypress: Cypress.Cypress) => {
  const onLogAdded = (attrs) => {
    Cypress.specBridgeCommunicator.toPrimary('_log:added', attrs)
  }

  const onLogChanged = (attrs) => {
    Cypress.specBridgeCommunicator.toPrimary('_log:changed', attrs)
  }

  Cypress.on('_log:added', onLogAdded)
  Cypress.on('_log:changed', onLogChanged)
}
