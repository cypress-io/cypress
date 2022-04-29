import _ from 'lodash'
import stringifyStable from 'json-stable-stringify'
import $errUtils from '../../../cypress/error_utils'
import $stackUtils from '../../../cypress/stack_utils'
import group from '../../logGroup'
import SessionsManager from './manager'
import {
  getSessionDetails,
  getConsoleProps,
  navigateAboutBlank,
} from './utils'

type SessionData = Cypress.Commands.Session.SessionData

/**
 * Session data should be cleared with spec browser launch.
 *
 * Rules for clearing session data:
 *  - if page reloads due to top navigation OR user hard reload, session data should NOT be cleared
 *  - if user relaunches the browser or launches a new spec, session data SHOULD be cleared
 *  - session data SHOULD be cleared between specs in run mode
 */

export default function (Commands, Cypress, cy) {
  function throwIfNoSessionSupport () {
    if (!Cypress.config('experimentalSessionAndOrigin')) {
      $errUtils.throwErrByPath('sessions.experimentNotEnabled', {
        args: {
          // determine if using experimental session opt-in flag (removed in 9.6.0) to
          // generate a coherent error message
          experimentalSessionSupport: Cypress.config('experimentalSessionSupport'),
        },
      })
    }
  }

  const sessionsManager = new SessionsManager(Cypress, cy)
  const sessions = sessionsManager.sessions

  Cypress.on('run:start', () => {
    Cypress.on('test:before:run:async', () => {
      if (Cypress.config('experimentalSessionAndOrigin')) {
        sessionsManager.currentTestRegisteredSessions.clear()

        return navigateAboutBlank(false)
        .then(() => sessions.clearCurrentSessionData())
        .then(() => {
          return Cypress.backend('reset:rendered:html:origins')
        })
      }

      return
    })
  })

  Commands.addAll({
    session (id, setup?: Function, options: {
      validate?: Function
    } = {}) {
      throwIfNoSessionSupport()

      if (!id || !_.isString(id) && !_.isObject(id)) {
        $errUtils.throwErrByPath('sessions.session.wrongArgId')
      }

      // backup session command so we can set it as codeFrame location for errors later on
      const sessionCommand = cy.state('current')

      // stringify deterministically if we were given an object
      id = typeof id === 'string' ? id : stringifyStable(id)

      if (options) {
        if (!_.isObject(options)) {
          $errUtils.throwErrByPath('sessions.session.wrongArgOptions')
        }

        const validOpts = {
          'validate': 'function',
        }

        Object.keys(options).forEach((key) => {
          const expectedType = validOpts[key]

          if (!expectedType) {
            $errUtils.throwErrByPath('sessions.session.wrongArgOptionUnexpected', { args: { key } })
          }

          const actualType = typeof options[key]

          if (actualType !== expectedType) {
            $errUtils.throwErrByPath('sessions.session.wrongArgOptionInvalid', { args: { key, expected: expectedType, actual: actualType } })
          }
        })
      }

      function createSession (existingSession, isRecreatingSession = false) {
        return group(Cypress, {
          name: 'Create New Session',
          message: '',
          event: true,
          type: 'system',
        }, (log) => {
          return cy.then(async () => {
            await navigateAboutBlank()
            await sessions.clearCurrentSessionData()

            await existingSession.setup()
            await navigateAboutBlank()
            const data = await sessions.getCurrentSessionData()

            _.extend(existingSession, data)
            existingSession.hydrated = true

            log.set({ state: 'passed' })
            _log.set({
              renderProps: () => {
                if (isRecreatingSession) {
                  return {
                    indicator: 'bad',
                    message: `(recreated) ${_log.get().message}`,
                  }
                }

                return {
                  indicator: 'successful',
                  message: `(new) ${_log.get().message}`,
                }
              },
            })

            sessionsManager.setActiveSession({ [existingSession.id]: existingSession })

            dataLog.set({
              consoleProps: () => getConsoleProps(existingSession),
            })

            // persist the session to the server. Only matters in openMode OR if there's a top navigation on a future test.
            // eslint-disable-next-line no-console
            return Cypress.backend('save:session', { ...existingSession, setup: existingSession.setup.toString() }).catch(console.error)
          })
        })
      }

      function restoreSession (existingSession) {
        return group(Cypress, {
          name: 'Restore Saved Session',
          message: '',
          event: true,
          type: 'system',
        }, (log) => {
          return cy.then(async () => {
            await navigateAboutBlank()

            log.set({ state: 'passed' })
            _log.set({
              renderProps: () => {
                return {
                  indicator: 'pending',
                  message: `(saved) ${_log.get().message}`,
                }
              },
            })

            sessionsManager.setActiveSession({ [existingSession.id]: existingSession })

            dataLog.set({
              consoleProps: () => getConsoleProps(existingSession),
            })

            await sessions.setSessionData(existingSession)
          })
        })
      }

      // uses Cypress hackery to resolve `false` if validate() resolves/returns false or throws/fails a cypress command.
      function validateSession (existingSession, shouldFailOnValidation = true) {
        if (!existingSession.validate) {
          return
        }

        return group(Cypress, {
          name: 'Validate Session',
          message: '',
          type: 'system',
          event: true,
        }, (log) => {
          const onSuccess = () => {
            log.set({ message: 'valid', state: 'passed' })

            Cypress.log({ groupEnd: true, emitOnly: true })
          }

          const onFail = (err) => {
            // @ts-ignore
            log.set({ message: 'invalid', state: 'warning' })

            if (shouldFailOnValidation) {
              throwValidationError(err)
            }

            Cypress.log({ showError: true }).error(err)

            const shouldRecreateSession = true

            return cy.wrap(shouldRecreateSession, { log: false })
          }

          let _errThrownFromCypressCommand = null
          let returnVal

          try {
            returnVal = existingSession.validate()
          } catch (e) {
            onFail(e)

            return
          }

          // if returned value is a promise
          if (typeof returnVal === 'object' && typeof returnVal.catch === 'function' && typeof returnVal.then === 'function') {
            return returnVal
            .then((val) => {
              if (val === false) {
                // set current command to cy.session for more accurate codeFrame
                cy.state('current', sessionCommand)

                onFail($errUtils.errByPath('sessions.validate_callback_false', { args: { reason: 'resolved false' } }))
              }

              onSuccess()
            })
            .catch((err) => {
              onFail(err)
            })
          }

          // Inject onCommandFailed override to handle when a Cypress Command leveraged in the
          // validation calling fails. This callback is executed instead of the standard command
          // failure to prevent the Command queue from stop on this command failure and allow the
          // sessions command to to update the validation session log message as failed
          // and provide a meaningful error message related to failed session validation.
          cy.state('onCommandFailed', (err, queue, next) => {
            const index = _.findIndex(queue.get(), (command: any) => {
              return (_parseValidationResult && command.attributes.chainerId === _parseValidationResult.chainerId)
            })

            // attach codeframe and cleanse the stack trace since we will not hit the cy.fail callback
            // if this is the first time validate fails
            if (typeof err === 'string') {
              err = new Error(err)
            }

            err.stack = $stackUtils.normalizedStack(err)

            err = $errUtils.enhanceStack({
              err,
              userInvocationStack: $errUtils.getUserInvocationStack(err, Cypress.state),
              projectRoot: Cypress.config('projectRoot'),
            })

            // forward command queue index to the _parseValidationResult command to correctly handle
            // the validation failure
            cy.state('index', index)
            cy.state('onCommandFailed', null)

            _errThrownFromCypressCommand = err

            return next()
          })

          const _parseValidationResult = cy.then(async () => {
            cy.state('onCommandFailed', null)

            if (_errThrownFromCypressCommand) {
              console.log('did throw')

              return onFail(_errThrownFromCypressCommand)
            }

            if (returnVal === false) {
              // set current command to cy.session for more accurate codeframe
              cy.state('current', sessionCommand)

              return onFail($errUtils.errByPath('sessions.validate_callback_false', { reason: 'returned false' }))
            }

            if (returnVal === undefined || Cypress.isCy(returnVal)) {
              const val = cy.state('current').get('prev')?.attributes?.subject

              if (val === false) {
                return onFail($errUtils.errByPath('sessions.validate_callback_false', { reason: 'resolved false' }))
              }
            }

            onSuccess()
          })

          return _parseValidationResult
        })
      }

      const throwValidationError = (err) => {
        $errUtils.modifyErrMsg(err, `\n\nThis error occurred in a session validate hook after initializing the session. Because validation failed immediately after session setup we failed the test.`, _.add)

        _log.error(err)
        cy.fail(err, { log: false })
      }

      const createSessionWorkflow = (shouldRecreateSession = false) => {
        return cy.then(() => {
          createSession(existingSession, shouldRecreateSession)
        })
        .then(() => {
          validateSession(existingSession)
        })
      }

      const restoreSavedSessionWorkflow = () => {
        return cy.then(async () => {
          restoreSession(existingSession)
        })
        .then(() => {
          const shouldFailOnValidation = false

          validateSession(existingSession, shouldFailOnValidation)
        })
        .then((hadValidationError) => {
          if (hadValidationError) {
            const shouldRecreateSession = true

            createSessionWorkflow(shouldRecreateSession)
          }
        })
      }

      let existingSession: SessionData = sessionsManager.getActiveSession(id)
      const isRegisteredSessionForTest = sessionsManager.currentTestRegisteredSessions.has(id)

      if (!setup) {
        if (!existingSession || !isRegisteredSessionForTest) {
          $errUtils.throwErrByPath('sessions.session.not_found', { args: { id } })
        }
      } else {
        const isUniqSessionDefinition = !existingSession || existingSession.setup.toString().trim() !== setup.toString().trim()

        if (isUniqSessionDefinition) {
          if (isRegisteredSessionForTest) {
            $errUtils.throwErrByPath('sessions.session.duplicateId', { args: { id: existingSession.id } })
          }

          existingSession = sessions.defineSession({
            id,
            setup,
            validate: options.validate,
          })

          sessionsManager.currentTestRegisteredSessions.set(id, true)
        }
      }

      const _log = Cypress.log({
        name: 'session',
        message: `${existingSession.id.length > 50 ? `${existingSession.id.substr(0, 47)}...` : existingSession.id}`,
        groupStart: true,
        snapshot: false,
      })

      const dataLog = Cypress.log({
        name: 'session',
        sessionInfo: getSessionDetails(existingSession),
        message: `${existingSession.id.length > 50 ? `${existingSession.id.substr(0, 47)}...` : existingSession.id}`,
      })

      return cy.then(async () => {
        if (!existingSession.hydrated) {
          const serverStoredSession = await sessions.getSession(existingSession.id).catch(_.noop)

          // create new session if we do not have a saved session on the server OR setup functions do not match
          if (!serverStoredSession || serverStoredSession.setup !== existingSession.setup.toString()) {
            return createSessionWorkflow()
          }
        }

        return restoreSavedSessionWorkflow()
      })
    },
  })

  Cypress.session = sessions
}
