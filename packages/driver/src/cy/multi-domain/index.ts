import Bluebird from 'bluebird'
import { AssertionError } from 'chai'
import _ from 'lodash'
import { createDeferred, Deferred } from '../../util/deferred'
import $utils from '../../cypress/utils'
import $errUtils from '../../cypress/error_utils'

export function addCommands (Commands, Cypress: Cypress.Cypress, cy: Cypress.cy, state: Cypress.State, config: Cypress.InternalConfig) {
  let timeoutId
  const correctStackForCrossDomainError = (serializedError: any, userInvocationStack: string) => {
    //  Since Errors sent over postMessage need to be serialized to Objects, we need to serialize them back into Error instances
    let errorClass

    switch (serializedError?.name) {
      case 'AssertionError':
        errorClass = AssertionError
        break
      default:
        errorClass = Error
    }

    // only assign missing properties on the object to reify the error properly
    const reifiedError = _.assignWith(new errorClass(serializedError?.message), serializedError, (objValue, srcValue) => {
      return _.isUndefined(objValue) ? srcValue : objValue
    })

    reifiedError.stack = userInvocationStack

    return reifiedError
  }

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
    // the other parts of multi-domain
    switchToDomain<T> (domain: string, doneOrDataOrFn: T[] | Mocha.Done | (() => {}), dataOrFn?: T[] | (() => {}), fn?: (data?: T[]) => {}) {
      // store the invocation stack in the case that `switchToDomain` errors
      const switchToDomainUserInvocationStack = state('current').get('userInvocationStack')

      clearTimeout(timeoutId)

      if (!config('experimentalMultiDomain')) {
        $errUtils.throwErrByPath('switchToDomain.experiment_not_enabled')
      }

      let done
      let data
      let callbackFn

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

      if (data && !Array.isArray(data)) {
        sendReadyForDomain()

        $errUtils.throwErrByPath('switchToDomain.invalid_data_argument', {
          onFail: log,
          args: { arg: $utils.stringify(data) },
        })
      }

      if (typeof callbackFn !== 'function') {
        sendReadyForDomain()

        $errUtils.throwErrByPath('switchToDomain.invalid_fn_argument', {
          onFail: log,
          args: { arg: $utils.stringify(callbackFn) },
        })
      }

      // these are proxy commands that represent real commands in a
      // secondary domain. this way, the queue runs in the primary domain
      // with all commands, making it possible to sync up timing for
      // the reporter command log, etc
      const commands: { [key: string]: {
        deferred: Deferred
        name: string
      }} = {}

      const logs: { [key: string]: {
        deferred: Deferred
        log: Cypress.Log
      }} = {}

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

      const endCommand = ({ id, name, err, logId }) => {
        const command = commands[id]

        if (command) {
          delete commands[id]
          if (err) {
            // If the command has failed, cast the error back to a proper Error object
            let parsedError = correctStackForCrossDomainError(err, switchToDomainUserInvocationStack)

            if (logId) {
              // Then, look up the logId associated with the failed command and stub out the onFail handler
              // to short circuit any added reporter command logs if a log exists for the failed command
              parsedError.onFail = () => undefined
            } else {
              delete parsedError.onFail
            }

            command.deferred.reject(parsedError)

            // finally, free up any memory and unbind any handlers now that the command/test has failed
            cleanup()
          } else {
            command.deferred.resolve()
          }
        }
      }

      const onLogAdded = (attrs) => {
        if (attrs) {
          attrs.consoleProps = () => attrs.consoleProps
          attrs.renderProps = () => attrs.renderProps

          const log = Cypress.log(attrs)

          // if the log needs to stream updates, defer its result to make sure all streamed updates come in
          if (!attrs.ended) {
            logs[log.get('id')] = {
              log,
              deferred: createDeferred(),
            }
          }
        }
      }

      const onLogChanged = (attrs) => {
        const changedLog = logs[attrs?.id]

        // NOTE: sometimes debug logs that are created in the secondary are only emitted through 'log:changed' events
        // and no initial log is created in 'log:added
        // These logs are not important to the primary domain, so we can ignore them
        if (changedLog) {
          const { deferred, log } = changedLog

          const logAttrs = log.get()

          _.forEach(attrs, (value: any, key: string) => {
            if (
              value != null
                && !(_.isObject(value) && _.isEmpty(value))
                && !_.isEqual(value, logAttrs[key])
            ) {
              log.set(key as keyof Cypress.LogConfig, value)
            }
          })

          const isEnded = log.get('ended')

          if (isEnded) {
            if (log.get('state') === 'failed') {
              const err = log.get('err')
              let parsedError = correctStackForCrossDomainError(err, switchToDomainUserInvocationStack)

              // The toJSON method on the Cypress.Log converts the 'error' property to 'err', so when the log gets
              // serialized from the SD to the PD, we need to do the opposite
              log.set('error', parsedError)
              if ((logAttrs.consoleProps as any)?.Error) {
                // Update consoleProps for when users pin failed commands in the reporter so correct error messages are displayed in the console
                (logAttrs.consoleProps as any).Error = parsedError.stack
              }
            }

            delete logs[attrs.id]
            deferred.resolve()
          }
        }
      }

      const cleanupCommands = async () => {
        communicator.off('command:enqueued', addCommand)

        // don't allow for new commands to be enqueued, but wait for commands to update in the secondary domain
        const pendingCommands = _.map(commands, (command) => command.deferred.promise)

        try {
          await Promise.all(pendingCommands)
        } finally {
          communicator.off('command:end', endCommand)
        }
      }

      const cleanupLogs = async () => {
        communicator.off('log:added', onLogAdded)

        // don't allow for new logs to be added, but wait for logs to update changes in the secondary domain
        const pendingLogs = _.map(logs, (log) => log.deferred.promise)

        try {
          await Promise.all(pendingLogs)
        } finally {
          communicator.off('log:changed', onLogChanged)
        }
      }

      const cleanup = () => {
        cleanupCommands()
        cleanupLogs()
      }

      const doneAndCleanup = async (err) => {
        communicator.off('done:called', doneAndCleanup)
        // If done is called, immediately unbind command listeners to prevent any commands from being enqueued, but wait for log updates to trickle in before invoking done
        cleanupCommands()
        await cleanupLogs()
        done(err)
      }

      if (done) {
        const doneByReference = cy.state('done')

        // If three or more arguments are passed in, verify the second argument is actually the done fn
        if (done !== doneByReference) {
          sendReadyForDomain()

          $errUtils.throwErrByPath('switchToDomain.done_reference_mismatch', { onFail: log })
        }

        communicator.once('done:called', doneAndCleanup)
      }

      communicator.on('command:enqueued', addCommand)
      communicator.on('command:end', endCommand)

      communicator.on('log:added', onLogAdded)
      communicator.on('log:changed', onLogChanged)

      return new Bluebird((resolve, reject) => {
        communicator.once('ran:domain:fn', (err) => {
          sendReadyForDomain()
          if (err) {
            if (done) {
              communicator.off('done:called', doneAndCleanup)
            } else {
              communicator.off('queue:finished', cleanup)
            }

            cleanup()
            reject(err)

            return
          }

          // If done is passed into switchToDomain, wait to unbind any listeners
          // Otherwise, all commands in the secondary domain (SD) should be enqueued by now.
          // Go ahead and bind the cleanup method for when the command queue finishes in the SD.
          // Otherwise, if no commands are enqueued, clean up the command and log listeners.
          // This case is common if there are only assertions enqueued in the SD.
          if (_.size(commands) === 0 && !done) {
            cleanup()
          }

          resolve()
        })

        // If done is NOT passed into switchToDomain, wait for the command queue to finish in the secondary domain before starting any cleanup
        if (!done) {
          communicator.once('queue:finished', cleanup)
        }

        // fired once the spec bridge is set up and ready to
        // receive messages
        communicator.once('bridge:ready', () => {
          state('readyForMultiDomain', true)

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

            cleanup()
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
