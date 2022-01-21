import type { PrimaryDomainCommunicator } from '../../multi-domain/communicator'
import { createDeferred, Deferred } from '../../util/deferred'

export class CommandsManager {
  // these are proxy commands that represent real commands in a
  // secondary domain. this way, the queue runs in the primary domain
  // with all commands, making it possible to sync up timing for
  // the reporter command log, etc
  commands: { [key: string]: {
    deferred: Deferred
    name: string
  }} = {}

  communicator: PrimaryDomainCommunicator
  isDoneFnAvailable: boolean

  constructor ({ communicator, isDoneFnAvailable }) {
    this.communicator = communicator
    this.isDoneFnAvailable = isDoneFnAvailable
  }

  get hasCommands () {
    return Object.keys(this.commands).length > 0
  }

  listen () {
    this.communicator.on('command:enqueued', this.addCommand)
    this.communicator.on('command:end', this.endCommand)
  }

  addCommand = (attrs) => {
    const deferred = createDeferred()

    this.commands[attrs.id] = {
      deferred,
      name: attrs.name,
    }

    attrs.fn = () => {
      // the real command running in the secondary domain handles its
      // own timeout
      // TODO: add a special, long timeout in case inter-domain
      // communication breaks down somehow
      cy.clearTimeout()

      this.communicator.toSpecBridge('run:command', {
        name: attrs.name,
        isDoneFnAvailable: this.isDoneFnAvailable,
      })

      return deferred.promise
    }

    Cypress.action('cy:enqueue:command', attrs)
  }

  endCommand = ({ id }) => {
    const command = this.commands[id]

    if (command) {
      delete this.commands[id]
      command.deferred.resolve()
    }
  }

  async cleanup () {
    this.communicator.off('command:enqueued', this.addCommand)

    // don't allow for new commands to be enqueued, but wait for commands
    // to update in the secondary domain
    const pendingCommands = Object.values(this.commands).map((command) => {
      return command.deferred.promise
    })

    await Promise.all(pendingCommands)
    this.communicator.off('command:end', this.endCommand)
  }
}
