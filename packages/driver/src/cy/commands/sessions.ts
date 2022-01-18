import _ from 'lodash'
import $ from 'jquery'
import { $Location } from '../../cypress/location'
import $errUtils from '../../cypress/error_utils'
import stringifyStable from 'json-stable-stringify'
import $stackUtils from '../../cypress/stack_utils'
import Bluebird from 'bluebird'
const currentTestRegisteredSessions = new Map()

/**
 * rules for clearing session data:
 * if page reloads due to top navigation OR user hard reload, session data should NOT be cleared
 * if user relaunches the browser or launches a new spec, session data SHOULD be cleared
 * session data SHOULD be cleared between specs in run mode
 *
 * therefore session data should be cleared with spec browser launch
 */

const getSessionDetails = (sessState) => {
  return {
    id: sessState.id,
    data: _.merge(
      _.mapValues(_.groupBy(sessState.cookies, 'domain'), (v) => ({ cookies: v.length })),
      ..._.map(sessState.localStorage, (v) => ({ [$Location.create(v.origin).hostname]: { localStorage: Object.keys(v.value).length } })),
    ) }
}

const getSessionDetailsForTable = (sessState) => {
  return _.merge(
    _.mapValues(_.groupBy(sessState.cookies, 'domain'), (v) => ({ cookies: v })),
    ..._.map(sessState.localStorage, (v) => ({ [$Location.create(v.origin).hostname]: { localStorage: v } })),
  )
}

const isSecureContext = (url) => url.startsWith('https:')

const getCurrentOriginStorage = () => {
  // localStorage.length propery is not always accurate, we must stringify to check for entries
  // for ex) try setting localStorge.key = 'val' and reading localStorage.length, may be 0.
  const _localStorageStr = JSON.stringify(window.localStorage)
  const _localStorage = _localStorageStr.length > 2 && JSON.parse(_localStorageStr)
  const _sessionStorageStr = JSON.stringify(window.sessionStorage)
  const _sessionStorage = _sessionStorageStr.length > 2 && JSON.parse(JSON.stringify(window.sessionStorage))

  const value = {} as any

  if (_localStorage) {
    value.localStorage = _localStorage
  }

  if (_sessionStorage) {
    value.sessionStorage = _sessionStorage
  }

  return value
}

const setPostMessageLocalStorage = async (specWindow, originOptions) => {
  const origins = originOptions.map((v) => v.origin) as string[]

  const iframes: JQuery<HTMLElement>[] = []

  const $iframeContainer = $(`<div style="display:none"></div>`).appendTo($('body', specWindow.document))

  // if we're on an https domain, there is no way for the secure context to access insecure origins from iframes
  // since there is no way for the app to access localStorage on insecure contexts, we don't have to clear any localStorage on http domains.
  if (isSecureContext(specWindow.location.href)) {
    _.remove(origins, (v) => !isSecureContext(v))
  }

  if (!origins.length) return []

  _.each(origins, (u) => {
    const $iframe = $(`<iframe src="${`${u}/${Cypress.config('namespace')}/automation/setLocalStorage?${u}`}"></iframe>`)

    $iframe.appendTo($iframeContainer)
    iframes.push($iframe)
  })

  let onPostMessage

  const successOrigins = [] as string[]

  return new Bluebird((resolve) => {
    onPostMessage = (event) => {
      const data = event.data

      if (data.type === 'set:storage:load') {
        if (!event.source) {
          throw new Error('failed to get localStorage')
        }

        const opts = _.find(originOptions, { origin: event.origin })!

        event.source.postMessage({ type: 'set:storage:data', data: opts }, '*')
      } else if (data.type === 'set:storage:complete') {
        successOrigins.push(event.origin)
        if (successOrigins.length === origins.length) {
          resolve()
        }
      }
    }

    specWindow.addEventListener('message', onPostMessage)
  })
  // timeout just in case something goes wrong and the iframe never loads in
  .timeout(2000)
  .finally(() => {
    specWindow.removeEventListener('message', onPostMessage)
    $iframeContainer.remove()
  })
  .catch((err) => {
    Cypress.log({
      name: 'warning',
      message: `failed to access session localStorage data on origin(s): ${_.xor(origins, successOrigins).join(', ')}`,
    })
  })
}

