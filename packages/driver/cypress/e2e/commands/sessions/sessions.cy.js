const baseUrl = Cypress.config('baseUrl')

before(() => {
  // sessions has logic built in to persists sessions on UI refresh
  Cypress.session.clearAllSavedSessions()
})

const expectCurrentSessionData = async (obj) => {
  return Cypress.session.getCurrentSessionData()
  .then((result) => {
    expect(result.cookies.map((v) => v.name)).members(obj.cookies || [])
    expect(result.localStorage).deep.members(obj.localStorage || [])
    expect(result.sessionStorage).deep.members(obj.sessionStorage || [])
  })
}

const clearAllSavedSessions = () => {
  // clear all sessions only sets hydrated: false and re-using a session id
  // with new setup / validation fn isn't updated/applied
  Cypress.state('activeSessions', {})
  cy.log('Cypress.session.clearAllSavedSessions()')
  cy.then(async () => {
    return Cypress.session.clearAllSavedSessions()
  })
}

describe('cy.session', { retries: 0 }, () => {
  describe('args', () => {
    it('accepts string as id', () => {
      cy.session('session-id', () => {})
      cy.session({ name: 'session-id', zkey: 'val' }, () => {})
    })

    it('accepts array as id', () => {
      cy.session('session-id', () => {})
      cy.session('session-id')
    })

    it('accepts object as id', () => {
      cy.session('session-id', () => {})
    })

    // redundant?
    it('accepts options as third argument', () => {
      const setup = cy.stub().as('setupSession')
      const validate = cy.stub().as('validateSession')

      cy.session('session-id-3rd-arg', setup, { validate })
      cy.then(() => {
        expect(setup).to.be.calledOnce
        expect(validate).to.be.calledOnce
      })
    })
  })

  describe('test:before:run:async', () => {
    it('clears session data before each run', async () => {
      const clearCurrentSessionData = cy.spy(Cypress.session, 'clearCurrentSessionData')

      await Cypress.action('runner:test:before:run:async', {})

      expect(clearCurrentSessionData).to.be.called
    })

    it('resets rendered html origins before each run', async () => {
      const backendSpy = cy.spy(Cypress, 'backend')

      await Cypress.action('runner:test:before:run:async', {})

      expect(backendSpy).to.be.calledWith('reset:rendered:html:origins')
    })

    describe('testIsolation=strict', { testIsolation: 'strict' }, () => {
      it('clears page before each run when testIsolation=strict', () => {
        cy.visit('/fixtures/form.html')
        .then(async () => {
          cy.spy(Cypress, 'action').log(false)

          await Cypress.action('runner:test:before:run:async', {})

          expect(Cypress.action).to.be.calledWith('cy:url:changed', '')
          expect(Cypress.action).to.be.calledWith('cy:visit:blank', { type: 'session-lifecycle' })
        })
        .url('about:blank')
      })
    })

    describe('testIsolation=legacy', { testIsolation: 'legacy' }, () => {
      it('does not clear page', () => {
        cy.visit('/fixtures/form.html')
        .then(async () => {
          cy.spy(Cypress, 'action').log(false)

          await Cypress.action('runner:test:before:run:async', {})

          expect(Cypress.action).not.to.be.calledWith('cy:url:changed')
          expect(Cypress.action).not.to.be.calledWith('cy:visit:blank')
        })
        .url('/fixtures/form.html')
      })
    })
  })

  describe('session flows', () => {
    let logs = []
    let clearPageCount = 0
    let sessionGroupId
    let setup
    let validate

    const handleSetup = () => {
      // create session clears page before running
      cy.contains('Default blank page')
      cy.contains('This page was cleared by navigating to about:blank.')

      cy.visit('/fixtures/auth/index.html')
      cy.contains('You are not logged in')
      cy.window().then((win) => {
        win.sessionStorage.setItem('cypressAuthToken', JSON.stringify({ body: { username: 'tester' } }))
      })
    }

    const handleValidate = () => {
      // both create & restore session clears page after running
      cy.contains('Default blank page')
      cy.contains('This page was cleared by navigating to about:blank.')

      cy.visit('/fixtures/auth/index.html')
      cy.contains('Welcome tester')
    }

    before(() => {
      setup = cy.stub().callsFake(handleSetup).as('setupSession')
      validate = cy.stub().callsFake(handleValidate).as('validateSession')
    })

    const resetMocks = () => {
      logs = []
      clearPageCount = 0
      sessionGroupId = undefined
      setup.reset()
      setup.callsFake(handleSetup)
      validate.reset()
      validate.callsFake(handleValidate)
    }

    const setupTestContext = () => {
      resetMocks()
      clearAllSavedSessions()
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'session' || attrs.name === 'sessions_manager' || attrs.name === 'page load' || attrs.alias?.includes('setupSession') || attrs.alias?.includes('validateSession')) {
          logs.push(log)
          if (!sessionGroupId) {
            sessionGroupId = attrs.id
          }
        }
      })

      cy.on('log:changed', (attrs, log) => {
        const index = logs.findIndex((l) => l.id === attrs.id)

        if (index) {
          logs[index] = log
        }
      })

      cy.on('internal:window:load', (args) => {
        if (args.window.location.href === 'about:blank') {
          clearPageCount++
        }
      })
    }

    describe('create session flow', () => {
      before(() => {
        setupTestContext()
        cy.log('Creating new session to test against')
        expect(clearPageCount, 'total times session cleared the page').to.eq(0)
        cy.session('session-1', setup)
      })

      // test must be first to run before blank page visit between each test
      it('clears page after setup runs', () => {
        cy.url().should('eq', 'about:blank')
      })

      it('successfully creates new session', () => {
        expect(setup).to.be.calledOnce
        expect(clearPageCount, 'total times session cleared the page').to.eq(2)
      })

      it('groups session logs correctly', () => {
        expect(logs[0].get()).to.deep.contain({
          name: 'session',
          id: sessionGroupId,
          sessionInfo: {
            id: 'session-1',
            isGlobalSession: false,
            status: 'created',
          },
        })

        expect(logs[1].get()).to.contain({
          name: 'Clear page',
          group: sessionGroupId,
        })

        expect(logs[2].get()).to.contain({
          displayName: 'Clear cookies, localStorage and sessionStorage',
          group: sessionGroupId,
        })

        const createNewSessionGroup = logs[3].get()

        expect(createNewSessionGroup).to.contain({
          displayName: 'Create new session',
          groupStart: true,
          group: sessionGroupId,
        })

        expect(logs[4].get()).to.deep.contain({
          alias: ['setupSession'],
          group: createNewSessionGroup.id,
        })

        expect(logs[5].get()).to.contain({
          name: 'Clear page',
          group: createNewSessionGroup.id,
        })
      })

      it('creates new session instrument with session details', () => {
        const sessionInfo = logs[0].get('sessionInfo')

        expect(sessionInfo).to.deep.eq({
          id: 'session-1',
          isGlobalSession: false,
          status: 'created',
        })
      })

      it('has session details in the consoleProps', () => {
        const consoleProps = logs[0].get('consoleProps')()

        expect(consoleProps).to.deep.eq({
          Command: 'session',
          id: 'session-1',
          table: [],
        })
      })
    })

    describe('create session with validation flow', () => {
      let sessionId

      before(() => {
        setupTestContext()
        cy.log('Creating new session with validation to test against')
        sessionId = `session-${Cypress.state('test').id}`
        cy.session(sessionId, setup, { validate })
      })

      // test must be first to run before blank page visit between each test
      it('does not clear page visit from validate function', () => {
        cy.url().should('contain', '/fixtures/auth/index.html')
      })

      it('successfully creates new session and validates it', () => {
        expect(setup).to.be.calledOnce
        expect(validate).to.be.calledOnce
        expect(clearPageCount, 'total times session cleared the page').to.eq(2)
      })

      it('groups session logs correctly', () => {
        expect(logs[0].get()).to.deep.contain({
          name: 'session',
          id: sessionGroupId,
          sessionInfo: {
            id: sessionId,
            isGlobalSession: false,
            status: 'created',
          },
        })

        expect(logs[1].get()).to.contain({
          name: 'Clear page',
          group: sessionGroupId,
        })

        expect(logs[2].get()).to.contain({
          displayName: 'Clear cookies, localStorage and sessionStorage',
          group: sessionGroupId,
        })

        const createNewSessionGroup = logs[3].get()

        expect(createNewSessionGroup).to.contain({
          displayName: 'Create new session',
          groupStart: true,
          group: sessionGroupId,
        })

        expect(logs[4].get()).to.deep.contain({
          alias: ['setupSession'],
          group: createNewSessionGroup.id,
        })

        expect(logs[5].get()).to.contain({
          name: 'Clear page',
          group: createNewSessionGroup.id,
        })

        const validateSessionGroup = logs[6].get()

        expect(validateSessionGroup).to.contain({
          displayName: 'Validate session',
          group: sessionGroupId,
        })

        expect(logs[7].get()).to.deep.contain({
          alias: ['validateSession'],
          group: validateSessionGroup.id,
        })
      })
    })

    describe('create session with failed validation flow', () => {
      it('fails validation and logs correctly', function (done) {
        setupTestContext()
        cy.log('Creating new session with validation to test against')

        cy.once('fail', (err) => {
          expect(setup).to.be.calledOnce
          expect(validate).to.be.calledOnce
          expect(clearPageCount, 'total times session cleared the page').to.eq(2)
          expect(err.message).to.contain('Your `cy.session` **validate** callback returned false')
          expect(logs[0].get()).to.deep.contain({
            name: 'session',
            id: sessionGroupId,
            sessionInfo: {
              id: `session-${Cypress.state('test').id}`,
              isGlobalSession: false,
              status: 'failed',
            },
          })

          expect(logs[1].get()).to.contain({
            name: 'Clear page',
            group: sessionGroupId,
          })

          expect(logs[2].get()).to.contain({
            displayName: 'Clear cookies, localStorage and sessionStorage',
            group: sessionGroupId,
          })

          const createNewSessionGroup = logs[3].get()

          expect(createNewSessionGroup).to.contain({
            displayName: 'Create new session',
            groupStart: true,
            group: sessionGroupId,
          })

          expect(logs[4].get()).to.deep.contain({
            alias: ['setupSession'],
            group: createNewSessionGroup.id,
          })

          expect(logs[5].get()).to.contain({
            name: 'Clear page',
            group: createNewSessionGroup.id,
          })

          const validateSessionGroup = logs[6].get()

          expect(validateSessionGroup).to.contain({
            displayName: 'Validate session',
            group: sessionGroupId,
          })

          expect(logs[7].get()).to.deep.contain({
            alias: ['validateSession'],
            group: validateSessionGroup.id,
          })

          done()
        })

        validate.callsFake(() => false)

        cy.session(`session-${Cypress.state('test').id}`, setup, { validate })
      })
    })

    describe('restores saved session flow', () => {
      let sessionId

      before(() => {
        setupTestContext()
        cy.log('Creating new session for test')
        sessionId = `session-${Cypress.state('test').id}`
        cy.session(sessionId, setup)
        .then(() => {
          // reset and only test restored session
          resetMocks()
        })

        cy.log('restore session to test against')
        cy.session(sessionId, setup)
      })

      // test must be first to run before blank page visit between each test
      it('clears page after setup runs', () => {
        cy.url().should('eq', 'about:blank')
      })

      it('successfully restores saved session', () => {
        expect(setup).to.not.be.called
        expect(validate).to.not.be.called
        expect(clearPageCount, 'total times session cleared the page').to.eq(1)
      })

      it('groups session logs correctly', () => {
        expect(logs[0].get()).to.contain({
          name: 'session',
          id: sessionGroupId,
        })

        expect(logs[0].get()).to.deep.contain({
          name: 'session',
          id: sessionGroupId,
          sessionInfo: {
            id: sessionId,
            isGlobalSession: false,
            status: 'restored',
          },
        })

        expect(logs[1].get()).to.contain({
          name: 'Clear page',
          group: sessionGroupId,
        })

        expect(logs[2].get()).to.contain({
          displayName: 'Clear cookies, localStorage and sessionStorage',
          group: sessionGroupId,
        })

        const restoreSavedSessionGroup = logs[3].get()

        expect(restoreSavedSessionGroup).to.contain({
          displayName: 'Restore saved session',
          group: sessionGroupId,
        })
      })
    })

    describe('restores saved session with validation flow', () => {
      let sessionId

      before(() => {
        setupTestContext()
        cy.log('Creating new session for test')
        sessionId = `session-${Cypress.state('test').id}`
        cy.session(sessionId, setup, { validate })
        .then(() => {
          // reset and only test restored session
          resetMocks()
        })

        cy.log('restore session to test against')
        cy.session(sessionId, setup, { validate })
      })

      // test must be first to run before blank page visit between each test
      it('does not clear page visit from validate function', () => {
        cy.url().should('contain', '/fixtures/auth/index.html')
      })

      it('successfully restores saved session', () => {
        expect(setup).to.not.be.called
        expect(validate).to.be.calledOnce
        expect(clearPageCount, 'total times session cleared the page').to.eq(1)
      })

      it('groups session logs correctly', () => {
        expect(logs[0].get()).to.contain({
          name: 'session',
          id: sessionGroupId,
        })

        expect(logs[0].get()).to.deep.contain({
          name: 'session',
          id: sessionGroupId,
          sessionInfo: {
            id: sessionId,
            isGlobalSession: false,
            status: 'restored',
          },
        })

        expect(logs[1].get()).to.contain({
          name: 'Clear page',
          group: sessionGroupId,
        })

        expect(logs[2].get()).to.contain({
          displayName: 'Clear cookies, localStorage and sessionStorage',
          group: sessionGroupId,
        })

        const restoreSavedSessionGroup = logs[3].get()

        expect(restoreSavedSessionGroup).to.contain({
          displayName: 'Restore saved session',
          group: sessionGroupId,
        })

        const validateSessionGroup = logs[4].get()

        expect(validateSessionGroup).to.contain({
          displayName: 'Validate session',
          group: sessionGroupId,
        })

        expect(logs[5].get()).to.deep.contain({
          alias: ['validateSession'],
          group: validateSessionGroup.id,
        })
      })
    })

    describe('recreates existing session flow', () => {
      let sessionId

      before(() => {
        setupTestContext()
        cy.log('Creating new session for test')
        sessionId = `session-${Cypress.state('test').id}`
        cy.session(sessionId, setup, { validate })
        .then(() => {
          // reset and only test restored session
          resetMocks()
          validate.callsFake(() => {
            if (validate.callCount === 1) {
              return false
            }

            handleValidate()
          })
        })

        cy.log('restore session to test against')
        cy.session(sessionId, setup, { validate })
      })

      // test must be first to run before blank page visit between each test
      it('does not clear page visit from validate function', () => {
        cy.url().should('contain', '/fixtures/auth/index.html')
      })

      it('successfully recreates session', () => {
        expect(setup).to.be.calledOnce
        expect(validate).to.be.calledTwice
        expect(clearPageCount, 'total times session cleared the page').to.eq(3)
      })

      it('groups session logs correctly', () => {
        expect(logs[0].get()).to.contain({
          name: 'session',
          id: sessionGroupId,
        })

        expect(logs[0].get()).to.deep.contain({
          name: 'session',
          id: sessionGroupId,
          sessionInfo: {
            id: sessionId,
            isGlobalSession: false,
            status: 'recreated',
          },
        })

        expect(logs[1].get()).to.contain({
          name: 'Clear page',
          group: sessionGroupId,
        })

        expect(logs[2].get()).to.contain({
          displayName: 'Clear cookies, localStorage and sessionStorage',
          group: sessionGroupId,
        })

        const restoreSavedSessionGroup = logs[3].get()

        expect(restoreSavedSessionGroup).to.contain({
          displayName: 'Restore saved session',
          group: sessionGroupId,
        })

        const validateSessionGroup = logs[4].get()

        expect(validateSessionGroup).to.contain({
          displayName: 'Validate session',
          group: sessionGroupId,
        })

        expect(logs[5].get()).to.deep.contain({
          alias: ['validateSession'],
          group: validateSessionGroup.id,
        })

        expect(logs[6].get()).to.deep.contain({
          showError: true,
          group: validateSessionGroup.id,
        })

        expect(logs[6].get('error').message).to.eq('Your `cy.session` **validate** callback returned false.')

        expect(logs[7].get()).to.contain({
          name: 'Clear page',
          group: sessionGroupId,
        })

        expect(logs[8].get()).to.contain({
          displayName: 'Clear cookies, localStorage and sessionStorage',
          group: sessionGroupId,
        })

        const createNewSessionGroup = logs[9].get()

        expect(createNewSessionGroup).to.contain({
          displayName: 'Recreate session',
          groupStart: true,
          group: sessionGroupId,
        })

        expect(logs[10].get()).to.deep.contain({
          alias: ['setupSession'],
          group: createNewSessionGroup.id,
        })

        expect(logs[11].get()).to.contain({
          name: 'Clear page',
          group: createNewSessionGroup.id,
        })

        const secondValidateSessionGroup = logs[12].get()

        expect(secondValidateSessionGroup).to.contain({
          displayName: 'Validate session',
          group: sessionGroupId,
        })

        expect(logs[13].get()).to.deep.contain({
          alias: ['validateSession'],
          group: secondValidateSessionGroup.id,
        })
      })
    })

    describe('recreates existing session with failed validation flow', () => {
      it('fails to recreate session and logs correctly', function (done) {
        setupTestContext()
        cy.log('Creating new session for test')
        cy.session(`session-${Cypress.state('test').id}`, setup, { validate })
        .then(() => {
          // reset and only test restored session
          resetMocks()
          validate.callsFake(() => false)
        })

        cy.once('fail', (err) => {
          expect(err.message).to.contain('Your `cy.session` **validate** callback returned false')
          expect(setup).to.be.calledOnce
          expect(validate).to.be.calledTwice
          expect(clearPageCount, 'total times session cleared the page').to.eq(3)

          expect(logs[0].get()).to.contain({
            name: 'session',
            id: sessionGroupId,
          })

          expect(logs[0].get()).to.deep.contain({
            name: 'session',
            id: sessionGroupId,
            sessionInfo: {
              id: `session-${Cypress.state('test').id}`,
              isGlobalSession: false,
              status: 'failed',
            },
          })

          expect(logs[1].get()).to.contain({
            name: 'Clear page',
            group: sessionGroupId,
          })

          expect(logs[2].get()).to.contain({
            displayName: 'Clear cookies, localStorage and sessionStorage',
            group: sessionGroupId,
          })

          const restoreSavedSessionGroup = logs[3].get()

          expect(restoreSavedSessionGroup).to.contain({
            displayName: 'Restore saved session',
            group: sessionGroupId,
          })

          const validateSessionGroup = logs[4].get()

          expect(validateSessionGroup).to.contain({
            displayName: 'Validate session',
            group: sessionGroupId,
          })

          expect(logs[5].get()).to.deep.contain({
            alias: ['validateSession'],
            group: validateSessionGroup.id,
          })

          expect(logs[6].get()).to.deep.contain({
            showError: true,
            group: validateSessionGroup.id,
          })

          expect(logs[6].get('error').message).to.eq('Your `cy.session` **validate** callback returned false.')

          expect(logs[7].get()).to.contain({
            name: 'Clear page',
            group: sessionGroupId,
          })

          expect(logs[8].get()).to.contain({
            displayName: 'Clear cookies, localStorage and sessionStorage',
            group: sessionGroupId,
          })

          const createNewSessionGroup = logs[9].get()

          expect(createNewSessionGroup).to.contain({
            displayName: 'Recreate session',
            groupStart: true,
            group: sessionGroupId,
          })

          expect(logs[10].get()).to.deep.contain({
            alias: ['setupSession'],
            group: createNewSessionGroup.id,
          })

          expect(logs[11].get()).to.contain({
            name: 'Clear page',
            group: createNewSessionGroup.id,
          })

          const secondValidateSessionGroup = logs[12].get()

          expect(secondValidateSessionGroup).to.contain({
            displayName: 'Validate session',
            group: sessionGroupId,
          })

          expect(logs[13].get()).to.deep.contain({
            alias: ['validateSession'],
            group: secondValidateSessionGroup.id,
          })

          done()
        })

        cy.log('restore session to test against')
        cy.session(`session-${Cypress.state('test').id}`, setup, { validate })
      })
    })
  })

  describe('errors', () => {
    let lastLog = null
    let lastSessionLog = null
    const handleAddLog = (attrs, log) => {
      lastLog = log
      if (attrs.name === 'session') {
        lastSessionLog = log
      }
    }

    beforeEach(() => {
      clearAllSavedSessions()
      cy.on('log:added', handleAddLog)
      cy.on('fail', (err) => {
        cy.off('log:added', handleAddLog)
      })

      return null
    })

    it('throws error when experimentalSessionAndOrigin not enabled', { experimentalSessionAndOrigin: false, experimentalSessionSupport: false }, (done) => {
      cy.once('fail', (err) => {
        expect(lastSessionLog).to.eq(lastLog)
        expect(lastSessionLog.get('error')).to.eq(err)
        expect(lastSessionLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('`cy.session()` requires enabling the `experimentalSessionAndOrigin` flag.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session('sessions-not-enabled')
    })

    it('throws error when experimentalSessionSupport is enabled through test config', { experimentalSessionAndOrigin: false, experimentalSessionSupport: true }, (done) => {
      cy.once('fail', (err) => {
        expect(lastSessionLog).to.eq(lastLog)
        expect(lastSessionLog.get('error')).to.eq(err)
        expect(lastSessionLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('\`cy.session()\` requires enabling the \`experimentalSessionAndOrigin\` flag. The \`experimentalSessionSupport\` flag was enabled but was removed in Cypress version 9.6.0.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session('sessions-not-enabled')
    })

    it('throws error when experimentalSessionSupport is enabled through Cypress.config', { experimentalSessionAndOrigin: false }, (done) => {
      Cypress.config('experimentalSessionSupport', true)

      cy.once('fail', (err) => {
        Cypress.config('experimentalSessionSupport', false)
        expect(lastSessionLog).to.eq(lastLog)
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('\`cy.session()\` requires enabling the \`experimentalSessionAndOrigin\` flag. The \`experimentalSessionSupport\` flag was enabled but was removed in Cypress version 9.6.0.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')
        done()
      })

      cy.session('sessions-not-enabled')
    })

    it('throws when sessionId argument was not provided', function (done) {
      cy.once('fail', (err) => {
        expect(lastSessionLog).to.eq(lastLog)
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('`cy.session()` was passed an invalid argument. The first argument `id` must be an string or serializable object.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session()
    })

    it('throws when sessionId argument is not an object', function (done) {
      cy.once('fail', (err) => {
        expect(lastSessionLog).to.eq(lastLog)
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('`cy.session()` was passed an invalid argument. The first argument `id` must be an string or serializable object.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session(1)
    })

    it('throws when options argument is provided and is not an object', function (done) {
      cy.once('fail', (err) => {
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('`cy.session()` was passed an invalid argument. The optional third argument `options` must be an object.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session('some-session', () => {}, 'invalid_arg')
    })

    it('throws when options argument has an invalid option', function (done) {
      cy.once('fail', (err) => {
        expect(lastSessionLog).to.eq(lastLog)
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('`cy.session()` was passed an invalid option: **invalid_key**\nAvailable options are: `validate`')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session('some-session', () => {}, { invalid_key: 2 })
    })

    it('throws when options argument has an option with an invalid type', function (done) {
      cy.once('fail', (err) => {
        expect(lastSessionLog).to.eq(lastLog)
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('`cy.session()` was passed an invalid option value. **validate** must be of type **function** but was **number**.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session('some-session', () => {}, { validate: 2 })
    })

    it('throws when setup function is not provided and existing session is not found', function (done) {
      cy.once('fail', (err) => {
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('No session is defined with the name\n  **some-session**\nIn order to use `cy.session()`, provide a `setup` as the second argument:\n\n`cy.session(id, setup)`')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session('some-session')
    })

    it('throws when setup function is not provided and global session is registered', function (done) {
      cy.once('fail', (err) => {
        expect(lastSessionLog).to.eq(lastLog)
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('In order to restore a global `cy.session()`, provide a `setup` as the second argument:\n\n`cy.session(id, setup, { cacheAcrossSpecs: true })`')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session('some-session-2', () => {}, { cacheAcrossSpecs: true })
      .then(() => {
        Cypress.state('activeSessions', {})
      }).then(async () => {
        await Cypress.backend('get:session', 'some-session-2').then((sessionDetails) => {
          Cypress.state('activeSessions', { 'some-session-2': sessionDetails })
        })
      })

      cy.session('some-session-2')
    })

    it('throws when multiple session calls with same sessionId but different setup', function (done) {
      cy.once('fail', async (err) => {
        expect(lastSessionLog).to.eq(lastLog)
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('This session already exists. You may not create a new session with a previously used identifier. If you want to create a new session with a different setup function, please call `cy.session()` with a unique identifier other than **duplicate-session**.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        try {
          await expectCurrentSessionData({
            localStorage: [{ origin: baseUrl, value: { one: 'value' } }],
          })
        } catch (err) {
          done(err)
        }

        done()
      })

      cy.session('duplicate-session', () => {
        // function content
        window.localStorage.one = 'value'
      })

      cy.session('duplicate-session', () => {
        // different function content
        window.localStorage.two = 'value'
      })
    })

    it('throws when multiple session calls with same sessionId but different validate opt', function (done) {
      cy.once('fail', async (err) => {
        expect(lastSessionLog).to.eq(lastLog)
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('This session already exists. You may not create a new session with a previously used identifier. If you want to create a new session with a different validate function, please call `cy.session()` with a unique identifier other than **duplicate-sess**.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session('duplicate-sess', () => {}, { validate: () => {} })

      cy.session('duplicate-sess', () => {}, { validate: () => { /* do something */ } })
    })

    it('throws when multiple session calls with same sessionId but different cacheAcrossSpec opt', function (done) {
      cy.once('fail', async (err) => {
        expect(lastSessionLog).to.eq(lastLog)
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('This session already exists. You may not create a new session with a previously used identifier. If you want to create a new session with a different persistence, please call `cy.session()` with a unique identifier other than **duplicate-sess**.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session('duplicate-sess', () => {}, { validate: () => {} })

      cy.session('duplicate-sess', () => {}, { validate: () => {}, cacheAcrossSpecs: true })
    })

    describe('setup function failures', () => {
      it('throws when setup function has a failing Cypress command', function (done) {
        cy.once('fail', (err) => {
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.contain('This error occurred while creating session. Because the session setup failed, we failed the test.')
          expect(lastSessionLog.get('state')).to.eq('failed')
          done()
        })

        cy.session(`session-${Cypress.state('test').id}`, () => {
          cy.get('#does_not_exist', { timeout: 500 })
        })
      })

      it('throws when setup function has a failing assertion', function (done) {
        cy.once('fail', (err) => {
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.contain('This error occurred while creating session. Because the session setup failed, we failed the test.')
          expect(lastSessionLog.get('state')).to.eq('failed')

          done()
        })

        cy.session(`session-${Cypress.state('test').id}`, () => {
          expect(true).to.be.false
        })
      })
    })

    describe('options.validate failures', () => {
      const errorHookMessage = 'This error occurred in a session validate hook after initializing the session. Because validation failed immediately after session setup we failed the test.'

      it('throws when options.validate has a failing Cypress command', (done) => {
        cy.once('fail', (err) => {
          expect(err.message).contain('Expected to find element: `#does_not_exist`')
          expect(err.message).contain(errorHookMessage)
          expect(err.codeFrame).exist

          done()
        })

        cy.session(['mock-session', 'command'], () => {
          cy.log('setup')
        }, {
          validate () {
            cy.get('#does_not_exist', { timeout: 20 })
          },
        })
      })

      it('throws when options.validate throws an error', (done) => {
        cy.once('fail', (err) => {
          expect(err.message).contain('validate error')
          expect(err.message).contain(errorHookMessage)
          expect(err.codeFrame).exist
          done()
        })

        cy.session(['mock-session', 'throws'], () => {
          cy.log('setup')
        }, {
          validate () {
            throw new Error('validate error')
          },
        })
      })

      it('throws when options.validate rejects', (done) => {
        cy.once('fail', (err) => {
          expect(err.message).contain('validate error')
          expect(err.message).contain(errorHookMessage)
          expect(err.codeFrame).exist

          done()
        })

        cy.session(['mock-session', 'rejects'], () => {
          cy.log('setup')
        }, {
          validate () {
            return Promise.reject(new Error('validate error'))
          },
        })
      })

      it('throws when options.validate returns false', (done) => {
        cy.once('fail', (err) => {
          expect(err.message).to.contain('Your `cy.session` **validate** callback returned false.')
          expect(err.message).contain(errorHookMessage)
          expect(err.codeFrame).exist

          done()
        })

        cy.session(['mock-session', 'return false'], () => {
          cy.log('setup')
        }, {
          validate () {
            return false
          },
        })
      })

      it('throws when options.validate resolves false', (done) => {
        cy.once('fail', (err) => {
          expect(err.message).to.contain('Your `cy.session` **validate** callback resolved false.')
          expect(err.message).contain(errorHookMessage)
          expect(err.codeFrame).exist
          done()
        })

        cy.session(['mock-session', 'resolves false'], () => {
          cy.log('setup')
        }, {
          validate () {
            return Promise.resolve(false)
          },
        })
      })

      // TODO: emilyrohrbough - 4/3/2022 - figure out what the below comment means
      // TODO: cy.validate that will fail, hook into event, soft-reload inside and test everything is halted
      // Look at other tests for cancellation
      // make error collapsible by default

      it('throws when options.validate returns Chainer<false>', (done) => {
        cy.once('fail', (err) => {
          expect(err.message).to.contain('Your `cy.session` **validate** callback resolved false.')
          expect(err.message).contain(errorHookMessage)
          done()
        })

        cy.session(['mock-session', 'Chainer<false>'], () => {
          cy.log('setup')
        }, {
          validate () {
            return cy.wrap(false)
          },
        })
      })
    })
  })
})
