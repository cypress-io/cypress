import Bluebird from 'bluebird'
import $errUtils from '../../../cypress/error_utils'
import $stackUtils from '../../../cypress/stack_utils'
import { Validator } from './validator'
import { isFunction } from 'lodash'
import { createUnserializableSubjectProxy } from './unserializable_subject_proxy'
import { serializeRunnable } from './util'
import { preprocessConfig, preprocessEnv, syncConfigToCurrentOrigin, syncEnvToCurrentOrigin } from '../../../util/config'
import { $Location } from '../../../cypress/location'
import { LogUtils } from '../../../cypress/log'
import logGroup from '../../logGroup'
import type { StateFunc } from '../../../cypress/state'
import { runPrivilegedCommand } from '../../../util/privileged_channel'

const reHttp = /^https?:\/\//

const normalizeOrigin = (urlOrDomain) => {
  let origin = urlOrDomain

  // If just a domain, convert it to an origin by adding the protocol
  if (!reHttp.test(urlOrDomain)) {
    origin = `https://${urlOrDomain}`
  }

  return $Location.normalize(origin)
}

type OptionsOrFn<T> = { args: T } | (() => {})
type Fn<T> = (args?: T) => {}

export default (Commands, Cypress: Cypress.Cypress, cy: Cypress.cy, state: StateFunc, config: Cypress.InternalConfig) => {
  const communicator = Cypress.primaryOriginCommunicator

  Commands.addAll({
    origin<T> (urlOrDomain: string, optionsOrFn: OptionsOrFn<T>, fn?: Fn<T>, ...extras: never[]) {
      if (Cypress.isBrowser('webkit')) {
        return $errUtils.throwErrByPath('webkit.origin')
      }

      const userInvocationStack = state('current').get('userInvocationStack')

      // store the invocation stack in the case that `cy.origin` errors
      communicator.userInvocationStack = userInvocationStack

      // this command runs for as long as the commands in the secondary
      // origin run, so it can't have its own timeout except in the case where we're creating the spec bridge.
      cy.clearTimeout()

      let options
      let callbackFn
      const timeout = Cypress.config('defaultCommandTimeout')

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
        timeout,
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

      validator.validateLocation(location, urlOrDomain, window.location.href)

      const origin = location.origin

      // This is set while IN the cy.origin command.
      cy.state('currentActiveOrigin', origin)

      return new Bluebird((resolve, reject, onCancel) => {
        const cleanup = (): void => {
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

        const _reject = (err) => {
          // Prevent cypress from trying to add the function to the error log
          err.onFail = () => {}
          cleanup()
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

        // If the spec bridge isn't created in time, it likely failed and we shouldn't hang the test.
        const timeoutId = setTimeout(() => {
          _reject($errUtils.errByPath('origin.failed_to_create_spec_bridge'))
        }, timeout)

        // fired once the spec bridge is set up and ready to receive messages
        communicator.once('bridge:ready', async (_data, { origin: specBridgeOrigin }) => {
          if (specBridgeOrigin === origin) {
            clearTimeout(timeoutId)
            // now that the spec bridge is ready, instantiate Cypress with the current app config and environment variables for initial sync when creating the instance
            communicator.toSpecBridge(origin, 'initialize:cypress', {
              config: preprocessConfig(Cypress.config()),
              env: preprocessEnv(Cypress.env()),
            })

            // Attach the spec bridge to the window to be tested.
            communicator.toSpecBridge(origin, 'attach:to:window')
            const fn = isFunction(callbackFn) ? callbackFn.toString() : callbackFn
            const file = $stackUtils.getSourceDetailsForFirstLine(userInvocationStack, config('projectRoot'))?.absoluteFile

            try {
              // origin is a privileged command, meaning it has to be invoked
              // from the spec or support file
              await runPrivilegedCommand({
                commandName: 'origin',
                cy,
                Cypress: (Cypress as unknown) as InternalCypress.Cypress,
                options: {
                  specBridgeOrigin,
                },
              })

              // once the secondary origin page loads, send along the
              // user-specified callback to run in that origin
              communicator.toSpecBridge(origin, 'run:origin:fn', {
                args: options?.args || undefined,
                fn,
                file,
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
                  crossOriginCookies: Cypress.state('crossOriginCookies'),
                },
                config: preprocessConfig(Cypress.config()),
                env: preprocessEnv(Cypress.env()),
                logCounter: LogUtils.getCounter(),
              })
            } catch (err: any) {
              if (err.isNonSpec) {
                return _reject($errUtils.errByPath('miscellaneous.non_spec_invocation', {
                  cmd: 'origin',
                }))
              }

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
              _reject(wrappedErr)
            }
          }
        })

        // this signals to the runner to create the spec bridge for the specified origin
        communicator.emit('expect:origin', location)
      })
    },
  })
}
