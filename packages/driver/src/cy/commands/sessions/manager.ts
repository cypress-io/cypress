import _ from 'lodash'
import { $Location } from '../../../cypress/location'
import type { ServerSessionData } from '@packages/types'
import {
  getCurrentOriginStorage,
  setPostMessageLocalStorage,
  getPostMessageLocalStorage,
} from './utils'

type ActiveSessions = Cypress.Commands.Session.ActiveSessions
type SessionData = Cypress.Commands.Session.SessionData

const LOGS = {
  clearCurrentSessionData: {
    displayName: 'Clear cookies, localStorage and sessionStorage',
    consoleProps: {
      Event: 'Cypress.session.clearCurrentSessionData()',
      Details: 'Clearing the cookies, localStorage and sessionStorage across all domains. This ensures the session is created in clean browser context.',
    },
  },
}

const getLogProperties = (apiName) => {
  return {
    name: 'sessions_manager',
    message: '',
    event: true,
    state: 'passed',
    type: 'system',
    snapshot: false,
    ...LOGS[apiName],
  }
}

export default class SessionsManager {
  Cypress
  cy
  registeredSessions = new Map()

  constructor (Cypress, cy) {
    this.Cypress = Cypress
    this.cy = cy
  }

  setActiveSession = (obj: ActiveSessions) => {
    const currentSessions = this.cy.state('activeSessions') || {}

    const newSessions = { ...currentSessions, ...obj }

    this.cy.state('activeSessions', newSessions)
  }

  getActiveSession = (id: string): SessionData => {
    const currentSessions = this.cy.state('activeSessions') || {}

    return currentSessions[id]
  }

  clearActiveSessions = () => {
    const curSessions = this.cy.state('activeSessions') || {}
    const clearedSessions: ActiveSessions = _.mapValues(curSessions, (v) => ({ ...v, hydrated: false }))

    this.cy.state('activeSessions', clearedSessions)
  }

  mapOrigins = async (origins: string | Array<string>): Promise<Array<string>> => {
    const getOrigins = this.Cypress.Promise.map(
      ([] as string[]).concat(origins), async (v) => {
        if (v === '*') {
          return await this.getAllHtmlOrigins()
        }

        if (v === 'currentOrigin') {
          return $Location.create(window.location.href).origin
        }

        return $Location.create(v).origin
      },
    )

    return _.uniq(_.flatten(await getOrigins))
  }

  _setStorageOnOrigins = async (originOptions) => {
    const specWindow = this.cy.state('specWindow')

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

  getAllHtmlOrigins = async () => {
    const currentOrigin = $Location.create(window.location.href).origin
    const storedOrigins = await this.Cypress.backend('get:rendered:html:origins')
    const origins = [..._.keys(storedOrigins), currentOrigin]

    return _.uniq(origins)
  }

  // this the public api exposed to consumers as Cypress.session
  sessions = {
    defineSession: (options = {} as any): SessionData => {
      return {
        id: options.id,
        cookies: null,
        localStorage: null,
        sessionStorage: null,
        setup: options.setup,
        hydrated: false,
        validate: options.validate,
        cacheAcrossSpecs: !!options.cacheAcrossSpecs,
      }
    },

    clearAllSavedSessions: async () => {
      this.clearActiveSessions()
      this.registeredSessions.clear()
      const clearAllSessions = true

      return this.Cypress.backend('clear:sessions', clearAllSessions)
    },

    clearCurrentSessionData: async () => {
      // this prevents a log occurring when we clear session in-between tests
      if (this.cy.state('duringUserTestExecution')) {
        this.Cypress.log(getLogProperties('clearCurrentSessionData'))
      }

      window.localStorage.clear()
      window.sessionStorage.clear()

      await Promise.all([
        this.sessions.clearStorage(),
        this.sessions.clearCookies(),
      ])
    },

    saveSessionData: async (data) => {
      this.setActiveSession({ [data.id]: data })

      // persist the session to the server. Only matters in openMode OR if there's a top navigation on a future test.
      // eslint-disable-next-line no-console
      return this.Cypress.backend('save:session', { ...data, setup: data.setup.toString(), validate: data.validate?.toString() }).catch(console.error)
    },

    setSessionData: async (data) => {
      const allHtmlOrigins = await this.getAllHtmlOrigins()

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
        this.sessions.setStorage({ localStorage: _localStorage, sessionStorage: _sessionStorage }),
        this.sessions.setCookies(data.cookies),
      ])
    },

    getCookies: async () => {
      return this.Cypress.automation('get:cookies', {})
    },

    setCookies: async (cookies) => {
      return this.Cypress.automation('set:cookies', cookies)
    },

    clearCookies: async () => {
      return this.Cypress.automation('clear:cookies', await this.sessions.getCookies())
    },

    getCurrentSessionData: async () => {
      const [storage, cookies] = await Promise.all([
        this.sessions.getStorage({ origin: '*' }),
        this.sessions.getCookies(),
      ])

      return {
        ...storage,
        cookies,
      }
    },

    getSession: (id: string): Promise<ServerSessionData> => {
      return this.Cypress.backend('get:session', id)
    },

    /**
      * 1) if we only need currentOrigin localStorage, access sync
      * 2) if cross-origin http, we need to load in iframe from our proxy that will intercept all http reqs at /__cypress/automation/*
      *      and postMessage() the localStorage value to us
      * 3) if cross-origin https, since we pass-thru https connections in the proxy, we need to
      *      send a message telling our proxy server to intercept the next req to the https domain,
      *      then follow 2)
      */
    getStorage: async (options = {}) => {
      const specWindow = this.cy.state('specWindow')

      if (!_.isObject(options)) {
        throw new Error('getStorage() takes an object')
      }

      const opts = _.defaults({}, options, {
        origin: 'currentOrigin',
      })

      const currentOrigin = $Location.create(window.location.href).origin

      const origins: Array<string> = await this.mapOrigins(opts.origin)

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
        return results
      }

      if (currentOrigin.startsWith('https:')) {
        _.remove(origins, (v) => v.startsWith('http:'))
      }

      const postMessageResults = await getPostMessageLocalStorage(specWindow, origins)

      postMessageResults.forEach((val) => {
        pushValue(val[0], val[1])
      })

      return results
    },

    clearStorage: async () => {
      const origins = await this.getAllHtmlOrigins()

      const originOptions = origins.map((v) => ({ origin: v, clear: true }))

      await this.sessions.setStorage({
        localStorage: originOptions,
        sessionStorage: originOptions,
      })
    },

    setStorage: async (options: any, clearAll = false) => {
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

      await this._setStorageOnOrigins(storageOptions)
    },
  }
}
