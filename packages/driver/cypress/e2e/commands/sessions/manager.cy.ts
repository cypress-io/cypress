const SessionsManager = require('../../../../src/cy/commands/sessions/manager').default
const $Cypress = require('../../../../src/cypress').default

describe('src/cy/commands/sessions/manager.ts', () => {
  let CypressInstance

  beforeEach(function () {
    // @ts-ignore
    CypressInstance = new $Cypress()
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

      const activeSession: Cypress.ActiveSessions = {
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
      const existingSessions: Cypress.ActiveSessions = {
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

      const activeSession: Cypress.ActiveSessions = {
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
      const activeSessions: Cypress.ActiveSessions = {
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
      const existingSessions: Cypress.ActiveSessions = {
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

  it('.defineSession()', () => {
    const sessionsManager = new SessionsManager(CypressInstance, cy)
    const setup = cy.stub()
    const sess = sessionsManager.defineSession({ id: '1', setup })

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

  it('.saveSessionData()', async () => {
    const cypressSpy = cy.stub(CypressInstance, 'backend').callThrough().withArgs('save:session').resolves(null)

    const sessionsManager = new SessionsManager(CypressInstance, cy)
    const sessionsSpy = cy.stub(sessionsManager, 'setActiveSession')

    const setup = cy.stub()
    const sess = { id: '1', setup }

    await sessionsManager.saveSessionData(sess)

    expect(sessionsSpy).to.be.calledOnce
    expect(sessionsSpy.getCall(0).args[0]).to.deep.eq({ 1: sess })

    expect(cypressSpy).to.be.calledOnceWith('save:session')
  })

  describe('.sessions', () => {
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

        const specWindow = {}

        CypressInstance.log = cy.stub()
        CypressInstance.state = cy.stub()
        CypressInstance.state.withArgs('specWindow').returns(specWindow)

        const storedOrigins = {}

        cy.stub(CypressInstance, 'backend')
        .callThrough()
        .withArgs('get:rendered:html:origins')
        .resolves(storedOrigins)

        const sessionsManager = new SessionsManager(CypressInstance, {
          state: () => true,
        })

        const clearCookiesSpy = cy.stub(sessionsManager.sessions, 'clearCookies')

        await sessionsManager.sessions.clearCurrentSessionData()

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
        const sessionsManager = new SessionsManager(Cypress, {
          state: () => false,
        })

        const clearCookiesSpy = cy.stub(sessionsManager.sessions, 'clearCookies')

        await sessionsManager.sessions.clearCurrentSessionData()

        expect(clearCookiesSpy).to.be.calledOnce
        expect(window.localStorage).of.have.lengthOf(0)
        expect(window.sessionStorage).of.have.lengthOf(0)
        expect(CypressInstance.log).not.to.be.called
      })
    })

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

    it('sessions.getCurrentSessionData()', async () => {
      const sessionsManager = new SessionsManager(Cypress, () => {})
      const cookiesSpy = cy.stub(sessionsManager.sessions, 'getCookies').resolves([{ id: 'cookie' }])

      const sessData = await sessionsManager.sessions.getCurrentSessionData()

      expect(sessData).to.deep.equal({
        localStorage: [],
        sessionStorage: [],
        cookies: [{ id: 'cookie' }],
      })

      expect(cookiesSpy).to.be.calledOnce
    })

    it('sessions.getSession()', () => {
      const cypressSpy = cy.stub(CypressInstance, 'backend').callThrough().withArgs('get:session')

      const sessionsManager = new SessionsManager(CypressInstance, () => {})

      sessionsManager.sessions.getSession('session_1')

      expect(cypressSpy).to.be.calledOnceWith('get:session', 'session_1')
    })
  })
})
