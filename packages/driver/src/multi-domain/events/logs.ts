import $Log from '../../cypress/log'

export const handleLogs = (Cypress: Cypress.Cypress) => {
  const onLogAdded = (attrs) => {
    // TODO:
    // - handle printing console props (need to add to runner)
    //     this.runner.addLog(args[0], this.config('isInteractive'))

    Cypress.specBridgeCommunicator.toPrimary('log:added', $Log.getDisplayProps(attrs))
  }

  const onLogChanged = (attrs) => {
    // TODO:
    // - add invocation stack if error:
    //     let parsedError = correctStackForCrossDomainError(log.get('err'), this.userInvocationStack)
    // - notify runner? maybe not
    //     this.runner.addLog(args[0], this.config('isInteractive'))

    Cypress.specBridgeCommunicator.toPrimary('log:changed', $Log.getDisplayProps(attrs))
  }

  Cypress.on('log:added', onLogAdded)
  Cypress.on('log:changed', onLogChanged)
}
