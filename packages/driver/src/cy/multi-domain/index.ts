import Bluebird from 'bluebird'
import $errUtils from '../../cypress/error_utils'
import { CommandsManager } from './commands_manager'
import { LogsManager } from './logs_manager'
import { Validator } from './validator'
import { correctStackForCrossDomainError, serializeRunnable } from './util'
import { preprocessConfig, preprocessEnv, syncConfigToCurrentDomain, syncEnvToCurrentDomain } from '../../util/config'
import { failedToSerializeSubject } from './failedSerializeSubjectProxy'

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
    switchToDomain<T> (domain: string, doneOrDataOrFn: T[] | Mocha.Done | (() => {}), dataOrFn?: T[] | (() => {}), fn?: (data?: T[]) => {}) {
      // store the invocation stack in the case that `switchToDomain` errors
      const userInvocationStack = state('current').get('userInvocationStack')

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

      const validator = new Validator({
        log,
        onFailure: sendReadyForDomain,
      })

      validator.validate({
        callbackFn,
        data,
        domain,
        done,
        doneReference: state('done'),
      })

      const commandsManager = new CommandsManager({
        communicator,
        isDoneFnAvailable: !!done,
        userInvocationStack,
      })

      const logsManager = new LogsManager({
        communicator,
        userInvocationStack,
      })

      const cleanup = () => {
        commandsManager.cleanup()
        logsManager.cleanup()
      }

      const doneAndCleanup = async ({ err }) => {
        communicator.off('done:called', doneAndCleanup)
        // If done is called, immediately unbind command listeners to prevent
        // any commands from being enqueued, but wait for log updates to
        // trickle in before invoking done
        commandsManager.cleanup()
        await logsManager.cleanup()
        done(err ? correctStackForCrossDomainError(err, userInvocationStack) : err)
      }

      if (done) {
        communicator.once('done:called', doneAndCleanup)
      }

      commandsManager.listen()
      logsManager.listen()

      return new Bluebird((resolve, reject) => {
        communicator.once('sync:config', ({ config, env }) => {
          syncConfigToCurrentDomain(config)
          syncEnvToCurrentDomain(env)
        })

        communicator.once('ran:domain:fn', ({ subject, failedToSerializeSubjectOfType, err }) => {
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
          // Otherwise, all commands in the secondary domain (SD) should be
          // enqueued by now. Go ahead and bind the cleanup method for when
          // the command queue finishes in the SD. Otherwise, if no commands
          // are enqueued, clean up the command and log listeners. This case
          // is common if there are only assertions enqueued in the SD.
          if (!commandsManager.hasCommands && !done) {
            cleanup()

            // This handles when a subject is returned synchronously
            resolve(failedToSerializeSubjectOfType ? failedToSerializeSubject(failedToSerializeSubjectOfType) : subject)
          } else {
            resolve()
          }
        })

        // If done is NOT passed into switchToDomain, wait for the command queue
        // to finish in the secondary domain before starting any cleanup
        if (!done) {
          communicator.once('queue:finished', cleanup)
        }

        // fired once the spec bridge is set up and ready to receive messages
        communicator.once('bridge:ready', () => {
          // now that the spec bridge is ready, instantiate Cypress with the current app config and environment variables for initial sync when creating the instance
          communicator.toSpecBridge('initialize:cypress', {
            config: preprocessConfig(Cypress.config()),
            env: preprocessEnv(Cypress.env()),
          })

          state('readyForMultiDomain', true)

          // once the secondary domain page loads, send along the
          // user-specified callback to run in that domain
          try {
            communicator.toSpecBridge('run:domain:fn', {
              data,
              fn: callbackFn.toString(),
              isDoneFnAvailable: !!done,
              // let the spec bridge version of Cypress know if config read-only values can be overwritten since window.top cannot be accessed in cross-origin iframes
              // this should only be used for internal testing. Cast to boolean to guarantee serialization
              // @ts-ignore
              skipConfigValidation: !!window.top.__cySkipValidateConfig,
              state: {
                viewportWidth: Cypress.state('viewportWidth'),
                viewportHeight: Cypress.state('viewportHeight'),
                runnable: serializeRunnable(Cypress.state('runnable')),
                duringUserTestExecution: Cypress.state('duringUserTestExecution'),
              },
              config: preprocessConfig(Cypress.config()),
              env: preprocessEnv(Cypress.env()),
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
