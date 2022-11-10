const { assertLogLength } = require('../../support/utils')
const { stripIndent } = require('common-tags')
const { Promise } = Cypress

const isWebkit = Cypress.isBrowser('webkit')

describe('src/cy/commands/cookies - no stub', () => {
  context('#getCookies', () => {
    // this can be removed along with the experimental flag since once the flag
    // removed, clearing cookies for all domains will be done by default
    beforeEach(() => {
      if (!Cypress.config('experimentalSessionAndOrigin')) {
        cy.clearCookies({ domain: null })
      }
    })

    it('returns cookies from the domain matching the AUT by default', () => {
      cy.visit('http://www.barbaz.com:3500/fixtures/generic.html')
      cy.setCookie('foo', 'bar', { domain: 'www.foobar.com' })
      cy.setCookie('baz', 'qux', { domain: 'foobar.com' })
      cy.setCookie('foo', 'bar') // defaults to (super)domain: barbaz.com
      cy.setCookie('qux', 'quuz', { domain: 'www.barbaz.com' })

      cy.getCookies().then((cookies) => {
        expect(cookies).to.have.length(2)
        // both the barbaz.com and www.barbaz.com cookies are yielded
        expect(cookies[0].domain).to.match(/\.?barbaz\.com/)
        expect(cookies[1].domain).to.match(/\.?www\.barbaz\.com/)
      })

      if (isWebkit || !Cypress.config('experimentalSessionAndOrigin')) return

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/generic.html')

        cy.getCookies().then((cookies) => {
          expect(cookies[0].domain).to.match(/\.?www\.foobar\.com/)
          expect(cookies[1].domain).to.match(/\.?foobar\.com/)
        })
      })
    })

    it('returns cookies for the specified domain', () => {
      cy.visit('http://www.barbaz.com:3500/fixtures/generic.html')
      cy.setCookie('foo', 'bar', { domain: 'www.foobar.com' })
      cy.setCookie('foo', 'bar') // defaults to (super)domain: barbaz.com
      cy.setCookie('qux', 'quuz', { domain: 'www.barbaz.com' })

      cy.getCookies({ domain: 'www.foobar.com' }).then((cookies) => {
        expect(cookies[0].domain).to.match(/\.?www\.foobar\.com/)
      })

      if (isWebkit || !Cypress.config('experimentalSessionAndOrigin')) return

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/generic.html')

        cy.getCookies({ domain: 'barbaz.com' }).then((cookies) => {
          expect(cookies).to.have.length(2)
          // both the barbaz.com and www.barbaz.com cookies are yielded
          expect(cookies[0].domain).to.match(/\.?barbaz\.com/)
          expect(cookies[1].domain).to.match(/\.?www\.barbaz\.com/)
        })
      })
    })

    it('returns cookies for all domains when domain is null', () => {
      cy.visit('http://www.barbaz.com:3500/fixtures/generic.html')
      cy.setCookie('foo', 'bar', { domain: 'www.foobar.com' })
      cy.setCookie('foo', 'bar')

      cy.getCookies({ domain: null }).should('have.length', 2)

      if (isWebkit || !Cypress.config('experimentalSessionAndOrigin')) return

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/generic.html')

        cy.getCookies({ domain: null }).should('have.length', 2)
      })
    })
  })

  context('#getCookie', () => {
    it('returns the cookie from the domain matching the AUT by default', () => {
      cy.visit('http://www.barbaz.com:3500/fixtures/generic.html')
      cy.setCookie('foo', 'bar', { domain: 'www.foobar.com' })
      cy.setCookie('foo', 'bar')

      cy.getCookie('foo').its('domain').should('match', /\.?barbaz\.com/)

      if (isWebkit || !Cypress.config('experimentalSessionAndOrigin')) return

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/generic.html')

        cy.getCookie('foo').its('domain').should('match', /\.?www\.foobar\.com/)
      })
    })

    it('returns the cookie from the specified domain', () => {
      cy.visit('http://www.barbaz.com:3500/fixtures/generic.html')
      cy.setCookie('foo', 'bar', { domain: 'www.foobar.com' })
      cy.setCookie('foo', 'bar')

      cy.getCookie('foo', { domain: 'www.foobar.com' })
      .its('domain').should('match', /\.?www\.foobar\.com/)

      if (isWebkit || !Cypress.config('experimentalSessionAndOrigin')) return

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/generic.html')

        cy.getCookie('foo', { domain: 'barbaz.com' })
        .its('domain').should('match', /\.?barbaz\.com/)
      })
    })

    it('returns cookie for any domain when domain is null', () => {
      cy.visit('http://www.barbaz.com:3500/fixtures/generic.html')
      cy.setCookie('foo', 'bar', { domain: 'www.foobar.com' })

      cy.getCookie('foo', { domain: null })
      .its('domain').should('match', /\.?www\.foobar\.com/)

      if (isWebkit || !Cypress.config('experimentalSessionAndOrigin')) return

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/generic.html')

        cy.clearCookie('foo')
        cy.setCookie('foo', 'bar', { domain: 'barbaz.com' })

        cy.getCookie('foo', { domain: null })
        .its('domain').should('match', /\.?barbaz\.com/)
      })
    })
  })

  context('#setCookie', () => {
    it('sets the cookie on the domain matching the AUT by default', () => {
      cy.visit('http://www.barbaz.com:3500/fixtures/generic.html')
      cy.setCookie('foo', 'bar')

      cy.getCookie('foo').its('domain').should('match', /\.?barbaz\.com/)

      if (isWebkit || !Cypress.config('experimentalSessionAndOrigin')) return

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/generic.html')
        cy.setCookie('foo', 'bar')

        cy.getCookie('foo').its('domain').should('equal', '.foobar.com')
      })
    })

    it('set the cookie on the specified domain', () => {
      cy.visit('http://www.barbaz.com:3500/fixtures/generic.html')
      cy.setCookie('foo', 'bar', { domain: 'www.foobar.com' })

      cy.getCookie('foo', { domain: 'www.foobar.com' })
      .its('domain').should('match', /\.?www\.foobar\.com/)

      if (isWebkit || !Cypress.config('experimentalSessionAndOrigin')) return

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/generic.html')
        cy.setCookie('foo', 'bar', { domain: 'barbaz.com' })

        cy.getCookie('foo', { domain: 'barbaz.com' })
        .its('domain').should('match', /\.?barbaz\.com/)
      })
    })
  })

  context('#clearCookies', () => {
    it('clears all cookies', () => {
      cy.setCookie('foo', 'bar')
      cy.getCookies().should('have.length', 1)
      cy.clearCookies()
      cy.getCookies().should('have.length', 0)
    })

    it('clears the cookies on the domain matching the AUT by default', () => {
      cy.visit('http://www.barbaz.com:3500/fixtures/generic.html')
      cy.setCookie('foo', 'bar')
      cy.setCookie('baz', 'qux')
      cy.setCookie('foo', 'bar', { domain: 'www.foobar.com' })

      cy.clearCookies()

      cy.getCookie('foo').should('be.null')
      cy.getCookie('baz').should('be.null')
      cy.getCookie('foo', { domain: 'www.foobar.com' }).should('exist')

      if (isWebkit || !Cypress.config('experimentalSessionAndOrigin')) return

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/generic.html')
        cy.setCookie('baz', 'qux')
        cy.setCookie('foo', 'bar', { domain: 'barbaz.com' })

        cy.clearCookies()

        cy.getCookie('foo').should('be.null')
        cy.getCookie('baz').should('be.null')
        cy.getCookie('foo', { domain: 'barbaz.com' }).should('exist')
      })
    })

    it('clears the cookies on the specified domain', () => {
      cy.visit('http://www.barbaz.com:3500/fixtures/generic.html')
      cy.setCookie('foo', 'bar')
      cy.setCookie('foo', 'bar', { domain: 'www.foobar.com' })
      cy.setCookie('baz', 'qux', { domain: 'www.foobar.com' })

      cy.clearCookies({ domain: 'www.foobar.com' })

      cy.getCookie('foo', { domain: 'www.foobar.com' }).should('be.null')
      cy.getCookie('baz', { domain: 'www.foobar.com' }).should('be.null')
      cy.getCookie('foo').should('exist')

      if (isWebkit || !Cypress.config('experimentalSessionAndOrigin')) return

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/generic.html')
        cy.setCookie('foo', 'bar')
        cy.setCookie('baz', 'qux', { domain: 'barbaz.com' })

        cy.clearCookies({ domain: 'barbaz.com' })

        cy.getCookie('foo', { domain: 'barbaz.com' }).should('be.null')
        cy.getCookie('baz', { domain: 'barbaz.com' }).should('be.null')
        cy.getCookie('foo').should('exist')
      })
    })

    it('clears cookies for all domains when domain is null', () => {
      cy.visit('http://www.barbaz.com:3500/fixtures/generic.html')
      cy.setCookie('foo', 'bar')
      cy.setCookie('foo', 'bar', { domain: 'www.foobar.com' })

      cy.clearCookies({ domain: null })
      cy.getCookies().should('have.length', 0)

      if (isWebkit || !Cypress.config('experimentalSessionAndOrigin')) return

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/generic.html')

        cy.setCookie('foo', 'bar')
        cy.setCookie('foo', 'bar', { domain: 'barbaz.com' })

        cy.clearCookies({ domain: null })
        cy.getCookies().should('have.length', 0)
      })
    })
  })

  context('#clearCookie', () => {
    it('clears a single cookie', () => {
      cy.setCookie('foo', 'bar')
      cy.setCookie('key', 'val')
      cy.getCookies().should('have.length', 2)
      cy.clearCookie('foo')
      cy.getCookies().should('have.length', 1).then((cookies) => {
        expect(cookies[0].name).to.eq('key')
      })
    })

    it('clears the cookie on the domain matching the AUT by default', () => {
      cy.visit('http://www.barbaz.com:3500/fixtures/generic.html')
      cy.setCookie('foo', 'bar')
      cy.setCookie('foo', 'bar', { domain: 'www.foobar.com' })

      cy.clearCookie('foo')

      cy.getCookie('foo').should('be.null')
      cy.getCookie('foo', { domain: 'www.foobar.com' }).should('exist')

      if (isWebkit || !Cypress.config('experimentalSessionAndOrigin')) return

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/generic.html')
        cy.setCookie('foo', 'bar', { domain: 'barbaz.com' })

        cy.clearCookie('foo')

        cy.getCookie('foo').should('be.null')
        cy.getCookie('foo', { domain: 'barbaz.com' }).should('exist')
      })
    })

    it('clears the cookie on the specified domain', () => {
      cy.visit('http://www.barbaz.com:3500/fixtures/generic.html')
      cy.setCookie('foo', 'bar')
      cy.setCookie('foo', 'bar', { domain: 'www.foobar.com' })

      cy.clearCookie('foo', { domain: 'www.foobar.com' })

      cy.getCookie('foo', { domain: 'www.foobar.com' }).should('be.null')
      cy.getCookie('foo').should('exist')

      if (isWebkit || !Cypress.config('experimentalSessionAndOrigin')) return

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/generic.html')
        cy.setCookie('foo', 'bar')

        cy.clearCookie('foo', { domain: 'barbaz.com' })

        cy.getCookie('foo', { domain: 'barbaz.com' }).should('be.null')
        cy.getCookie('foo').should('exist')
      })
    })
  })

  it('clears cookie for any domain when domain is null', () => {
    cy.visit('http://www.barbaz.com:3500/fixtures/generic.html')
    cy.setCookie('foo', 'bar', { domain: 'www.foobar.com' })

    cy.clearCookie('foo', { domain: null })
    cy.getCookies().should('have.length', 0)

    if (isWebkit || !Cypress.config('experimentalSessionAndOrigin')) return

    cy.origin('http://www.foobar.com:3500', () => {
      cy.visit('http://www.foobar.com:3500/fixtures/generic.html')

      cy.setCookie('foo', 'bar', { domain: 'barbaz.com' })

      cy.clearCookie('foo', { domain: null })
      cy.getCookies().should('have.length', 0)
    })
  })
})

