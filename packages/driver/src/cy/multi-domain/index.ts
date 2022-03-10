import Bluebird from 'bluebird'
import $errUtils from '../../cypress/error_utils'
import { Validator } from './validator'
import { createUnserializableSubjectProxy } from './unserializable_subject_proxy'
import { serializeRunnable } from './util'
import { preprocessConfig, preprocessEnv, syncConfigToCurrentDomain, syncEnvToCurrentDomain } from '../../util/config'

export function addCommands (Commands, Cypress: Cypress.Cypress, cy: Cypress.cy, state: Cypress.State, config: Cypress.InternalConfig) {
  let timeoutId

  // @ts-ignore
  const communicator = Cypress.multiDomainCommunicator

  const sendReadyForDomain = () => {
    // lets the proxy know to allow the response for the secondary
    // domain html through, so the page will finish loading
    Cypress.backend('ready:for:domain')
  }

  communicator.on('delaying:html', (request) => {
    console.log('Delaying Request', request.href)
    // when a secondary domain is detected by the proxy, it holds it up
    // to provide time for the spec bridge to be set up. normally, the queue
    // will not continue until the page is stable, but this signals it to go
    // ahead because we're anticipating multi-domain
    // @ts-ignore
    cy.isAnticipatingMultiDomain(request.href)

    // cy.isAnticipatingMultiDomain(href) will free the queue to move forward.
    // if the next command isn't switchToDomain, this timeout will hit and
    // the test will fail with a cross-origin error
    timeoutId = setTimeout(sendReadyForDomain, 2000)
  })

  Commands.addAll({
    switchToDomain<T> (domain: string, dataOrFn: T[] | (() => {}), fn?: (data?: T[]) => {}) {
      clearTimeout(timeoutId)
      // this command runs for as long as the commands in the secondary
      // domain run, so it can't have its own timeout
      cy.clearTimeout()

      if (!config('experimentalMultiDomain')) {
        $errUtils.throwErrByPath('switchToDomain.experiment_not_enabled')
      }

      let data
      let callbackFn

      if (fn) {
        callbackFn = fn
        data = dataOrFn
      } else {
        callbackFn = dataOrFn
        data = []
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
      })

      return new Bluebird((resolve, reject) => {
        const cleanup = () => {
          communicator.off('queue:finished', onQueueFinished)
          communicator.off('window:load', onWindowLoad)
        }

        const _resolve = ({ subject, unserializableSubjectType }) => {
          cleanup()
          resolve(unserializableSubjectType ? createUnserializableSubjectProxy(unserializableSubjectType) : subject)
        }

        const _reject = (err) => {
          cleanup()
          log.error(err)
          if (typeof err === 'object') {
            err.onFail = () => {}
          }

          reject(err)
        }

        const onQueueFinished = ({ err, subject, unserializableSubjectType }) => {
          if (err) {
            return _reject(err)
          }

          _resolve({ subject, unserializableSubjectType })
        }

        const onWindowLoad = ({ url }, windowLoadDomain) => {
          if (windowLoadDomain === domain) {
            cy.isStable(true, 'load')
            Cypress.emit('internal:window:load', { type: 'cross:domain', url })
          }
        }

        communicator.on('window:load', onWindowLoad)

        communicator.once('sync:globals', ({ config, env, state }) => {
          syncConfigToCurrentDomain(config)
          syncEnvToCurrentDomain(env)
          Cypress.state(state)
        })

        communicator.once('ran:domain:fn', (details) => {
          const { subject, unserializableSubjectType, err, finished } = details

          sendReadyForDomain()

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
            Cypress.runner.onSpecError('error')({ error: err })
          })
        }

        // fired once the spec bridge is set up and ready to receive messages
        communicator.once('bridge:ready', (_data, bridgeReadyDomain) => {
          if (bridgeReadyDomain === domain) {
            // now that the spec bridge is ready, instantiate Cypress with the current app config and environment variables for initial sync when creating the instance
            communicator.toSpecBridge(domain, 'initialize:cypress', {
              config: preprocessConfig(Cypress.config()),
              env: preprocessEnv(Cypress.env()),
            })

            // once the secondary domain page loads, send along the
            // user-specified callback to run in that domain
            try {
              communicator.toSpecBridge(domain, 'run:domain:fn', {
                data,
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
                },
                config: preprocessConfig(Cypress.config()),
                env: preprocessEnv(Cypress.env()),
                isStable: state('isStable'),
              })
            } catch (err: any) {
              const wrappedErr = $errUtils.errByPath('switchToDomain.run_domain_fn_errored', {
                error: err.message,
              })

              reject(wrappedErr)
            } finally {
              // @ts-ignore
              cy.isAnticipatingMultiDomain(undefined)
            }
          }
        })

        // this signals to the runner to create the spec bridge for
        // the specified domain
        communicator.emit('expect:domain', domain)
      })
    },
  })
}
