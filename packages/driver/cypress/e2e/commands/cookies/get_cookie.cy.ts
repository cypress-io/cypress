import { assertLogLength } from '../../../support/utils'
const { Promise } = Cypress

describe('src/cy/commands/cookies', () => {
  let automation: sinon.SinonStub

  beforeEach(() => {
    // fail loudly on any automation call a test hasn't stubbed
    automation = cy.stub(Cypress, 'automation').rejects(new Error('Cypress.automation was not stubbed'))

    cy.visit('http://localhost:3500/fixtures/generic.html')
  })

  context('#getCookie', () => {
    it('returns single cookie by name', () => {
      automation.withArgs('get:cookie').resolves({
        name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false, hostOnly: true,
      })

      cy.getCookie('foo').should('deep.eq', {
        name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false, hostOnly: true,
      })
      .then(() => {
        expect(automation).to.be.calledWith(
          'get:cookie',
          { domain: 'localhost', name: 'foo' },
        )
      })
    })

    it('returns null when no cookie was found', () => {
      automation.withArgs('get:cookie').resolves(null)

      cy.getCookie('foo').should('be.null')
    })

    describe('timeout', () => {
      it('sets timeout to Cypress.config(defaultCommandTimeout)', {
        defaultCommandTimeout: 2500,
      }, () => {
        automation.resolves(null)

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.getCookie('foo').then(() => {
          expect(timeout).to.be.calledWith(2500)
        })
      })

      it('can override timeout', () => {
        automation.resolves(null)

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.getCookie('foo', { timeout: 1000 }).then(() => {
          expect(timeout).to.be.calledWith(1000)
        })
      })
    })

    // https://github.com/cypress-io/cypress/issues/4802
    it('retries reading the cookie until an assertion passes', () => {
      const get = automation.withArgs('get:cookie')

      get.resolves(null)
      get.onCall(2).resolves({
        name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false,
      })

      cy.getCookie('foo').should('exist').then((cookie) => {
        expect(cookie).to.have.property('value', 'bar')
        expect(get.callCount).to.be.gte(3)
      })
    })

    // https://github.com/cypress-io/cypress/issues/4802
    // the cookie must be re-read on retries even when the failing assertion is
    // chained through another query (e.g. `.its()`).
    it('retries reading the cookie when assertions are chained through another query', () => {
      const get = automation.withArgs('get:cookie')

      get.resolves({ name: 'foo', value: 'stale', domain: 'localhost', path: '/', secure: true, httpOnly: false })
      get.onCall(2).resolves({ name: 'foo', value: 'fresh', domain: 'localhost', path: '/', secure: true, httpOnly: false })

      cy.getCookie('foo').its('value').should('eq', 'fresh').then(() => {
        expect(get.callCount).to.be.gte(3)
      })
    })

    describe('errors', {
      defaultCommandTimeout: 100,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'getCookie') {
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

        automation.rejects(error)

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)

          expect(lastLog.get('error').message).to.contain(`\`cy.getCookie()\` had an unexpected error reading the requested cookie from ${Cypress.browser.displayName}.`)
          expect(lastLog.get('error').message).to.contain('some err message')

          done()
        })

        cy.getCookie('foo')
      })

      it('throws after timing out', function (done) {
        automation.resolves(Promise.delay(1000))

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('name')).to.eq('getCookie')
          expect(lastLog.get('message')).to.eq('foo')
          expect(err.message).to.eq('Timed out retrying after 50ms: `cy.getCookie()` timed out waiting `50ms` to complete.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/getcookie')

          done()
        })

        cy.getCookie('foo', { timeout: 50 })
      })

      it('requires a string name', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error').message).to.eq('`cy.getCookie()` must be passed a string argument for name.')
          expect(lastLog.get('error').docsUrl).to.eq('https://on.cypress.io/getcookie')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        // @ts-expect-error - verifies the runtime check for a non-string name
        cy.getCookie(123)
      })

      it('when an invalid domain prop is supplied', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(lastLog.get('error').message).to.eq('`cy.getCookie()` must be passed a valid domain name. You passed: `true`')
          expect(lastLog.get('error').docsUrl).to.eq('https://on.cypress.io/getcookie')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        // @ts-expect-error - verifies the runtime check for a non-string domain
        cy.getCookie('foo', { domain: true })
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        this.asserts = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'getCookie') {
            this.lastLog = log
          }

          if (attrs.name === 'assert') {
            this.asserts.push(log)
          }
        })

        automation
        .withArgs('get:cookie', { domain: 'localhost', name: 'foo' })
        .resolves({
          name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false,
        })
        .withArgs('get:cookie', { domain: 'localhost', name: 'bar' })
        .resolves(null)
      })

      it('can turn off logging when protocol is disabled', function () {
        cy.state('isProtocolEnabled', false)
        cy.on('_log:added', (attrs, log) => {
          if (attrs.name === 'getCookie') {
            this.hiddenLog = log
          }
        })

        cy.getCookie('foo', { log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', function () {
        cy.state('isProtocolEnabled', true)
        cy.on('_log:added', (attrs, log) => {
          if (attrs.name === 'getCookie') {
            this.hiddenLog = log
          }
        })

        cy.getCookie('foo', { log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.ok
          expect(hiddenLog.get('name'), 'log name').to.eq('getCookie')
          expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
          expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(1)
        })
      })

      it('only logs assertion once when should is invoked', () => {
        cy.getCookie('foo').should('exist').then(function () {
          expect(this.asserts.length).to.eq(1)
        })
      })

      it('ends immediately', () => {
        cy.getCookie('foo').then(function () {
          const { lastLog } = this

          expect(lastLog.get('ended')).to.be.true
          expect(lastLog.get('state')).to.eq('passed')
        })
      })

      it('has correct message', () => {
        cy.getCookie('foo').then(function () {
          const { lastLog } = this

          expect(lastLog.get('message')).to.eq('foo')
        })
      })

      it('snapshots immediately', () => {
        cy.getCookie('foo').then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('#consoleProps', () => {
        cy.getCookie('foo').then(function (cookie) {
          expect(cookie).to.deep.eq({ name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false })
          const c = this.lastLog.invoke('consoleProps')

          expect(c.props['Yielded']).to.deep.eq(cookie)
        })
      })

      it('#consoleProps when no cookie found', () => {
        cy.getCookie('bar').then(function (cookie) {
          expect(cookie).to.be.null
          const c = this.lastLog.invoke('consoleProps')

          expect(c.props['Yielded']).to.eq('null')
          expect(c.props['Note']).to.eq('No cookie with the name: \'bar\' was found.')
        })
      })
    })
  })
})
