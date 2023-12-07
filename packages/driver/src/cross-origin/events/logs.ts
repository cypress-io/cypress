export const handleLogs = (Cypress: Cypress.Cypress) => {
  const onLogAdded = (attrs) => {
    Cypress.specBridgeCommunicator.toPrimary('log:added', attrs)
  }

  const onLogChanged = (attrs) => {
    Cypress.specBridgeCommunicator.toPrimary('log:changed', attrs)
  }

  Cypress.on('log:added', onLogAdded)
  Cypress.on('_log:added', onLogAdded)
  Cypress.on('log:changed', onLogChanged)
  Cypress.on('_log:changed', onLogChanged)
}
