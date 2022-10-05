import Bluebird from 'bluebird'
import $errUtils from '../../../cypress/error_utils'
import $stackUtils from '../../../cypress/stack_utils'
import { Validator } from './validator'
import { createUnserializableSubjectProxy } from './unserializable_subject_proxy'
import { serializeRunnable } from './util'
import { preprocessConfig, preprocessEnv, syncConfigToCurrentOrigin, syncEnvToCurrentOrigin } from '../../../util/config'
import { $Location } from '../../../cypress/location'
import { LogUtils } from '../../../cypress/log'
import logGroup from '../../logGroup'
import type { StateFunc } from '../../../cypress/state'

const reHttp = /^https?:\/\//

const normalizeOrigin = (urlOrDomain) => {
  let origin = urlOrDomain

  // If just a domain, convert it to an origin by adding the protocol
  if (!reHttp.test(urlOrDomain)) {
    origin = `https://${urlOrDomain}`
  }

  return $Location.normalize(origin)
}

export default (Commands, Cypress: Cypress.Cypress, cy: Cypress.cy, state: StateFunc, config: Cypress.InternalConfig) => {
  const communicator = Cypress.primaryOriginCommunicator

  Commands.addAll({
    origin<T> (urlOrDomain: string, optionsOrFn: { args: T } | (() => {}), fn?: (args?: T) => {}) {
      if (Cypress.isBrowser('webkit')) {
        return $errUtils.throwErrByPath('webkit.origin')
      }

      const userInvocationStack = state('current').get('userInvocationStack')

      // store the invocation stack in the case that `cy.origin` errors
      communicator.userInvocationStack = userInvocationStack

      // this command runs for as long as the commands in the secondary
      // origin run, so it can't have its own timeout
      cy.clearTimeout()

      if (!config('experimentalSessionAndOrigin')) {
        $errUtils.throwErrByPath('origin.experiment_not_enabled')
      }

      let options
      let callbackFn

      if (fn) {
        callbackFn = fn
        options = optionsOrFn
      } else {
        callbackFn = optionsOrFn
        options = {
          args: undefined,
        }
      }

      let log

      logGroup(Cypress, {
        name: 'origin',
        type: 'parent',
        message: urlOrDomain,
        // @ts-ignore TODO: revisit once log-grouping has more implementations
      }, (_log) => {
        log = _log
      })

      const validator = new Validator({
        log,
      })

      validator.validate({
        callbackFn,
        options,
        urlOrDomain,
      })

      // use URL to ensure unicode characters are correctly handled
      const url = new URL(normalizeOrigin(urlOrDomain)).toString()
      const location = $Location.create(url)

      validator.validateLocation(location, urlOrDomain)

      const origin = location.origin

      // This is set while IN the cy.origin command.
      cy.state('currentActiveOrigin', origin)

      return new Bluebird((resolve, reject, onCancel) => {
        const cleanup = ({ readyForOriginFailed }: {readyForOriginFailed?: boolean} = {}): void => {
          cy.state('currentActiveOrigin', undefined)

          communicator.off('queue:finished', onQueueFinished)
          communicator.off('sync:globals', onSyncGlobals)
        }

        onCancel && onCancel(() => {
          cleanup()
        })

        const _resolve = ({ subject, unserializableSubjectType }) => {
          cleanup()
          resolve(unserializableSubjectType ? createUnserializableSubjectProxy(unserializableSubjectType) : subject)
        }

        const _reject = (err, cleanupOptions: {readyForOriginFailed?: boolean} = {}) => {
          cleanup(cleanupOptions)
          log?.error(err)
          reject(err)
        }

        const onQueueFinished = ({ err, subject, unserializableSubjectType }) => {
          if (err) {
            return _reject(err)
          }

          _resolve({ subject, unserializableSubjectType })
        }

        const onSyncGlobals = ({ config, env }) => {
          syncConfigToCurrentOrigin(config)
          syncEnvToCurrentOrigin(env)
        }

        communicator.once('sync:globals', onSyncGlobals)

        communicator.once('ran:origin:fn', (details) => {
          const { subject, unserializableSubjectType, err, finished } = details

          if (err) {
            if (err?.name === 'ReferenceError') {
              const wrappedErr = $errUtils.errByPath('origin.ran_origin_fn_reference_error', {
                error: err.message,
              })

              wrappedErr.name = err.name
              wrappedErr.stack = $stackUtils.replacedStack(wrappedErr, err.stack)

              // Prevent cypress from trying to add the function to the error log
              wrappedErr.onFail = () => {}

              return _reject(wrappedErr)
            }

            return _reject(err)
          }

          // if there are not commands and a synchronous return from the callback,
          // this resolves immediately
          if (finished || subject || unserializableSubjectType) {
            _resolve({ subject, unserializableSubjectType })
          }
        })

        communicator.once('queue:finished', onQueueFinished)

        // We don't unbind this even after queue:finished, because an async
        // error could be thrown after the queue is done, but make sure not
        // to stack up listeners on it after it's originally bound
        if (!communicator.listeners('uncaught:error').length) {
          communicator.once('uncaught:error', ({ err }) => {
            cy.fail(err, { async: true })
          })
        }

        // fired once the spec bridge is set up and ready to receive messages
        communicator.once('bridge:ready', async (_data, specBridgeOrigin) => {
          if (specBridgeOrigin === origin) {
            // now that the spec bridge is ready, instantiate Cypress with the current app config and environment variables for initial sync when creating the instance
            communicator.toSpecBridge(origin, 'initialize:cypress', {
              config: preprocessConfig(Cypress.config()),
              env: preprocessEnv(Cypress.env()),
            })

            // Attach the spec bridge to the window to be tested.
            communicator.toSpecBridge(origin, 'attach:to:window')

            const fn = _.isFunction(callbackFn) ? callbackFn.toString() : callbackFn

            // once the secondary origin page loads, send along the
            // user-specified callback to run in that origin
            try {
              communicator.toSpecBridge(origin, 'run:origin:fn', {
                args: options?.args || undefined,
                fn,
                // let the spec bridge version of Cypress know if config read-only values can be overwritten since window.top cannot be accessed in cross-origin iframes
                // this should only be used for internal testing. Cast to boolean to guarantee serialization
                // @ts-ignore
                skipConfigValidation: !!window.top.__cySkipValidateConfig,
                state: {
                  viewportWidth: Cypress.state('viewportWidth'),
                  viewportHeight: Cypress.state('viewportHeight'),
                  runnable: serializeRunnable(Cypress.state('runnable')),
                  duringUserTestExecution: Cypress.state('duringUserTestExecution'),
                  hookId: Cypress.state('hookId'),
                  originCommandBaseUrl: location.href,
                  isStable: Cypress.state('isStable'),
                  autLocation: Cypress.state('autLocation')?.href,
                },
                config: preprocessConfig(Cypress.config()),
                env: preprocessEnv(Cypress.env()),
                logCounter: LogUtils.getCounter(),
              })
            } catch (err: any) {
              const wrappedErr = $errUtils.errByPath('origin.run_origin_fn_errored', {
                error: err.message,
              })

              wrappedErr.name = err.name

              const stack = $stackUtils.replacedStack(wrappedErr, userInvocationStack)

              // add the actual stack, since it might be useful for debugging
              // the failure
              wrappedErr.stack = $stackUtils.stackWithContentAppended({
                appendToStack: {
                  title: 'From Cypress Internals',
                  content: $stackUtils.stackWithoutMessage(err.stack),
                },
              }, stack)

              // @ts-ignore - This keeps Bluebird from messing with the stack.
              // It tries to add a bunch of stuff that's not useful and ends up
              // messing up the stack that we want on the error
              wrappedErr.__stackCleaned__ = true

              // Prevent cypress from trying to add the function to the error log
              wrappedErr.onFail = () => {}

              _reject(wrappedErr, { readyForOriginFailed: true })
            }
          }
        })

        // this signals to the runner to create the spec bridge for the specified origin
        communicator.emit('expect:origin', location)
      })
    },
  })
}
