const SessionsManager = require('../../../../src/cy/commands/sessions/manager').default
const $Cypress = require('../../../../src/cypress').default

describe('src/cy/commands/sessions/manager.ts', () => {
  let CypressInstance
  let baseUrl

  beforeEach(function () {
    // @ts-ignore
    CypressInstance = new $Cypress()
    baseUrl = Cypress.config('baseUrl')
  })

  it('creates SessionsManager instance', () => {
    const sessionsManager = new SessionsManager(CypressInstance, () => {})

    expect(sessionsManager).to.haveOwnProperty('cy')
    expect(sessionsManager).to.haveOwnProperty('Cypress')
    expect(sessionsManager).to.haveOwnProperty('registeredSessions')
    expect(sessionsManager.registeredSessions).to.be.instanceOf(Map)
  })

  describe('.setActiveSession()', () => {
    it('adds session when none were previously added', () => {
      const cySpy = cy.spy(cy, 'state').withArgs('activeSessions')

      const activeSession: Cypress.Commands.Session.ActiveSessions = {
        'session_1': {
          id: 'session_1',
          setup: () => {},
          cacheAcrossSpecs: false,
          hydrated: true,
        },
      }

      const sessionsManager = new SessionsManager(CypressInstance, cy)

      sessionsManager.setActiveSession(activeSession)
      const calls = cySpy.getCalls()

      expect(cySpy).to.be.calledTwice
      expect(calls[0].args[1]).to.be.undefined
      expect(calls[1].args[1]).to.haveOwnProperty('session_1')
    })

    it('adds session when other sessions were previously added', () => {
      const existingSessions: Cypress.Commands.Session.ActiveSessions = {
        'session_1': {
          id: 'session_1',
          setup: () => {},
          cacheAcrossSpecs: false,
          hydrated: false,
        },
        'session_2': {
          id: 'session_2',
          setup: () => {},
          cacheAcrossSpecs: false,
          hydrated: true,
        },
      }

      const cySpy = cy.stub(cy, 'state').callThrough().withArgs('activeSessions').returns(existingSessions)

      const activeSession: Cypress.Commands.Session.ActiveSessions = {
        'session_3': {
          id: 'session_3',
          setup: () => {},
          cacheAcrossSpecs: false,
          hydrated: true,
        },
      }

      const sessionsManager = new SessionsManager(CypressInstance, cy)

      sessionsManager.setActiveSession(activeSession)
      const calls = cySpy.getCalls()

      expect(cySpy).to.be.calledTwice
      expect(calls[0].args[1]).to.be.undefined
      expect(calls[1].args[1]).to.haveOwnProperty('session_1')
      expect(calls[1].args[1]).to.haveOwnProperty('session_2')
      expect(calls[1].args[1]).to.haveOwnProperty('session_3')
    })
  })

  describe('.getActiveSession()', () => {
    it('returns undefined when no active sessions', () => {
      const cySpy = cy.stub(cy, 'state').callThrough().withArgs('activeSessions')

      const sessionsManager = new SessionsManager(CypressInstance, cy)

      const activeSession = sessionsManager.getActiveSession('session_1')

      expect(cySpy).to.be.calledOnce
      expect(activeSession).to.be.undefined
    })

    it('returns session when found', () => {
      const activeSessions: Cypress.Commands.Session.ActiveSessions = {
        'session_1': {
          id: 'session_1',
          setup: () => {},
          cacheAcrossSpecs: false,
          hydrated: false,
        },
        'session_2': {
          id: 'session_2',
          setup: () => {},
          cacheAcrossSpecs: false,
          hydrated: true,
        },
      }

      const cySpy = cy.stub(cy, 'state').callThrough().withArgs('activeSessions').returns(activeSessions)

      const sessionsManager = new SessionsManager(CypressInstance, cy)

      let activeSession = sessionsManager.getActiveSession('session_1')

      expect(cySpy).to.be.calledOnce
      expect(activeSession).to.deep.eq(activeSessions['session_1'])
    })
  })

  describe('.clearActiveSessions()', () => {
    it('handles when no active sessions have been set', () => {
      const cySpy = cy.stub(cy, 'state').callThrough().withArgs('activeSessions')

      const sessionsManager = new SessionsManager(CypressInstance, cy)

      sessionsManager.clearActiveSessions()
      const calls = cySpy.getCalls()

      expect(cySpy).to.be.calledTwice
      expect(calls[1].args[1]).to.be.instanceOf(Object)
      expect(calls[1].args[1]).to.deep.eq({})
    })

    it('updates the existing active sessions to "hydrated: false"', () => {
      const existingSessions: Cypress.Commands.Session.ActiveSessions = {
        'session_1': {
          id: 'session_1',
          setup: () => {},
          cacheAcrossSpecs: false,
          hydrated: false,
        },
        'session_2': {
          id: 'session_2',
          setup: () => {},
          cacheAcrossSpecs: false,
          hydrated: true,
        },
      }

      const cySpy = cy.stub(cy, 'state').callThrough().withArgs('activeSessions').returns(existingSessions)

      const sessionsManager = new SessionsManager(CypressInstance, cy)

      sessionsManager.clearActiveSessions()
      const calls = cySpy.getCalls()

      expect(cySpy).to.be.calledTwice
      expect(calls[1].args[1]).to.be.instanceOf(Object)
      expect(calls[1].args[1]).to.haveOwnProperty('session_1')
      expect(calls[1].args[1].session_1).to.haveOwnProperty('hydrated', false)
      expect(calls[1].args[1]).to.haveOwnProperty('session_2')
      expect(calls[1].args[1].session_2).to.haveOwnProperty('hydrated', false)
    })
  })

  describe('.mapOrigins()', () => {
    it('maps when requesting all origins', async () => {
      const sessionsManager = new SessionsManager(CypressInstance, cy)

      const allOrigins = ['https://example.com', baseUrl, 'http://foobar.com', 'http://foobar.com']
      const sessionsSpy = cy.stub(sessionsManager, 'getAllHtmlOrigins').resolves(allOrigins)

      const origins = await sessionsManager.mapOrigins('*')

      expect(origins).to.deep.eq(['https://example.com', baseUrl, 'http://foobar.com'])
      expect(sessionsSpy).to.be.calledOnce
    })

    it('maps when requesting the current origin', async () => {
      const sessionsManager = new SessionsManager(CypressInstance, cy)
      const sessionsSpy = cy.stub(sessionsManager, 'getAllHtmlOrigins')
      const origins = await sessionsManager.mapOrigins('currentOrigin')

      expect(origins).to.deep.eq([baseUrl])
      expect(sessionsSpy).not.to.be.called
    })

    it('maps when requesting a specific origin', async () => {
      const sessionsManager = new SessionsManager(CypressInstance, cy)
      const sessionsSpy = cy.stub(sessionsManager, 'getAllHtmlOrigins')
      const origins = await sessionsManager.mapOrigins('https://example.com/random_page?1')

      expect(origins).to.deep.eq(['https://example.com'])
      expect(sessionsSpy).not.to.be.called
    })

    it('maps when requesting a list of origins', async () => {
      const sessionsManager = new SessionsManager(CypressInstance, cy)

      const allOrigins = ['https://example.com', baseUrl, 'http://foobar.com', 'http://foobar.com']
      const sessionsSpy = cy.stub(sessionsManager, 'getAllHtmlOrigins').resolves(allOrigins)

      const origins = await sessionsManager.mapOrigins(['*', 'https://other.com'])

      expect(origins).to.deep.eq(['https://example.com', baseUrl, 'http://foobar.com', 'https://other.com'])
      expect(sessionsSpy).to.be.calledOnce
    })
  })

  // TODO:
  describe('._setStorageOnOrigins()', () => {})

  it('.getAllHtmlOrigins()', async () => {
    const storedOrigins = {
      'https://example.com': {},
      'https://foobar.com': {},
    }

    storedOrigins[`${baseUrl}`] = {}
    const cypressSpy = cy.stub(CypressInstance, 'backend').callThrough().withArgs('get:rendered:html:origins').resolves(storedOrigins)
    const sessionsManager = new SessionsManager(CypressInstance, cy)

    const origins = await sessionsManager.getAllHtmlOrigins()

    expect(cypressSpy).have.been.calledOnce
    expect(origins).to.have.lengthOf(3)
    expect(origins).to.deep.eq(['https://example.com', 'https://foobar.com', baseUrl])
  })

  describe('.sessions', () => {
    it('sessions.defineSession()', () => {
      const sessionsManager = new SessionsManager(CypressInstance, cy)
      const setup = cy.stub()
      const sess = sessionsManager.sessions.defineSession({ id: '1', setup })

      expect(sess).to.deep.eq({
        id: '1',
        setup,
        validate: undefined,
        cookies: null,
        cacheAcrossSpecs: false,
        localStorage: null,
        sessionStorage: null,
        hydrated: false,
      })
    })

    it('sessions.clearAllSavedSessions()', async () => {
      const cypressSpy = cy.stub(CypressInstance, 'backend').callThrough().withArgs('clear:sessions', true).resolves(null)

      const sessionsManager = new SessionsManager(CypressInstance, () => {})
      const sessionsSpy = cy.stub(sessionsManager, 'clearActiveSessions')

      await sessionsManager.sessions.clearAllSavedSessions()

      expect(sessionsSpy).to.be.calledOnce
      expect(cypressSpy).to.be.calledOnceWith('clear:sessions', true)
    })

    describe('.clearCurrentSessionData()', () => {
      it('logs message when running tests', async () => {
        // Unable to cleanly mock localStorage or sessionStorage on Firefox,
        // so add dummy values and ensure they are cleared as expected.
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1141698
        window.localStorage.foo = 'bar'
        window.sessionStorage.jazzy = 'music'

        expect(window.localStorage).of.have.lengthOf(1)
        expect(window.sessionStorage).of.have.lengthOf(1)

        CypressInstance.log = cy.stub()
        const sessionsManager = new SessionsManager(CypressInstance, {
          state: () => true,
        })

        const clearStorageSpy = cy.stub(sessionsManager.sessions, 'clearStorage')
        const clearCookiesSpy = cy.stub(sessionsManager.sessions, 'clearCookies')

        await sessionsManager.sessions.clearCurrentSessionData()

        expect(clearStorageSpy).to.be.calledOnce
        expect(clearCookiesSpy).to.be.calledOnce
        expect(window.localStorage).of.have.lengthOf(0)
        expect(window.sessionStorage).of.have.lengthOf(0)
        expect(CypressInstance.log).to.be.calledOnce
      })

      it('does not log message when setting up tests', async () => {
        // Unable to cleanly mock localStorage or sessionStorage on Firefox,
      // so add dummy values and ensure they are cleared as expected.
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1141698
        window.localStorage.foo = 'bar'
        window.sessionStorage.jazzy = 'music'

        expect(window.localStorage).of.have.lengthOf(1)
        expect(window.sessionStorage).of.have.lengthOf(1)

        CypressInstance.log = cy.stub()
        const sessionsManager = new SessionsManager(CypressInstance, {
          state: () => false,
        })

        const clearStorageSpy = cy.stub(sessionsManager.sessions, 'clearStorage')
        const clearCookiesSpy = cy.stub(sessionsManager.sessions, 'clearCookies')

        await sessionsManager.sessions.clearCurrentSessionData()

        expect(clearStorageSpy).to.be.calledOnce
        expect(clearCookiesSpy).to.be.calledOnce
        expect(window.localStorage).of.have.lengthOf(0)
        expect(window.sessionStorage).of.have.lengthOf(0)
        expect(CypressInstance.log).not.to.be.called
      })
    })

    it('sessions.saveSessionData', async () => {
      const cypressSpy = cy.stub(CypressInstance, 'backend').callThrough().withArgs('save:session').resolves(null)

      const sessionsManager = new SessionsManager(CypressInstance, cy)
      const sessionsSpy = cy.stub(sessionsManager, 'setActiveSession')

      const setup = cy.stub()
      const sess = { id: '1', setup }

      await sessionsManager.sessions.saveSessionData(sess)

      expect(sessionsSpy).to.be.calledOnce
      expect(sessionsSpy.getCall(0).args[0]).to.deep.eq({ 1: sess })

      expect(cypressSpy).to.be.calledOnceWith('save:session')
    })

    // TODO:
    describe('sessions.setSessionData', () => {})

    it('sessions.getCookies()', async () => {
      const cookies = [{ id: 'cookie' }]
      const cypressSpy = cy.stub(CypressInstance, 'automation').withArgs('get:cookies').resolves(cookies)

      const sessionsManager = new SessionsManager(CypressInstance, () => {})

      const sessionCookies = await sessionsManager.sessions.getCookies()

      expect(cypressSpy).to.be.calledOnceWith('get:cookies', {})
      expect(sessionCookies).to.deep.eq(cookies)
    })

    it('sessions.setCookies()', async () => {
      const cypressSpy = cy.stub(CypressInstance, 'automation').withArgs('set:cookies')

      const sessionsManager = new SessionsManager(CypressInstance, () => {})

      await sessionsManager.sessions.setCookies({})

      expect(cypressSpy).to.be.calledOnceWith('set:cookies', {})
    })

    it('sessions.clearCookies()', async () => {
      const cookies = [{ id: 'cookie' }]
      const cypressSpy = cy.stub(CypressInstance, 'automation').withArgs('clear:cookies').resolves([])

      const sessionsManager = new SessionsManager(CypressInstance, () => {})
      const sessionsSpy = cy.stub(sessionsManager.sessions, 'getCookies').resolves(cookies)

      await sessionsManager.sessions.clearCookies()

      expect(sessionsSpy).to.be.calledOnce
      expect(cypressSpy).to.be.calledOnceWith('clear:cookies', cookies)
    })

    it('sessions.getCurrentSessionData', async () => {
      const sessionsManager = new SessionsManager(CypressInstance, () => {})
      const getStorageSpy = cy.stub(sessionsManager.sessions, 'getStorage').resolves({ localStorage: [] })
      const cookiesSpy = cy.stub(sessionsManager.sessions, 'getCookies').resolves([{ id: 'cookie' }])

      const sessData = await sessionsManager.sessions.getCurrentSessionData()

      expect(sessData).to.deep.eq({
        localStorage: [],
        cookies: [{ id: 'cookie' }],
      })

      expect(getStorageSpy).to.be.calledOnce
      expect(cookiesSpy).to.be.calledOnce
    })

    it('sessions.getSession()', () => {
      const cypressSpy = cy.stub(CypressInstance, 'backend').callThrough().withArgs('get:session')

      const sessionsManager = new SessionsManager(CypressInstance, () => {})

      sessionsManager.sessions.getSession('session_1')

      expect(cypressSpy).to.be.calledOnceWith('get:session', 'session_1')
    })

    // TODO:
    describe('sessions.getStorage', () => {})

    // TODO:
    describe('sessions.clearStorage', () => {})

    // TODO:
    describe('sessions.setStorage', () => {})
  })
})
