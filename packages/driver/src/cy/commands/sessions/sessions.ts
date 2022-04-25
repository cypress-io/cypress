import _ from 'lodash'
import { $Location } from '../../../cypress/location'

import {
  getCurrentOriginStorage,
  setPostMessageLocalStorage,
  getPostMessageLocalStorage,
  navigateAboutBlank,
} from './utils'

const currentTestRegisteredSessions = new Map()

type ActiveSessions = Cypress.Commands.Session.ActiveSessions
type SessionData = Cypress.Commands.Session.SessionData

export default class SessionsManager {
  Cypress
  cy

  constructor (Cypress, cy) {
    this.Cypress = Cypress
    this.cy = cy
  }

  setActiveSession (obj: ActiveSessions) {
    const currentSessions = this.cy.state('activeSessions') || {}

    const newSessions = { ...currentSessions, ...obj }

    this.cy.state('activeSessions', newSessions)
  }

  getActiveSession (id: string): SessionData {
    const currentSessions = this.cy.state('activeSessions') || {}

    return currentSessions[id]
  }

  clearActiveSessions () {
    const curSessions = this.cy.state('activeSessions') || {}

    this.cy.state('activeSessions', _.mapValues(curSessions, (v) => ({ ...v, hydrated: false })))
  }

  async mapOrigins (origins: string) {
    const currentOrigin = $Location.create(window.location.href).origin

    return _.uniq(
      _.flatten(await this.Cypress.Promise.map(
        ([] as string[]).concat(origins), async (v) => {
          if (v === '*') {
            return _.keys(await this.Cypress.backend('get:rendered:html:origins')).concat([currentOrigin])
          }

          if (v === 'currentOrigin') return currentOrigin

          return $Location.create(v).origin
        },
      )),
    ) as string[]
  }

  async _setStorageOnOrigins (originOptions) {
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

  async getAllHtmlOrigins () {
    const currentOrigin = $Location.create(window.location.href).origin

    const origins = _.uniq([..._.keys(await Cypress.backend('get:rendered:html:origins')), currentOrigin]) as string[]

    return origins
  }

  defineSession (options = {} as any): SessionData {
    const sess_state: SessionData = {
      id: options.id,
      cookies: null,
      localStorage: null,
      setup: options.setup,
      hydrated: false,
      validate: options.validate,
    }

    this.setActiveSession({ [sess_state.id]: sess_state })

    return sess_state
  }

  async clearAllSavedSessions () {
    this.clearActiveSessions()

    return this.Cypress.backend('clear:session', null)
  }

  async clearCurrentSessionData () {
    window.localStorage.clear()
    window.sessionStorage.clear()

    await Promise.all([
      this.clearStorage(),
      this.clearCookies(),
    ])
  }

  async setSessionData (data) {
    await this.clearCurrentSessionData()
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
      this.setStorage({ localStorage: _localStorage, sessionStorage: _sessionStorage }),
      this.Cypress.automation('clear:cookies', null),
    ])

    await this.setCookies(data.cookies)
  }

  async getCookies () {
    return this.Cypress.automation('get:cookies', {})
  }

  setCookies (data) {
    return this.Cypress.automation('set:cookies', data)
  }

  async clearCookies () {
    return this.Cypress.automation('clear:cookies', await this.getCookies())
  }

  async getCurrentSessionData () {
    const storage = await this.getStorage({ origin: '*' })

    let cookies = [] as any[]

    cookies = await this.Cypress.automation('get:cookies', {})

    const ses = {
      ...storage,
      cookies,
    }

    return ses
  }

  getSession (id) {
    return this.Cypress.backend('get:session', id)
  }

  /**
     * 1) if we only need currentOrigin localStorage, access sync
     * 2) if cross-origin http, we need to load in iframe from our proxy that will intercept all http reqs at /__cypress/automation/*
     *      and postMessage() the localStorage value to us
     * 3) if cross-origin https, since we pass-thru https connections in the proxy, we need to
     *      send a message telling our proxy server to intercept the next req to the https domain,
     *      then follow 2)
     */
  async getStorage (options = {}) {
    const specWindow = this.cy.state('specWindow')

    if (!_.isObject(options)) {
      throw new Error('getStorage() takes an object')
    }

    const opts = _.defaults({}, options, {
      origin: 'currentOrigin',
    })

    const currentOrigin = $Location.create(window.location.href).origin

    const origins = await this.mapOrigins(opts.origin)

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
  }

  async clearStorage () {
    const origins = await this.getAllHtmlOrigins()

    const originOptions = origins.map((v) => ({ origin: v, clear: true }))

    await this.setStorage({
      localStorage: originOptions,
      sessionStorage: originOptions,
    })
  }

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

    await this._setStorageOnOrigins(storageOptions)
  }

  registerSessionHooks () {
    this.Cypress.on('test:before:run:async', () => {
      if (Cypress.config('experimentalSessionAndOrigin')) {
        currentTestRegisteredSessions.clear()

        return navigateAboutBlank(false)
        .then(() => this.clearCurrentSessionData())
        .then(() => {
          return this.Cypress.backend('reset:rendered:html:origins')
        })
      }

      return
    })
  }

  publicAPI () {
    return {
      clearAllSavedSessions: this.clearAllSavedSessions,
      clearActiveSessions: this.clearActiveSessions,
      clearCookies: this.clearCookies,
      clearCurrentSessionData: this.clearCurrentSessionData,
      clearStorage: this.clearStorage,
      defineSession: this.defineSession,
      getCookies: this.getCookies,
      getCurrentSessionData: this.getCurrentSessionData,
      getSession: this.getSession,
      getStorage: this.getStorage,
      registerSessionHooks: this.registerSessionHooks,
      setCookies: this.setCookies,
      setSessionData: this.setSessionData,
      setStorage: this.setStorage,
    }
  }
}
