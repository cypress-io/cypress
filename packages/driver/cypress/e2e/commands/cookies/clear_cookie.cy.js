const { assertLogLength } = require('../../../support/utils')
const { Promise } = Cypress

describe('src/cy/commands/cookies', () => {
  beforeEach(() => {
    // call through normally on everything
    cy.stub(Cypress, 'automation').rejects(new Error('Cypress.automation was not stubbed'))

    cy.visit('http://localhost:3500/fixtures/generic.html')
  })

  context('#clearCookie', () => {
    it('returns null', () => {
      Cypress.automation.withArgs('clear:cookie').resolves(null)

      cy.clearCookie('foo').should('be.null').then(() => {
        expect(Cypress.automation).to.be.calledWith(
          'clear:cookie',
          { domain: 'localhost', name: 'foo' },
        )
      })
    })

    describe('timeout', () => {
      it('sets timeout to Cypress.config(responseTimeout)', {
        responseTimeout: 2500,
      }, () => {
        Cypress.automation.resolves(null)

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.clearCookie('foo').then(() => {
          expect(timeout).to.be.calledWith(2500)
        })
      })

      it('can override timeout', () => {
        Cypress.automation.resolves(null)

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.clearCookie('foo', { timeout: 1000 }).then(() => {
          expect(timeout).to.be.calledWith(1000)
        })
      })

      it('clears the current timeout and restores after success', () => {
        Cypress.automation.resolves([])

        cy.timeout(100)

        cy.spy(cy, 'clearTimeout')

        cy.clearCookie('foo').then(() => {
          expect(cy.clearTimeout).to.be.calledWith('clear:cookie')

          // restores the timeout afterwards
          expect(cy.timeout()).to.eq(100)
        })
      })
    })

    describe('errors', {
      defaultCommandTimeout: 100,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'clearCookie') {
            this.lastLog = log
            this.logs.push(log)
          }
        })

        return null
      })

      it('logs once on error', function (done) {
        const error = new Error('some err message')

        error.name = 'foo'
        error.stack = 'stack'

        Cypress.automation.rejects(error)

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error').message).to.contain(`\`cy.clearCookie()\` had an unexpected error clearing the requested cookie in ${Cypress.browser.displayName}.`)
          expect(lastLog.get('error').message).to.contain('some err message')

          done()
        })

        cy.clearCookie('foo')
      })

      it('throws after timing out', function (done) {
        Cypress.automation.resolves(Promise.delay(1000))

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('name')).to.eq('clearCookie')
          expect(lastLog.get('message')).to.eq('foo')
          expect(err.message).to.eq('`cy.clearCookie()` timed out waiting `50ms` to complete.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/clearcookie')

          done()
        })

        cy.clearCookie('foo', { timeout: 50 })
      })

      it('requires a string name', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error').message).to.eq('`cy.clearCookie()` must be passed a string argument for name.')
          expect(lastLog.get('error').docsUrl).to.eq('https://on.cypress.io/clearcookie')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.clearCookie(123)
      })

      it('when an invalid domain prop is supplied', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(lastLog.get('error').message).to.eq('`cy.clearCookie()` must be passed a valid domain name. You passed: `true`')
          expect(lastLog.get('error').docsUrl).to.eq('https://on.cypress.io/clearcookie')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.clearCookie('foo', { domain: true })
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'clearCookie') {
            this.lastLog = log
          }
        })

        Cypress.automation
        .withArgs('clear:cookie', { domain: 'localhost', name: 'foo' })
        .resolves({
          name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false, hostOnly: false,
        })
        .withArgs('clear:cookie', { domain: 'localhost', name: 'bar' })
        .resolves(null)
      })

      it('can turn off logging when protocol is disabled', function () {
        cy.state('isProtocolEnabled', false)
        cy.on('_log:added', (attrs, log) => {
          if (attrs.name === 'clearCookie') {
            this.hiddenLog = log
          }
        })

        cy.clearCookie('foo', { log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', function () {
        cy.state('isProtocolEnabled', true)
        cy.on('_log:added', (attrs, log) => {
          if (attrs.name === 'clearCookie') {
            this.hiddenLog = log
          }
        })

        cy.clearCookie('foo', { log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.ok
          expect(hiddenLog.get('name'), 'log name').to.eq('clearCookie')
          expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
          expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(1)
        })
      })

      it('ends immediately', () => {
        cy.clearCookie('foo').then(function () {
          const { lastLog } = this

          expect(lastLog.get('ended')).to.be.true
          expect(lastLog.get('state')).to.eq('passed')
        })
      })

      it('snapshots immediately', () => {
        cy.clearCookie('foo').then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('#consoleProps', () => {
        cy.clearCookie('foo').then(function (cookie) {
          expect(cookie).to.be.null
          const c = this.lastLog.invoke('consoleProps')

          expect(c.props['Yielded']).to.eq('null')
          expect(c.props['Cleared Cookie']).to.deep.eq({ name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false, hostOnly: false })
        })
      })

      it('#consoleProps when no matching cookie was found', () => {
        cy.clearCookie('bar').then(function (cookie) {
          expect(cookie).to.be.null
          const c = this.lastLog.invoke('consoleProps')

          expect(c.props['Yielded']).to.eq('null')
          expect(c.props['Cleared Cookie']).to.be.undefined
          expect(c.props['Note']).to.eq('No cookie with the name: \'bar\' was found or removed.')
        })
      })
    })
  })
})
