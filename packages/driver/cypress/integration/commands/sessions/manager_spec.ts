const SessionsManager = require('@packages/driver/src/cy/commands/sessions/manager').default

describe('src/cy/commands/sessions/utils.ts', () => {
  // @ts-ignore
  const CypressInstance = Cypress.$Cypress.create({})

  it('creates SessionsManager instance', () => {
    const sessions = new SessionsManager(CypressInstance, () => {})

    expect(sessions).to.haveOwnProperty('cy')
    expect(sessions).to.haveOwnProperty('Cypress')
    expect(sessions).to.haveOwnProperty('currentTestRegisteredSessions')
    expect(sessions.currentTestRegisteredSessions).to.be.instanceOf(Map)
  })

  describe('.setActiveSession', () => {
    it('adds session when non were previously added', () => {
      const cySpy = cy.spy(cy, 'state').withArgs('activeSessions')

      const activeSession: Cypress.Commands.Session.ActiveSessions = {
        'session_1': {
          id: 'session_1',
          setup: () => {},
          hydrated: true,
        },
      }

      const sessions = new SessionsManager(CypressInstance, cy)

      sessions.setActiveSession(activeSession)
      const calls = cySpy.getCalls()

      expect(cySpy).to.be.calledTwice
      expect(calls[0].args[1]).to.be.undefined
      expect(calls[1].args[1]).to.haveOwnProperty('session_1')
    })

    it('adds session when other sessions had previously added', () => {
      const existingSessions: Cypress.Commands.Session.ActiveSessions = {
        'session_1': {
          id: 'session_1',
          setup: () => {},
          hydrated: false,
        },
        'session_2': {
          id: 'session_2',
          setup: () => {},
          hydrated: true,
        },
      }

      const cySpy = cy.stub(cy, 'state').callThrough().withArgs('activeSessions').returns(existingSessions)

      const activeSession: Cypress.Commands.Session.ActiveSessions = {
        'session_3': {
          id: 'session_3',
          setup: () => {},
          hydrated: true,
        },
      }

      const sessions = new SessionsManager(CypressInstance, cy)

      sessions.setActiveSession(activeSession)
      const calls = cySpy.getCalls()

      expect(cySpy).to.be.calledTwice
      expect(calls[0].args[1]).to.be.undefined
      expect(calls[1].args[1]).to.haveOwnProperty('session_1')
      expect(calls[1].args[1]).to.haveOwnProperty('session_2')
      expect(calls[1].args[1]).to.haveOwnProperty('session_3')
    })
  })

  describe('.getActiveSession', () => {
    it('returns undefined when no active sessions', () => {
      const cySpy = cy.stub(cy, 'state').callThrough().withArgs('activeSessions')

      const sessions = new SessionsManager(CypressInstance, cy)

      const activeSession = sessions.getActiveSession('session_1')

      expect(cySpy).to.be.calledOnce
      expect(activeSession).to.be.undefined
    })

    it('returns session when found', () => {
      const activeSessions: Cypress.Commands.Session.ActiveSessions = {
        'session_1': {
          id: 'session_1',
          setup: () => {},
          hydrated: false,
        },
        'session_2': {
          id: 'session_2',
          setup: () => {},
          hydrated: true,
        },
      }

      const cySpy = cy.stub(cy, 'state').callThrough().withArgs('activeSessions').returns(activeSessions)

      const sessions = new SessionsManager(CypressInstance, cy)

      let activeSession = sessions.getActiveSession('session_1')

      expect(cySpy).to.be.calledOnce
      expect(activeSession).to.deep.eq(activeSessions['session_1'])
    })
  })

  describe('.clearActiveSessions', () => {
    it('handles when no active sessions have been set', () => {
      const cySpy = cy.stub(cy, 'state').callThrough().withArgs('activeSessions')

      const sessions = new SessionsManager(CypressInstance, cy)

      sessions.clearActiveSessions()
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
          hydrated: false,
        },
        'session_2': {
          id: 'session_2',
          setup: () => {},
          hydrated: true,
        },
      }

      const cySpy = cy.stub(cy, 'state').callThrough().withArgs('activeSessions').returns(existingSessions)

      const sessions = new SessionsManager(CypressInstance, cy)

      sessions.clearActiveSessions()
      const calls = cySpy.getCalls()

      expect(cySpy).to.be.calledTwice
      expect(calls[1].args[1]).to.be.instanceOf(Object)
      expect(calls[1].args[1]).to.haveOwnProperty('session_1')
      expect(calls[1].args[1].session_1).to.haveOwnProperty('hydrated', false)
      expect(calls[1].args[1]).to.haveOwnProperty('session_2')
      expect(calls[1].args[1].session_2).to.haveOwnProperty('hydrated', false)
    })
  })

  describe('.mapOrigins', () => {})

  describe('._setStorageOnOrigins', () => {})

  describe('.getAllHtmlOrigins', () => {})

  describe('.defineSession', () => {})

  it('.clearAllSavedSessions', async () => {
    const cypressSpy = cy.stub(CypressInstance, 'backend').withArgs('clear:session').resolves(null)

    const sessions = new SessionsManager(CypressInstance, () => {})
    const sessionsSpy = cy.stub(sessions, 'clearActiveSessions')

    await sessions.clearAllSavedSessions()

    expect(sessionsSpy).to.be.calledOnce
    expect(cypressSpy).to.be.calledOnceWith('clear:session', null)
  })

  describe('.clearCurrentSessionData', () => {})

  it('.getCookies', async () => {
    const cookies = [{ id: 'cookie' }]
    const cypressSpy = cy.stub(CypressInstance, 'automation').withArgs('get:cookies').resolves(cookies)

    const sessions = new SessionsManager(CypressInstance, () => {})

    const sessionCookies = await sessions.getCookies()

    expect(cypressSpy).to.be.calledOnceWith('get:cookies', {})
    expect(sessionCookies).to.deep.eq(cookies)
  })

  it('.setCookies', async () => {
    const cypressSpy = cy.stub(CypressInstance, 'automation').withArgs('set:cookies')

    const sessions = new SessionsManager(CypressInstance, () => {})

    await sessions.setCookies({})

    expect(cypressSpy).to.be.calledOnceWith('set:cookies', {})
  })

  it('.clearCookies', async () => {
    const cookies = [{ id: 'cookie' }]
    const cypressSpy = cy.stub(CypressInstance, 'automation').withArgs('clear:cookies').resolves([])

    const sessions = new SessionsManager(CypressInstance, () => {})
    const sessionsSpy = cy.stub(sessions, 'getCookies').resolves(cookies)

    await sessions.clearCookies()

    expect(sessionsSpy).to.be.calledOnce
    expect(cypressSpy).to.be.calledOnceWith('clear:cookies', cookies)
  })

  it('.getSession', () => {
    const cypressSpy = cy.stub(CypressInstance, 'backend').callThrough().withArgs('get:session')

    const sessions = new SessionsManager(CypressInstance, () => {})

    sessions.getSession('session_1')

    expect(cypressSpy).to.be.calledOnceWith('get:session', 'session_1')
  })

  describe('.getStorage', () => {})
  describe('.clearStorage', () => {})
  describe('.setStorage', () => {})
  describe('.registerSessionHooks', () => {})
  describe('.publicAPI', () => {})
})
