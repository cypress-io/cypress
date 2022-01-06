import Bluebird from 'bluebird'
import { createDeferred } from '../../util/deferred'
import $errUtils from '../../cypress/error_utils'

export function addCommands (Commands, Cypress: Cypress.Cypress, cy: Cypress.cy, state: Cypress.State) {
  let timeoutId

  // @ts-ignore
  const communicator = Cypress.multiDomainCommunicator

  communicator.on('html:received', () => {
    // when a secondary domain is detected by the proxy, it holds it up
    // to provide time for the spec bridge to be set up. normally, the queue
    // will not continue until the page is stable, but this signals it to go
    // ahead because we're anticipating multidomain
    // @ts-ignore
    cy.isAnticipatingMultidomain(true)

    // cy.isAnticipatingMultidomain(true) will free the queue to move forward.
    // if the next command isn't switchToDomain, this timeout will hit and
    // the test will fail with a cross-origin error
    timeoutId = setTimeout(() => {
      Cypress.backend('ready:for:domain', { shouldInject: false })
    }, 2000)
  })

  Commands.addAll({
    // this isn't fully implemented, but in place to be able to test out
    // the other parts of multidomain
    switchToDomain (domain, doneOrFn, fn) {
      let done
      const cleanup = () => {
        communicator.off('command:enqueued', addCommand)
        communicator.off('command:update', updateCommand)
        communicator.off('done:called', doneAndCleanup)
      }
      const doneAndCleanup = (err) => {
        cleanup()
        done(err)
      }

      if (fn) {
        // TODO: test this
        const doneByReference = cy.state('done')

        // done is available
        // TODO: make sure that doneOrFn in this case is actually the done function through comparison
        if (done !== doneByReference) {
          $errUtils.throwErrByPath('switchToDomain.experiment_not_enabled')
        }

        done = doneOrFn
      } else {
        fn = doneOrFn
      }

      // if done has been provided to the test, allow the user to call done
      // from the switchToDomain context running in the secondary domain.
      if (done) {
        communicator.once('done:called', doneAndCleanup)
      }

      clearTimeout(timeoutId)

      Cypress.log({
        name: 'switchToDomain',
        type: 'parent',
        message: domain,
        end: true,
      })

      // these are proxy commands that represent real commands in a
      // secondary domain. this way, the queue runs in the primary domain
      // with all commands, making it possible to sync up timing for
      // the reporter command log, etc
      const commands = {}
      const logs = {}

      const addCommand = (attrs) => {
        const deferred = createDeferred()

        commands[attrs.id] = {
          deferred,
          name: attrs.name,
        }

        attrs.fn = () => {
          // the real command running in the secondary domain handles its
          // own timeout
          // TODO: add a special, long timeout in case inter-domain
          // communication breaks down somehow
          cy.clearTimeout()

          communicator.toSpecBridge('run:command', {
            name: attrs.name,
            isDoneFnAvailable: !!done,
          })

          return deferred.promise
        }

        Cypress.action('cy:enqueue:command', attrs)
      }

      const updateCommand = (details) => {
        if (details.logAdded) {
          const attrs = details.logAdded

          attrs.consoleProps = () => details.logAdded.consoleProps
          attrs.renderProps = () => details.logAdded.renderProps

          const log = Cypress.log(attrs)

          logs[log.get('id')] = log

          return
        }

        if (details.logChanged) {
          const log = logs[details.logChanged.id]

          if (log) {
            log.set(details.logChanged)
          }

          return
        }

        if (details.end) {
          const command = commands[details.id]

          if (command) {
            delete commands[details.id]
            command.deferred.resolve()
          }
        }
      }

      communicator.on('command:enqueued', addCommand)
      communicator.on('command:update', updateCommand)

      return new Bluebird((resolve, reject) => {
        communicator.once('run:domain:fn', (err) => {
          if (err) {
            cleanup()
            communicator.off('queue:finished', cleanup)
            reject(err)

            return
          }

          resolve()
        })

        if (!done) {
          communicator.once('queue:finished', cleanup)
        }

        // fired once the spec bridge is set up and ready to
        // receive messages
        communicator.once('bridge:ready', () => {
          state('readyForMultidomain', true)
          // let the proxy know to let the response for the secondary
          // domain html through, so the page will finish loading
          Cypress.backend('ready:for:domain', { shouldInject: true })
        })

        cy.once('internal:window:load', ({ type }) => {
          if (type !== 'cross:domain') return

          // once the secondary domain page loads, send along the
          // user-specified callback to run in that domain
          communicator.toSpecBridge('run:domain:fn', {
            fn: fn.toString(),
            isDoneFnAvailable: !!done,
          })

          state('readyForMultidomain', false)
          // @ts-ignore
          cy.isAnticipatingMultidomain(false)
        })

        // this signals to the runner to create the spec bridge for
        // the specified domain
        communicator.emit('expect:domain', domain)
      })
    },
  })
}
