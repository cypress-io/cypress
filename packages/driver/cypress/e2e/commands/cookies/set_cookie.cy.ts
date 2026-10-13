import { assertLogLength } from '../../../support/utils'
import { stripIndent } from 'common-tags'
const { Promise } = Cypress

describe('src/cy/commands/cookies', () => {
  let automation: sinon.SinonStub

  beforeEach(() => {
    // fail loudly on any automation call a test hasn't stubbed
    automation = cy.stub(Cypress, 'automation').rejects(new Error('Cypress.automation was not stubbed'))

    cy.visit('http://localhost:3500/fixtures/generic.html')
  })

  context('#setCookie', () => {
    let addTwentyYears: sinon.SinonStub

    beforeEach(() => {
      addTwentyYears = cy.stub(Cypress.utils, 'addTwentyYears').returns(12345)
    })

    it('returns set cookie', () => {
      automation.withArgs('set:cookie').resolves({
        name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: false, httpOnly: false, expiry: 12345,
      })

      cy.setCookie('foo', 'bar').should('deep.eq', {
        name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: false, httpOnly: false, expiry: 12345,
      })
      .then(() => {
        expect(automation).to.be.calledWith(
          'set:cookie',
          { domain: 'localhost', name: 'foo', value: 'bar', path: '/', secure: false, httpOnly: false, hostOnly: false, expiry: 12345, sameSite: undefined },
        )
      })
    })

    it('can change options', () => {
      automation.withArgs('set:cookie').resolves({
        name: 'foo', value: 'bar', domain: 'brian.dev.local', path: '/foo', secure: true, httpOnly: true, expiry: 987,
      })

      cy.setCookie('foo', 'bar', { domain: 'brian.dev.local', path: '/foo', secure: true, httpOnly: true, expiry: 987 }).should('deep.eq', {
        name: 'foo', value: 'bar', domain: 'brian.dev.local', path: '/foo', secure: true, httpOnly: true, expiry: 987,
      })
      .then(() => {
        expect(automation).to.be.calledWith(
          'set:cookie',
          { domain: 'brian.dev.local', name: 'foo', value: 'bar', path: '/foo', secure: true, httpOnly: true, hostOnly: false, expiry: 987, sameSite: undefined },
        )
      })
    })

    it('does not mutate options', () => {
      automation.resolves()
      const options = {}

      cy.setCookie('foo', 'bar', options).then(() => {
        expect(options).deep.eq({})
      })
    })

    it('can set cookies with sameSite', () => {
      automation.restore()
      addTwentyYears.restore()

      // @ts-expect-error - verifies a lowercase `none` is normalized to `no_restriction`
      cy.setCookie('one', 'bar', { sameSite: 'none', secure: true })
      cy.getCookie('one').should('include', { sameSite: 'no_restriction' })

      cy.setCookie('two', 'bar', { sameSite: 'no_restriction', secure: true })
      cy.getCookie('two').should('include', { sameSite: 'no_restriction' })

      // @ts-expect-error - verifies `sameSite` is normalized case-insensitively
      cy.setCookie('three', 'bar', { sameSite: 'Lax' })
      cy.getCookie('three').should('include', { sameSite: 'lax' })

      // @ts-expect-error - verifies `sameSite` is normalized case-insensitively
      cy.setCookie('four', 'bar', { sameSite: 'Strict' })
      cy.getCookie('four').should('include', { sameSite: 'strict' })

      cy.setCookie('five', 'bar')

      // @see https://bugzilla.mozilla.org/show_bug.cgi?id=1550032
      // Firefox bidi returns "unspecified" for sameSite;
      // webkit returns "no_restriction" for sameSite;
      // other browsers do not return sameSite at all
      const sameSite = (
        Cypress.isBrowser('webkit')
        // There is an odd inconsistency when setting an undefined cookie context in WebKit in WebKit 26.
        // On linux based machines, the sameSite will be set to `lax`, but on MacOS the sameSite is set to `None` (no_restriction).
        // There is no difference in the webkit-automation logic within cypress so the inconsistency must lie in the OS
        // implement of WebKit
      ) ? Cypress.platform === 'darwin' ? 'no_restriction' : 'lax'
        : Cypress.isBrowser('firefox') ? 'unspecified' : null

      if (sameSite) {
        cy.getCookie('five').should('include', { sameSite })
      } else {
        cy.getCookie('five').should('not.have.property', 'sameSite')
      }
    })

    describe('timeout', () => {
      it('sets timeout to Cypress.config(responseTimeout)', {
        responseTimeout: 2500,
      }, () => {
        automation.resolves(null)

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.setCookie('foo', 'bar').then(() => {
          expect(timeout).to.be.calledWith(2500)
        })
      })

      it('can override timeout', () => {
        automation.resolves(null)

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.setCookie('foo', 'bar', { timeout: 1000 }).then(() => {
          expect(timeout).to.be.calledWith(1000)
        })
      })

      it('clears the current timeout and restores after success', () => {
        automation.resolves(null)

        cy.timeout(100)

        cy.spy(cy, 'clearTimeout')

        cy.setCookie('foo', 'bar').then(() => {
          expect(cy.clearTimeout).to.be.calledWith('set:cookie')

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
          if (attrs.name === 'setCookie') {
            this.lastLog = log
            this.logs.push(log)
          }
        })

        return null
      })

      it('logs once on error', function (done) {
        const error = new Error('some err message')

        error.name = 'foo'

        automation.rejects(error)

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error').message).to.include('some err message')
          expect(lastLog.get('error').name).to.eq('CypressError')

          done()
        })

        cy.setCookie('foo', 'bar')
      })

      it('throws after timing out', function (done) {
        automation.resolves(Promise.delay(1000))

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('name')).to.eq('setCookie')
          expect(lastLog.get('message')).to.eq('foo, bar')
          expect(err.message).to.include('`cy.setCookie()` timed out waiting `50ms` to complete.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/setcookie')

          done()
        })

        cy.setCookie('foo', 'bar', { timeout: 50 })
      })

      it('requires a string name', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error').message).to.eq('`cy.setCookie()` must be passed two string arguments for `name` and `value`.')
          expect(lastLog.get('error').docsUrl).to.eq('https://on.cypress.io/setcookie')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        // @ts-expect-error - verifies the runtime check for a non-string name
        cy.setCookie(123)
      })

      it('requires a string value', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error').message).to.eq('`cy.setCookie()` must be passed two string arguments for `name` and `value`.')
          expect(lastLog.get('error').docsUrl).to.eq('https://on.cypress.io/setcookie')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        // @ts-expect-error - verifies the runtime check for a non-string value
        cy.setCookie('foo', 123)
      })

      it('when an invalid samesite prop is supplied', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error').message).to.eq(stripIndent`
            If a \`sameSite\` value is supplied to \`cy.setCookie()\`, it must be a string from the following list:
              > no_restriction, lax, strict, unspecified
            You passed:
              > bad`)

          expect(lastLog.get('error').docsUrl).to.eq('https://on.cypress.io/setcookie')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        // @ts-expect-error - verifies the runtime check for an unknown `sameSite`
        cy.setCookie('foo', 'bar', { sameSite: 'bad' })
      })

      it('when samesite=none is supplied and secure is not set', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error').message).to.eq(stripIndent`
            Only cookies with the \`secure\` flag set to \`true\` can use \`sameSite: 'None'\`.

            Pass \`secure: true\` to \`cy.setCookie()\` to set a cookie with \`sameSite: 'None'\`.`)

          expect(lastLog.get('error').docsUrl).to.eq('https://on.cypress.io/setcookie')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        // @ts-expect-error - verifies the `secure` check for a capitalized `None`
        cy.setCookie('foo', 'bar', { sameSite: 'None' })
      })

      it('when an invalid domain prop is supplied', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(lastLog.get('error').message).to.eq('`cy.setCookie()` must be passed a valid domain name. You passed: `true`')
          expect(lastLog.get('error').docsUrl).to.eq('https://on.cypress.io/setcookie')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        // @ts-expect-error - verifies the runtime check for a non-string domain
        cy.setCookie('foo', 'bar', { domain: true })
      })

      context('when setting an invalid cookie', () => {
        it('throws an error if the backend responds with an error', (done) => {
          const err = new Error('backend could not set cookie')

          automation.withArgs('set:cookie').rejects(err)

          cy.on('fail', (failErr) => {
            expect(automation.withArgs('set:cookie')).to.be.calledOnce
            expect(failErr.message).to.contain('unexpected error setting the requested cookie')
            expect(failErr.message).to.contain(err.message)

            done()
          })

          // browser backend should yell since this is invalid
          cy.setCookie('foo', ' bar')
        })
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'setCookie') {
            this.lastLog = log
          }
        })

        automation
        .withArgs('set:cookie', {
          domain: 'localhost', name: 'foo', value: 'bar', path: '/', secure: false, httpOnly: false, hostOnly: false, expiry: 12345, sameSite: undefined,
        })
        .resolves({
          name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false, hostOnly: true,
        })
      })

      it('can turn off logging when protocol is disabled', function () {
        cy.state('isProtocolEnabled', false)
        cy.on('_log:added', (attrs, log) => {
          if (attrs.name === 'setCookie') {
            this.hiddenLog = log
          }
        })

        cy.setCookie('foo', 'bar', { log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', function () {
        cy.state('isProtocolEnabled', true)
        cy.on('_log:added', (attrs, log) => {
          if (attrs.name === 'setCookie') {
            this.hiddenLog = log
          }
        })

        cy.setCookie('foo', 'bar', { log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.ok
          expect(hiddenLog.get('name'), 'log name').to.eq('setCookie')
          expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
          expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(1)
        })
      })

      it('ends immediately', () => {
        cy.setCookie('foo', 'bar').then(function () {
          const { lastLog } = this

          expect(lastLog.get('ended')).to.be.true
          expect(lastLog.get('state')).to.eq('passed')
        })
      })

      it('snapshots immediately', () => {
        cy.setCookie('foo', 'bar').then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('#consoleProps', () => {
        cy.setCookie('foo', 'bar').then(function (cookie) {
          expect(cookie).to.deep.eq({ name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false, hostOnly: true })
          const c = this.lastLog.invoke('consoleProps')

          expect(c.props['Yielded']).to.deep.eq(cookie)
        })
      })
    })
  })
})
