import Bluebird from 'bluebird'
import $errUtils from '../../cypress/error_utils'
import { Validator } from './validator'
import { createUnserializableSubjectProxy } from './unserializable_subject_proxy'
import { serializeRunnable } from './util'
import { preprocessConfig, preprocessEnv, syncConfigToCurrentDomain, syncEnvToCurrentDomain } from '../../util/config'
import { $Location } from '../../cypress/location'
import { LogUtils } from '../../cypress/log'
import logGroup from '../logGroup'

const reHttp = /^https?:\/\//

const normalizeDomain = (domain) => {
  // add the protocol if it's not present
  if (!reHttp.test(domain)) {
    domain = `https://${domain}`
  }

  return $Location.normalize(domain)
}

export function addCommands (Commands, Cypress: Cypress.Cypress, cy: Cypress.cy, state: Cypress.State, config: Cypress.InternalConfig) {
  let timeoutId

  const communicator = Cypress.multiDomainCommunicator

  communicator.on('delaying:html', (request) => {
    // when a secondary domain is detected by the proxy, it holds it up
    // to provide time for the spec bridge to be set up. normally, the queue
    // will not continue until the page is stable, but this signals it to go
    // ahead because we're anticipating multi-domain
    // @ts-ignore
    cy.isAnticipatingMultiDomainFor(request.href)

    // If we haven't seen a switchToDomain and cleared the timeout within 300ms,
    // go ahead and inform the server 'ready:for:domain' failed and to release the
    // response. This typically happens during a redirect where the user does
    // not have a switchToDomain for the intermediary domain.
    timeoutId = setTimeout(() => {
      Cypress.backend('ready:for:domain', { failed: true })
    }, 300)
  })

  const switchToDomain = (log, originOrDomain, options, callbackFn) => {
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
    const url = new URL(normalizeDomain(originOrDomain)).toString()
    const location = $Location.create(url)

    validator.validateLocation(location, originOrDomain)

    const originPolicy = location.originPolicy

    cy.state('latestActiveDomain', originPolicy)

    return new Bluebird((resolve, reject, onCancel) => {
      const cleanup = () => {
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
        // domain html through, so the page will finish loading
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
            // This is a Cypress error thrown from the secondary domain after the command queue has finished, do not wrap it as a spec or app error.
            cy.fail(err, { async: true })
          } else {
            // @ts-ignore
            Cypress.runner.onSpecError('error')({ error: err })
          }
        })
      }

      // fired once the spec bridge is set up and ready to receive messages
      communicator.once('bridge:ready', (_data, bridgeReadyDomain) => {
        if (bridgeReadyDomain === originPolicy) {
          // now that the spec bridge is ready, instantiate Cypress with the current app config and environment variables for initial sync when creating the instance
          communicator.toSpecBridge(originPolicy, 'initialize:cypress', {
            config: preprocessConfig(Cypress.config()),
            env: preprocessEnv(Cypress.env()),
          })

          // once the secondary domain page loads, send along the
          // user-specified callback to run in that domain
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
                hookId: state('hookId'),
                hasVisitedAboutBlank: state('hasVisitedAboutBlank'),
                multiDomainBaseUrl: location.origin,
                parentOrigins: [cy.getRemoteLocation('originPolicy')],
                isStable: state('isStable'),
                autOrigin: state('autOrigin'),
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
  }

  Commands.addAll({
    switchToDomain<T> (originOrDomain: string, optionsOrFn: { args: T } | (() => {}), fn?: (args?: T) => {}) {
      // store the invocation stack in the case that `switchToDomain` errors
      communicator.userInvocationStack = state('current').get('userInvocationStack')

      clearTimeout(timeoutId)
      // this command runs for as long as the commands in the secondary
      // domain run, so it can't have its own timeout
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

      return logGroup(Cypress, {
        message: originOrDomain,
      }, (log) => switchToDomain(log, originOrDomain, options, callbackFn))
    },
  })
}
