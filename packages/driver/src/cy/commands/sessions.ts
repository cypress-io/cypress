import _ from 'lodash'
import $ from 'jquery'
import $Location from '../../cypress/location'
import $errUtils from '../../cypress/error_utils'
import stringifyStable from 'json-stable-stringify'

const currentTestRegisteredSessions = new Map()
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
    const current_origin = $Location.create(window.location.href).origin

    return _.uniq(
      _.flatten(await Promise.map(
        ([] as string[]).concat(origins), async (v) => {
          if (v === '*') {
            return _.keys(await Cypress.backend('get:renderedHTMLOrigins')).concat([current_origin])
          }

          if (v === 'current_origin') return current_origin

          return $Location.create(v).origin
        },
      )),
    ) as string[]
  }

  async function _setStorageOnOrigins (originOptions) {
    const specWindow = cy.state('specWindow')

    const current_origin = $Location.create(window.location.href).origin

    const current_origin_options_index = _.findIndex(originOptions, { origin: current_origin })

    if (current_origin_options_index !== -1) {
      const opts = originOptions.splice(current_origin_options_index, 1)[0]

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

    const origins = originOptions.map((v) => v.origin) as string[]

    const iframes: JQuery<HTMLElement>[] = []

    const $iframeContainer = $(`<div style="display:none"></div>`).appendTo($('body', specWindow.document))

    // if we're on an https domain, there is no way for the secure context to access insecure origins from iframes
    // since there is no way for the app to access localStorage on insecure contexts, we don't have to clear any localStorage on http domains.
    if (current_origin.startsWith('https:')) {
      _.remove(origins, (v) => v.startsWith('http:'))
    }

    _.each(origins, (u) => {
      const $iframe = $(`<iframe src="${`${u}/__cypress/automation/setLocalStorage?${u}`}"></iframe>`)

      $iframe.appendTo($iframeContainer)
      iframes.push($iframe)
    })

    let onPostMessage

    const successOrigins = [] as string[]

    await new Promise((resolve) => {
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
    .timeout(2000)
    .catch((err) => {
      Cypress.log({
        name: 'warning',
        message: `failed to set session storage on origin(s): ${_.xor(origins, successOrigins).join(', ')}`,
      })
    })
    .finally(() => {
      specWindow.removeEventListener('message', onPostMessage)
      $iframeContainer.remove()
    })
  }

  async function getAllHtmlOrigins () {
    const current_origin = $Location.create(window.location.href).origin

    const origins = _.uniq([..._.keys(await Cypress.backend('get:renderedHTMLOrigins')), current_origin]) as string[]

    return origins
  }

  function throwIfNoSessionSupport () {
    if (!Cypress.config('experimentalSessionSupport')) {
      // TODO: proper error msg
      throw new Error('experimentalSessionSupport is not enabled. You must enable the experimentalSessionSupport flag in order to use Cypress session commands')
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
     * 1) if we only need current_origin localStorage, access sync
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
        origin: 'current_origin',
      })

      const current_origin = $Location.create(window.location.href).origin

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

      const currentOriginIndex = origins.indexOf(current_origin)

      if (currentOriginIndex !== -1) {
        origins.splice(currentOriginIndex, 1)
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

        pushValue(current_origin, value)
      }

      if (_.isEmpty(origins)) {
        return getResults()
      }

      if (current_origin.startsWith('https:')) {
        _.remove(origins, (v) => v.startsWith('http:'))
      }

      const iframes: JQuery<HTMLElement>[] = []

      const $iframeContainer = $(`<div style="display:none"></div>`).appendTo($('body', specWindow.document))

      _.each(origins, (u) => {
        const $iframe = $(`<iframe src="${`${u}/__cypress/automation/getLocalStorage`}"></iframe>`)

        $iframe.appendTo($iframeContainer)
        iframes.push($iframe)
      })

      let onPostMessage
      const successOrigins = [] as string[]

      await new Promise((resolve) => {
        onPostMessage = ((event) => {
          const data = event.data

          if (data.type !== 'localStorage') return

          const value = data.value

          pushValue(event.origin, value)

          successOrigins.push(event.origin)
          if (successOrigins.length === origins.length) {
            resolve()
          }
        })

        specWindow.addEventListener('message', onPostMessage)
      })
      .catch((err) => {
        Cypress.log({
          name: 'warning',
          message: `failed to set session storage data on origin(s): ${_.xor(origins, successOrigins).join(', ')}`,
        })
      })
      .finally(() => {
        specWindow.removeEventListener('message', onPostMessage)
        $iframeContainer.remove()
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
      const current_origin = $Location.create(window.location.href).origin as string

      const mapToCurrentOrigin = (v) => ({ ...v, origin: (v.origin && v.origin !== 'current_origin') ? $Location.create(v.origin).origin : current_origin })

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
            return Cypress.backend('reset:renderedHTMLOrigins')
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
        throw new Error('cy.session requires a string or object as the first argument')
      }

      // stringfy determinitically if we were given an object
      id = typeof id === 'string' ? id : stringifyStable(id)

      if (options) {
        if (!_.isObject(options)) {
          throw new Error('cy.session optional third argument must be an object')
        }

        const validopts = {
          'validate': 'function',
        }

        Object.keys(options).forEach((key) => {
          const expectedType = validopts[key]

          if (!expectedType) {
            throw new Error(`unexpected option **${key}** passed to cy.session options`)
          }

          const actualType = typeof options[key]

          if (actualType !== expectedType) {
            throw new Error(`invalid option **${key}** passed to cy.session options. Expected **${expectedType}**, got ${actualType}`)
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
            throw $errUtils.errByPath('sessions.session.duplicateId', { id: existingSession.id })
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

      async function runsetup (existingSession) {
        const creatingLog = Cypress.log({
          name: 'Creating New Session',
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

        await navigateAboutBlank()

        cy.then(() => sessions.clearCurrentSessionData())
        .then(() => existingSession.setup())

        return cy.then(() => sessions.getCurrentSessionData())
        .then((data) => {
          creatingLog.set({
            name: 'Created New Session',

          })

          Cypress.log({ groupEnd: true, emitOnly: true })

          _.extend(existingSession, data)
          existingSession.hydrated = true

          setActiveSession({ [existingSession.id]: existingSession })

          dataLog.set({
            consoleProps: () => getConsoleProps(existingSession),
          })

          // persist the session to the server. Only matters in openMode OR if there's a top navigation on a future test.
          // eslint-disable-next-line no-console

          // eslint-disable-next-line no-console
          return Cypress.backend('save:session', { ...existingSession, setup: existingSession.setup.toString() }).catch(console.error)
        })
      }

      // uses Cypress hackery to resolve `false` if validate() resolves/returns false or throws/fails a cypress command.
      function validateSession (existingSession, _onFail) {
        navigateAboutBlank()

        const validatingLog = Cypress.log({
          name: 'Validating Session',
          message: '',
          snapshot: false,
          type: 'system',
          state: 'passed',
          event: true,
          groupStart: true,
        })

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
              throw new Error('Your `cy.session` **validate** callback resolved false')
            }

            Cypress.log({ groupEnd: true, emitOnly: true })
          })
          .catch((err) => {
            onFail(err)
          })
        }

        cy.state('onCommandFailed', (err, queue, next) => {
          const index = _.findIndex(queue.commands, (v: any) => _commandToResume && v.attributes.chainerId === _commandToResume.chainerId)

          cy.state('index', index)

          cy.state('onCommandFailed', null)

          _didThrow = err

          return next()
        })

        const _catchCommand = cy.then(async () => {
          cy.state('onCommandFailed', null)
          if (_didThrow) return onFail((_didThrow))

          if (returnVal === false) {
            return onFail((new Error('Your `cy.session` **validate** callback returned false.')))
          }

          if (returnVal === undefined || Cypress.isCy(returnVal)) {
            const val = cy.state('current').get('prev')?.attributes?.subject

            if (val === false) {
              return onFail((new Error('Your `cy.session` **validate** callback resolved false')))
            }
          }

          Cypress.log({ groupEnd: true, emitOnly: true })
        })

        _commandToResume = _catchCommand

        return _catchCommand
      }

      let hadValidationError = false
      let onValidationError: Function = (err, log) => {
        log.set({
          name: 'Invalidated Session',
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
              message: `(invalidated) ${_log.get().message}`,
            }
          },
        })

        Cypress.log({ groupEnd: true, emitOnly: true })

        hadValidationError = true

        return runsetup(existingSession)
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
        err.message += '\n\nThis error occurred in a session validate hook after initializing the session.'

        cy.fail(err)
      }

      return cy.then(async () => {
        if (existingSession.hydrated) return

        const serverStoredSession = await sessions.getSession(existingSession.id).catch(_.noop)

        // we have a saved session on the server AND setup matches
        if (serverStoredSession && serverStoredSession.setup === existingSession.setup.toString()) {
          _.extend(existingSession, serverStoredSession)
          existingSession.hydrated = true
        }
      }).then(() => {
        if (!existingSession.hydrated) {
          onValidationError = throwValidationError

          return runsetup(existingSession)
        }

        Cypress.log({
          name: 'Restored Saved Session',
          event: true,
          state: 'passed',
          type: 'system',
          message: ``,
        })

        _log.set({
          renderProps: () => {
            return {
              indicator: 'pending',
              message: `(cached) ${_log.get().message}`,
            }
          },
        })

        return sessions.setSessionData(existingSession)
      })
      .then(async () => {
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
  if (cy.state('window').location.href === 'about:blank') {
    return Promise.resolve()
  }

  Cypress.action('cy:url:changed', '')

  return Cypress.action('cy:visit:blank', { type: session ? 'session' : 'session-lifecycle' }) as unknown as Promise<void>
}
