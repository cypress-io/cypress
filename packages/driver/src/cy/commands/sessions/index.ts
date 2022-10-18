import _ from 'lodash'
import stringifyStable from 'json-stable-stringify'
import $errUtils from '../../../cypress/error_utils'
import $stackUtils from '../../../cypress/stack_utils'
import logGroup from '../../logGroup'
import SessionsManager from './manager'
import {
  getConsoleProps,
  navigateAboutBlank,
} from './utils'
import type { ServerSessionData } from '@packages/types'

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
  // @ts-ignore

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
    // @ts-ignore
    Object.values(Cypress.state('activeSessions') || {}).forEach((sessionData: ServerSessionData) => {
      if (sessionData.cacheAcrossSpecs) {
        sessionsManager.registeredSessions.set(sessionData.id, true)
      }
    })

    Cypress.on('test:before:run:async', () => {
      if (Cypress.config('experimentalSessionAndOrigin')) {
        const clearPage = Cypress.config('testIsolation') === 'strict' ? navigateAboutBlank(false) : new Cypress.Promise.resolve()

        return clearPage
        .then(() => sessions.clearCurrentSessionData())
        .then(() => Cypress.backend('reset:rendered:html:origins'))
      }

      return
    })
  })

  Commands.addAll({
    session (id: string | object, setup?: () => void, options: Cypress.SessionOptions = { cacheAcrossSpecs: false }) {
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
          'cacheAcrossSpecs': 'boolean',
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

      let session: SessionData = sessionsManager.getActiveSession(id)
      const isRegisteredSessionForSpec = sessionsManager.registeredSessions.has(id)

      if (!setup) {
        if (!session && !isRegisteredSessionForSpec) {
          $errUtils.throwErrByPath('sessions.session.not_found', { args: { id } })
        }

        if (session.cacheAcrossSpecs && _.isString(session.setup)) {
          $errUtils.throwErrByPath('sessions.session.missing_global_setup', { args: { id } })
        }
      } else {
        if (session) {
          const hasUniqSetupDefinition = session.setup.toString().trim() !== setup.toString().trim()
          const hasUniqValidateDefinition = (!!session.validate !== !!options.validate) || (!!session.validate && !!options.validate && session.validate.toString().trim() !== options.validate.toString().trim())
          const hasUniqPersistence = session.cacheAcrossSpecs !== !!options.cacheAcrossSpecs

          if (isRegisteredSessionForSpec && (hasUniqSetupDefinition || hasUniqValidateDefinition || hasUniqPersistence)) {
            $errUtils.throwErrByPath('sessions.session.duplicateId', {
              args: {
                id,
                hasUniqSetupDefinition,
                hasUniqValidateDefinition,
                hasUniqPersistence,
              },
            })
          }

          if (session.cacheAcrossSpecs && _.isString(session.setup)) {
            session.setup = setup
          }

          if (session.cacheAcrossSpecs && session.validate && _.isString(session.validate)) {
            session.validate = options.validate
          }
        } else {
          if (isRegisteredSessionForSpec) {
            $errUtils.throwErrByPath('sessions.session.duplicateId', { args: { id } })
          }

          session = sessions.defineSession({
            id,
            setup,
            validate: options.validate,
            cacheAcrossSpecs: options.cacheAcrossSpecs,
          })

          sessionsManager.registeredSessions.set(id, true)
        }
      }

      function setSessionLogStatus (status: string) {
        _log.set({
          sessionInfo: {
            id: session.id,
            isGlobalSession: session.cacheAcrossSpecs,
            status,
          },
        })
      }

      function createSession (existingSession, recreateSession = false) {
        logGroup(Cypress, {
          name: 'session',
          displayName: recreateSession ? 'Recreate session' : 'Create new session',
          message: '',
          type: 'system',
        }, (setupLogGroup) => {
          return cy.then(async () => {
            // Catch when a cypress command fails in the setup function to correctly update log status
            // before failing command and ending command queue.
            cy.state('onCommandFailed', (err) => {
              setupLogGroup.set({ state: 'failed' })
              setSessionLogStatus('failed')

              $errUtils.modifyErrMsg(err, `\n\nThis error occurred while creating session. Because the session setup failed, we failed the test.`, _.add)

              return false
            })

            return existingSession.setup()
          })
          .then(async () => {
            cy.state('onCommandFailed', null)
            await navigateAboutBlank()
            const data = await sessions.getCurrentSessionData()

            _.extend(existingSession, data)
            existingSession.hydrated = true
            await sessions.saveSessionData(existingSession)

            _log.set({ consoleProps: () => getConsoleProps(existingSession) })

            return
          })
        })
      }

      function restoreSession (testSession) {
        return cy.then(async () => {
          Cypress.log({
            name: 'session',
            displayName: 'Restore saved session',
            message: '',
            type: 'system',
          })

          _log.set({ consoleProps: () => getConsoleProps(testSession) })

          await sessions.setSessionData(testSession)
        })
      }

      function validateSession (existingSession, restoreSession = false) {
        const isValidSession = true

        if (!existingSession.validate) {
          return isValidSession
        }

        return logGroup(Cypress, {
          name: 'session',
          displayName: 'Validate session',
          message: '',
          type: 'system',
        }, (validateLog) => {
          return cy.then(async () => {
            const onSuccess = () => {
              return isValidSession
            }

            const onFail = (err) => {
              validateLog.set({ state: 'failed' })
              setSessionLogStatus('failed')

              // show validation error and allow sessions workflow to recreate the session
              if (restoreSession) {
                err.isRecovered = true
                Cypress.log({
                  type: 'system',
                  name: 'session',
                })
                .error(err)

                return !isValidSession
              }

              $errUtils.modifyErrMsg(err, `\n\nThis error occurred in a session validate hook after initializing the session. Because validation failed immediately after session setup we failed the test.`, _.add)

              return cy.fail(err)
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
        cy.state('onCommandFailed', (err, queue) => {
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

          return true
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
        return cy.then(async () => {
          setSessionLogStatus(recreateSession ? 'recreating' : 'creating')

          await navigateAboutBlank()
          await sessions.clearCurrentSessionData()

          return createSession(existingSession, recreateSession)
        })
        .then(() => validateSession(existingSession))
        .then((isValidSession: boolean) => {
          if (!isValidSession) {
            return
          }

          setSessionLogStatus(recreateSession ? 'recreated' : 'created')
        })
      }

      /**
       * Restore session flow:
       *   1. restore session
       *   2. validate session
       *   3. if validation fails, catch error and recreate session
       */
      const restoreSessionWorkflow = (existingSession) => {
        return cy.then(async () => {
          setSessionLogStatus('restoring')
          await navigateAboutBlank()
          await sessions.clearCurrentSessionData()

          return restoreSession(existingSession)
        })
        .then(() => validateSession(existingSession, true))
        .then((isValidSession: boolean) => {
          if (!isValidSession) {
            return createSessionWorkflow(existingSession, true)
          }

          setSessionLogStatus('restored')
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
        message: `${session.id.length > 50 ? `${session.id.substring(0, 47)}...` : session.id}`,
      }

      return logGroup(Cypress, groupDetails, (log) => {
        return cy.then(async () => {
          _log = log

          if (!session.hydrated) {
            const serverStoredSession = await sessions.getSession(session.id).catch(_.noop)

            // we have a saved session on the server and setup matches
            if (serverStoredSession && serverStoredSession.setup === session.setup.toString()) {
              _.extend(session, _.omit(serverStoredSession, 'setup', 'validate'))
              session.hydrated = true
            } else {
              return createSessionWorkflow(session)
            }
          }

          return restoreSessionWorkflow(session)
        }).then(() => {
          _log.set({ state: 'passed' })
        })
      })
    },
  })

  Cypress.session = sessions
}
