import _ from 'lodash'
import $ from 'jquery'

import $Location from '../../cypress/location'
import $errUtils, { errs } from '../../cypress/error_utils'

// type LocalStorageData = {origin: string, localStorage?: object, sessionStorage?: object}
// type LocalStorageOptions = {origin: string, localStorage?: object, sessionStorage?: object, clear?: boolean}

const currentTestRegisteredSessions = new Map()
const getSessionDetails = (sessState) => {
  return {
    name: sessState.name,
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
    name: sessState.name,
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
  const getActiveSession = (name) => {
    const currentSessions = cy.state('activeSessions') || {}

    return currentSessions[name]
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

  interface defineSessionOpts {
    name: string
    setupFn: Function
    validate?: Function
    before?: Function
    after?: Function
  }

  const sessions = {

    defineSession (name: string | defineSessionOpts, setupFn?: Function, options = {} as defineSessionOpts) {
      throwIfNoSessionSupport()

      if (_.isObject(name)) {
        options = name as defineSessionOpts
        name = options.name
        setupFn = options.setupFn
      }

      if (!name) {
        $errUtils.throwErrByPath(errs.sessions.defineSession.missing_argument, { args: { name: 'name' } })
      }

      if (!setupFn) {
        $errUtils.throwErrByPath(errs.sessions.defineSession.missing_argument, { args: { name: 'steps function' } })
      }

      const sess_state = {
        name,
        cookies: null,
        localStorage: null,
        setupFn,
        hydrated: false,
        after: options.after,
        before: options.before,
        validate: options.validate,
      }

      setActiveSession({ [sess_state.name]: sess_state })

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

    getSession (name) {
      return Cypress.backend('get:session', name)
    },

    async saveSession (name: string) {
      const ses = await sessions.getCurrentSessionData()

      return Cypress.backend('save:session', { ...ses, name })
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
        // return _.omitBy(results, _.isEmpty)
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
        currentTestRegisteredSessions.clear()
        Cypress.action('cy:url:changed', '')

        return Cypress.action('cy:visit:blank')
        .then(() => {
          return sessions.clearCurrentSessionData()
        }).then(() => {
          return Cypress.backend('reset:renderedHTMLOrigins')
        })
      })
    },

  }

  if (Cypress.config('experimentalSessionSupport')) {
    sessions.registerSessionHooks()
  }

  Commands.addAll({
    session (name, setupFn?: Function, options: {
      validate?: Function
    } = {}) {
      throwIfNoSessionSupport()

      if (!name || !_.isString(name)) {
        throw new Error('cy.session requires a string as the first argument')
      }

      if (options) {
        if (!_.isObject(options)) {
          throw new Error('cy.session optional third argument must be an object')
        }

        const validopts = {
          'validate': 'function',
          'exclude': 'object',
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

      let existingSession = getActiveSession(name)

      if (!setupFn) {
        if (!existingSession || !currentTestRegisteredSessions.has(name)) {
          $errUtils.throwErrByPath('sessions.session.not_found', { args: { name } })
        }
      } else {
        const isUniqSessionDefinition = !existingSession || existingSession.setupFn.toString().trim() !== setupFn.toString().trim()

        if (isUniqSessionDefinition) {
          if (currentTestRegisteredSessions.has(name)) {
            throw $errUtils.errByPath(errs.sessions.session.duplicateName, { name: existingSession.name })
          }

          existingSession = sessions.defineSession({
            name,
            setupFn,
            validate: options.validate,
          })
        }
      }

      const wrap = (obj) => {
        // await a returned chainer OR promises
        if (obj === undefined) {
          return cy.then(() => {
            return cy.state('current').get('prev')?.attributes?.subject
          })
        }

        if (Cypress.isCy(obj)) {
          return obj
        }

        return cy.wrap(obj, { log: false })
      }

      const _log = Cypress.log({
        name: 'session',
        sessionInfo: getSessionDetails(existingSession),
        message: `**${existingSession.name}**`,
        type: 'parent',
        state: 'passed',
      })

      const initialize = async () => {
        if (existingSession.hydrated) return existingSession

        const serverStoredSession = await sessions.getSession(existingSession.name).catch(_.noop)

        if (serverStoredSession && serverStoredSession.setupFn === existingSession.setupFn.toString()) {
          _.extend(existingSession, serverStoredSession)
          existingSession.hydrated = true
        }
      }

      wrap(initialize())
      cy.then(async () => {
        Cypress.log({
          groupStart: true,
        })

        if (!existingSession.hydrated) {
          return false
        }

        if (existingSession.validate) {
          return wrap(existingSession.validate(existingSession))
        }

        return true
      })
      .then(async (isValid) => {
        if (isValid === false) {
          if (existingSession.hydrated) {
            const __log = Cypress.log({
              name: 'session',
              sessionInfo: getSessionDetails(existingSession),
              message: `invalidated **${existingSession.name}**`,
              state: 'failed',
            })

            setTimeout(() => {
              __log.set({
                state: 'failed',
              })
            })
          } else {
            // using a brand new session
          }

          return false
        }

        _log.set({
          message: `using saved session **${existingSession.name}**`,
          // consoleProps: { table: [() => ({ name: 'foo', data: [{ foo: true, bar: true }] })] },
          // consoleProps: () => getConsoleProps(sess_state),

          // state: 'passed',
        })

        await sessions.setSessionData(existingSession)

        return wrap(true)
      })

      .then(async (alreadyHydrated) => {
        if (alreadyHydrated) return

        cy.then(() => sessions.clearCurrentSessionData())

        .then(() => existingSession.setupFn())

        .then(() => {
          wrap(sessions.getCurrentSessionData().then((data) => {
            _.extend(existingSession, data)
            existingSession.hydrated = true

            setActiveSession({ [existingSession.name]: existingSession })

            const sessionDetails = getSessionDetails(existingSession)

            Cypress.log({
              name: 'Session',
              state: 'passed',
              sessionInfo: sessionDetails,
              message: `Finished registering session`,
              emitOnly: true,
            })

            _log.set({

              consoleProps: () => getConsoleProps(existingSession),
              // consoleProps () {
              //   return {
              //     'table': [() => {
              //       return {
              //         name: 'ents',
              //         data: [{ foo: true }],
              //       }
              //     }],
              //   }
              // },
            })

            // persist the session to the server, it can happen async/dangling since this doesn't affect the test
            // and really only matters in openMode and if there's a top navigation on a future test.
            // eslint-disable-next-line no-console
            void Cypress.backend('save:session', { ...existingSession }).catch(console.error)
          }))
        })
      })
      .then(() => {
        Cypress.action('cy:url:changed', '')

        return Cypress.action('cy:visit:blank', { type: 'session' })
      })

      .then(() => {
        Cypress.log({ groupEnd: true })

        return {
          localStorage: existingSession.localStorage,
          cookies: existingSession.cookies,
        }
      })
    },
  })

  // cy.defineSession = sessions.defineSession

  Cypress.session = sessions
}
