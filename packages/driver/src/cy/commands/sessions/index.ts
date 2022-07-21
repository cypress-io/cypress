import _ from 'lodash'
import stringifyStable from 'json-stable-stringify'
import $errUtils from '../../../cypress/error_utils'
import $stackUtils from '../../../cypress/stack_utils'
import logGroup from '../../logGroup'
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
        .then(() => Cypress.backend('reset:rendered:html:origins'))
      }

      return
    })
  })

  Commands.addAll({
    session (id, setup?: Function, options: { validate?: Function } = {}) {
      throwIfNoSessionSupport()

      if (!id || !_.isString(id) && !_.isObject(id)) {
        $errUtils.throwErrByPath('sessions.session.wrongArgId')
      }

      // backup session command so we can set it as codeFrame location for errors later on
      const sessionCommand = cy.state('current')

      // stringify deterministically if we were given an object
      id = _.isString(id) ? id : stringifyStable(id)

      if (options) {
        if (!_.isObject(options)) {
          $errUtils.throwErrByPath('sessions.session.wrongArgOptions')
        }

        const validOpts = {
          'validate': 'function',
        }

        Object.entries(options).forEach(([key, value]) => {
          const expectedType = validOpts[key]

          if (!expectedType) {
            $errUtils.throwErrByPath('sessions.session.wrongArgOptionUnexpected', { args: { key } })
          }

          const actualType = typeof value

          if (actualType !== expectedType) {
            $errUtils.throwErrByPath('sessions.session.wrongArgOptionInvalid', { args: { key, expected: expectedType, actual: actualType } })
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

      function createSession (existingSession, recreateSession = false) {
        let renderProps = {
          indicator: 'successful',
          message: `(new) ${_log.get().message}`,
        }

        if (recreateSession) {
          renderProps = {
            indicator: 'bad',
            message: `(recreated) ${_log.get().message}`,
          }
        }

        logGroup(Cypress, {
          name: 'session',
          displayName: 'Create New Session',
          message: '',
          type: 'system',
        }, () => {
          return cy.then(async () => {
            await navigateAboutBlank()
            await sessions.clearCurrentSessionData()

            return existingSession.setup()
          })
          .then(async () => {
            await navigateAboutBlank()
            const data = await sessions.getCurrentSessionData()

            _.extend(existingSession, data)
            existingSession.hydrated = true

            sessionsManager.setActiveSession({ [existingSession.id]: existingSession })

            _log.set({
              consoleProps: () => getConsoleProps(existingSession),
              renderProps: () => renderProps,
            })

            // persist the session to the server. Only matters in openMode OR if there's a top navigation on a future test.
            // eslint-disable-next-line no-console
            return Cypress.backend('save:session', { ...existingSession, setup: existingSession.setup.toString() }).catch(console.error)
          })
        })
      }

      function restoreSession (existingSession) {
        logGroup(Cypress, {
          name: 'session',
          displayName: 'Restore Saved Session',
          message: '',
          type: 'system',
        }, () => {
          return cy.then(async () => {
            await navigateAboutBlank()

            _log.set({
              consoleProps: () => getConsoleProps(existingSession),
              renderProps: () => {
                return {
                  indicator: 'pending',
                  message: `(saved) ${_log.get().message}`,
                }
              },
            })

            await sessions.setSessionData(existingSession)
          })
        })
      }

      function validateSession (existingSession, restoreSession = false) {
        const isValidSession = true

        if (!existingSession.validate) {
          return isValidSession
        }

        return logGroup(Cypress, {
          name: 'session',
          displayName: 'Validate Session',
          message: '',
          type: 'system',
        }, (validatingLog) => {
          return cy.then(async () => {
            const onSuccess = () => {
              validatingLog.set({ displayName: 'Validate Session: valid' })

              return isValidSession
            }

            const onFail = (err) => {
              validatingLog.set({ displayName: 'Validate Session: invalid' })

              // show validation error and allow sessions workflow to recreate the session
              if (restoreSession) {
                Cypress.log({
                  showError: true,
                  type: 'system',
                  name: 'session',
                })
                .error(err)

                return !isValidSession
              }

              $errUtils.modifyErrMsg(err, `\n\nThis error occurred in a session validate hook after initializing the session. Because validation failed immediately after session setup we failed the test.`, _.add)

              cy.fail(err)
            }

            return validate(existingSession, onSuccess, onFail)
          })
        })
      }

      // uses Cypress hackery to resolve `false` if validate() resolves/returns false or throws/fails a cypress command.
      function validate (existingSession, onSuccess, onFail) {
        let returnVal
        let _validationError = null

        try {
          returnVal = existingSession.validate()
        } catch (e) {
          return onFail(e)
        }

        // when the validate function returns a promise, ensure it does not return false or throw an error
        if (typeof returnVal === 'object' && typeof returnVal.catch === 'function' && typeof returnVal.then === 'function') {
          return returnVal
          .then((val) => {
            if (val === false) {
              // set current command to cy.session for more accurate codeFrame
              cy.state('current', sessionCommand)

              return onFail($errUtils.errByPath('sessions.validate_callback_false', { reason: 'resolved false' }))
            }

            return onSuccess()
          })
          .catch((err) => {
            return onFail(err)
          })
        }

        // catch when a cypress command fails in the validate callback to move the queue index
        cy.state('onCommandFailed', (err, queue, next) => {
          const index = _.findIndex(queue.get(), (command: any) => {
            return (
              _commandToRunAfterValidation
              && command.attributes.chainerId === _commandToRunAfterValidation.chainerId
            )
          })

          // attach codeframe and cleanse the stack trace since we will not hit the cy.fail callback
          // if this is the first time validate fails
          if (typeof err === 'string') {
            err = new Error(err)
          }

          err.stack = $stackUtils.normalizedStack(err)

          _validationError = $errUtils.enhanceStack({
            err,
            userInvocationStack: $errUtils.getUserInvocationStack(err, Cypress.state),
            projectRoot: Cypress.config('projectRoot'),
          })

          // move to _commandToRunAfterValidation's index to ensure failures are handled correctly
          cy.state('index', index)

          cy.state('onCommandFailed', null)

          return next()
        })

        const _commandToRunAfterValidation = cy.then(async () => {
          cy.state('onCommandFailed', null)

          if (_validationError) {
            return onFail(_validationError)
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

          return onSuccess()
        })

        return _commandToRunAfterValidation
      }

      /**
       * Creates session flow:
       *   1. create session
       *   2. validate session
       */
      const createSessionWorkflow = (existingSession, recreateSession = false) => {
        return cy.then(() => createSession(existingSession, recreateSession))
        .then(() => validateSession(existingSession))
      }

      /**
       * Restore session flow:
       *   1. restore session
       *   2. validate session
       *   3. if validation fails, catch error and recreate session
       */
      const restoreSessionWorkflow = (existingSession) => {
        return cy.then(() => restoreSession(existingSession))
        .then(() => validateSession(existingSession, true))
        .then((isValidSession: boolean) => {
          if (!isValidSession) {
            return createSessionWorkflow(existingSession, true)
          }
        })
      }

      /**
       * Session command rules:
       *   If session does not exists or was no previously saved to the server, create session
       *      1. run create session flow
       *      2. clear page
       *
       *   If session exists or has been saved to the server, restore session
       *      1. run restore session flow
       *      2. clear page
       */
      let _log
      const groupDetails = {
        message: `${existingSession.id.length > 50 ? `${existingSession.id.substring(0, 47)}...` : existingSession.id}`,
        sessionInfo: getSessionDetails(existingSession),
      }

      return logGroup(Cypress, groupDetails, (log) => {
        return cy.then(async () => {
          _log = log
          if (!existingSession.hydrated) {
            const serverStoredSession = await sessions.getSession(existingSession.id).catch(_.noop)

            // we have a saved session on the server and setup matches
            if (serverStoredSession && serverStoredSession.setup === existingSession.setup.toString()) {
              _.extend(existingSession, _.omit(serverStoredSession, 'setup'))
              existingSession.hydrated = true
            } else {
              return createSessionWorkflow(existingSession)
            }
          }

          return restoreSessionWorkflow(existingSession)
        }).then(async () => {
          await navigateAboutBlank()
        })
      })
    },
  })

  Cypress.session = sessions
}
