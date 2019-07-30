/* eslint-disable
    brace-style,
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const { _ } = Cypress
const { Promise } = Cypress

describe('src/cy/commands/cookies', () => {
  beforeEach(() =>
  //# call through normally on everything

  {
    return cy.stub(Cypress, 'automation').callThrough()
  })

  context('test:before:run:async', () => {
    it('clears cookies before each test run', () => {
      Cypress.automation
      .withArgs('get:cookies', { domain: 'localhost' })
      .resolves([{ name: 'foo' }])
      .withArgs('clear:cookies', [{ domain: 'localhost', name: 'foo' }])
      .resolves([])

      return Cypress.emitThen('test:before:run:async', {})
      .then(() => {
        expect(Cypress.automation).to.be.calledWith(
          'get:cookies',
          { domain: 'localhost' }
        )

        expect(Cypress.automation).to.be.calledWith(
          'clear:cookies',
          [{ domain: 'localhost', name: 'foo' }]
        )
      })
    })

    it('does not call clear:cookies when get:cookies returns empty array', () => {
      Cypress.automation.withArgs('get:cookies').resolves([])

      return Cypress.emitThen('test:before:run:async', {})
      .then(() => {
        expect(Cypress.automation).not.to.be.calledWith(
          'clear:cookies'
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

      return Cypress.emitThen('test:before:run:async', {})
      .then(() => {
        expect(timeout).not.to.be.called
      })
    })
  })

  context('#getCookies', () => {
    it('returns array of cookies', () => {
      Cypress.automation.withArgs('get:cookies').resolves([])

      return cy.getCookies().should('deep.eq', []).then(() => {
        expect(Cypress.automation).to.be.calledWith(
          'get:cookies',
          { domain: 'localhost' }
        )
      })
    })

    describe('timeout', () => {
      it('sets timeout to Cypress.config(responseTimeout)', () => {
        Cypress.config('responseTimeout', 2500)

        Cypress.automation.resolves([])

        const timeout = cy.spy(Promise.prototype, 'timeout')

        return cy.getCookies().then(() => {
          expect(timeout).to.be.calledWith(2500)
        })
      })

      it('can override timeout', () => {
        Cypress.automation.resolves([])

        const timeout = cy.spy(Promise.prototype, 'timeout')

        return cy.getCookies({ timeout: 1000 }).then(() => {
          expect(timeout).to.be.calledWith(1000)
        })
      })

      it('clears the current timeout and restores after success', () => {
        Cypress.automation.resolves([])

        cy.timeout(100)

        cy.spy(cy, 'clearTimeout')

        return cy.getCookies().then(() => {
          expect(cy.clearTimeout).to.be.calledWith('get:cookies')

          //# restores the timeout afterwards
          expect(cy.timeout()).to.eq(100)
        })
      })
    })

    describe('errors', () => {
      beforeEach(function () {
        Cypress.config('defaultCommandTimeout', 50)

        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'getCookies') {
            this.lastLog = log

            return this.logs.push(log)
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

          expect(this.logs.length).to.eq(1)

          expect(lastLog.get('error').message).to.eq('some err message')
          expect(lastLog.get('error').name).to.eq('foo')
          expect(lastLog.get('error').stack).to.eq(error.stack)

          return done()
        })

        return cy.getCookies()
      })

      it('throws after timing out', function (done) {
        Cypress.automation.resolves(Promise.delay(1000))

        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(this.logs.length).to.eq(1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('name')).to.eq('getCookies')
          expect(lastLog.get('message')).to.eq('')
          expect(err.message).to.eq('cy.getCookies() timed out waiting \'50ms\' to complete.')

          return done()
        })

        return cy.getCookies({ timeout: 50 })
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'getCookies') {
            this.lastLog = log
          }
        })

        return Cypress.automation
        .withArgs('get:cookies', { domain: 'localhost' })
        .resolves([
          { name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false },
        ])
      })

      it('can turn off logging', () => {
        return cy.getCookies({ log: false }).then(function () {
          expect(this.lastLog).to.be.undefined
        })
      })

      it('ends immediately', () => {
        return cy.getCookies().then(function () {
          const { lastLog } = this

          expect(lastLog.get('ended')).to.be.true

          expect(lastLog.get('state')).to.eq('passed')
        })
      })

      it('snapshots immediately', () => {
        return cy.getCookies().then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)

          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('displays name \'get cookies\'', () => {
        return cy.getCookies().then(function () {
          const { lastLog } = this

          expect(lastLog.get('displayName')).to.eq('get cookies')
        })
      })

      it('#consoleProps', () => {
        return cy.getCookies().then(function (cookies) {
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
        name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false,
      })

      return cy.getCookie('foo').should('deep.eq', {
        name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false,
      }).then(() => {
        expect(Cypress.automation).to.be.calledWith(
          'get:cookie',
          { domain: 'localhost', name: 'foo' }
        )
      })
    })

    it('returns null when no cookie was found', () => {
      Cypress.automation.withArgs('get:cookie').resolves(null)

      return cy.getCookie('foo').should('be.null')
    })

    describe('timeout', () => {
      it('sets timeout to Cypress.config(responseTimeout)', () => {
        Cypress.config('responseTimeout', 2500)

        Cypress.automation.resolves(null)

        const timeout = cy.spy(Promise.prototype, 'timeout')

        return cy.getCookie('foo').then(() => {
          expect(timeout).to.be.calledWith(2500)
        })
      })

      it('can override timeout', () => {
        Cypress.automation.resolves(null)

        const timeout = cy.spy(Promise.prototype, 'timeout')

        return cy.getCookie('foo', { timeout: 1000 }).then(() => {
          expect(timeout).to.be.calledWith(1000)
        })
      })

      it('clears the current timeout and restores after success', () => {
        Cypress.automation.resolves(null)

        cy.timeout(100)

        cy.spy(cy, 'clearTimeout')

        return cy.getCookie('foo').then(() => {
          expect(cy.clearTimeout).to.be.calledWith('get:cookie')

          //# restores the timeout afterwards
          expect(cy.timeout()).to.eq(100)
        })
      })
    })

    describe('errors', () => {
      beforeEach(function () {
        Cypress.config('defaultCommandTimeout', 50)

        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'getCookie') {
            this.lastLog = log

            return this.logs.push(log)
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

          expect(this.logs.length).to.eq(1)

          expect(lastLog.get('error').message).to.eq('some err message')
          expect(lastLog.get('error').name).to.eq('foo')
          expect(lastLog.get('error').stack).to.eq(error.stack)

          return done()
        })

        return cy.getCookie('foo')
      })

      it('throws after timing out', function (done) {
        Cypress.automation.resolves(Promise.delay(1000))

        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(this.logs.length).to.eq(1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('name')).to.eq('getCookie')
          expect(lastLog.get('message')).to.eq('foo')
          expect(err.message).to.eq('cy.getCookie() timed out waiting \'50ms\' to complete.')

          return done()
        })

        return cy.getCookie('foo', { timeout: 50 })
      })

      it('requires a string name', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(this.logs.length).to.eq(1)
          expect(lastLog.get('error').message).to.eq('cy.getCookie() must be passed a string argument for name.')
          expect(lastLog.get('error')).to.eq(err)

          return done()
        })

        return cy.getCookie(123)
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'getCookie') {
            this.lastLog = log
          }
        })

        return Cypress.automation
        .withArgs('get:cookie', { domain: 'localhost', name: 'foo' })
        .resolves({
          name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false,
        })
        .withArgs('get:cookie', { domain: 'localhost', name: 'bar' })
        .resolves(null)
      })

      it('can turn off logging', () => {
        return cy.getCookie('foo', { log: false }).then(function () {
          expect(this.log).to.be.undefined
        })
      })

      it('ends immediately', () => {
        return cy.getCookie('foo').then(function () {
          const { lastLog } = this

          expect(lastLog.get('ended')).to.be.true

          expect(lastLog.get('state')).to.eq('passed')
        })
      })

      it('has correct message', () => {
        return cy.getCookie('foo').then(function () {
          const { lastLog } = this

          expect(lastLog.get('message')).to.eq('foo')
        })
      })

      it('snapshots immediately', () => {
        return cy.getCookie('foo').then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)

          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('displays name \'get cookie\'', () => {
        return cy.getCookie('foo').then(function () {
          const { lastLog } = this

          expect(lastLog.get('displayName')).to.eq('get cookie')
        })
      })

      it('#consoleProps', () => {
        return cy.getCookie('foo').then(function (cookie) {
          expect(cookie).to.deep.eq({ name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false })
          const c = this.lastLog.invoke('consoleProps')

          expect(c['Yielded']).to.deep.eq(cookie)
        })
      })

      it('#consoleProps when no cookie found', () => {
        return cy.getCookie('bar').then(function (cookie) {
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
      return cy.stub(Cypress.utils, 'addTwentyYears').returns(12345)
    })

    it('returns set cookie', () => {
      Cypress.automation.withArgs('set:cookie').resolves({
        name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: false, httpOnly: false, expiry: 12345,
      })

      return cy.setCookie('foo', 'bar').should('deep.eq', {
        name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: false, httpOnly: false, expiry: 12345,
      }).then(() => {
        expect(Cypress.automation).to.be.calledWith(
          'set:cookie',
          { domain: 'localhost', name: 'foo', value: 'bar', path: '/', secure: false, httpOnly: false, expiry: 12345 }
        )
      })
    })

    it('can change options', () => {
      Cypress.automation.withArgs('set:cookie').resolves({
        name: 'foo', value: 'bar', domain: 'brian.dev.local', path: '/foo', secure: true, httpOnly: true, expiry: 987,
      })

      return cy.setCookie('foo', 'bar', { domain: 'brian.dev.local', path: '/foo', secure: true, httpOnly: true, expiry: 987 }).should('deep.eq', {
        name: 'foo', value: 'bar', domain: 'brian.dev.local', path: '/foo', secure: true, httpOnly: true, expiry: 987,
      }).then(() => {
        expect(Cypress.automation).to.be.calledWith(
          'set:cookie',
          { domain: 'brian.dev.local', name: 'foo', value: 'bar', path: '/foo', secure: true, httpOnly: true, expiry: 987 }
        )
      })
    })

    describe('timeout', () => {
      it('sets timeout to Cypress.config(responseTimeout)', () => {
        Cypress.config('responseTimeout', 2500)

        Cypress.automation.resolves(null)

        const timeout = cy.spy(Promise.prototype, 'timeout')

        return cy.setCookie('foo', 'bar').then(() => {
          expect(timeout).to.be.calledWith(2500)
        })
      })

      it('can override timeout', () => {
        Cypress.automation.resolves(null)

        const timeout = cy.spy(Promise.prototype, 'timeout')

        return cy.setCookie('foo', 'bar', { timeout: 1000 }).then(() => {
          expect(timeout).to.be.calledWith(1000)
        })
      })

      it('clears the current timeout and restores after success', () => {
        Cypress.automation.resolves(null)

        cy.timeout(100)

        cy.spy(cy, 'clearTimeout')

        return cy.setCookie('foo', 'bar').then(() => {
          expect(cy.clearTimeout).to.be.calledWith('set:cookie')

          //# restores the timeout afterwards
          expect(cy.timeout()).to.eq(100)
        })
      })
    })

    describe('errors', () => {
      beforeEach(function () {
        Cypress.config('defaultCommandTimeout', 50)

        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'setCookie') {
            this.lastLog = log

            return this.logs.push(log)
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

          expect(this.logs.length).to.eq(1)
          expect(lastLog.get('error').message).to.eq('some err message')
          expect(lastLog.get('error').name).to.eq('foo')
          expect(lastLog.get('error').stack).to.eq(error.stack)

          return done()
        })

        return cy.setCookie('foo', 'bar')
      })

      it('throws after timing out', function (done) {
        Cypress.automation.resolves(Promise.delay(1000))

        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(this.logs.length).to.eq(1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('name')).to.eq('setCookie')
          expect(lastLog.get('message')).to.eq('foo, bar')
          expect(err.message).to.eq('cy.setCookie() timed out waiting \'50ms\' to complete.')

          return done()
        })

        return cy.setCookie('foo', 'bar', { timeout: 50 })
      })

      it('requires a string name', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(this.logs.length).to.eq(1)
          expect(lastLog.get('error').message).to.eq('cy.setCookie() must be passed two string arguments for name and value.')
          expect(lastLog.get('error')).to.eq(err)

          return done()
        })

        return cy.setCookie(123)
      })

      it('requires a string value', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(this.logs.length).to.eq(1)
          expect(lastLog.get('error').message).to.eq('cy.setCookie() must be passed two string arguments for name and value.')
          expect(lastLog.get('error')).to.eq(err)

          return done()
        })

        return cy.setCookie('foo', 123)
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'setCookie') {
            this.lastLog = log
          }
        })

        return Cypress.automation
        .withArgs('set:cookie', {
          domain: 'localhost', name: 'foo', value: 'bar', path: '/', secure: false, httpOnly: false, expiry: 12345,
        })
        .resolves({
          name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false,
        })
      })

      it('can turn off logging', () => {
        return cy.setCookie('foo', 'bar', { log: false }).then(function () {
          expect(this.log).to.be.undefined
        })
      })

      it('ends immediately', () => {
        return cy.setCookie('foo', 'bar').then(function () {
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

          it('displays name \'set cookie\'', () => {})
        })

        return cy.setCookie('foo', 'bar').then(function () {
          const { lastLog } = this

          expect(lastLog.get('displayName')).to.eq('set cookie')
        })
      })

      it('#consoleProps', () => {
        return cy.setCookie('foo', 'bar').then(function (cookie) {
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

      return cy.clearCookie('foo').should('be.null').then(() => {
        expect(Cypress.automation).to.be.calledWith(
          'clear:cookie',
          { domain: 'localhost', name: 'foo' }
        )
      })
    })

    describe('timeout', () => {
      it('sets timeout to Cypress.config(responseTimeout)', () => {
        Cypress.config('responseTimeout', 2500)

        Cypress.automation.resolves(null)

        const timeout = cy.spy(Promise.prototype, 'timeout')

        return cy.clearCookie('foo').then(() => {
          expect(timeout).to.be.calledWith(2500)
        })
      })

      it('can override timeout', () => {
        Cypress.automation.resolves(null)

        const timeout = cy.spy(Promise.prototype, 'timeout')

        return cy.clearCookie('foo', { timeout: 1000 }).then(() => {
          expect(timeout).to.be.calledWith(1000)
        })
      })

      it('clears the current timeout and restores after success', () => {
        Cypress.automation.resolves([])

        cy.timeout(100)

        cy.spy(cy, 'clearTimeout')

        return cy.clearCookie('foo').then(() => {
          expect(cy.clearTimeout).to.be.calledWith('clear:cookie')

          //# restores the timeout afterwards
          expect(cy.timeout()).to.eq(100)
        })
      })
    })

    describe('errors', () => {
      beforeEach(function () {
        Cypress.config('defaultCommandTimeout', 50)

        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'clearCookie') {
            this.lastLog = log

            return this.logs.push(log)
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

          expect(this.logs.length).to.eq(1)
          expect(lastLog.get('error').message).to.eq('some err message')
          expect(lastLog.get('error').name).to.eq('foo')
          expect(lastLog.get('error').stack).to.eq(error.stack)

          return done()
        })

        return cy.clearCookie('foo')
      })

      it('throws after timing out', function (done) {
        Cypress.automation.resolves(Promise.delay(1000))

        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(this.logs.length).to.eq(1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('name')).to.eq('clearCookie')
          expect(lastLog.get('message')).to.eq('foo')
          expect(err.message).to.eq('cy.clearCookie() timed out waiting \'50ms\' to complete.')

          return done()
        })

        return cy.clearCookie('foo', { timeout: 50 })
      })

      it('requires a string name', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(this.logs.length).to.eq(1)
          expect(lastLog.get('error').message).to.eq('cy.clearCookie() must be passed a string argument for name.')
          expect(lastLog.get('error')).to.eq(err)

          return done()
        })

        return cy.clearCookie(123)
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'clearCookie') {
            this.lastLog = log
          }
        })

        return Cypress.automation
        .withArgs('clear:cookie', { domain: 'localhost', name: 'foo' })
        .resolves({
          name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false,
        })
        .withArgs('clear:cookie', { domain: 'localhost', name: 'bar' })
        .resolves(null)
      })

      it('can turn off logging', () => {
        return cy.clearCookie('foo', { log: false }).then(function () {
          expect(this.log).to.be.undefined
        })
      })

      it('ends immediately', () => {
        return cy.clearCookie('foo').then(function () {
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

          it('displays name \'clear cookie\'', () => {})
        })

        return cy.clearCookie('foo').then(function () {
          const { lastLog } = this

          expect(lastLog.get('displayName')).to.eq('clear cookie')
        })
      })

      it('#consoleProps', () => {
        return cy.clearCookie('foo').then(function (cookie) {
          expect(cookie).to.be.null
          const c = this.lastLog.invoke('consoleProps')

          expect(c['Yielded']).to.eq('null')

          expect(c['Cleared Cookie']).to.deep.eq({ name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false })
        })
      })

      it('#consoleProps when no matching cookie was found', () => {
        return cy.clearCookie('bar').then(function (cookie) {
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

      return cy.clearCookies().should('be.null')
    })

    it('does not call \'clear:cookies\' when no cookies were returned', () => {
      Cypress.automation.withArgs('get:cookies').resolves([])

      return cy.clearCookies().then(() => {
        expect(Cypress.automation).not.to.be.calledWith(
          'clear:cookies'
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

      return cy.clearCookies().should('be.null').then(() => {
        expect(Cypress.automation).to.be.calledWith(
          'clear:cookies',
          [{ name: 'foo', domain: 'localhost' }]
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

      return cy
      .clearCookies().should('be.null').then(() => {
        expect(Cypress.automation).to.be.calledWith(
          'clear:cookies',
          [{ name: 'foo', domain: 'localhost' }]
        )
      }).clearCookies().should('be.null').then(() => {
        expect(Cypress.automation).to.be.calledWith(
          'clear:cookies', [
            { name: 'foo', domain: 'localhost' },
            { name: 'bar', domain: 'localhost' },
            { name: 'baz', domain: 'localhost' },
          ]
        )
      })
    })

    describe('timeout', () => {
      beforeEach(() => {
        return Cypress.automation
        .withArgs('get:cookies')
        .resolves([{}])
        .withArgs('clear:cookies')
        .resolves({})
      })

      it('sets timeout to Cypress.config(responseTimeout)', () => {
        Cypress.config('responseTimeout', 2500)

        Cypress.automation.resolves([])

        const timeout = cy.spy(Promise.prototype, 'timeout')

        return cy.clearCookies().then(() => {
          expect(timeout).to.be.calledWith(2500)
        })
      })

      it('can override timeout', () => {
        Cypress.automation.resolves([])

        const timeout = cy.spy(Promise.prototype, 'timeout')

        return cy.clearCookies({ timeout: 1000 }).then(() => {
          expect(timeout).to.be.calledWith(1000)
        })
      })

      it('clears the current timeout and restores after success', () => {
        cy.timeout(100)

        cy.spy(cy, 'clearTimeout')

        return cy.clearCookies().then(() => {
          expect(cy.clearTimeout).to.be.calledWith('get:cookies')
          expect(cy.clearTimeout).to.be.calledWith('clear:cookies')

          //# restores the timeout afterwards
          expect(cy.timeout()).to.eq(100)
        })
      })
    })

    describe('errors', () => {
      beforeEach(function () {
        Cypress.config('defaultCommandTimeout', 50)

        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'clearCookies') {
            this.lastLog = log

            return this.logs.push(log)
          }
        })

        return null
      })

      it('logs once on \'get:cookies\' error', function (done) {
        const error = new Error('some err message')

        error.name = 'foo'
        error.stack = 'stack'

        Cypress.automation.rejects(error)

        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(this.logs.length).to.eq(1)
          expect(lastLog.get('error').message).to.eq('some err message')
          expect(lastLog.get('error').name).to.eq('foo')
          expect(lastLog.get('error').stack).to.eq(err.stack)
          expect(lastLog.get('error')).to.eq(err)

          return done()
        })

        return cy.clearCookies()
      })

      it('throws after timing out', function (done) {
        Cypress.automation.resolves(Promise.delay(1000))

        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(this.logs.length).to.eq(1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('name')).to.eq('clearCookies')
          expect(lastLog.get('message')).to.eq('')
          expect(err.message).to.eq('cy.clearCookies() timed out waiting \'50ms\' to complete.')

          return done()
        })

        return cy.clearCookies({ timeout: 50 })
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

          expect(this.logs.length).to.eq(1)
          expect(lastLog.get('error').message).to.eq('some err message')
          expect(lastLog.get('error').name).to.eq('foo')
          expect(lastLog.get('error').stack).to.eq(error.stack)
          expect(lastLog.get('error')).to.eq(err)

          return done()
        })

        return cy.clearCookies()
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'clearCookies') {
            this.lastLog = log
          }
        })

        return Cypress.automation
        .withArgs('get:cookies', { domain: 'localhost' })
        .resolves([{ name: 'foo' }])
        .withArgs('clear:cookies', [{ name: 'foo', domain: 'localhost' }])
        .resolves([
          { name: 'foo' },
        ])
      })

      it('can turn off logging', () => {
        return cy.clearCookies({ log: false }).then(function () {
          expect(this.log).to.be.undefined
        })
      })

      it('ends immediately', () => {
        return cy.clearCookies().then(function () {
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

          it('displays name \'get cookies\'', () => {})
        })

        return cy.clearCookies().then(function () {
          const { lastLog } = this

          expect(lastLog.get('displayName')).to.eq('clear cookies')
        })
      })

      it('#consoleProps', () => {
        return cy.clearCookies().then(function (cookies) {
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

        return Cypress.automation
        .withArgs('get:cookies', { domain: 'localhost' })
        .resolves([])
      })

      it('#consoleProps', () => {
        return cy.clearCookies().then(function (cookies) {
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

        return Cypress.automation
        .withArgs('get:cookies', { domain: 'localhost' })
        .resolves([{ name: 'foo' }])
        .withArgs('clear:cookies', [{ name: 'foo', domain: 'localhost' }])
        .resolves([])
      })

      it('#consoleProps', () => {
        return cy.clearCookies().then(function (cookies) {
          expect(cookies).to.be.null
          const c = this.lastLog.invoke('consoleProps')

          expect(c['Yielded']).to.eq('null')
          expect(c['Cleared Cookies']).to.be.undefined

          expect(c['Note']).to.eq('No cookies were found or removed.')
        })
      })
    })
  })
})
