import _ from 'lodash'
import { getAllHtmlOrigins } from './origins'
import { clearStorage, getStorage, setStorage } from './storage'

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

  setActiveSession = (obj: Cypress.ActiveSessions) => {
    const currentSessions = this.cy.state('activeSessions') || {}

    const newSessions = { ...currentSessions, ...obj }

    this.cy.state('activeSessions', newSessions)
  }

  getActiveSession = (id: string): Cypress.SessionData => {
    const currentSessions = this.cy.state('activeSessions') || {}

    return currentSessions[id]
  }

  clearActiveSessions = () => {
    const curSessions = this.cy.state('activeSessions') || {}
    const clearedSessions: Cypress.ActiveSessions = _.mapValues(curSessions, (v) => ({ ...v, hydrated: false }))

    this.cy.state('activeSessions', clearedSessions)
  }

  defineSession = (options = {} as any): Cypress.SessionData => {
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
  }

  saveSessionData = async (data) => {
    this.setActiveSession({ [data.id]: data })

    // persist the session to the server. Only matters in openMode OR if there's a top navigation on a future test.
    // eslint-disable-next-line no-console
    return this.Cypress.backend('save:session', { ...data, setup: data.setup.toString(), validate: data.validate?.toString() }).catch(console.error)
  }

  setSessionData = async (data) => {
    const allHtmlOrigins = await getAllHtmlOrigins(this.Cypress)

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
      setStorage(this.Cypress, { localStorage: _localStorage, sessionStorage: _sessionStorage }),
      this.sessions.setCookies(data.cookies),
    ])
  }

  // this the public api exposed to consumers as Cypress.session
  sessions = {
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
        clearStorage(this.Cypress),
        this.sessions.clearCookies(),
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
        getStorage(this.Cypress, { origin: '*' }),
        this.sessions.getCookies(),
      ])

      return {
        ...storage,
        cookies,
      }
    },

    getSession: (id: string): Promise<Cypress.ServerSessionData> => {
      return this.Cypress.backend('get:session', id)
    },
  }
}
