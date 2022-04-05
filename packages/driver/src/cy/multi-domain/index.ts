import Bluebird from 'bluebird'
import $errUtils from '../../cypress/error_utils'
import { Validator } from './validator'
import { createUnserializableSubjectProxy } from './unserializable_subject_proxy'
import { serializeRunnable } from './util'
import { preprocessConfig, preprocessEnv, syncConfigToCurrentDomain, syncEnvToCurrentDomain } from '../../util/config'
import { $Location } from '../../cypress/location'
import { LogUtils } from '../../cypress/log'

const reHttp = /^https?:\/\//

const normalizeOrigin = (originOrDomain) => {
  let origin = originOrDomain

  // If just a domain, convert it to an origin by adding the protocol
  if (!reHttp.test(originOrDomain)) {
    origin = `https://${originOrDomain}`
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
    // @ts-ignore

    cy.isAnticipatingCrossOriginResponseFor(request)
    const location = $Location.create(request.href)

    // If this event has occurred while a switchToDomain command is running with
    // the same origin policy, do not set the time out and allow switchToDomain
    // to handle the ready for domain event
    if (cy.state('currentActiveOriginPolicy') === location.originPolicy) {
      return
    }

    // If we haven't seen a switchToDomain and cleared the timeout within 300ms,
    // go ahead and inform the server 'ready:for:domain' failed and to release the
    // response. This typically happens during a redirect where the user does
    // not have a switchToDomain for the intermediary origin.
    timeoutId = setTimeout(() => {
      Cypress.backend('ready:for:domain', { failed: true })
    }, 300)
  })

  Commands.addAll({
    switchToDomain<T> (originOrDomain: string, optionsOrFn: { args: T } | (() => {}), fn?: (args?: T) => {}) {
      // store the invocation stack in the case that `switchToDomain` errors
      communicator.userInvocationStack = state('current').get('userInvocationStack')

      clearTimeout(timeoutId)
      // this command runs for as long as the commands in the secondary
      // origin run, so it can't have its own timeout
      cy.clearTimeout()

      if (!config('experimentalMultiDomain')) {
        $errUtils.throwErrByPath('switchToDomain.experiment_not_enabled')
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

      const log = Cypress.log({
        name: 'switchToDomain',
        type: 'parent',
        message: originOrDomain,
        end: true,
      })

      const validator = new Validator({
        log,
        onFailure: () => {
          Cypress.backend('ready:for:domain', { failed: true })
        },
      })

      validator.validate({
        callbackFn,
        options,
        originOrDomain,
      })

      // use URL to ensure unicode characters are correctly handled
      const url = new URL(normalizeOrigin(originOrDomain)).toString()
      const location = $Location.create(url)

      validator.validateLocation(location, originOrDomain)

      const originPolicy = location.originPolicy

      // This is not reset after leaving the switchToDomain command.
      cy.state('latestActiveOriginPolicy', originPolicy)
      // This is set while IN the switchToDomain command.
      cy.state('currentActiveOriginPolicy', originPolicy)

      return new Bluebird((resolve, reject, onCancel) => {
        const cleanup = () => {
          cy.state('currentActiveOriginPolicy', undefined)
          Cypress.backend('cross:origin:finished', location.originPolicy)
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
          cleanup()
          log.error(err)
          reject(err)
        }

        const onQueueFinished = ({ err, subject, unserializableSubjectType }) => {
          if (err) {
            return _reject(err)
          }

          _resolve({ subject, unserializableSubjectType })
        }

        const onSyncGlobals = ({ config, env }) => {
          syncConfigToCurrentDomain(config)
          syncEnvToCurrentDomain(env)
        }

        communicator.once('sync:globals', onSyncGlobals)

        communicator.once('ran:domain:fn', (details) => {
          const { subject, unserializableSubjectType, err, finished } = details

          // lets the proxy know to allow the response for the secondary
          // origin html through, so the page will finish loading
          Cypress.backend('ready:for:domain', { originPolicy: location.originPolicy })

          if (err) {
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
            // @ts-ignore
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
              communicator.toSpecBridge(originPolicy, 'run:domain:fn', {
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
                  hasVisitedAboutBlank: Cypress.state('hasVisitedAboutBlank'),
                  switchToDomainBaseUrl: location.origin,
                  parentOriginPolicies: [cy.getRemoteLocation('originPolicy')],
                  isStable: Cypress.state('isStable'),
                  autOrigin: Cypress.state('autOrigin'),
                },
                config: preprocessConfig(Cypress.config()),
                env: preprocessEnv(Cypress.env()),
                logCounter: LogUtils.getCounter(),
              })
            } catch (err: any) {
              const wrappedErr = $errUtils.errByPath('switchToDomain.run_domain_fn_errored', {
                error: err.message,
              })

              _reject(wrappedErr)
            }
          }
        })

        // this signals to the runner to create the spec bridge for the specified origin policy
        communicator.emit('expect:domain', location)
      })
    },
  })
}
