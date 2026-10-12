import { assertLogLength } from '../../../support/utils'
const { Promise } = Cypress

describe('src/cy/commands/cookies', () => {
  let automation: sinon.SinonStub

  beforeEach(() => {
    // call through normally on everything
    automation = cy.stub(Cypress, 'automation').rejects(new Error('Cypress.automation was not stubbed'))

    cy.visit('http://localhost:3500/fixtures/generic.html')
  })

  context('#clearCookies', () => {
    it('returns null', () => {
      automation.withArgs('get:cookies').resolves([])

      cy.clearCookies().should('be.null')
    })

    it('does not call \'clear:cookies\' when no cookies were returned', () => {
      automation.withArgs('get:cookies').resolves([])

      cy.clearCookies().then(() => {
        expect(Cypress.automation).not.to.be.calledWith(
          'clear:cookies',
        )
      })
    })

    it('calls \'clear:cookies\' with all cookies', () => {
      automation
      .withArgs('get:cookies')
      .resolves([
        { name: 'foo', domain: 'localhost' },
        { name: 'bar', domain: 'localhost' },
        { name: 'baz', domain: 'localhost' },
      ])
      .withArgs('clear:cookies', [
        { name: 'foo', domain: 'localhost' },
        { name: 'bar', domain: 'localhost' },
        { name: 'baz', domain: 'localhost' },
      ])
      .resolves({
        name: 'foo',
      })

      cy
      .clearCookies().should('be.null').then(() => {
        expect(Cypress.automation).to.be.calledWith(
          'clear:cookies', [
            { name: 'foo', domain: 'localhost' },
            { name: 'bar', domain: 'localhost' },
            { name: 'baz', domain: 'localhost' },
          ],
        )
      })
    })

    describe('timeout', () => {
      beforeEach(() => {
        automation
        .withArgs('get:cookies')
        .resolves([{}])
        .withArgs('clear:cookies')
        .resolves({})
      })

      it('sets timeout to Cypress.config(responseTimeout)', {
        responseTimeout: 2500,
      }, () => {
        automation.resolves([])

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.clearCookies().then(() => {
          expect(timeout).to.be.calledWith(2500)
        })
      })

      it('can override timeout', () => {
        automation.resolves([])

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.clearCookies({ timeout: 1000 }).then(() => {
          expect(timeout).to.be.calledWith(1000)
        })
      })

      it('clears the current timeout and restores after success', () => {
        cy.timeout(100)

        cy.spy(cy, 'clearTimeout')

        cy.clearCookies().then(() => {
          expect(cy.clearTimeout).to.be.calledWith('get:cookies')
          expect(cy.clearTimeout).to.be.calledWith('clear:cookies')

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
          if (attrs.name === 'clearCookies') {
            this.lastLog = log
            this.logs.push(log)
          }
        })

        return null
      })

      it('when an invalid domain prop is supplied', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(lastLog.get('error').message).to.eq('`cy.clearCookies()` must be passed a valid domain name. You passed: `true`')
          expect(lastLog.get('error').docsUrl).to.eq('https://on.cypress.io/clearcookies')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        // @ts-expect-error - verifies the runtime check for a non-string domain
        cy.clearCookies({ domain: true })
      })

      it('logs once on \'get:cookies\' error', function (done) {
        const error = new Error('some err message')

        error.name = 'foo'
        error.stack = 'some err message\n  at fn (foo.js:1:1)'

        automation.rejects(error)

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error').message).to.contain(`\`cy.clearCookies()\` had an unexpected error clearing cookies in ${Cypress.browser.displayName}.`)
          expect(lastLog.get('error').message).to.contain('some err message')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.clearCookies()
      })

      it('throws after timing out', function (done) {
        automation.resolves([{ name: 'foo' }])
        automation.withArgs('clear:cookies').resolves(Promise.delay(1000))

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('name')).to.eq('clearCookies')
          expect(lastLog.get('message')).to.eq('')
          expect(err.message).to.eq('`cy.clearCookies()` timed out waiting `50ms` to complete.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/clearcookies')

          done()
        })

        cy.clearCookies({ timeout: 50 })
      })

      it('logs once on \'clear:cookies\' error', function (done) {
        automation.withArgs('get:cookies').resolves([
          { name: 'foo' }, { name: 'bar' },
        ])

        const error = new Error('some err message')

        error.name = 'foo'
        error.stack = 'stack'

        automation.withArgs('clear:cookies').rejects(error)

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error').message).to.contain(`\`cy.clearCookies()\` had an unexpected error clearing cookies in ${Cypress.browser.displayName}.`)
          expect(lastLog.get('error').message).to.contain('some err message')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.clearCookies()
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'clearCookies') {
            this.lastLog = log
          }
        })

        automation
        .withArgs('get:cookies', { domain: 'localhost' })
        .resolves([{ name: 'foo', domain: 'localhost' }])
        .withArgs('clear:cookies', [{ name: 'foo', domain: 'localhost' }])
        .resolves([
          { name: 'foo' },
        ])
      })

      it('can turn off logging when protocol is disabled', function () {
        cy.state('isProtocolEnabled', false)
        cy.on('_log:added', (attrs, log) => {
          if (attrs.name === 'clearCookies') {
            this.hiddenLog = log
          }
        })

        cy.clearCookies({ log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', function () {
        cy.state('isProtocolEnabled', true)
        cy.on('_log:added', (attrs, log) => {
          if (attrs.name === 'clearCookies') {
            this.hiddenLog = log
          }
        })

        cy.clearCookies({ log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.ok
          expect(hiddenLog.get('name'), 'log name').to.eq('clearCookies')
          expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
          expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(1)
        })
      })

      it('ends immediately', () => {
        cy.clearCookies().then(function () {
          const { lastLog } = this

          expect(lastLog.get('ended')).to.be.true
          expect(lastLog.get('state')).to.eq('passed')
        })
      })

      it('snapshots immediately', () => {
        cy.clearCookies().then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('#consoleProps', () => {
        cy.clearCookies().then(function (cookies) {
          expect(cookies).to.be.null
          const c = this.lastLog.invoke('consoleProps')

          expect(c.props['Yielded']).to.eq('null')
          expect(c.props['Cleared Cookies']).to.deep.eq([{ name: 'foo' }])
          expect(c.props['Num Cookies']).to.eq(1)
        })
      })
    })

    describe('.log with no cookies returned', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'clearCookies') {
            this.lastLog = log
          }
        })

        automation
        .withArgs('get:cookies', { domain: 'localhost' })
        .resolves([])
      })

      it('#consoleProps', () => {
        cy.clearCookies().then(function (cookies) {
          expect(cookies).to.be.null
          const c = this.lastLog.invoke('consoleProps')

          expect(c.props['Yielded']).to.eq('null')
          expect(c.props['Cleared Cookies']).to.be.undefined
          expect(c.props['Note']).to.eq('No cookies were found or removed.')
        })
      })
    })

    describe('.log when no cookies were cleared', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'clearCookies') {
            this.lastLog = log
          }
        })

        automation
        .withArgs('get:cookies', { domain: 'localhost' })
        .resolves([{ name: 'foo', domain: 'localhost' }])
        .withArgs('clear:cookies', [{ name: 'foo', domain: 'localhost' }])
        .resolves([])
      })

      it('#consoleProps', () => {
        cy.clearCookies().then(function (cookies) {
          expect(cookies).to.be.null
          const c = this.lastLog.invoke('consoleProps')

          expect(c.props['Yielded']).to.eq('null')
          expect(c.props['Cleared Cookies']).to.be.undefined
          expect(c.props['Note']).to.eq('No cookies were found or removed.')
        })
      })
    })
  })
})
