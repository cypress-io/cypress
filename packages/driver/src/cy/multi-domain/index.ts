import Bluebird from 'bluebird'
import $errUtils from '../../cypress/error_utils'
import { Validator } from './validator'
import { serializeRunnable } from './util'
import { createUnserializableSubjectProxy } from './unserializable_subject_proxy'

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
        const onError = (err) => {
          log.error(err)
          err.onFail = () => {}
          reject(err)
        }

        const onQueueFinished = ({ err, subject, unserializableSubjectType }) => {
          if (err) {
            return onError(err)
          }

          resolve(unserializableSubjectType ? createUnserializableSubjectProxy(unserializableSubjectType) : subject)
        }

        const cleanup = () => {
          communicator.off('queue:finished', onQueueFinished)
        }

        communicator.once('ran:domain:fn', ({ err, subject, unserializableSubjectType }) => {
          sendReadyForDomain()

          if (err) {
            cleanup()

            return onError(err)
          }

          // if there are not commands and a synchronous return from the callback,
          // this resolves immediately
          if (subject || unserializableSubjectType) {
            cleanup()

            resolve(unserializableSubjectType ? createUnserializableSubjectProxy(unserializableSubjectType) : subject)
          }
        })

        communicator.once('queue:finished', onQueueFinished)

        // fired once the spec bridge is set up and ready to receive messages
        communicator.once('bridge:ready', () => {
          state('readyForMultiDomain', true)

          // once the secondary domain page loads, send along the
          // user-specified callback to run in that domain
          try {
            communicator.toSpecBridge('run:domain:fn', {
              data,
              fn: callbackFn.toString(),
              state: {
                viewportWidth: Cypress.state('viewportWidth'),
                viewportHeight: Cypress.state('viewportHeight'),
                runnable: serializeRunnable(Cypress.state('runnable')),
                duringUserTestExecution: Cypress.state('duringUserTestExecution'),
                hookId: state('hookId'),
              },
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
