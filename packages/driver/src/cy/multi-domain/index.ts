import Bluebird from 'bluebird'
import $errUtils from '../../cypress/error_utils'
import { Validator } from './validator'
import { createUnserializableSubjectProxy } from './unserializable_subject_proxy'
import { serializeRunnable } from './util'
import { preprocessConfig, preprocessEnv, syncConfigToCurrentOrigin, syncEnvToCurrentOrigin } from '../../util/config'
import { $Location } from '../../cypress/location'
import { LogUtils } from '../../cypress/log'
import logGroup from '../logGroup'

const reHttp = /^https?:\/\//

const normalizeOrigin = (urlOrDomain) => {
  let origin = urlOrDomain

  // If just a domain, convert it to an origin by adding the protocol
  if (!reHttp.test(urlOrDomain)) {
    origin = `https://${urlOrDomain}`
  }

  return $Location.normalize(origin)
}

export function addCommands (Commands, Cypress: Cypress.Cypress, cy: Cypress.cy, state: Cypress.State, config: Cypress.InternalConfig) {
  let timeoutId

  const communicator = Cypress.primaryOriginCommunicator

  communicator.on('delaying:html', (request) => {
    // when a cross origin request is detected by the proxy, it holds it up
    // to provide time for the spec bridge to be set up. normally, the queue
    // will not continue until the page is stable, but this signals it to go
    // ahead because we're anticipating a cross origin request
    cy.isAnticipatingCrossOriginResponseFor(request)
    const location = $Location.create(request.href)

    // If this event has occurred while a cy.origin command is running with
    // the same origin policy, do not set the time out and allow cy.origin
    // to handle the ready for origin event
    if (cy.state('currentActiveOriginPolicy') === location.originPolicy) {
      return
    }

    // If we haven't seen a cy.origin and cleared the timeout within 300ms,
    // go ahead and inform the server 'ready:for:origin' failed and to release the
    // response. This typically happens during a redirect where the user does
    // not have a cy.origin for the intermediary origin.
    timeoutId = setTimeout(() => {
      Cypress.backend('ready:for:origin', { failed: true })
    }, 300)
  })

  Commands.addAll({
    origin<T> (urlOrDomain: string, optionsOrFn: { args: T } | (() => {}), fn?: (args?: T) => {}) {
      // store the invocation stack in the case that `cy.origin` errors
      communicator.userInvocationStack = state('current').get('userInvocationStack')

      clearTimeout(timeoutId)
      // this command runs for as long as the commands in the secondary
      // origin run, so it can't have its own timeout
      cy.clearTimeout()

      if (!config('experimentalLoginFlows')) {
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

      const log = logGroup(Cypress, {
        name: 'origin',
        type: 'parent',
        message: urlOrDomain,
      }, (log) => log)

      const validator = new Validator({
        log,
        onFailure: () => {
          Cypress.backend('ready:for:origin', { failed: true })
        },
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

      const originPolicy = location.originPolicy

      // This is intentionally not reset after leaving the cy.origin command.
      cy.state('latestActiveOriginPolicy', originPolicy)
      // This is set while IN the cy.origin command.
      cy.state('currentActiveOriginPolicy', originPolicy)

      return new Bluebird((resolve, reject, onCancel) => {
        const cleanup = ({ readyForOriginFailed }: {readyForOriginFailed?: boolean} = {}): void => {
          cy.state('currentActiveOriginPolicy', undefined)
          if (!readyForOriginFailed) {
            Cypress.backend('cross:origin:finished', location.originPolicy)
          }

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

          // lets the proxy know to allow the response for the secondary
          // origin html through, so the page will finish loading
          Cypress.backend('ready:for:origin', { originPolicy: location.originPolicy })

          if (err) {
            if (err?.name === 'ReferenceError') {
              const wrappedErr = $errUtils.errByPath('origin.ran_origin_fn_reference_error', {
                error: err.message,
              })

              wrappedErr.name = err.name
              wrappedErr.stack = err.stack

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
            if (err?.name === 'CypressError') {
              // This is a Cypress error thrown from the secondary origin after the command queue has finished, do not wrap it as a spec or app error.
              cy.fail(err, { async: true })
            } else {
              // @ts-ignore
              Cypress.runner.onSpecError('error')({ error: err })
            }
          })
        }

        // fired once the spec bridge is set up and ready to receive messages
        communicator.once('bridge:ready', (_data, specBridgeOriginPolicy) => {
          if (specBridgeOriginPolicy === originPolicy) {
            // now that the spec bridge is ready, instantiate Cypress with the current app config and environment variables for initial sync when creating the instance
            communicator.toSpecBridge(originPolicy, 'initialize:cypress', {
              config: preprocessConfig(Cypress.config()),
              env: preprocessEnv(Cypress.env()),
            })

            // once the secondary origin page loads, send along the
            // user-specified callback to run in that origin
            try {
              communicator.toSpecBridge(originPolicy, 'run:origin:fn', {
                args: options?.args || undefined,
                fn: callbackFn.toString(),
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
                  parentOriginPolicies: [cy.getRemoteLocation('originPolicy')],
                  isStable: Cypress.state('isStable'),
                  autOrigin: Cypress.state('autOrigin'),
                },
                config: preprocessConfig(Cypress.config()),
                env: preprocessEnv(Cypress.env()),
                logCounter: LogUtils.getCounter(),
              })
            } catch (err: any) {
              // Release the request if 'run:origin:fn' fails
              Cypress.backend('ready:for:origin', { failed: true })

              const wrappedErr = $errUtils.errByPath('origin.run_origin_fn_errored', {
                error: err.message,
              })

              wrappedErr.name = err.name
              wrappedErr.stack = err.stack

              // Prevent cypress from trying to add the function to the error log
              wrappedErr.onFail = () => {}

              _reject(wrappedErr, { readyForOriginFailed: true })
            }
          }
        })

        // this signals to the runner to create the spec bridge for the specified origin policy
        communicator.emit('expect:origin', location)
      })
    },
  })
}
