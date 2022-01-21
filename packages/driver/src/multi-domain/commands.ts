import type { $Cy } from '../cypress/cy'
import type { SpecBridgeDomainCommunicator } from './communicator'

import $Log from '../cypress/log'

export const handleCommands = (Cypress: Cypress.Cypress, cy: $Cy, specBridgeCommunicator: SpecBridgeDomainCommunicator) => {
  const onCommandEnqueued = (commandAttrs: Cypress.EnqueuedCommand) => {
    const { id, name } = commandAttrs

    // it's not strictly necessary to send the name, but it can be useful
    // for debugging purposes
    specBridgeCommunicator.toPrimary('command:enqueued', { id, name })
  }

  const onCommandEnd = (command: Cypress.CommandQueue) => {
    const id = command.get('id')
    const name = command.get('name')

    specBridgeCommunicator.toPrimary('command:end', { id, name })
  }

  const onLogAdded = (attrs) => {
    specBridgeCommunicator.toPrimary('log:added', $Log.toSerializedJSON(attrs))
  }

  const onLogChanged = (attrs) => {
    specBridgeCommunicator.toPrimary('log:changed', $Log.toSerializedJSON(attrs))
  }

  const onRunCommand = () => {
    const next = cy.state('next')

    if (next) {
      return next()
    }

    // if there's no state('next') for running the next command,
    // the queue hasn't started yet, so run it
    cy.queue.run(false)
    .then(() => {
      specBridgeCommunicator.toPrimary('queue:finished')
    })
  }

  Cypress.on('command:enqueued', onCommandEnqueued)
  Cypress.on('command:end', onCommandEnd)
  Cypress.on('skipped:command:end', onCommandEnd)
  Cypress.on('log:added', onLogAdded)
  Cypress.on('log:changed', onLogChanged)

  specBridgeCommunicator.on('run:command', onRunCommand)
}