const getConsoleProps = (sessState) => {
  const ret = {
    id: sessState.id,
    table: _.compact(_.flatMap(getSessionDetailsForTable(sessState), (val, domain) => {
      return [() => {
        return {
          name: `🍪 Cookies - ${domain} (${val.cookies.length})`,
          data: val.cookies,
        }
      },
      val.localStorage && (() => {
        return {
          name: `📁 Storage - ${domain} (${_.keys(val.localStorage.value).length})`,
          data: _.map(val.localStorage.value, (value, key) => {
            return {
              key, value,
            }
          }),
        }
      })]
    }))
    ,
  }

  return ret
}

const getPostMessageLocalStorage = (specWindow, origins): Promise<any[]> => {
  const results = [] as any[]
  const iframes: JQuery<HTMLElement>[] = []
  let onPostMessage
  const successOrigins = [] as string[]

  const $iframeContainer = $(`<div style="display:none"></div>`).appendTo($('body', specWindow.document))

  _.each(origins, (u) => {
    const $iframe = $(`<iframe src="${`${u}/__cypress/automation/getLocalStorage`}"></iframe>`)

    $iframe.appendTo($iframeContainer)
    iframes.push($iframe)
  })

  return new Bluebird((resolve) => {
    // when the cross-domain iframe for each domain is loaded
    // we can only communicate through postmessage
    onPostMessage = ((event) => {
      const data = event.data

      if (data.type !== 'localStorage') return

      const value = data.value

      results.push([event.origin, value])

      successOrigins.push(event.origin)
      if (successOrigins.length === origins.length) {
        resolve(results)
      }
    })

    specWindow.addEventListener('message', onPostMessage)
  })
  // timeout just in case something goes wrong and the iframe never loads in
  .timeout(2000)
  .finally(() => {
    specWindow.removeEventListener('message', onPostMessage)
    $iframeContainer.remove()
  })
  .catch((err) => {
    Cypress.log({
      name: 'warning',
      message: `failed to access session localStorage data on origin(s): ${_.xor(origins, successOrigins).join(', ')}`,
    })

    return []
  })
}

