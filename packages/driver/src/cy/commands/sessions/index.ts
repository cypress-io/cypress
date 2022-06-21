import _ from 'lodash'
import stringifyStable from 'json-stable-stringify'
import $errUtils from '../../../cypress/error_utils'
import $stackUtils from '../../../cypress/stack_utils'
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

      const _log = Cypress.log({
        name: 'session',
        message: `${existingSession.id.length > 50 ? `${existingSession.id.substr(0, 47)}...` : existingSession.id}`,
        groupStart: true,
        sessionInfo: getSessionDetails(existingSession),
        snapshot: false,
      })

      function createSession (existingSession, recreateSession = false) {
        Cypress.log({
          name: 'session',
          displayName: 'Create New Session',
          state: 'passed',
          event: true,
          type: 'system',
          message: ``,
          groupStart: true,
        })

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

        _log.set({ renderProps: () => renderProps })

        return cy.then(async () => {
          await navigateAboutBlank()
          await sessions.clearCurrentSessionData()

          return existingSession.setup()
        })
        .then(async () => {
          await navigateAboutBlank()
          const data = await sessions.getCurrentSessionData()

          Cypress.log({ groupEnd: true, emitOnly: true })

          _.extend(existingSession, data)
          existingSession.hydrated = true

          sessionsManager.setActiveSession({ [existingSession.id]: existingSession })

          _log.set({ consoleProps: () => getConsoleProps(existingSession) })

          // persist the session to the server. Only matters in openMode OR if there's a top navigation on a future test.
          // eslint-disable-next-line no-console
          return Cypress.backend('save:session', { ...existingSession, setup: existingSession.setup.toString() }).catch(console.error)
        })
      }

      function restoreSession (existingSession) {
        Cypress.log({
          name: 'session',
          displayName: 'Restore Saved Session',
          event: true,
          state: 'passed',
          type: 'system',
          message: ``,
          groupStart: true,
        })

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
          Cypress.log({ groupEnd: true, emitOnly: true })
        })
      }

      // uses Cypress hackery to resolve `false` if validate() resolves/returns false or throws/fails a cypress command.
      function validateSession (existingSession, _onFail) {
        if (!existingSession.validate) {
          return
        }

        const validatingLog = Cypress.log({
          name: 'session',
          displayName: 'Validate Session',
          message: '',
          snapshot: false,
          type: 'system',
          state: 'passed',
          event: true,
          groupStart: true,
        })

        const onSuccess = () => {
          validatingLog.set({ displayName: 'Validate Session: valid' })

          Cypress.log({ groupEnd: true, emitOnly: true })
        }

        const onFail = (err) => {
          validatingLog.set({ displayName: 'Validate Session: invalid' })

          _onFail(err, validatingLog)
        }

        let _commandToResume: any = null

        let _didThrow = false

        let returnVal

        try {
          returnVal = existingSession.validate()
        } catch (e) {
          onFail(e)

          return
        }

        if (typeof returnVal === 'object' && typeof returnVal.catch === 'function' && typeof returnVal.then === 'function') {
          return returnVal
          .then((val) => {
            if (val === false) {
              // set current command to cy.session for more accurate codeFrame
              cy.state('current', sessionCommand)
              $errUtils.throwErrByPath('sessions.validate_callback_false', { args: { reason: 'resolved false' } })
            }

            onSuccess()
          })
          .catch((err) => {
            onFail(err)
          })
        }

        cy.state('onCommandFailed', (err, queue, next) => {
          const index = _.findIndex(queue.get(), (command: any) => {
            return (
              _commandToResume
              && command.attributes.chainerId === _commandToResume.chainerId
            )
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

          cy.state('index', index)

          cy.state('onCommandFailed', null)

          _didThrow = err

          return next()
        })

        const _catchCommand = cy.then(async () => {
          cy.state('onCommandFailed', null)
          if (_didThrow) return onFail((_didThrow))

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

        _commandToResume = _catchCommand

        return _catchCommand
      }

      const onRestoreSessionValidationError = (err, log) => {
        // create error log to show validation error to the user in the reporter
        Cypress.log({
          showError: true,
          type: 'system',
          event: true,
          name: 'session',
          displayName: '',
          message: '',
        }).error(err)

        log.endGroup()

        const recreateSession = true

        return createSessionWorkflow(existingSession, recreateSession)
      }

      const throwValidationError = (err, log) => {
        log.endGroup()
        $errUtils.modifyErrMsg(err, `\n\nThis error occurred in a session validate hook after initializing the session. Because validation failed immediately after session setup we failed the test.`, _.add)

        cy.fail(err)
      }

      /**
       * Creates session flow:
       *   1. create session
       *   2. validate session
       */
      const createSessionWorkflow = (existingSession, recreateSession = false) => {
        return createSession(existingSession, recreateSession)
        .then(() => {
          validateSession(existingSession, throwValidationError)
        })
      }

      /**
       * Restore session flow:
       *   1. restore session
       *   2. validation session
       *   3. if validation fails, catch error and recreate session
       */
      const restoreSessionWorkflow = (existingSession) => {
        return restoreSession(existingSession)
        .then(() => {
          validateSession(existingSession, onRestoreSessionValidationError)
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
      return cy.then(async () => {
        if (!existingSession.hydrated) {
          const serverStoredSession = await sessions.getSession(existingSession.id).catch(_.noop)

          // we have a saved session on the server AND setup matches
          if (serverStoredSession && serverStoredSession.setup === existingSession.setup.toString()) {
            _.extend(existingSession, _.omit(serverStoredSession, 'setup'))
            existingSession.hydrated = true
          } else {
            return createSessionWorkflow(existingSession)
          }
        }

        return restoreSessionWorkflow(existingSession)
      })
      .then(async () => {
        await navigateAboutBlank()
        Cypress.log({ groupEnd: true, emitOnly: true })
      })
    },
  })

  Cypress.session = sessions
}
