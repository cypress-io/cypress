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

  type SESSION_STEPS = 'create' | 'restore' | 'recreate' | 'validate'
  const statusMap = {
    inProgress: (step) => {
      switch (step) {
        case 'create':
          return 'creating'
        case 'restore':
          return 'restoring'
        case 'recreate':
          return 'recreating'
        default:
          throw new Error(`${step} is not a valid session step.`)
      }
    },
    stepName: (step) => {
      switch (step) {
        case 'create':
          return 'Create new session'
        case 'restore':
          return 'Restore saved session'
        case 'recreate':
          return 'Recreate session'
        case 'validate':
          return 'Validate session'
        default:
          throw new Error(`${step} is not a valid session step.`)
      }
    },
    complete: (step) => {
      switch (step) {
        case 'create':
          return 'created'
        case 'restore':
          return 'restored'
        case 'recreate':
          return 'recreated'
        default:
          throw new Error(`${step} is not a valid session step.`)
      }
    },
  }

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

      function createSession (existingSession, step: 'create' | 'recreate') {
        logGroup(Cypress, {
          name: 'session',
          displayName: statusMap.stepName(step),
          message: '',
          type: 'system',

        }, (setupLogGroup) => {
          return cy.then(async () => {
            // Catch when a cypress command fails in the setup function to correctly update log status
            // before failing command and ending command queue.
            cy.state('onCommandFailed', (err) => {
              setupLogGroup.set({
                state: 'failed',
                consoleProps: {
                  Step: statusMap.stepName(step),
                  Error: err.stack || err.message,
                },
              })

              setSessionLogStatus('failed')

              $errUtils.modifyErrMsg(err, `\n\nThis error occurred while creating the session. Because the session setup failed, we failed the test.`, _.add)

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
            setupLogGroup.set({
              consoleProps: () => {
                return {
                  Step: statusMap.stepName(step),
                  ...getConsoleProps(existingSession),
                }
              },
            })

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
            consoleProps: () => {
              return {
                Step: 'Restore saved session',
                ...getConsoleProps(testSession),
              }
            },
          })

          _log.set({ consoleProps: () => getConsoleProps(testSession) })

          await sessions.setSessionData(testSession)
        })
      }

      function validateSession (existingSession, step: SESSION_STEPS) {
        const isValidSession = true

        if (!existingSession.validate) {
          return isValidSession
        }

        return logGroup(Cypress, {
          name: 'session',
          displayName: 'Validate session',
          message: '',
          type: 'system',
          consoleProps: {
            Step: 'Validate Session',
          },
        }, (validateLog) => {
          return cy.then(async () => {
            const onSuccess = () => {
              return isValidSession
            }

            const onFail = (err, yielded) => {
              Cypress.state('onFail', null)

              // show validation error and allow sessions workflow to recreate the session
              if (step === 'restore') {
                $errUtils.modifyErrMsg(err, `\n\nThis error occurred while validating the restored session. Because validation failed, we will try to recreate the session.`, _.add)

                err.isRecovered = true

                validateLog.set({
                  state: 'failed',
                  consoleProps: (args) => {
                    return {
                      Error: err.stack,
                    }
                  },
                  error: err,
                })

                return !isValidSession
              }

              setSessionLogStatus('failed')
              validateLog.set({
                state: 'failed',
                consoleProps: (args) => {
                  return {
                    Error: err.stack,
                  }
                },
                // error: err,
              })

              err.onFail = (err) => {
                // console.log('err on FAIL error', err)
                validateLog.set({
                //   ...(yielded && { consoleProps: {
                //       Yielded: yielded
                //     }
                //   }),
                  snapshot: true,
                  error: err,
                })
              }

              $errUtils.modifyErrMsg(err, `\n\nThis error occurred while validating the ${statusMap.complete(step)} session. Because validation failed immediately after ${statusMap.inProgress(step)} the session, we failed the test.`, _.add)
              // console.log('before throw', err)

              throw err
            }

            return validate(existingSession, step, onSuccess, onFail)
          })
        })
      }

      // uses Cypress hackery to resolve `false` if validate() resolves/returns false or throws/fails a cypress command.
      function validate (existingSession, step, onSuccess, onFail) {
        let returnVal

        Cypress.state('onFail', (err) => {
          // set current command to cy.session for more accurate codeFrame
          // err.stack = $stackUtils.normalizedStack(err)

          // err = $errUtils.enhanceStack({
          //   err,
          //   userInvocationStack: $errUtils.getUserInvocationStack(err, this.state),
          //   projectRoot: this.config('projectRoot'),
          // })

          return onFail(err)
        })

        // const normalizeError = (err) => {
        //   err.stack = $stackUtils.normalizedStack(err)

        //   return $errUtils.enhanceStack({
        //     err,
        //     userInvocationStack: $errUtils.getUserInvocationStack(err, Cypress.state),
        //     projectRoot: Cypress.config('projectRoot'),
        //   })
        // }

        try {
          returnVal = existingSession.validate()
        } catch (e) {
          return onFail(e)
        }

        return cy.then(async () => {
          Cypress.state('onFail', null)
          // when the validate function returns a promise, ensure it does not return false or throw an error
          if (typeof returnVal === 'object' && typeof returnVal.catch === 'function' && typeof returnVal.then === 'function') {
            return returnVal
            .then((val) => {
              if (val === false) {
                // set current command to cy.session for more accurate codeFrame
                cy.state('current', sessionCommand)

                throw $errUtils.errByPath('sessions.validate_callback_false', { reason: 'promise resolved false' })
              }

              return onSuccess()
            })
            .catch((err) => {
              if (!(err instanceof Error)) {
                // set current command to cy.session for more accurate codeFrame
                cy.state('current', sessionCommand)
                err = $errUtils.errByPath('sessions.validate_callback_false', { reason: `promise rejected with ${String(err)}` })
              }

              return onFail(err)
            })
          }

          if (returnVal === undefined || Cypress.isCy(returnVal)) {
            const val = cy.state('current').get('prev')?.attributes?.subject

            if (val === false) {
              // set current command to cy.session for more accurate codeframe
              cy.state('current', sessionCommand)

              return onFail($errUtils.errByPath('sessions.validate_callback_false', { reason: 'callback yielded false' }), val)
            }
          }

          return onSuccess()
        })
      }

      /**
       * Creates session flow:
       *   1. create session
       *   2. validate session
       */
      const createSessionWorkflow = (existingSession, step: 'create' | 'recreate' = 'create') => {
        return cy.then(async () => {
          setSessionLogStatus(statusMap.inProgress(step))

          await navigateAboutBlank()
          await sessions.clearCurrentSessionData()

          return createSession(existingSession, step)
        })
        .then(() => validateSession(existingSession, step))
        .then((isValidSession: boolean) => {
          if (!isValidSession) {
            return
          }

          setSessionLogStatus(statusMap.complete(step))
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
        .then(() => validateSession(existingSession, 'restore'))
        .then((isValidSession: boolean) => {
          if (!isValidSession) {
            return createSessionWorkflow(existingSession, 'recreate')
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
