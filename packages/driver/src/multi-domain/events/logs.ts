import type { SpecBridgeDomainCommunicator } from '../communicator'

import $Log from '../../cypress/log'

export const handleLogs = (Cypress: Cypress.Cypress, specBridgeCommunicator: SpecBridgeDomainCommunicator) => {
  const onLogAdded = (attrs) => {
    // TODO:
    // - handle printing console props (need to add to runner)
    //     this.runner.addLog(args[0], this.config('isInteractive'))

    specBridgeCommunicator.toPrimary('log:added', $Log.getDisplayProps(attrs))
  }

  const onLogChanged = (attrs) => {
    // TODO:
    // - add invocation stack if error:
    //     let parsedError = correctStackForCrossDomainError(log.get('err'), this.userInvocationStack)
    // - notify runner? maybe not
    //     this.runner.addLog(args[0], this.config('isInteractive'))

    specBridgeCommunicator.toPrimary('log:changed', $Log.getDisplayProps(attrs))
  }

  Cypress.on('log:added', onLogAdded)
  Cypress.on('log:changed', onLogChanged)
}
