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
      cy.session(['session', 'id'], () => {})
    })

    it('accepts object as id', () => {
      cy.session({ 'session-id': true }, () => {})
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

  describe('testIsolation=true', { testIsolation: true }, () => {
    describe('test:before:after:run:async', () => {
      it('clears page before the end of each run', () => {
        cy.visit('/fixtures/form.html')
        .then(async () => {
          cy.spy(Cypress, 'action').log(false)

          await Cypress.action('runner:test:before:after:run:async', {}, Cypress.state('runnable'), { nextTestHasTestIsolationOn: true })

          expect(Cypress.action).to.be.calledWith('cy:url:changed', '')
          expect(Cypress.action).to.be.calledWith('cy:visit:blank', { testIsolation: true })
        })
        .url()
        .should('eq', 'about:blank')
      })

      it('clears page before the end of each run when nextTestHasTestIsolationOn is undefined', () => {
        cy.visit('/fixtures/form.html')
        .then(async () => {
          cy.spy(Cypress, 'action').log(false)

          await Cypress.action('runner:test:before:after:run:async', {}, Cypress.state('runnable'), { nextTestHasTestIsolationOn: undefined })

          expect(Cypress.action).to.be.calledWith('cy:url:changed', '')
          expect(Cypress.action).to.be.calledWith('cy:visit:blank', { testIsolation: true })
        })
        .url()
        .should('eq', 'about:blank')
      })

      it('does not clear the page before the end of each run if the next test has test isolation off', () => {
        cy.visit('/fixtures/form.html')
        .then(async () => {
          cy.spy(Cypress, 'action').log(false)

          await Cypress.action('runner:test:before:after:run:async', {}, Cypress.state('runnable'), { nextTestHasTestIsolationOn: false })

          expect(Cypress.action).not.to.be.calledWith('cy:url:changed', '')
          expect(Cypress.action).not.to.be.calledWith('cy:visit:blank', { testIsolation: true })
        })
        .url()
        .should('not.eq', 'about:blank')
      })

      it('clears the browser cookie after each run', () => {
        cy.window()
        .then((win) => {
          win.cookie = 'key=value; SameSite=Strict; Secure; Path=/fixtures'
        })
        .then(async () => {
          cy.spy(Cypress, 'action').log(false)

          await Cypress.action('runner:test:before:after:run:async', {}, Cypress.state('runnable'), { nextTestHasTestIsolationOn: true })
        })

        cy.window().its('cookie').should('be.undefined')
      })

      it('does not clear the browser cookie after each run if the next test has test isolation off', () => {
        cy.window()
        .then((win) => {
          win.cookie = 'key=value; SameSite=Strict; Secure; Path=/fixtures'
        })
        .then(async () => {
          cy.spy(Cypress, 'action').log(false)

          await Cypress.action('runner:test:before:after:run:async', {}, Cypress.state('runnable'), { nextTestHasTestIsolationOn: false })
        })

        cy.window().its('cookie').should('eq', 'key=value; SameSite=Strict; Secure; Path=/fixtures')
      })
    })

    describe('test:before:run:async', () => {
      it('clears session data before each run', async () => {
        const clearCurrentSessionData = cy.spy(Cypress.session, 'clearCurrentSessionData')

        await Cypress.action('runner:test:before:run:async', {
          id: 'r1',
          currentRetry: 0,
        }, Cypress.state('runnable'))

        expect(clearCurrentSessionData).to.be.called
      })

      it('resets rendered html origins before each run', async () => {
        const backendSpy = cy.spy(Cypress, 'backend').log(false)

        await Cypress.action('runner:test:before:run:async', {
          id: 'r1',
          currentRetry: 0,
        }, Cypress.state('runnable'))

        expect(backendSpy).to.be.calledWith('reset:rendered:html:origins')
      })

      it('clears the browser context before each run', () => {
        cy.window()
        .then((win) => {
          win.localStorage.setItem('animal', 'bear')
          win.sessionStorage.setItem('food', 'burgers')
        })
        .then(async () => {
          cy.spy(Cypress, 'action').log(false)

          await Cypress.action('runner:test:before:run:async', {
            id: 'r1',
            currentRetry: 0,
          }, Cypress.state('runnable'))
        })

        cy.window().its('localStorage').should('have.length', 0)
        cy.window().its('sessionStorage').should('have.length', 0)
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
        it('clears page after command runs', () => {
          cy.url().should('eq', 'about:blank')
        })

        it('successfully creates new session', () => {
          expect(setup).to.be.calledOnce
          expect(clearPageCount, 'total times session cleared the page').to.eq(2)
        })

        it('groups session logs correctly', () => {
          expect(logs[0].get()).to.deep.contain({
            name: 'session',
            state: 'passed',
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
            group: sessionGroupId,
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

          expect(consoleProps.name).to.eq('session')
          expect(consoleProps.type).to.eq('command')
          expect(consoleProps.props.id).to.eq('session-1')
          expect(consoleProps.props.Domains).to.eq('This session captured data from localhost.')

          expect(consoleProps.groups).to.have.length(1)
          expect(consoleProps.groups[0].name).to.eq('localhost data:')
          expect(consoleProps.groups[0].groups).to.have.length(1)

          const sessionStorageData = consoleProps.groups[0].groups[0]

          expect(sessionStorageData.name).to.contain('Session Storage - (1)')
          expect(sessionStorageData.items).to.have.property('cypressAuthToken')
          expect(sessionStorageData.items.cypressAuthToken).to.contains('"username":"tester"')
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
        it('clears page after command runs', () => {
          cy.url().should('eq', 'about:blank')
        })

        it('successfully creates new session and validates it', () => {
          expect(setup).to.be.calledOnce
          expect(validate).to.be.calledOnce
          expect(clearPageCount, 'total times session cleared the page').to.eq(2)
        })

        it('groups session logs correctly', () => {
          expect(logs[0].get()).to.deep.contain({
            name: 'session',
            state: 'passed',
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

          const validateSessionGroup = logs[5].get()

          expect(validateSessionGroup).to.contain({
            displayName: 'Validate session',
            group: sessionGroupId,
          })

          expect(logs[6].get()).to.deep.contain({
            alias: ['validateSession'],
            group: validateSessionGroup.id,
          })

          expect(logs[7].get()).to.contain({
            name: 'Clear page',
            group: sessionGroupId,
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
            expect(clearPageCount, 'total times session cleared the page').to.eq(1)
            expect(err.message).to.contain('This error occurred while validating the created session')
            expect(logs[0].get()).to.deep.contain({
              name: 'session',
              state: 'failed',
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

            const validateSessionGroup = logs[5].get()

            expect(validateSessionGroup).to.contain({
              displayName: 'Validate session',
              group: sessionGroupId,
            })

            expect(logs[6].get()).to.deep.contain({
              alias: ['validateSession'],
              group: validateSessionGroup.id,
            })

            done()
          })

          validate.rejects(false)

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
          expect(clearPageCount, 'total times session cleared the page').to.eq(2)
        })

        it('groups session logs correctly', () => {
          expect(logs[0].get()).to.contain({
            name: 'session',
            state: 'passed',
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
        it('clears page after command runs', () => {
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
            state: 'passed',
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
                return Promise.reject(false)
              }

              handleValidate()
            })
          })

          cy.log('restore session to test against')
          cy.session(sessionId, setup, { validate })
        })

        // test must be first to run before blank page visit between each test
        it('clears page after command runs', () => {
          cy.url().should('eq', 'about:blank')
        })

        it('successfully recreates session', () => {
          expect(setup).to.be.calledOnce
          expect(validate).to.be.calledTwice
          expect(clearPageCount, 'total times session cleared the page').to.eq(3)
        })

        it('groups session logs correctly', () => {
          expect(logs[0].get()).to.contain({
            name: 'session',
            state: 'warned',
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

          // this error is associated with the group since the validation rejected
          expect(logs[4].get('error').message).to.contain('This error occurred while validating the restored session')

          expect(logs[6].get()).to.contain({
            name: 'Clear page',
            group: sessionGroupId,
          })

          expect(logs[7].get()).to.contain({
            displayName: 'Clear cookies, localStorage and sessionStorage',
            group: sessionGroupId,
          })

          const createNewSessionGroup = logs[8].get()

          expect(createNewSessionGroup).to.contain({
            displayName: 'Recreate session',
            groupStart: true,
            group: sessionGroupId,
          })

          expect(logs[9].get()).to.deep.contain({
            alias: ['setupSession'],
            group: createNewSessionGroup.id,
          })

          const secondValidateSessionGroup = logs[10].get()

          expect(secondValidateSessionGroup).to.contain({
            displayName: 'Validate session',
            group: sessionGroupId,
          })

          expect(logs[11].get()).to.deep.contain({
            alias: ['validateSession'],
            group: secondValidateSessionGroup.id,
          })

          expect(logs[12].get()).to.contain({
            name: 'Clear page',
            group: sessionGroupId,
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
            validate.callsFake(() => Promise.reject(false))
          })

          cy.once('fail', (err) => {
            expect(err.message).to.contain('Your `cy.session` **validate** promise rejected with false')
            expect(setup).to.be.calledOnce
            expect(validate).to.be.calledTwice
            expect(clearPageCount, 'total times session cleared the page').to.eq(2)

            expect(logs[0].get()).to.contain({
              name: 'session',
              state: 'failed',
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

            // this error is associated with the group since the validation rejected
            expect(logs[4].get('error').message).to.contain('Your `cy.session` **validate** promise rejected with false.')

            expect(logs[6].get()).to.contain({
              name: 'Clear page',
              group: sessionGroupId,
            })

            expect(logs[7].get()).to.contain({
              displayName: 'Clear cookies, localStorage and sessionStorage',
              group: sessionGroupId,
            })

            const createNewSessionGroup = logs[8].get()

            expect(createNewSessionGroup).to.contain({
              displayName: 'Recreate session',
              groupStart: true,
              group: sessionGroupId,
            })

            expect(logs[9].get()).to.deep.contain({
              alias: ['setupSession'],
              group: createNewSessionGroup.id,
            })

            const secondValidateSessionGroup = logs[10].get()

            expect(secondValidateSessionGroup).to.contain({
              displayName: 'Validate session',
              group: sessionGroupId,
            })

            expect(logs[11].get()).to.deep.contain({
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
  })

  describe('testIsolation=false', { testIsolation: false }, () => {
    before(async () => {
      // manually ensure clear browser state! since we turned testIsolation off
      await Cypress.session.clearCurrentSessionData()
    })

    describe('test:before:run:async', () => {
      it('does not clear page before each run', () => {
        cy.visit('/fixtures/form.html')
        .then(async () => {
          cy.spy(Cypress, 'action').log(false)

          await Cypress.action('runner:test:before:run:async', {
            id: 'r1',
            currentRetry: 0,
          }, Cypress.state('runnable'))

          expect(Cypress.action).not.to.be.calledWith('cy:url:changed')
          expect(Cypress.action).not.to.be.calledWith('cy:visit:blank')
        })
        .url('/fixtures/form.html')
      })

      it('does not clear session data before each run', async () => {
        const clearCurrentSessionData = cy.spy(Cypress.session, 'clearCurrentSessionData')

        await Cypress.action('runner:test:before:run:async', {
          id: 'r1',
          currentRetry: 0,
        }, Cypress.state('runnable'))

        expect(clearCurrentSessionData).not.to.be.called
      })

      it('does not reset rendered html origins before each run', async () => {
        const backendSpy = cy.spy(Cypress, 'backend').log(false)

        await Cypress.action('runner:test:before:run:async', {
          id: 'r1',
          currentRetry: 0,
        }, Cypress.state('runnable'))

        expect(backendSpy).not.to.be.calledWith('reset:rendered:html:origins')
      })

      it('does not clear the browser context before each run', () => {
        cy.window()
        .then((win) => {
          win.cookie = 'key=value; SameSite=Strict; Secure; Path=/fixtures'
          win.localStorage.setItem('animal', 'bear')
          win.sessionStorage.setItem('food', 'burgers')
        })
        .then(async () => {
          cy.spy(Cypress, 'action').log(false)

          await Cypress.action('runner:test:before:run:async', {
            id: 'r1',
            currentRetry: 0,
          }, Cypress.state('runnable'))

          expect(Cypress.action).not.to.be.calledWith('cy:url:changed')
          expect(Cypress.action).not.to.be.calledWith('cy:visit:blank')
        })

        cy.window().its('cookie').should('equal', 'key=value; SameSite=Strict; Secure; Path=/fixtures')
        cy.window().its('localStorage').should('have.length', 1).should('deep.contain', { animal: 'bear' })
        cy.window().its('sessionStorage').should('have.length', 1).should('deep.contain', { food: 'burgers' })
      })
    })

    describe('session flows', () => {
      let logs = []
      let clearPageCount = 0
      let sessionGroupId
      let setup
      let slowSetup
      let validate

      const handleSetup = (slowLogin = false) => {
      // create session clears page before running
        cy.contains('Default blank page').should('not.exist')

        cy.visit('/fixtures/auth/index.html')
        cy.contains('You are not logged in')
        cy.get('[data-cy=login-same-origin]').click()
        cy.get('input').type('tester')
        if (slowLogin) {
          cy.get('[data-cy=slow-login]').click()
        } else {
          cy.get('[data-cy=login]').click()
        }
      }

      const handleSlowSetup = () => handleSetup(true)

      const handleValidate = () => {
        // both create & restore session clears page after running
        cy.contains('Default blank page').should('not.exist')

        cy.window()
        .its('sessionStorage')
        .its('cypressAuthToken', { timeout: 5000 })
        .should('contain', '"username":"tester"')
      }

      before(() => {
        setup = cy.stub().callsFake(handleSetup).as('setupSession')
        slowSetup = cy.stub().callsFake(handleSlowSetup).as('setupSlowSession')
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
          if (attrs.name === 'session' || attrs.name === 'sessions_manager' || attrs.alias?.includes('setupSession') || attrs.alias?.includes('setupSlowSession') || attrs.alias?.includes('validateSession')) {
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

        it('does not clear the page after command', () => {
          cy.url().should('contain', '/fixtures/auth/index.html')
        })

        it('successfully creates new session', () => {
          expect(setup).to.be.calledOnce
          expect(clearPageCount, 'total times session cleared the page').to.eq(0)
        })

        it('groups session logs correctly', () => {
          expect(logs[0].get()).to.deep.contain({
            name: 'session',
            state: 'passed',
            id: sessionGroupId,
            sessionInfo: {
              id: 'session-1',
              isGlobalSession: false,
              status: 'created',
            },
          })

          expect(logs[1].get()).to.contain({
            displayName: 'Clear cookies, localStorage and sessionStorage',
            group: sessionGroupId,
          })

          const createNewSessionGroup = logs[2].get()

          expect(createNewSessionGroup).to.contain({
            displayName: 'Create new session',
            groupStart: true,
            group: sessionGroupId,
          })

          expect(logs[3].get()).to.deep.contain({
            alias: ['setupSession'],
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

          expect(consoleProps.name).to.eq('session')
          expect(consoleProps.type).to.eq('command')
          expect(consoleProps.props.id).to.eq('session-1')
          expect(consoleProps.props.Domains).to.eq('This session captured data from localhost.')

          expect(consoleProps.groups).to.have.length(1)
          expect(consoleProps.groups[0].name).to.eq('localhost data:')
          expect(consoleProps.groups[0].groups).to.have.length(1)

          const sessionStorageData = consoleProps.groups[0].groups[0]

          expect(sessionStorageData.name).to.contain('Session Storage - (1)')
          expect(sessionStorageData.items).to.have.property('cypressAuthToken')
          expect(sessionStorageData.items.cypressAuthToken).to.contains('"username":"tester"')
        })
      })

      describe('create session with validation flow', () => {
        let sessionId

        before(() => {
          setupTestContext()
          cy.log('Creating new session with validation to test against')
          sessionId = `session-${Cypress.state('test').id}`
          cy.session(sessionId, slowSetup, { validate })
        })

        it('does not clear the page after command', () => {
          cy.url().should('contain', '/fixtures/auth/index.html')
        })

        it('successfully creates new session and validates it', () => {
          expect(slowSetup).to.be.calledOnce
          expect(validate).to.be.calledOnce
          expect(clearPageCount, 'total times session cleared the page').to.eq(0)
        })

        it('groups session logs correctly', () => {
          expect(logs[0].get()).to.deep.contain({
            name: 'session',
            state: 'passed',
            id: sessionGroupId,
            sessionInfo: {
              id: sessionId,
              isGlobalSession: false,
              status: 'created',
            },
          })

          expect(logs[1].get()).to.contain({
            displayName: 'Clear cookies, localStorage and sessionStorage',
            group: sessionGroupId,
          })

          const createNewSessionGroup = logs[2].get()

          expect(createNewSessionGroup).to.contain({
            displayName: 'Create new session',
            groupStart: true,
            group: sessionGroupId,
          })

          expect(logs[3].get()).to.deep.contain({
            alias: ['setupSlowSession'],
            group: createNewSessionGroup.id,
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

        it('has session details in the consoleProps', () => {
          const consoleProps = logs[0].get('consoleProps')()

          expect(consoleProps.name).to.eq('session')
          expect(consoleProps.type).to.eq('command')
          expect(consoleProps.props.id).to.eq(sessionId)
          expect(consoleProps.props.Domains).to.eq('This session captured data from localhost.')

          expect(consoleProps.groups).to.have.length(1)
          expect(consoleProps.groups[0].name).to.eq('localhost data:')
          expect(consoleProps.groups[0].groups).to.have.length(1)

          const sessionStorageData = consoleProps.groups[0].groups[0]

          expect(sessionStorageData.name).to.contain('Session Storage - (1)')
          expect(sessionStorageData.items).to.have.property('cypressAuthToken')
          expect(sessionStorageData.items.cypressAuthToken).to.contains('"username":"tester"')
        })
      })

      describe('create session with failed validation flow', () => {
        it('fails validation and logs correctly', function (done) {
          setupTestContext()
          cy.log('Creating new session with validation to test against')

          cy.once('fail', (err) => {
            expect(setup).to.be.calledOnce
            expect(validate).to.be.calledOnce
            expect(clearPageCount, 'total times session cleared the page').to.eq(0)
            expect(err.message).to.contain('Your `cy.session` **validate** promise rejected with false')
            expect(logs[0].get()).to.deep.contain({
              name: 'session',
              state: 'failed',
              id: sessionGroupId,
              sessionInfo: {
                id: `session-${Cypress.state('test').id}`,
                isGlobalSession: false,
                status: 'failed',
              },
            })

            expect(logs[1].get()).to.contain({
              displayName: 'Clear cookies, localStorage and sessionStorage',
              group: sessionGroupId,
            })

            const createNewSessionGroup = logs[2].get()

            expect(createNewSessionGroup).to.contain({
              displayName: 'Create new session',
              groupStart: true,
              group: sessionGroupId,
            })

            expect(logs[3].get()).to.deep.contain({
              alias: ['setupSession'],
              group: createNewSessionGroup.id,
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

            done()
          })

          validate.callsFake(() => Promise.reject(false))

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

        it('does not clear the page after command', () => {
          cy.url().should('contain', '/fixtures/auth/index.html')
        })

        it('successfully restores saved session', () => {
          expect(setup).to.not.be.called
          expect(validate).to.not.be.called
          expect(clearPageCount, 'total times session cleared the page').to.eq(0)
        })

        it('groups session logs correctly', () => {
          expect(logs[0].get()).to.contain({
            name: 'session',
            state: 'passed',
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
            displayName: 'Clear cookies, localStorage and sessionStorage',
            group: sessionGroupId,
          })

          const restoreSavedSessionGroup = logs[2].get()

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

        it('does not clear page after command', () => {
          cy.url().should('contain', '/fixtures/auth/index.html')
        })

        it('successfully restores saved session', () => {
          expect(setup).to.not.be.called
          expect(validate).to.be.calledOnce
          expect(clearPageCount, 'total times session cleared the page').to.eq(0)
        })

        it('groups session logs correctly', () => {
          expect(logs[0].get()).to.contain({
            name: 'session',
            state: 'passed',
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
            displayName: 'Clear cookies, localStorage and sessionStorage',
            group: sessionGroupId,
          })

          const restoreSavedSessionGroup = logs[2].get()

          expect(restoreSavedSessionGroup).to.contain({
            displayName: 'Restore saved session',
            group: sessionGroupId,
          })

          const validateSessionGroup = logs[3].get()

          expect(validateSessionGroup).to.contain({
            displayName: 'Validate session',
            group: sessionGroupId,
          })

          expect(logs[4].get()).to.deep.contain({
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
                return Promise.reject(false)
              }

              handleValidate()
            })
          })

          cy.log('restore session to test against')
          cy.session(sessionId, setup, { validate })
        })

        it('does not clear page after command', () => {
          cy.url().should('contain', '/fixtures/auth/index.html')
        })

        it('successfully recreates session', () => {
          expect(setup).to.be.calledOnce
          expect(validate).to.be.calledTwice
          expect(clearPageCount, 'total times session cleared the page').to.eq(0)
        })

        it('groups session logs correctly', () => {
          expect(logs[0].get()).to.contain({
            name: 'session',
            state: 'warned',
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
            displayName: 'Clear cookies, localStorage and sessionStorage',
            group: sessionGroupId,
          })

          const restoreSavedSessionGroup = logs[2].get()

          expect(restoreSavedSessionGroup).to.contain({
            displayName: 'Restore saved session',
            group: sessionGroupId,
          })

          const validateSessionGroup = logs[3].get()

          expect(validateSessionGroup).to.contain({
            displayName: 'Validate session',
            group: sessionGroupId,
          })

          expect(logs[4].get()).to.deep.contain({
            alias: ['validateSession'],
            group: validateSessionGroup.id,
          })

          // this error is associated with the group since the validation rejected
          expect(logs[3].get('error').message).to.contain('Your `cy.session` **validate** promise rejected with false.')

          expect(logs[5].get()).to.contain({
            displayName: 'Clear cookies, localStorage and sessionStorage',
            group: sessionGroupId,
          })

          const createNewSessionGroup = logs[6].get()

          expect(createNewSessionGroup).to.contain({
            displayName: 'Recreate session',
            groupStart: true,
            group: sessionGroupId,
          })

          expect(logs[7].get()).to.deep.contain({
            alias: ['setupSession'],
            group: createNewSessionGroup.id,
          })

          const secondValidateSessionGroup = logs[8].get()

          expect(secondValidateSessionGroup).to.contain({
            displayName: 'Validate session',
            group: sessionGroupId,
          })

          expect(logs[9].get()).to.deep.contain({
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
            validate.callsFake(() => Promise.reject(false))
          })

          cy.once('fail', (err) => {
            expect(err.message).to.contain('Your `cy.session` **validate** promise rejected with false')
            expect(setup).to.be.calledOnce
            expect(validate).to.be.calledTwice
            expect(clearPageCount, 'total times session cleared the page').to.eq(0)

            expect(logs[0].get()).to.contain({
              name: 'session',
              state: 'failed',
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
              displayName: 'Clear cookies, localStorage and sessionStorage',
              group: sessionGroupId,
            })

            const restoreSavedSessionGroup = logs[2].get()

            expect(restoreSavedSessionGroup).to.contain({
              displayName: 'Restore saved session',
              group: sessionGroupId,
            })

            const validateSessionGroup = logs[3].get()

            expect(validateSessionGroup).to.contain({
              displayName: 'Validate session',
              group: sessionGroupId,
            })

            expect(logs[4].get()).to.deep.contain({
              alias: ['validateSession'],
              group: validateSessionGroup.id,
            })

            // this error is associated with the group since the validation rejected
            expect(logs[3].get('error').message).to.contain('Your `cy.session` **validate** promise rejected with false.')

            expect(logs[5].get()).to.contain({
              displayName: 'Clear cookies, localStorage and sessionStorage',
              group: sessionGroupId,
            })

            const createNewSessionGroup = logs[6].get()

            expect(createNewSessionGroup).to.contain({
              displayName: 'Recreate session',
              groupStart: true,
              group: sessionGroupId,
            })

            expect(logs[7].get()).to.deep.contain({
              alias: ['setupSession'],
              group: createNewSessionGroup.id,
            })

            const secondValidateSessionGroup = logs[8].get()

            expect(secondValidateSessionGroup).to.contain({
              displayName: 'Validate session',
              group: sessionGroupId,
            })

            expect(logs[9].get()).to.deep.contain({
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

    it('throws when setup function is not provided', function (done) {
      cy.once('fail', (err) => {
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('In order to use `cy.session()`, provide a `setup` as the second argument:\n\n`cy.session(id, setup)`')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session('some-session')
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
        expect(lastSessionLog).to.eq(lastLog)
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
          expect(err.message).to.contain('This error occurred while creating the session. Because the session setup failed, we failed the test.')
          expect(lastSessionLog.get('state')).to.eq('failed')
          done()
        })

        cy.session(`session-${Cypress.state('test').id}`, () => {
          cy.get('#does_not_exist', { timeout: 500 })
        })
      })

      it('throws when setup function has a failing assertion', function (done) {
        cy.once('fail', (err) => {
          expect(err.message).to.contain(lastLog.get('error').message)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.contain('This error occurred while creating the session. Because the session setup failed, we failed the test.')
          expect(lastSessionLog.get('state')).to.eq('failed')

          done()
        })

        cy.session(`session-${Cypress.state('test').id}`, () => {
          expect(true).to.be.false
        })
      })
    })

    describe('options.validate failures', () => {
      const errorHookMessage = 'This error occurred while validating the created session. Because validation failed immediately after creating the session, we failed the test.'

      it('throws when options.validate has a failing Cypress command', (done) => {
        cy.once('fail', (err) => {
          expect(err.message).contain('Expected to find element: `#does_not_exist`')
          expect(err.message).contain(errorHookMessage)
          // TODO: Webkit does not have correct stack traces on errors currently
          if (Cypress.isBrowser('!webkit')) {
            expect(err.codeFrame).exist
          }

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
          // TODO: Webkit does not have correct stack traces on errors currently
          if (Cypress.isBrowser('!webkit')) {
            expect(err.codeFrame).exist
          }

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
          // TODO: Webkit does not have correct stack traces on errors currently
          if (Cypress.isBrowser('!webkit')) {
            expect(err.codeFrame).exist
          }

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

      it('throws when options.validate resolves false', (done) => {
        cy.once('fail', (err) => {
          expect(err.message).to.contain('Your `cy.session` **validate** promise resolved false.')
          expect(err.message).contain(errorHookMessage)
          // TODO: Webkit does not have correct stack traces on errors currently
          if (Cypress.isBrowser('!webkit')) {
            expect(err.codeFrame).exist
          }

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
          expect(err.message).to.contain('Your `cy.session` **validate** callback yielded false.')
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

  it('should allow more than 20 sessions to be created per test', () => {
    for (let index = 0; index < 21; index++) {
      cy.session(`${index}`, () => {})
    }
  })
})
