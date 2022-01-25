import type { PrimaryDomainCommunicator } from '../../multi-domain/communicator'
import { createDeferred, Deferred } from '../../util/deferred'
import { correctStackForCrossDomainError } from './util'

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
  userInvocationStack: string

  constructor ({ communicator, isDoneFnAvailable, userInvocationStack }) {
    this.communicator = communicator
    this.isDoneFnAvailable = isDoneFnAvailable
    this.userInvocationStack = userInvocationStack
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

  endCommand = ({ id, name, err, logId }) => {
    const command = this.commands[id]

    if (command) {
      delete this.commands[id]
      if (err) {
        // If the command has failed, cast the error back to a proper Error object
        let parsedError = correctStackForCrossDomainError(err, this.userInvocationStack)

        if (logId) {
          // Then, look up the logId associated with the failed command and stub out the onFail handler
          // to short circuit any added reporter command logs if a log exists for the failed command
          parsedError.onFail = () => undefined
        } else {
          delete parsedError.onFail
        }

        command.deferred.reject(parsedError)

        // finally, free up any memory and unbind any handlers now that the command/test has failed
        this.cleanup()
      } else {
        command.deferred.resolve()
      }
    }
  }

  async cleanup () {
    this.communicator.off('command:enqueued', this.addCommand)

    // don't allow for new commands to be enqueued, but wait for commands
    // to update in the secondary domain
    const pendingCommands = Object.values(this.commands).map((command) => {
      return command.deferred.promise
    })

    try {
      await Promise.all(pendingCommands)
    } finally {
      this.communicator.off('command:end', this.endCommand)
    }
  }
}