export default function (Commands, Cypress, cy) {
  const { Promise } = Cypress

  const setActiveSession = (obj) => {
    const currentSessions = cy.state('activeSessions') || {}

    const newSessions = { ...currentSessions, ...obj }

    cy.state('activeSessions', newSessions)
  }

  const getActiveSession = (id) => {
    const currentSessions = cy.state('activeSessions') || {}

    return currentSessions[id]
  }
  const clearActiveSessions = () => {
    const curSessions = cy.state('activeSessions') || {}

    cy.state('activeSessions', _.mapValues(curSessions, (v) => ({ ...v, hydrated: false })))
  }

  async function mapOrigins (origins) {
    const currentOrigin = $Location.create(window.location.href).origin

    return _.uniq(
      _.flatten(await Promise.map(
        ([] as string[]).concat(origins), async (v) => {
          if (v === '*') {
            return _.keys(await Cypress.backend('get:rendered:html:origins')).concat([currentOrigin])
          }

          if (v === 'currentOrigin') return currentOrigin

          return $Location.create(v).origin
        },
      )),
    ) as string[]
  }

  async function _setStorageOnOrigins (originOptions) {
    const specWindow = cy.state('specWindow')

    const currentOrigin = $Location.create(window.location.href).origin

    const currentOriginIndex = _.findIndex(originOptions, { origin: currentOrigin })

    if (currentOriginIndex !== -1) {
      const opts = originOptions.splice(currentOriginIndex, 1)[0]

      if (!_.isEmpty(opts.localStorage)) {
        if (opts.localStorage.clear) {
          window.localStorage.clear()
        }

        _.each(opts.localStorage.value, (val, key) => localStorage.setItem(key, val))
      }

      if (opts.sessionStorage) {
        if (opts.sessionStorage.clear) {
          window.sessionStorage.clear()
        }

        _.each(opts.sessionStorage.value, (val, key) => sessionStorage.setItem(key, val))
      }
    }

    if (_.isEmpty(originOptions)) {
      return
    }

    await setPostMessageLocalStorage(specWindow, originOptions)
  }

  async function getAllHtmlOrigins () {
    const currentOrigin = $Location.create(window.location.href).origin

    const origins = _.uniq([..._.keys(await Cypress.backend('get:rendered:html:origins')), currentOrigin]) as string[]

    return origins
  }

  function throwIfNoSessionSupport () {
    if (!Cypress.config('experimentalSessionSupport')) {
      $errUtils.throwErrByPath('sessions.experimentNotEnabled')
    }
  }

  const sessions = {

    defineSession (options = {} as any) {
      const sess_state = {
        id: options.id,
        cookies: null,
        localStorage: null,
        setup: options.setup,
        hydrated: false,
        validate: options.validate,
      }

      setActiveSession({ [sess_state.id]: sess_state })

      return sess_state
    },

    async clearAllSavedSessions () {
      clearActiveSessions()

      return Cypress.backend('clear:session', null)
    },

    async clearCurrentSessionData () {
      window.localStorage.clear()
      window.sessionStorage.clear()

      await Promise.all([
        sessions.clearStorage(),
        sessions.clearCookies(),
      ])
    },

    async setSessionData (data) {
      await sessions.clearCurrentSessionData()
      const allHtmlOrigins = await getAllHtmlOrigins()

      let _localStorage = data.localStorage || []
      let _sessionStorage = data.sessionStorage || []

      _.each(allHtmlOrigins, (v) => {
        if (!_.find(_localStorage, v)) {
          _localStorage = _localStorage.concat({ origin: v, clear: true })
        }

        if (!_.find(_sessionStorage, v)) {
          _sessionStorage = _sessionStorage.concat({ origin: v, clear: true })
        }
      })

      await Promise.all([
        sessions.setStorage({ localStorage: _localStorage, sessionStorage: _sessionStorage }),
        Cypress.automation('clear:cookies', null),
      ])

      await sessions.setCookies(data.cookies)
    },

    getCookies () {
      return Cypress.automation('get:cookies', {})
    },

    setCookies (data) {
      return Cypress.automation('set:cookies', data)
    },

    async clearCookies () {
      return Cypress.automation('clear:cookies', await sessions.getCookies())
    },

    async getCurrentSessionData () {
      const storage = await sessions.getStorage({ origin: '*' })

      let cookies = [] as any[]

      cookies = await Cypress.automation('get:cookies', {})

      const ses = {
        ...storage,
        cookies,
      }

      return ses
    },

    getSession (id) {
      return Cypress.backend('get:session', id)
    },

    /**
     * 1) if we only need currentOrigin localStorage, access sync
     * 2) if cross-origin http, we need to load in iframe from our proxy that will intercept all http reqs at /__cypress/automation/*
     *      and postMessage() the localStorage value to us
     * 3) if cross-origin https, since we pass-thru https conntections in the proxy, we need to
     *      send a message telling our proxy server to intercept the next req to the https domain,
     *      then follow 2)
     */
    async getStorage (options = {}) {
      const specWindow = cy.state('specWindow')

      if (!_.isObject(options)) {
        throw new Error('getStorage() takes an object')
      }

      const opts = _.defaults({}, options, {
        origin: 'currentOrigin',
      })

      const currentOrigin = $Location.create(window.location.href).origin

      const origins = await mapOrigins(opts.origin)

      const getResults = () => {
        return results
      }
      const results = {
        localStorage: [] as any[],
        sessionStorage: [] as any[],
      }

      function pushValue (origin, value) {
        if (!_.isEmpty(value.localStorage)) {
          results.localStorage.push({ origin, value: value.localStorage })
        }

        if (!_.isEmpty(value.sessionStorage)) {
          results.sessionStorage.push({ origin, value: value.sessionStorage })
        }
      }

      const currentOriginIndex = origins.indexOf(currentOrigin)

      if (currentOriginIndex !== -1) {
        origins.splice(currentOriginIndex, 1)
        const currentOriginStorage = getCurrentOriginStorage()

        pushValue(currentOrigin, currentOriginStorage)
      }

      if (_.isEmpty(origins)) {
        return getResults()
      }

      if (currentOrigin.startsWith('https:')) {
        _.remove(origins, (v) => v.startsWith('http:'))
      }

      const postMessageResults = await getPostMessageLocalStorage(specWindow, origins)

      postMessageResults.forEach((val) => {
        pushValue(val[0], val[1])
      })

      return getResults()
    },

    async clearStorage () {
      const origins = await getAllHtmlOrigins()

      const originOptions = origins.map((v) => ({ origin: v, clear: true }))

      await sessions.setStorage({
        localStorage: originOptions,
        sessionStorage: originOptions,
      })
    },

    async setStorage (options: any, clearAll = false) {
      const currentOrigin = $Location.create(window.location.href).origin as string

      const mapToCurrentOrigin = (v) => ({ ...v, origin: (v.origin && v.origin !== 'currentOrigin') ? $Location.create(v.origin).origin : currentOrigin })

      const mappedLocalStorage = _.map(options.localStorage, (v) => {
        const mapped = { origin: v.origin, localStorage: _.pick(v, 'value', 'clear') }

        if (clearAll) {
          mapped.localStorage.clear = true
        }

        return mapped
      }).map(mapToCurrentOrigin)

      const mappedSessionStorage = _.map(options.sessionStorage, (v) => {
        const mapped = { origin: v.origin, sessionStorage: _.pick(v, 'value', 'clear') }

        if (clearAll) {
          mapped.sessionStorage.clear = true
        }

        return mapped
      }).map(mapToCurrentOrigin)

      const storageOptions = _.map(_.groupBy(mappedLocalStorage.concat(mappedSessionStorage), 'origin'), (v) => _.merge({}, ...v))

      await _setStorageOnOrigins(storageOptions)
    },

    registerSessionHooks () {
      Cypress.on('test:before:run:async', () => {
        if (Cypress.config('experimentalSessionSupport')) {
          currentTestRegisteredSessions.clear()

          return navigateAboutBlank(false)
          .then(() => sessions.clearCurrentSessionData())
          .then(() => {
            return Cypress.backend('reset:rendered:html:origins')
          })
        }

        return
      })
    },

  }

  Cypress.on('run:start', () => {
    sessions.registerSessionHooks()
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

      // stringfy deterministically if we were given an object
      id = typeof id === 'string' ? id : stringifyStable(id)

      if (options) {
        if (!_.isObject(options)) {
          $errUtils.throwErrByPath('sessions.session.wrongArgOptions')
        }

        const validopts = {
          'validate': 'function',
        }

        Object.keys(options).forEach((key) => {
          const expectedType = validopts[key]

          if (!expectedType) {
            $errUtils.throwErrByPath('sessions.session.wrongArgOptionUnexpected', { args: { key } })
          }

          const actualType = typeof options[key]

          if (actualType !== expectedType) {
            $errUtils.throwErrByPath('sessions.session.wrongArgOptionInvalid', { args: { key, expected: expectedType, actual: actualType } })
          }
        })
      }

      let existingSession = getActiveSession(id)

      if (!setup) {
        if (!existingSession || !currentTestRegisteredSessions.has(id)) {
          $errUtils.throwErrByPath('sessions.session.not_found', { args: { id } })
        }
      } else {
        const isUniqSessionDefinition = !existingSession || existingSession.setup.toString().trim() !== setup.toString().trim()

        if (isUniqSessionDefinition) {
          if (currentTestRegisteredSessions.has(id)) {
            $errUtils.throwErrByPath('sessions.session.duplicateId', { args: { id: existingSession.id } })
          }

          existingSession = sessions.defineSession({
            id,
            setup,
            validate: options.validate,
          })

          currentTestRegisteredSessions.set(id, true)
        }
      }

      const _log = Cypress.log({
        name: 'session',
        message: `${existingSession.id > 50 ? `${existingSession.id.substr(0, 47)}...` : existingSession.id}`,
        groupStart: true,
        snapshot: false,
      })

      const dataLog = Cypress.log({
        name: 'session',
        sessionInfo: getSessionDetails(existingSession),
        message: `${existingSession.id > 50 ? `${existingSession.id.substr(0, 47)}...` : existingSession.id}`,
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

          setActiveSession({ [existingSession.id]: existingSession })

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

  Cypress.session = sessions
}

function navigateAboutBlank (session = true) {
  Cypress.action('cy:url:changed', '')

  return Cypress.action('cy:visit:blank', { type: session ? 'session' : 'session-lifecycle' }) as unknown as Promise<void>
}
