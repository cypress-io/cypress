const baseUrl = Cypress.config('baseUrl')

before(() => {
  // sessions has logic built in to persists sessions on UI refresh
  Cypress.session.clearAllSavedSessions()
})

const expectCurrentSessionData = async (obj) => {
  return Cypress.session.getCurrentSessionData()
  .then((result) => {
    cy.log(result)
    expect(result.cookies.map((v) => v.name)).members(obj.cookies || [])
    expect(result.localStorage).deep.members(obj.localStorage || [])
    expect(result.sessionStorage).deep.members(obj.sessionStorage || [])
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
    })

    it('accepts object as id', () => {
      cy.session('session-id', () => {})
    })

    // redundant?
    it('accepts options as third argument', () => {
      const setup = cy.stub().as('setupSession')
      const validate = cy.stub().as('validateSession')

      cy.session('session-id', setup, { validate })
      cy.then(() => {
        expect(setup).to.be.calledOnce
        expect(validate).to.be.calledOnce
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
      cy.then(() => {
        expect(clearPageCount, 'cleared page before executing session setup').to.eq(1)
      })

      cy.contains('This is a blank page')
      cy.contains('We always navigate you here after')
      cy.contains('cy.session(...)')
    }

    before(() => {
      setup = cy.stub().callsFake(handleSetup).as('setupSession')
      validate = cy.stub().as('validateSession')
    })

    const resetMocks = () => {
      logs = []
      clearPageCount = 0
      sessionGroupId = undefined
      setup.reset()
      validate.reset()
    }

    const setupTestContext = () => {
      resetMocks()

      // clear all sessions only sets hydrated: false and re-using a session id
      // with new setup / validation fn isn't updated/applied
      Cypress.state('activeSessions', {})
      cy.log('Cypress.session.clearAllSavedSessions()')
      Cypress.session.clearAllSavedSessions()

      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'session' || attrs.name === 'page load' || attrs.alias?.includes('setupSession') || attrs.alias?.includes('validateSession')) {
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
        cy.log('create new session to test against')
        cy.session('session-1', setup)
        cy.url().should('eq', 'about:blank')
      })

      it('successfully creates new session', () => {
        expect(setup).to.be.calledOnce
        // FIXME: currently page is cleared 3 times when it should clear 2 times
        expect(clearPageCount, 'total times session cleared the page').to.eq(3)
      })

      it('groups session logs correctly', () => {
        expect(logs[0].get()).to.contain({
          name: 'session',
          id: sessionGroupId,
        })

        expect(logs[0].get('renderProps')()).to.contain({
          indicator: 'successful',
          message: '(new) session-1',
        })

        const createNewSessionGroup = logs[1].get()

        expect(createNewSessionGroup).to.contain({
          displayName: 'Create New Session',
          groupStart: true,
          group: sessionGroupId,
        })

        expect(logs[2].get()).to.contain({
          name: 'Clear Page',
          group: createNewSessionGroup.id,
        })

        expect(logs[3].get()).to.deep.contain({
          alias: ['setupSession'],
          group: createNewSessionGroup.id,
        })

        expect(logs[4].get()).to.contain({
          name: 'Clear Page',
          group: createNewSessionGroup.id,
        })

        expect(logs[5].get()).to.contain({
          name: 'Clear Page',
          group: sessionGroupId,
        })
      })

      it('creates new session instrument with session details', () => {
        const sessionInfo = logs[0].get('sessionInfo')

        expect(sessionInfo).to.deep.eq({
          id: 'session-1',
          data: {},
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
      before(() => {
        setupTestContext()
        cy.log('create new session with validation to test against')

        cy.session('session-1', setup, { validate })
        cy.url().should('eq', 'about:blank')
      })

      it('successfully creates new session and validates it', () => {
        expect(setup).to.be.calledOnce
        expect(validate).to.be.calledOnce
        // FIXME: currently page is cleared 3 times when it should clear twice
        expect(clearPageCount, 'total times session cleared the page').to.eq(3)
      })

      it('groups session logs correctly', () => {
        expect(logs[0].get()).to.contain({
          name: 'session',
          id: sessionGroupId,
        })

        expect(logs[0].get('renderProps')()).to.contain({
          indicator: 'successful',
          message: '(new) session-1',
        })

        const createNewSessionGroup = logs[1].get()

        expect(createNewSessionGroup).to.contain({
          displayName: 'Create New Session',
          groupStart: true,
          group: sessionGroupId,
        })

        expect(logs[2].get()).to.contain({
          name: 'Clear Page',
          group: createNewSessionGroup.id,
        })

        expect(logs[3].get()).to.deep.contain({
          alias: ['setupSession'],
          group: createNewSessionGroup.id,
        })

        expect(logs[4].get()).to.contain({
          name: 'Clear Page',
          group: createNewSessionGroup.id,
        })

        const validateSessionGroup = logs[5].get()

        expect(validateSessionGroup).to.contain({
          displayName: 'Validate Session: valid',
          group: sessionGroupId,
        })

        expect(logs[6].get()).to.deep.contain({
          alias: ['validateSession'],
          group: validateSessionGroup.id,
        })

        expect(logs[7].get()).to.contain({
          name: 'Clear Page',
          group: sessionGroupId,
        })
      })
    })

    describe('create session with failed validation flow', () => {
      it('fails validation and logs correctly', function (done) {
        setupTestContext()
        cy.log('create new session with validation to test against')

        cy.once('fail', (err) => {
          expect(setup).to.be.calledOnce
          expect(validate).to.be.calledOnce
          expect(clearPageCount, 'total times session cleared the page').to.eq(2)
          expect(err.message).to.contain('Your `cy.session` **validate** callback returned false')

          expect(logs[0].get()).to.contain({
            name: 'session',
            id: sessionGroupId,
          })

          expect(logs[0].get('renderProps')()).to.contain({
            indicator: 'successful',
            message: '(new) session-1',
          })

          const createNewSessionGroup = logs[1].get()

          expect(createNewSessionGroup).to.contain({
            displayName: 'Create New Session',
            groupStart: true,
            group: sessionGroupId,
          })

          expect(logs[2].get()).to.contain({
            name: 'Clear Page',
            group: createNewSessionGroup.id,
          })

          expect(logs[3].get()).to.deep.contain({
            alias: ['setupSession'],
            group: createNewSessionGroup.id,
          })

          expect(logs[4].get()).to.contain({
            name: 'Clear Page',
            group: createNewSessionGroup.id,
          })

          const validateSessionGroup = logs[5].get()

          expect(validateSessionGroup).to.contain({
            displayName: 'Validate Session: invalid',
            group: sessionGroupId,
          })

          done()
        })

        validate.callsFake(() => false)

        cy.session('session-1', setup, { validate })
      })
    })

    describe('restores saved session flow', () => {
      before(() => {
        setupTestContext()
        cy.log('create new session for test')
        cy.session('session-1', setup)
        .then(() => {
          // reset and only test restored session
          resetMocks()
        })

        cy.log('restore session to test against')
        cy.session('session-1', setup)
        cy.url().should('eq', 'about:blank')
      })

      it('successfully restores saved session', () => {
        expect(setup).to.not.be.called
        expect(validate).to.not.be.called
        expect(clearPageCount, 'total times session cleared the page').to.eq(2)
      })

      it('groups session logs correctly', () => {
        expect(logs[0].get()).to.contain({
          name: 'session',
          id: sessionGroupId,
        })

        expect(logs[0].get('renderProps')()).to.contain({
          indicator: 'pending',
          message: '(saved) session-1',
        })

        const restoreSavedSessionGroup = logs[1].get()

        expect(restoreSavedSessionGroup).to.contain({
          displayName: 'Restore Saved Session',
          groupStart: true,
          group: sessionGroupId,
        })

        expect(logs[2].get()).to.contain({
          name: 'Clear Page',
          group: restoreSavedSessionGroup.id,
        })

        expect(logs[3].get()).to.contain({
          name: 'Clear Page',
          group: sessionGroupId,
        })
      })
    })

    describe('restores saved session with validation flow', () => {
      before(() => {
        setupTestContext()
        cy.log('create new session for test')
        cy.session('session-1', setup, { validate })
        .then(() => {
          // reset and only test restored session
          resetMocks()
        })

        cy.log('restore session to test against')
        cy.session('session-1', setup, { validate })
        cy.url().should('eq', 'about:blank')
      })

      it('successfully restores saved session', () => {
        expect(setup).to.not.be.called
        expect(validate).to.be.calledOnce
        expect(clearPageCount, 'total times session cleared the page').to.eq(2)
      })

      it('groups session logs correctly', () => {
        expect(logs[0].get()).to.contain({
          name: 'session',
          id: sessionGroupId,
        })

        expect(logs[0].get('renderProps')()).to.contain({
          indicator: 'pending',
          message: '(saved) session-1',
        })

        const restoreSavedSessionGroup = logs[1].get()

        expect(restoreSavedSessionGroup).to.contain({
          displayName: 'Restore Saved Session',
          groupStart: true,
          group: sessionGroupId,
        })

        expect(logs[2].get()).to.contain({
          name: 'Clear Page',
          group: restoreSavedSessionGroup.id,
        })

        const validateSessionGroup = logs[3].get()

        expect(validateSessionGroup).to.contain({
          displayName: 'Validate Session: valid',
          group: sessionGroupId,
        })

        expect(logs[4].get()).to.deep.contain({
          alias: ['validateSession'],
          group: validateSessionGroup.id,
        })

        expect(logs[5].get()).to.contain({
          name: 'Clear Page',
          group: sessionGroupId,
        })
      })
    })

    describe('recreates existing session flow', () => {
      before(() => {
        setupTestContext()
        cy.log('create new session for test')
        cy.session('session-1', setup, { validate })
        .then(() => {
          // reset and only test restored session
          resetMocks()
          validate.callsFake(() => {
            if (validate.callCount === 1) {
              return false
            }
          })
        })

        cy.log('restore session to test against')
        cy.session('session-1', setup, { validate })
        cy.url().should('eq', 'about:blank')
      })

      it('successfully recreates session', () => {
        expect(setup).to.be.calledOnce
        expect(validate).to.be.calledTwice
        expect(clearPageCount, 'total times session cleared the page').to.eq(4)
      })

      it('groups session logs correctly', () => {
        expect(logs[0].get()).to.contain({
          name: 'session',
          id: sessionGroupId,
        })

        expect(logs[0].get('renderProps')()).to.contain({
          indicator: 'bad',
          message: '(recreated) session-1',
        })

        const recreatedSavedSessionGroup = logs[1].get()

        expect(recreatedSavedSessionGroup).to.contain({
          displayName: 'Restore Saved Session',
          groupStart: true,
          group: sessionGroupId,
        })

        expect(logs[2].get()).to.contain({
          name: 'Clear Page',
          group: recreatedSavedSessionGroup.id,
        })

        const validateSessionGroup = logs[3].get()

        expect(validateSessionGroup).to.contain({
          displayName: 'Validate Session: invalid',
          group: sessionGroupId,
        })

        expect(logs[4].get()).to.deep.contain({
          alias: ['validateSession'],
          group: validateSessionGroup.id,
        })

        expect(logs[5].get()).to.deep.contain({
          showError: true,
          group: validateSessionGroup.id,
        })

        expect(logs[5].get('error').message).to.eq('Your `cy.session` **validate** callback returned false.')

        const createNewSessionGroup = logs[6].get()

        expect(createNewSessionGroup).to.contain({
          displayName: 'Create New Session',
          groupStart: true,
          group: sessionGroupId,
        })

        expect(logs[7].get()).to.contain({
          name: 'Clear Page',
          group: createNewSessionGroup.id,
        })

        expect(logs[8].get()).to.deep.contain({
          alias: ['setupSession'],
          group: createNewSessionGroup.id,
        })

        expect(logs[9].get()).to.contain({
          name: 'Clear Page',
          group: createNewSessionGroup.id,
        })

        const secondValidateSessionGroup = logs[10].get()

        expect(secondValidateSessionGroup).to.contain({
          displayName: 'Validate Session: valid',
          group: sessionGroupId,
        })

        expect(logs[11].get()).to.deep.contain({
          alias: ['validateSession'],
          group: secondValidateSessionGroup.id,
        })

        expect(logs[12].get()).to.contain({
          name: 'Clear Page',
          group: sessionGroupId,
        })
      })
    })

    describe('recreates existing session with failed validation flow', () => {
      it('fails to recreate session and logs correctly', function (done) {
        setupTestContext()
        cy.log('create new session for test')
        cy.session('session-1', setup, { validate })
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

          expect(logs[0].get('renderProps')()).to.contain({
            indicator: 'bad',
            message: '(recreated) session-1',
          })

          const recreatedSavedSessionGroup = logs[1].get()

          expect(recreatedSavedSessionGroup).to.contain({
            displayName: 'Restore Saved Session',
            groupStart: true,
            group: sessionGroupId,
          })

          expect(logs[2].get()).to.contain({
            name: 'Clear Page',
            group: recreatedSavedSessionGroup.id,
          })

          const validateSessionGroup = logs[3].get()

          expect(validateSessionGroup).to.contain({
            displayName: 'Validate Session: invalid',
            group: sessionGroupId,
          })

          expect(logs[4].get()).to.deep.contain({
            alias: ['validateSession'],
            group: validateSessionGroup.id,
          })

          expect(logs[5].get()).to.deep.contain({
            showError: true,
            group: validateSessionGroup.id,
          })

          expect(logs[5].get('error').message).to.eq('Your `cy.session` **validate** callback returned false.')

          const createNewSessionGroup = logs[6].get()

          expect(createNewSessionGroup).to.contain({
            displayName: 'Create New Session',
            groupStart: true,
            group: sessionGroupId,
          })

          expect(logs[7].get()).to.contain({
            name: 'Clear Page',
            group: createNewSessionGroup.id,
          })

          expect(logs[8].get()).to.deep.contain({
            alias: ['setupSession'],
            group: createNewSessionGroup.id,
          })

          expect(logs[9].get()).to.contain({
            name: 'Clear Page',
            group: createNewSessionGroup.id,
          })

          const secondValidateSessionGroup = logs[10].get()

          expect(secondValidateSessionGroup).to.contain({
            displayName: 'Validate Session: invalid',
            group: sessionGroupId,
          })

          expect(logs[11].get()).to.deep.contain({
            alias: ['validateSession'],
            group: secondValidateSessionGroup.id,
          })

          done()
        })

        cy.log('restore session to test against')
        cy.session('session-1', setup, { validate })
      })
    })
  })

  describe('errors', () => {
    let lastLog = null
    let logs = []

    beforeEach(() => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'session') {
          lastLog = log
          logs.push(log)
        }
      })

      return null
    })

    it('throws error when experimentalSessionAndOrigin not enabled', { experimentalSessionAndOrigin: false, experimentalSessionSupport: false }, (done) => {
      cy.on('fail', (err) => {
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('`cy.session()` requires enabling the `experimentalSessionAndOrigin` flag.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session('sessions-not-enabled')
    })

    it('throws error when experimentalSessionSupport is enabled through test config', { experimentalSessionAndOrigin: false, experimentalSessionSupport: true }, (done) => {
      cy.on('fail', (err) => {
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('\`cy.session()\` requires enabling the \`experimentalSessionAndOrigin\` flag. The \`experimentalSessionSupport\` flag was enabled but was removed in Cypress version 9.6.0.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session('sessions-not-enabled')
    })

    it('throws error when experimentalSessionSupport is enabled through Cypress.config', { experimentalSessionAndOrigin: false }, (done) => {
      Cypress.config('experimentalSessionSupport', true)

      cy.on('fail', (err) => {
        Cypress.config('experimentalSessionSupport', false)
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('\`cy.session()\` requires enabling the \`experimentalSessionAndOrigin\` flag. The \`experimentalSessionSupport\` flag was enabled but was removed in Cypress version 9.6.0.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')
        done()
      })

      cy.session('sessions-not-enabled')
    })

    it('throws when sessionId argument was not provided', function (done) {
      cy.on('fail', (err) => {
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('`cy.session()` was passed an invalid argument. The first argument `id` must be an string or serializable object.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session()
    })

    it('throws when sessionId argument is not an object', function (done) {
      cy.on('fail', (err) => {
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('`cy.session()` was passed an invalid argument. The first argument `id` must be an string or serializable object.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session(1)
    })

    it('throws when options argument is provided and is not an object', function (done) {
      cy.on('fail', (err) => {
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('`cy.session()` was passed an invalid argument. The optional third argument `options` must be an object.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session('some-session', () => {}, 'invalid_arg')
    })

    it('throws when options argument has an invalid option', function (done) {
      cy.on('fail', (err) => {
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('`cy.session()` was passed an invalid option: **invalid_key**\nAvailable options are: `validate`')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session('some-session', () => {}, { invalid_key: 2 })
    })

    it('throws when options argument has an option with an invalid type', function (done) {
      cy.on('fail', (err) => {
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('`cy.session()` was passed an invalid option value. **validate** must be of type **function** but was **number**.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session('some-session', () => {}, { validate: 2 })
    })

    it('throws when setup function is not provided and existing session is not found', function (done) {
      cy.on('fail', (err) => {
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('No session is defined with the name\n  **some-session**\nIn order to use `cy.session()`, provide a `setup` as the second argument:\n\n`cy.session(id, setup)`')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session('some-session')
    })

    it('throws when multiple session calls with same sessionId but different options', function (done) {
      cy.on('fail', async (err) => {
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('You may not call `cy.session()` with a previously used name and different options. If you want to specify different options, please use a unique name other than **duplicate-session**.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        await expectCurrentSessionData({
          localStorage: [{ origin: baseUrl, value: { one: 'value' } }],
        })

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

    describe('options.validate failures', () => {
      const errorHookMessage = 'This error occurred in a session validate hook after initializing the session. Because validation failed immediately after session setup we failed the test.'

      it('throws when options.validate has a failing Cypress command', (done) => {
        cy.on('fail', (err) => {
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
        cy.on('fail', (err) => {
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
        cy.on('fail', (err) => {
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
        cy.on('fail', (err) => {
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
        cy.on('fail', (err) => {
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
        cy.on('fail', (err) => {
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
