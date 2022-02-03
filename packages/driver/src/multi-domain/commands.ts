import type { $Cy } from '../cypress/cy'
import type { SpecBridgeDomainCommunicator } from './communicator'

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
    const logId = command.getLastLog()?.get('id')

    let subject: string | undefined = undefined

    // Prevent serialization if this isn't the last command in the queue.
    if (cy.queue.last()?.get('id') === id) {
      subject = cy.state('subject')
    }

    // we need to serialize and send back the subject on each command because the next chained
    // command outside of the multi-domain context will not wait for the queue finished event.
    specBridgeCommunicator.toPrimaryCommandEnd({ id, name, subject, logId })
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

  specBridgeCommunicator.on('run:command', onRunCommand)
}
