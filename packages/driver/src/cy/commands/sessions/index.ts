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

  const sessions = new SessionsManager(Cypress, cy)

  Cypress.on('run:start', () => {
    Cypress.on('test:before:run:async', () => {
      if (Cypress.config('experimentalSessionAndOrigin')) {
        sessions.currentTestRegisteredSessions.clear()

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

      let existingSession: SessionData = sessions.getActiveSession(id)
      const isRegisteredSessionForTest = sessions.currentTestRegisteredSessions.has(id)

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

          sessions.currentTestRegisteredSessions.set(id, true)
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

      function runSetup (existingSession) {
        Cypress.log({
          name: 'Create New Session',
          state: 'passed',
          event: true,
          type: 'system',
          message: ``,
          groupStart: true,
        })

        if (!hadValidationError) {
          _log.set({
            renderProps: () => {
              return {
                indicator: 'successful',
                message: `(new) ${_log.get().message}`,
              }
            },
          })
        }

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

          sessions.setActiveSession({ [existingSession.id]: existingSession })

          dataLog.set({
            consoleProps: () => getConsoleProps(existingSession),
          })

          // persist the session to the server. Only matters in openMode OR if there's a top navigation on a future test.
          // eslint-disable-next-line no-console
          return Cypress.backend('save:session', { ...existingSession, setup: existingSession.setup.toString() }).catch(console.error)
        })
      }

      // uses Cypress hackery to resolve `false` if validate() resolves/returns false or throws/fails a cypress command.
      function validateSession (existingSession, _onFail) {
        const validatingLog = Cypress.log({
          name: 'Validate Session',
          message: '',
          snapshot: false,
          type: 'system',
          state: 'passed',
          event: true,
          groupStart: true,
        })

        const onSuccess = () => {
          validatingLog.set({
            name: 'Validate Session: valid',
            message: '',
            type: 'system',
            event: true,
            state: 'warning',
          })

          Cypress.log({ groupEnd: true, emitOnly: true })
        }

        const onFail = (err) => {
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

      let hadValidationError = false
      let onValidationError: Function = (err, log) => {
        log.set({
          name: 'Validate Session: invalid',
          message: '',
          type: 'system',
          event: true,
          state: 'warning',
        })

        const errorLog = Cypress.log({
          showError: true,
          type: 'system',
          event: true,
          name: '',
          message: '',
        })

        errorLog.error(err)
        errorLog.set({
          state: 'warn',

        })

        _log.set({
          renderProps: () => {
            return {
              indicator: 'bad',
              message: `(recreated) ${_log.get().message}`,
            }
          },
        })

        Cypress.log({ groupEnd: true, emitOnly: true })

        hadValidationError = true

        return runSetup(existingSession)
        .then(() => {
          cy.then(() => {
            return validateSession(existingSession, throwValidationError)
          })
          .then(() => {
            cy.then(async () => {
              await navigateAboutBlank()
              Cypress.log({ groupEnd: true, name: '', message: '', emitOnly: true })
            })
          })
        })
      }

      const throwValidationError = (err) => {
        $errUtils.modifyErrMsg(err, `\n\nThis error occurred in a session validate hook after initializing the session. Because validation failed immediately after session setup we failed the test.`, _.add)

        cy.fail(err)
      }

      return cy.then(async () => {
        if (!existingSession.hydrated) {
          const serverStoredSession = await sessions.getSession(existingSession.id).catch(_.noop)

          // we have a saved session on the server AND setup matches
          if (serverStoredSession && serverStoredSession.setup === existingSession.setup.toString()) {
            _.extend(existingSession, serverStoredSession)
            existingSession.hydrated = true
          } else {
            onValidationError = throwValidationError

            return runSetup(existingSession)
          }
        }

        Cypress.log({
          name: 'Restore Saved Session',
          event: true,
          state: 'passed',
          type: 'system',
          message: ``,
          groupStart: true,
        })

        await navigateAboutBlank()

        _log.set({
          renderProps: () => {
            return {
              indicator: 'pending',
              message: `(saved) ${_log.get().message}`,
            }
          },
        })

        dataLog.set({
          consoleProps: () => getConsoleProps(existingSession),
        })

        await sessions.setSessionData(existingSession)
      })
      .then(async () => {
        Cypress.log({ groupEnd: true, emitOnly: true })
        if (existingSession.validate) {
          await validateSession(existingSession, onValidationError)
        }
      })
      .then(async () => {
        if (!hadValidationError) {
          await navigateAboutBlank()
          Cypress.log({ groupEnd: true, emitOnly: true })
        }
      })
    },
  })

  Cypress.session = sessions.publicAPI()
}
