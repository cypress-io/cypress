import { assertLogLength } from '../../../support/utils'
const { Promise } = Cypress

describe('src/cy/commands/cookies', () => {
  let automation: sinon.SinonStub

  beforeEach(() => {
    // call through normally on everything
    automation = cy.stub(Cypress, 'automation').rejects(new Error('Cypress.automation was not stubbed'))

    cy.visit('http://localhost:3500/fixtures/generic.html')
  })

  context('#getCookies', () => {
    it('returns array of cookies', () => {
      automation.withArgs('get:cookies').resolves([])

      cy.getCookies().should('deep.eq', []).then(() => {
        expect(automation).to.be.calledWith(
          'get:cookies',
          { domain: 'localhost' },
        )
      })
    })

    describe('timeout', () => {
      it('sets timeout to Cypress.config(defaultCommandTimeout)', {
        defaultCommandTimeout: 2500,
      }, () => {
        automation.resolves([])

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.getCookies().then(() => {
          expect(timeout).to.be.calledWith(2500)
        })
      })

      it('can override timeout', () => {
        automation.resolves([])

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.getCookies({ timeout: 1000 }).then(() => {
          expect(timeout).to.be.calledWith(1000)
        })
      })
    })

    // https://github.com/cypress-io/cypress/issues/4802
    it('retries reading cookies until an assertion passes', () => {
      const get = automation.withArgs('get:cookies')

      get.resolves([])
      get.onCall(2).resolves([
        { name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false, hostOnly: false },
      ])

      cy.getCookies().should('have.length', 1).then((cookies) => {
        expect(cookies[0].name).to.eq('foo')
        expect(get.callCount).to.be.gte(3)
      })
    })

    describe('errors', {
      defaultCommandTimeout: 50,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'getCookies') {
            this.lastLog = log
            this.logs.push(log)
          }
        })

        return null
      })

      it('when an invalid domain prop is supplied', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(lastLog.get('error').message).to.eq('`cy.getCookies()` must be passed a valid domain name. You passed: `true`')
          expect(lastLog.get('error').docsUrl).to.eq('https://on.cypress.io/getcookies')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        // @ts-expect-error - verifies the runtime check for a non-string domain
        cy.getCookies({ domain: true })
      })

      it('logs once on error', function (done) {
        const error = new Error('some err message')

        error.name = 'foo'
        error.stack = 'stack'

        automation.rejects(error)

        cy.on('fail', () => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error').message).to.contain(`\`cy.getCookies()\` had an unexpected error reading cookies from ${Cypress.browser.displayName}.`)
          expect(lastLog.get('error').message).to.contain('some err message')

          done()
        })

        cy.getCookies()
      })

      it('throws after timing out', function (done) {
        automation.resolves(Promise.delay(1000))

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('name')).to.eq('getCookies')
          expect(lastLog.get('message')).to.eq('')
          expect(err.message).to.eq('Timed out retrying after 50ms: `cy.getCookies()` timed out waiting `50ms` to complete.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/getcookies')

          done()
        })

        cy.getCookies({ timeout: 50 })
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'getCookies') {
            this.lastLog = log
          }
        })

        automation
        .withArgs('get:cookies', { domain: 'localhost' })
        .resolves([
          { name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false, hostOnly: false },
        ])
      })

      it('can turn off logging when protocol is disabled', function () {
        cy.state('isProtocolEnabled', false)
        cy.on('_log:added', (attrs, log) => {
          if (attrs.name === 'getCookies') {
            this.hiddenLog = log
          }
        })

        cy.getCookies({ log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', function () {
        cy.state('isProtocolEnabled', true)
        cy.on('_log:added', (attrs, log) => {
          if (attrs.name === 'getCookies') {
            this.hiddenLog = log
          }
        })

        cy.getCookies({ log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.ok
          expect(hiddenLog.get('name'), 'log name').to.eq('getCookies')
          expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
          expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(1)
        })
      })

      it('ends immediately', () => {
        cy.getCookies().then(function () {
          const { lastLog } = this

          expect(lastLog.get('ended')).to.be.true
          expect(lastLog.get('state')).to.eq('passed')
        })
      })

      it('snapshots immediately', () => {
        cy.getCookies().then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('#consoleProps', () => {
        cy.getCookies().then(function (cookies) {
          expect(cookies).to.deep.eq([{ name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false, hostOnly: false }])
          const c = this.lastLog.invoke('consoleProps')

          expect(c.props['Yielded']).to.deep.eq(cookies)
          expect(c.props['Num Cookies']).to.eq(1)
        })
      })
    })
  })
})
