import Bluebird from 'bluebird'
import { createDeferred } from '../../util/deferred'
import $utils from '../../cypress/utils'
import $errUtils from '../../cypress/error_utils'

export function addCommands (Commands, Cypress: Cypress.Cypress, cy: Cypress.cy, state: Cypress.State, config: Cypress.InternalConfig) {
  let timeoutId

  // @ts-ignore
  const communicator = Cypress.multiDomainCommunicator

  const sendReadyForDomain = () => {
    // lets the proxy know to allow the response for the secondary
    // domain html through, so the page will finish loading
    Cypress.backend('ready:for:domain')
  }

  communicator.on('delaying:html', () => {
    // when a secondary domain is detected by the proxy, it holds it up
    // to provide time for the spec bridge to be set up. normally, the queue
    // will not continue until the page is stable, but this signals it to go
    // ahead because we're anticipating multi-domain
    // @ts-ignore
    cy.isAnticipatingMultiDomain(true)

    // cy.isAnticipatingMultiDomain(true) will free the queue to move forward.
    // if the next command isn't switchToDomain, this timeout will hit and
    // the test will fail with a cross-origin error
    timeoutId = setTimeout(sendReadyForDomain, 2000)
  })

  Commands.addAll({
    // this isn't fully implemented, but in place to be able to test out
    // the other parts of multidomain
    switchToDomain<T> (domain: string, doneOrDataOrFn: T | Mocha.Done | (() => {}), dataOrFn?: T | (() => {}), fn?: (data?: T) => {}) {
      clearTimeout(timeoutId)

      if (!config('experimentalMultiDomain')) {
        $errUtils.throwErrByPath('switchToDomain.experiment_not_enabled')
      }

      let done
      let data
      let callbackFn

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
        callbackFn = fn
        done = doneOrDataOrFn
        data = dataOrFn

        // if done has been provided to the test, allow the user to call done
        // from the switchToDomain context running in the secondary domain.
      } else if (dataOrFn) {
        callbackFn = dataOrFn

        if (typeof doneOrDataOrFn === 'function') {
          done = doneOrDataOrFn
        } else {
          data = doneOrDataOrFn
        }
      } else {
        callbackFn = doneOrDataOrFn
      }

      const log = Cypress.log({
        name: 'switchToDomain',
        type: 'parent',
        message: domain,
        end: true,
      })

      if (typeof domain !== 'string') {
        sendReadyForDomain()

        $errUtils.throwErrByPath('switchToDomain.invalid_domain_argument', {
          onFail: log,
          args: { arg: $utils.stringify(domain) },
        })
      }

      if (typeof callbackFn !== 'function') {
        sendReadyForDomain()

        $errUtils.throwErrByPath('switchToDomain.invalid_fn_argument', {
          onFail: log,
          args: { arg: $utils.stringify(callbackFn) },
        })
      }

      if (done) {
        const doneByReference = cy.state('done')

        // if three arguments are passed in, verify the second argument is actually the done fn
        if (done !== doneByReference) {
          sendReadyForDomain()

          $errUtils.throwErrByPath('switchToDomain.done_reference_mismatch', { onFail: log })
        }

        communicator.once('done:called', doneAndCleanup)
      }

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
        communicator.once('ran:domain:fn', (err) => {
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
          state('readyForMultiDomain', true)
          sendReadyForDomain()
        })

        cy.once('internal:window:load', ({ type }) => {
          if (type !== 'cross:domain') return

          // once the secondary domain page loads, send along the
          // user-specified callback to run in that domain
          try {
            communicator.toSpecBridge('run:domain:fn', {
              data,
              fn: callbackFn.toString(),
              isDoneFnAvailable: !!done,
            })
          } catch (err: any) {
            const wrappedErr = $errUtils.errByPath('switchToDomain.run_domain_fn_errored', {
              error: err.message,
            })

            reject(wrappedErr)
          } finally {
            state('readyForMultidomain', false)
            // @ts-ignore
            cy.isAnticipatingMultiDomain(false)
          }
        })

        // this signals to the runner to create the spec bridge for
        // the specified domain
        communicator.emit('expect:domain', domain)
      })
    },
  })
}