describe('src/cy/commands/cookies', () => {
  beforeEach(() => {
    // call through normally on everything
    cy.stub(Cypress, 'automation').rejects(new Error('Cypress.automation was not stubbed'))

    cy.visit('http://localhost:3500/fixtures/generic.html')
  })

  context('test:before:run:async', () => {
    it('clears cookies before each test run', () => {
      Cypress.automation
      .withArgs('get:cookies', { domain: 'localhost' })
      .resolves([{ name: 'foo' }])
      .withArgs('clear:cookies', [{ domain: 'localhost', name: 'foo' }])
      .resolves([])

      Cypress.emitThen('test:before:run:async', {})
      .then(() => {
        expect(Cypress.automation).to.be.calledWith(
          'get:cookies',
          { domain: 'localhost' },
        )

        expect(Cypress.automation).to.be.calledWith(
          'clear:cookies',
          [{ domain: 'localhost', name: 'foo' }],
        )
      })
    })

    it('does not call clear:cookies when get:cookies returns empty array', () => {
      Cypress.automation.withArgs('get:cookies').resolves([])

      Cypress.emitThen('test:before:run:async', {})
      .then(() => {
        expect(Cypress.automation).not.to.be.calledWith(
          'clear:cookies',
        )
      })
    })

    it('does not attempt to time out', () => {
      Cypress.automation
      .withArgs('get:cookies', { domain: 'localhost' })
      .resolves([{ name: 'foo' }])
      .withArgs('clear:cookies', [{ domain: 'localhost', name: 'foo' }])
      .resolves([])

      const timeout = cy.spy(Promise.prototype, 'timeout')

      Cypress.emitThen('test:before:run:async', {})
      .then(() => {
        expect(timeout).not.to.be.called
      })
    })
  })

  context('#getCookies', () => {
    it('returns array of cookies', () => {
      Cypress.automation.withArgs('get:cookies').resolves([])

      cy.getCookies().should('deep.eq', []).then(() => {
        expect(Cypress.automation).to.be.calledWith(
          'get:cookies',
          { domain: 'localhost' },
        )
      })
    })

    describe('timeout', () => {
      it('sets timeout to Cypress.config(responseTimeout)', {
        responseTimeout: 2500,
      }, () => {
        Cypress.automation.resolves([])

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.getCookies().then(() => {
          expect(timeout).to.be.calledWith(2500)
        })
      })

      it('can override timeout', () => {
        Cypress.automation.resolves([])

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.getCookies({ timeout: 1000 }).then(() => {
          expect(timeout).to.be.calledWith(1000)
        })
      })

      it('clears the current timeout and restores after success', () => {
        Cypress.automation.resolves([])

        cy.timeout(100)

        cy.spy(cy, 'clearTimeout')

        cy.getCookies().then(() => {
          expect(cy.clearTimeout).to.be.calledWith('get:cookies')

          // restores the timeout afterwards
          expect(cy.timeout()).to.eq(100)
        })
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

        cy.getCookies({ domain: true })
      })

      it('logs once on error', function (done) {
        const error = new Error('some err message')

        error.name = 'foo'
        error.stack = 'stack'

        Cypress.automation.rejects(error)

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
        Cypress.automation.resolves(Promise.delay(1000))

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('name')).to.eq('getCookies')
          expect(lastLog.get('message')).to.eq('')
          expect(err.message).to.eq('`cy.getCookies()` timed out waiting `50ms` to complete.')
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

        Cypress.automation
        .withArgs('get:cookies', { domain: 'localhost' })
        .resolves([
          { name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false, hostOnly: false },
        ])
      })

      it('can turn off logging', () => {
        cy.getCookies({ log: false }).then(function () {
          expect(this.lastLog).to.be.undefined
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
          expect(cookies).to.deep.eq([{ name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false }])
          const c = this.lastLog.invoke('consoleProps')

          expect(c['Yielded']).to.deep.eq(cookies)
          expect(c['Num Cookies']).to.eq(1)
        })
      })
    })
  })

  context('#getCookie', () => {
    it('returns single cookie by name', () => {
      Cypress.automation.withArgs('get:cookie').resolves({
        name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false, hostOnly: true,
      })

      cy.getCookie('foo').should('deep.eq', {
        name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false,
      })
      .then(() => {
        expect(Cypress.automation).to.be.calledWith(
          'get:cookie',
          { domain: 'localhost', name: 'foo' },
        )
      })
    })

    it('returns null when no cookie was found', () => {
      Cypress.automation.withArgs('get:cookie').resolves(null)

      cy.getCookie('foo').should('be.null')
    })

    describe('timeout', () => {
      it('sets timeout to Cypress.config(responseTimeout)', {
        responseTimeout: 2500,
      }, () => {
        Cypress.automation.resolves(null)

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.getCookie('foo').then(() => {
          expect(timeout).to.be.calledWith(2500)
        })
      })

      it('can override timeout', () => {
        Cypress.automation.resolves(null)

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.getCookie('foo', { timeout: 1000 }).then(() => {
          expect(timeout).to.be.calledWith(1000)
        })
      })

      it('clears the current timeout and restores after success', () => {
        Cypress.automation.resolves(null)

        cy.timeout(100)

        cy.spy(cy, 'clearTimeout')

        cy.getCookie('foo').then(() => {
          expect(cy.clearTimeout).to.be.calledWith('get:cookie')

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

        Cypress.automation.rejects(error)

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
        Cypress.automation.resolves(Promise.delay(1000))

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('name')).to.eq('getCookie')
          expect(lastLog.get('message')).to.eq('foo')
          expect(err.message).to.eq('`cy.getCookie()` timed out waiting `50ms` to complete.')
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

        Cypress.automation
        .withArgs('get:cookie', { domain: 'localhost', name: 'foo' })
        .resolves({
          name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false,
        })
        .withArgs('get:cookie', { domain: 'localhost', name: 'bar' })
        .resolves(null)
      })

      it('can turn off logging', () => {
        cy.getCookie('foo', { log: false }).then(function () {
          expect(this.log).to.be.undefined
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

          expect(c['Yielded']).to.deep.eq(cookie)
        })
      })

      it('#consoleProps when no cookie found', () => {
        cy.getCookie('bar').then(function (cookie) {
          expect(cookie).to.be.null
          const c = this.lastLog.invoke('consoleProps')

          expect(c['Yielded']).to.eq('null')
          expect(c['Note']).to.eq('No cookie with the name: \'bar\' was found.')
        })
      })
    })
  })

  context('#setCookie', () => {
    beforeEach(() => {
      cy.stub(Cypress.utils, 'addTwentyYears').returns(12345)
    })

    it('returns set cookie', () => {
      Cypress.automation.withArgs('set:cookie').resolves({
        name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: false, httpOnly: false, expiry: 12345,
      })

      cy.setCookie('foo', 'bar').should('deep.eq', {
        name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: false, httpOnly: false, expiry: 12345,
      })
      .then(() => {
        expect(Cypress.automation).to.be.calledWith(
          'set:cookie',
          { domain: 'localhost', name: 'foo', value: 'bar', path: '/', secure: false, httpOnly: false, expiry: 12345, sameSite: undefined },
        )
      })
    })

    it('can change options', () => {
      Cypress.automation.withArgs('set:cookie').resolves({
        name: 'foo', value: 'bar', domain: 'brian.dev.local', path: '/foo', secure: true, httpOnly: true, expiry: 987,
      })

      cy.setCookie('foo', 'bar', { domain: 'brian.dev.local', path: '/foo', secure: true, httpOnly: true, expiry: 987 }).should('deep.eq', {
        name: 'foo', value: 'bar', domain: 'brian.dev.local', path: '/foo', secure: true, httpOnly: true, expiry: 987,
      })
      .then(() => {
        expect(Cypress.automation).to.be.calledWith(
          'set:cookie',
          { domain: 'brian.dev.local', name: 'foo', value: 'bar', path: '/foo', secure: true, httpOnly: true, expiry: 987, sameSite: undefined },
        )
      })
    })

    it('does not mutate options', () => {
      Cypress.automation.resolves()
      const options = {}

      cy.setCookie('foo', 'bar', {}).then(() => {
        expect(options).deep.eq({})
      })
    })

    it('can set cookies with sameSite', () => {
      Cypress.automation.restore()
      Cypress.utils.addTwentyYears.restore()

      cy.setCookie('one', 'bar', { sameSite: 'none', secure: true })
      cy.getCookie('one').should('include', { sameSite: 'no_restriction' })

      cy.setCookie('two', 'bar', { sameSite: 'no_restriction', secure: true })
      cy.getCookie('two').should('include', { sameSite: 'no_restriction' })

      cy.setCookie('three', 'bar', { sameSite: 'Lax' })
      cy.getCookie('three').should('include', { sameSite: 'lax' })

      cy.setCookie('four', 'bar', { sameSite: 'Strict' })
      cy.getCookie('four').should('include', { sameSite: 'strict' })

      cy.setCookie('five', 'bar')

      // @see https://bugzilla.mozilla.org/show_bug.cgi?id=1624668
      // TODO(webkit): pw webkit has the same issue as firefox (no "unspecified" state), need a patched binary
      if (Cypress.isBrowser('firefox') || Cypress.isBrowser('webkit')) {
        cy.getCookie('five').should('include', { sameSite: 'no_restriction' })
      } else {
        cy.getCookie('five').should('not.have.property', 'sameSite')
      }
    })

    describe('timeout', () => {
      it('sets timeout to Cypress.config(responseTimeout)', {
        responseTimeout: 2500,
      }, () => {
        Cypress.automation.resolves(null)

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.setCookie('foo', 'bar').then(() => {
          expect(timeout).to.be.calledWith(2500)
        })
      })

      it('can override timeout', () => {
        Cypress.automation.resolves(null)

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.setCookie('foo', 'bar', { timeout: 1000 }).then(() => {
          expect(timeout).to.be.calledWith(1000)
        })
      })

      it('clears the current timeout and restores after success', () => {
        Cypress.automation.resolves(null)

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

        Cypress.automation.rejects(error)

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
        Cypress.automation.resolves(Promise.delay(1000))

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

        cy.setCookie('foo', 123)
      })

      it('when an invalid samesite prop is supplied', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error').message).to.eq(stripIndent`
            If a \`sameSite\` value is supplied to \`cy.setCookie()\`, it must be a string from the following list:
              > no_restriction, lax, strict
            You passed:
              > bad`)

          expect(lastLog.get('error').docsUrl).to.eq('https://on.cypress.io/setcookie')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

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

        cy.setCookie('foo', 'bar', { domain: true })
      })

      context('when setting an invalid cookie', () => {
        it('throws an error if the backend responds with an error', (done) => {
          const err = new Error('backend could not set cookie')

          Cypress.automation.withArgs('set:cookie').rejects(err)

          cy.on('fail', (err) => {
            expect(Cypress.automation.withArgs('set:cookie')).to.be.calledOnce
            expect(err.message).to.contain('unexpected error setting the requested cookie')
            expect(err.message).to.contain(err.message)

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

        Cypress.automation
        .withArgs('set:cookie', {
          domain: 'localhost', name: 'foo', value: 'bar', path: '/', secure: false, httpOnly: false, expiry: 12345, sameSite: undefined,
        })
        .resolves({
          name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false, hostOnly: true,
        })
      })

      it('can turn off logging', () => {
        cy.setCookie('foo', 'bar', { log: false }).then(function () {
          expect(this.log).to.be.undefined
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
          expect(cookie).to.deep.eq({ name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false })
          const c = this.lastLog.invoke('consoleProps')

          expect(c['Yielded']).to.deep.eq(cookie)
        })
      })
    })
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

      it('can turn off logging', () => {
        cy.clearCookie('foo', { log: false }).then(function () {
          expect(this.log).to.be.undefined
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

          expect(c['Yielded']).to.eq('null')
          expect(c['Cleared Cookie']).to.deep.eq({ name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false })
        })
      })

      it('#consoleProps when no matching cookie was found', () => {
        cy.clearCookie('bar').then(function (cookie) {
          expect(cookie).to.be.null
          const c = this.lastLog.invoke('consoleProps')

          expect(c['Yielded']).to.eq('null')
          expect(c['Cleared Cookie']).to.be.undefined
          expect(c['Note']).to.eq('No cookie with the name: \'bar\' was found or removed.')
        })
      })
    })
  })

  context('#clearCookies', () => {
    it('returns null', () => {
      Cypress.automation.withArgs('get:cookies').resolves([])

      cy.clearCookies().should('be.null')
    })

    it('does not call \'clear:cookies\' when no cookies were returned', () => {
      Cypress.automation.withArgs('get:cookies').resolves([])

      cy.clearCookies().then(() => {
        expect(Cypress.automation).not.to.be.calledWith(
          'clear:cookies',
        )
      })
    })

    it('calls \'clear:cookies\' only with clearableCookies', () => {
      Cypress.automation
      .withArgs('get:cookies')
      .resolves([
        { name: 'foo' },
        { name: 'bar' },
      ])
      .withArgs('clear:cookies', [
        { name: 'foo', domain: 'localhost' },
      ])
      .resolves({
        name: 'foo',
      })

      cy.stub(Cypress.Cookies, 'getClearableCookies')
      .withArgs([{ name: 'foo' }, { name: 'bar' }])
      .returns([{ name: 'foo' }])

      cy.clearCookies().should('be.null').then(() => {
        expect(Cypress.automation).to.be.calledWith(
          'clear:cookies',
          [{ name: 'foo', domain: 'localhost' }],
        )
      })
    })

    it('calls \'clear:cookies\' with all cookies', () => {
      Cypress.Cookies.preserveOnce('bar', 'baz')

      Cypress.automation
      .withArgs('get:cookies')
      .resolves([
        { name: 'foo' },
        { name: 'bar' },
        { name: 'baz' },
      ])
      .withArgs('clear:cookies', [
        { name: 'foo', domain: 'localhost' },
      ])
      .resolves({
        name: 'foo',
      })
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
          'clear:cookies',
          [{ name: 'foo', domain: 'localhost' }],
        )
      }).clearCookies().should('be.null').then(() => {
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
        Cypress.automation
        .withArgs('get:cookies')
        .resolves([{}])
        .withArgs('clear:cookies')
        .resolves({})
      })

      it('sets timeout to Cypress.config(responseTimeout)', {
        responseTimeout: 2500,
      }, () => {
        Cypress.automation.resolves([])

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.clearCookies().then(() => {
          expect(timeout).to.be.calledWith(2500)
        })
      })

      it('can override timeout', () => {
        Cypress.automation.resolves([])

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

        cy.clearCookies({ domain: true })
      })

      it('logs once on \'get:cookies\' error', function (done) {
        const error = new Error('some err message')

        error.name = 'foo'
        error.stack = 'some err message\n  at fn (foo.js:1:1)'

        Cypress.automation.rejects(error)

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
        Cypress.automation.resolves([{ name: 'foo' }])
        Cypress.automation.withArgs('clear:cookies').resolves(Promise.delay(1000))

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
        Cypress.automation.withArgs('get:cookies').resolves([
          { name: 'foo' }, { name: 'bar' },
        ])

        const error = new Error('some err message')

        error.name = 'foo'
        error.stack = 'stack'

        Cypress.automation.withArgs('clear:cookies').rejects(error)

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

        Cypress.automation
        .withArgs('get:cookies', { domain: 'localhost' })
        .resolves([{ name: 'foo' }])
        .withArgs('clear:cookies', [{ name: 'foo', domain: 'localhost' }])
        .resolves([
          { name: 'foo' },
        ])
      })

      it('can turn off logging', () => {
        cy.clearCookies({ log: false }).then(function () {
          expect(this.log).to.be.undefined
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

          expect(c['Yielded']).to.eq('null')
          expect(c['Cleared Cookies']).to.deep.eq([{ name: 'foo' }])
          expect(c['Num Cookies']).to.eq(1)
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

        Cypress.automation
        .withArgs('get:cookies', { domain: 'localhost' })
        .resolves([])
      })

      it('#consoleProps', () => {
        cy.clearCookies().then(function (cookies) {
          expect(cookies).to.be.null
          const c = this.lastLog.invoke('consoleProps')

          expect(c['Yielded']).to.eq('null')
          expect(c['Cleared Cookies']).to.be.undefined
          expect(c['Note']).to.eq('No cookies were found or removed.')
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

        Cypress.automation
        .withArgs('get:cookies', { domain: 'localhost' })
        .resolves([{ name: 'foo' }])
        .withArgs('clear:cookies', [{ name: 'foo', domain: 'localhost' }])
        .resolves([])
      })

      it('#consoleProps', () => {
        cy.clearCookies().then(function (cookies) {
          expect(cookies).to.be.null
          const c = this.lastLog.invoke('consoleProps')

          expect(c['Yielded']).to.eq('null')
          expect(c['Cleared Cookies']).to.be.undefined
          expect(c['Note']).to.eq('No cookies were found or removed.')
        })
      })
    })
  })

  context('Cypress.Cookies.defaults', () => {
    it('throws error on use of renamed whitelist option', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('`Cypress.Cookies.defaults` `whitelist` option has been renamed to `preserve`. Please rename `whitelist` to `preserve`.')

        done()
      })

      Cypress.Cookies.defaults({
        whitelist: 'session_id',
      })
    })

    it('logs deprecation warning', () => {
      cy.stub(Cypress.utils, 'warning')

      Cypress.Cookies.defaults({})
      expect(Cypress.utils.warning).to.be.calledWith('`Cypress.Cookies.defaults()` has been deprecated and will be removed in a future release. Consider using `cy.session()` instead.\n\nhttps://on.cypress.io/session')
    })
  })

  context('Cypress.Cookies.preserveOnce', () => {
    it('logs deprecation warning', () => {
      cy.stub(Cypress.utils, 'warning')

      Cypress.Cookies.preserveOnce({})
      expect(Cypress.utils.warning).to.be.calledWith('`Cypress.Cookies.preserveOnce()` has been deprecated and will be removed in a future release. Consider using `cy.session()` instead.\n\nhttps://on.cypress.io/session')
    })
  })
})
