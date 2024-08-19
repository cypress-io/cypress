const Cookie = require('js-cookie')
const { stripIndent } = require('common-tags')

const { assertLogLength } = require('../../support/utils')
const { _, Promise, $ } = Cypress

describe('src/cy/commands/navigation', () => {
  context('#reload', () => {
    beforeEach(function () {
      cy.visit('/fixtures/generic.html')
    })

    it('calls into window.location.reload', () => {
      const locReload = cy.spy(Cypress.utils, 'locReload')

      cy.reload().then(() => {
        expect(locReload).to.be.calledWith(false)
      })
    })

    it('can pass forceReload', () => {
      const locReload = cy.spy(Cypress.utils, 'locReload')

      cy.reload(true).then(() => {
        expect(locReload).to.be.calledWith(true)
      })
    })

    it('can pass forceReload + options', () => {
      const locReload = cy.spy(Cypress.utils, 'locReload')

      cy.reload(true, {}).then(() => {
        expect(locReload).to.be.calledWith(true)
      })
    })

    it('can pass just options', () => {
      const locReload = cy.spy(Cypress.utils, 'locReload')

      cy.reload({}).then(() => {
        expect(locReload).to.be.calledWith(false)
      })
    })

    it('returns the window object', () => {
      cy
      .window().then((oldWin) => {
        oldWin.foo = 'bar'
        expect(oldWin.foo).to.eq('bar')

        cy.reload().then((win) => {
          expect(win).not.to.be.undefined
          expect(win.foo).to.be.undefined

          expect(win).to.eq(cy.state('window'))
        })
      })
    })

    it('removes window:load listeners', () => {
      const listeners = cy.listeners('window:load')

      const winLoad = cy.spy(cy, 'once').withArgs('window:load')

      cy.reload().then(() => {
        expect(winLoad).to.be.calledOnce
        expect(cy.listeners('window:load')).to.deep.eq(listeners)
      })
    })

    // TODO: fix this
    it('sets timeout to Cypress.config(pageLoadTimeout)', {
      pageLoadTimeout: 4567,
    }, () => {
      const timeout = cy.spy(Promise.prototype, 'timeout')

      cy.reload().then(() => {
        expect(timeout).to.be.calledWith(4567, 'reload')
      })
    })

    it('fires stability:changed and window events events', () => {
      const stub1 = cy.stub()
      const stub2 = cy.stub()
      const stub3 = cy.stub()

      cy.on('stability:changed', stub1)
      cy.on('window:before:unload', stub2)
      cy.on('window:unload', stub3)

      cy.reload().then(() => {
        expect(stub1.getCall(0)).to.be.calledWith(false, 'beforeunload')
        expect(stub1.getCall(1)).to.be.calledWith(true, 'load')
        expect(stub2).to.be.calledOnce
        expect(stub3).to.be.calledOnce
      })
    })

    it('removes listeners', () => {
      cy.log(Cypress.browser)
      const unloadEvent = Cypress.browser.family === 'chromium' ? 'pagehide' : 'unload'
      const win = cy.state('window')

      const rel = cy.stub(win, 'removeEventListener')

      cy.reload().then(() => {
        expect(rel).to.be.calledWith('beforeunload')
        expect(rel).to.be.calledWith(unloadEvent)
      })
    })

    describe('errors', {
      defaultCommandTimeout: 100,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log
          this.logs?.push(log)
        })

        return null
      })

      it('logs once on failure', {
        defaultCommandTimeout: 200,
      }, function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)

          done()
        })

        cy.reload(Infinity)
      })

      it('throws passing more than 2 args', {
        defaultCommandTimeout: 1000,
      }, (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('`cy.reload()` can only accept a boolean or `options` as its arguments.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/reload')

          done()
        })

        cy.reload(1, 2, 3)
      })

      it('throws passing 2 invalid arguments', { defaultCommandTimeout: 200, retries: 1 }, (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('`cy.reload()` can only accept a boolean or `options` as its arguments.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/reload')

          done()
        })

        cy.reload(true, 1)
      })

      it('throws passing 1 invalid argument', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('`cy.reload()` can only accept a boolean or `options` as its arguments.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/reload')

          done()
        })

        cy.reload(1)
      })

      it('fully refreshes page', () => {
        cy
        .window().then((win) => {
          win.foo = 'foo'
        })
        .reload()
        .window().then((win) => {
          expect(win.foo).to.be.undefined
        })
      })

      it('throws when reload times out', (done) => {
        cy.timeout(1000)
        cy.spy(Cypress.utils, 'locReload')

        cy
        .visit('/timeout?ms=100').then(() => {
          let expected = false

          // wait until the window finishes loading first
          // else we can potentially move onto the next test
          // while we're still unstable, which will result in
          // properties on the window being inaccessible
          // since we only visit once at the beginning of these tests
          cy.on('window:load', () => {
            expect(expected).to.be.true

            done()
          })

          cy.on('fail', (err) => {
            expected = true

            expect(err.message).to.include('Your page did not fire its `load` event within `1ms`.')
          })
        })
        .reload({ timeout: 1 })
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'reload') {
            this.lastLog = log
          }

          this.logs.push(log)
        })
      })

      it('logs reload', () => {
        cy.reload().then(function () {
          expect(this.lastLog.get('name')).to.eq('reload')
        })
      })

      it('can turn off logging when protocol is disabled', { protocolEnabled: false }, function () {
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy.reload({ log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', { protocolEnabled: true }, function () {
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy.reload({ log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog.get('name'), 'log name').to.eq('reload')
          expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
          expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(2)
        })
      })

      it('does not log \'Page Load\' events', () => {
        cy.reload().then(function () {
          this.logs.slice(0).forEach((log) => {
            expect(log.get('name')).not.eq('page load')
          })
        })
      })

      it('logs before + after', () => {
        let beforeunload = false

        cy
        .window().then(function () {
          cy.on('window:before:unload', () => {
            const { lastLog } = this

            beforeunload = true
            expect(lastLog.get('snapshots').length).to.eq(1)
            expect(lastLog.get('snapshots')[0].name).to.eq('before')
            expect(lastLog.get('snapshots')[0].body).to.be.an('object')

            return undefined
          })
        }).reload().then(function () {
          const { lastLog } = this

          expect(beforeunload).to.be.true
          expect(lastLog.get('snapshots').length).to.eq(2)
          expect(lastLog.get('snapshots')[1].name).to.eq('after')

          expect(lastLog.get('snapshots')[1].body).to.be.an('object')
        })
      })
    })
  })

  // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23308
  context.skip('#go', () => {
    it('sets timeout to Cypress.config(pageLoadTimeout)', {
      pageLoadTimeout: 4567,
    }, () => {
      cy.visit('/fixtures/generic.html')
      const timeout = cy.spy(Promise.prototype, 'timeout')

      cy
      .visit('/fixtures/jquery.html')
      .go('back').then(() => {
        expect(timeout).to.be.calledWith(4567, 'go')
      })
    })

    it('handles hashchange events', () => {
      const emit = cy.spy(Cypress, 'emit').log(false).withArgs('url:changed')

      cy
      .visit('/fixtures/generic.html')
      .get('#hashchange').click()
      .then(() => {
        cy.go('back')
        cy.go('forward')
        cy.get('#dimensions').click()
        cy.go('back')
        cy.go('back')
      })
      .then(function () {
        expect(emit.getCall(0)).to.be.calledWith(
          'url:changed',
          'http://localhost:3500/fixtures/generic.html',
        )

        expect(emit.getCall(1)).to.be.calledWith(
          'url:changed',
          'http://localhost:3500/fixtures/generic.html#hashchange',
        )

        expect(emit.getCall(2)).to.be.calledWith(
          'url:changed',
          'http://localhost:3500/fixtures/generic.html',
        )

        expect(emit.getCall(3)).to.be.calledWith(
          'url:changed',
          'http://localhost:3500/fixtures/generic.html#hashchange',
        )

        expect(emit.getCall(4)).to.be.calledWith(
          'url:changed',
          'http://localhost:3500/fixtures/dimensions.html',
        )

        expect(emit.getCall(5)).to.be.calledWith(
          'url:changed',
          'http://localhost:3500/fixtures/generic.html#hashchange',
        )

        expect(emit.getCall(6)).to.be.calledWith(
          'url:changed',
          'http://localhost:3500/fixtures/generic.html',
        )

        expect(emit.callCount).to.eq(7)
      })
    })

    it('removes listeners', () => {
      cy
      .visit('/fixtures/generic.html')
      .visit('/fixtures/jquery.html')
      .then(() => {
        const winLoadListeners = cy.listeners('window:load')
        const beforeWinUnloadListeners = cy.listeners('window:before:unload')

        const cyOn = cy.spy(cy, 'once')

        const winLoad = cyOn.withArgs('window:load')
        const beforeWinUnload = cyOn.withArgs('window:before:unload')

        cy.go('back').then(() => {
          expect(winLoad).to.be.calledOnce
          expect(beforeWinUnload).to.be.calledOnce

          expect(cy.listeners('window:load')).to.deep.eq(winLoadListeners)
          expect(cy.listeners('window:before:unload')).to.deep.eq(beforeWinUnloadListeners)
        })
      })
    })

    it('fires stability:changed and window events events', () => {
      const stub1 = cy.stub()
      const stub2 = cy.stub()
      const stub3 = cy.stub()

      cy
      .visit('/fixtures/generic.html')
      .visit('/fixtures/jquery.html')
      .then(() => {
        cy.on('stability:changed', stub1)
        cy.on('window:before:unload', stub2)
        cy.on('window:unload', stub3)
      })
      .go('back').then(() => {
        expect(stub1.getCall(0)).to.be.calledWith(false, 'beforeunload')
        expect(stub1.getCall(1)).to.be.calledWith(true, 'load')
        expect(stub2).to.be.calledOnce
        expect(stub3).to.be.calledOnce
      })
    })

    it('removes listeners from window', () => {
      cy
      .visit('/fixtures/generic.html')
      .visit('/fixtures/jquery.html')
      .then((win) => {
        const rel = cy.stub(win, 'removeEventListener')

        cy.go('back').then(() => {
          const unloadEvent = cy.browser.family === 'chromium' ? 'pagehide' : 'unload'

          expect(rel).to.be.calledWith('beforeunload')
          expect(rel).to.be.calledWith(unloadEvent)
        })
      })
    })

    describe('errors', {
      defaultCommandTimeout: 50,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'go') {
            this.lastLog = log
            this.logs.push(log)
          }
        })

        return null
      })

      _.each([null, undefined, NaN, Infinity, {}, [], () => {}], (val) => {
        it(`throws on: '${val}'`, (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.eq('`cy.go()` accepts only a string or number argument')
            expect(err.docsUrl).to.eq('https://on.cypress.io/go')

            done()
          })

          cy.go(val)
        })
      })

      it('throws on invalid string', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('`cy.go()` accepts either `forward` or `back`. You passed: `foo`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/go')

          done()
        })

        cy.go('foo')
      })

      it('throws on zero', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('`cy.go()` cannot accept `0`. The number must be greater or less than `0`.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/go')

          done()
        })

        cy.go(0)
      })

      it('throws when go times out', (done) => {
        cy.timeout(1000)

        cy
        .visit('/timeout?ms=100')
        .visit('/fixtures/jquery.html')
        .then(() => {
          let expected = false

          // wait until the window finishes loading first
          // else we can potentially move onto the next test
          // while we're still unstable, which will result in
          // properties on the window being inaccessible
          // since we only visit once at the beginning of these tests
          cy.on('window:load', () => {
            expect(expected).to.be.true

            done()
          })

          cy.on('fail', (err) => {
            expected = true

            expect(err.message).to.include('Your page did not fire its `load` event within `1ms`.')
          })

          cy.go('back', { timeout: 1 })
        })
      })

      it('only logs once on error', function (done) {
        cy.once('fail', (err) => {
          assertLogLength(this.logs, 1)
          expect(this.logs[0].get('error')).to.eq(err)

          done()
        })

        cy
        .visit('/fixtures/jquery.html')
        .go('back', { timeout: 1 })
      })
    })

    describe('.log', () => {
      beforeEach(() => {
        cy.visit('/fixtures/generic.html').then(function () {
          this.logs = []

          cy.on('log:added', (attrs, log) => {
            if (attrs.name === 'go') {
              this.lastLog = log
            }

            this.logs.push(log)
          })

          return null
        })
      })

      it('logs go', () => {
        cy
        .visit('/fixtures/jquery.html')
        .go('back').then(function () {
          const { lastLog } = this

          expect(lastLog.get('name')).to.eq('go')
          expect(lastLog.get('message')).to.eq('back')
        })
      })

      it('can turn off logging when protocol is disabled', { protocolEnabled: false }, function () {
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy
        .visit('/fixtures/jquery.html')
        .go('back', { log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', { protocolEnabled: true }, function () {
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy
        .visit('/fixtures/jquery.html')
        .go('back', { log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog.get('name'), 'log name').to.eq('go')
          expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
          expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(2)
        })
      })

      it('does not log \'Page Load\' events', () => {
        cy
        .visit('/fixtures/jquery.html')
        .go('back').then(function () {
          this.logs.slice(0).forEach((log) => {
            expect(log.get('name')).not.eq('page load')
          })
        })
      })

      it('logs before + after', () => {
        let beforeunload = false

        cy
        .visit('/fixtures/jquery.html')
        .window().then(function (win) {
          cy.on('window:before:unload', () => {
            const { lastLog } = this

            beforeunload = true
            expect(lastLog.get('snapshots').length).to.eq(1)
            expect(lastLog.get('snapshots')[0].name).to.eq('before')
            expect(lastLog.get('snapshots')[0].body).to.be.an('object')

            return undefined
          })

          cy.go('back').then(function () {
            const { lastLog } = this

            expect(beforeunload).to.be.true
            expect(lastLog.get('snapshots').length).to.eq(2)
            expect(lastLog.get('snapshots')[1].name).to.eq('after')
            expect(lastLog.get('snapshots')[1].body).to.be.an('object')
          })
        })
      })
    })
  })

  context('#visit', () => {
    // TODO: fix this
    it('sets timeout to Cypress.config(pageLoadTimeout)', {
      pageLoadTimeout: 4567,
    }, () => {
      const timeout = cy.spy(Promise.prototype, 'timeout')

      cy.visit('/fixtures/jquery.html').then(() => {
        expect(timeout).to.be.calledWith(4567)
      })
    })

    describe('removes window:load listeners when testIsolation=true', () => {
      it('removes for first url visit', () => {
        const listeners = cy.listeners('window:load')

        const winLoad = cy.spy(cy, 'once').withArgs('window:load')

        cy.visit('/fixtures/generic.html').then(() => {
          expect(winLoad).to.be.calledOnce
          expect(cy.listeners('window:load')).to.deep.eq(listeners)
        })
      })
    })

    it('can visit pages on the same origin', () => {
      cy
      .visit('http://localhost:3500/fixtures/jquery.html')
      .visit('http://localhost:3500/fixtures/generic.html')
      .visit('http://localhost:3500/fixtures/dimensions.html')
    })

    it('can visit a 2nd domain on different port', function () {
      cy.visit('http://localhost:3500/fixtures/generic.html')
      cy.visit('http://localhost:3501/fixtures/generic.html')
    })

    it('can visit a 2nd domain on different protocol', function () {
      cy.visit('http://localhost:3500/fixtures/generic.html')
      cy.visit('https://localhost:3502/fixtures/generic.html')
    })

    it('can visit a 2nd domain on different superdomain', function () {
      cy.visit('http://localhost:3500/fixtures/generic.html')
      cy.visit('http://www.foobar.com:3500/fixtures/generic.html')
    })

    it('can visit 2 unique ip addresses', function () {
      cy
      .visit('http://127.0.0.1:3500/fixtures/generic.html')
      .visit('http://0.0.0.0:3500/fixtures/generic.html')
    })

    it('can navigate to a cross origin', { pageLoadTimeout: 3000 }, function () {
      cy.visit('/fixtures/primary-origin.html')
      cy.get('a[data-cy="cross-origin-secondary-link"]').click()
    })

    it('resolves the subject to the remote iframe window', () => {
      cy.visit('/fixtures/jquery.html').then((win) => {
        expect(win).to.eq(cy.state('$autIframe').prop('contentWindow'))
      })
    })

    it('changes the src of the iframe to the initial src', () => {
      cy.visit('/fixtures/jquery.html').then(() => {
        const src = cy.state('$autIframe').attr('src')

        expect(src).to.eq('http://localhost:3500/fixtures/jquery.html')
      })
    })

    it('invokes onLoad callback', function (done) {
      const ctx = this

      cy.visit('/fixtures/jquery.html', {
        onLoad (contentWindow) {
          const thisValue = this === ctx

          expect(thisValue).be.true
          expect(!!contentWindow.Cypress).to.be.true

          done()
        },
      })
    })

    it('invokes onBeforeLoad callback with cy context', function (done) {
      const ctx = this

      cy.visit('/fixtures/jquery.html', {
        onBeforeLoad (contentWindow) {
          const thisValue = this === ctx

          expect(thisValue).be.true

          expect(!!contentWindow.Cypress).to.be.true

          done()
        },
      })
    })

    it('does not error without an onBeforeLoad callback', () => {
      cy.visit('/fixtures/jquery.html').then(() => {
        const prev = cy.state('current').get('prev')

        expect(prev.get('args')).to.have.length(1)
      })
    })

    it('calls resolve:url with http:// when localhost', () => {
      const backend = cy.spy(Cypress, 'backend').log(false)

      cy
      .visit('localhost:3500/timeout')
      .then(() => {
        expect(backend).to.be.calledWith('resolve:url', 'http://localhost:3500/timeout')
      })
    })

    it('prepends hostname when visiting locally', () => {
      const prop = cy.spy(cy.state('$autIframe'), 'prop')

      cy
      .visit('fixtures/jquery.html')
      .then(() => {
        expect(prop).to.be.calledWith('src', 'http://localhost:3500/fixtures/jquery.html')
      })
    })

    it('can visit relative pages on the same origin', () => {
      // as long as we are already on the localhost:3500
      // domain this will work
      cy
      .visit('http://localhost:3500/fixtures/dimensions.html')
      .visit('/fixtures/jquery.html')
    })

    it('can visit relative pages with domain like query params', () => {
      cy
      .visit('http://localhost:3500/fixtures/generic.html')
      .visit('http://localhost:3500/fixtures/dimensions.html?email=briancypress.io')
    })

    it('can visit pages with non-2xx status codes when option failOnStatusCode is false', () => {
      cy
      .visit('localhost:3500/status-404', { failOnStatusCode: false })
      .visit('localhost:3500/status-500', { failOnStatusCode: false })
    })

    it('strips username + password out of the url when provided', () => {
      const backend = cy.spy(Cypress, 'backend').log(false)

      cy
      .visit('http://cypress:password123@localhost:3500/timeout')
      .then(() => {
        expect(backend).to.be.calledWith('resolve:url', 'http://localhost:3500/timeout')
      })
    })

    it('passes auth options', () => {
      const backend = cy.spy(Cypress, 'backend').log(false)

      const auth = {
        username: 'cypress',
        password: 'password123',
      }

      cy
      .visit('http://localhost:3500/timeout', { auth })
      .then(() => {
        expect(backend).to.be.calledWithMatch('resolve:url', 'http://localhost:3500/timeout', { auth })
      })
    })

    it('does not support file:// protocol', {
      baseUrl: null,
    }, (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.contain('`cy.visit()` failed because the \'file://...\' protocol is not supported by Cypress.')

        done()
      })

      cy.visit('file:///cypress/fixtures/generic.html')
    })

    // https://github.com/cypress-io/cypress/issues/1727
    it('can visit a page with undefined content type and html-shaped body', () => {
      cy.visit('http://localhost:3500/undefined-content-type')
    })

    // https://github.com/cypress-io/cypress/issues/14445
    // FIXME: fix flaky test (webkit): https://github.com/cypress-io/cypress/issues/24600
    it('should eventually fail on assertion despite redirects', { browser: '!webkit' }, (done) => {
      let hasDoneBeenCalled = false

      cy.on('fail', (err) => {
        expect(err.message).to.contain('The application redirected to')
        if (!hasDoneBeenCalled) {
          hasDoneBeenCalled = true
          done()
        }
      })

      // One time, set the amount of times we want the page to perform it's redirect loop.
      cy.once('window:before:load', (win) => {
        win.sessionStorage.setItem('redirectCount', 21)
      })

      cy.visit('fixtures/redirection-loop-a.html')
    })

    describe('when only hashes are changing when testIsolation=true', () => {
      it('short circuits the visit if the page will not refresh', () => {
        let count = 0
        const urls = []

        cy.on('window:load', () => {
          urls.push(cy.state('window').location.href)

          count += 1
        })

        cy
        .visit('/fixtures/generic.html?foo#bar') // yes (1)
        .visit('/fixtures/generic.html?foo#foo') // no (1)
        .visit('/fixtures/generic.html?bar#bar') // yes (2)
        .visit('/fixtures/dimensions.html?bar#bar') // yes (3)
        .visit('/fixtures/dimensions.html?baz#bar') // yes (4)
        .visit('/fixtures/dimensions.html#bar') // yes (5)
        .visit('/fixtures/dimensions.html') // yes (6)
        .visit('/fixtures/dimensions.html#baz') // no (6)
        .visit('/fixtures/dimensions.html#') // no (6)
        .then(() => {
          expect(count).to.eq(6)

          expect(urls).to.deep.eq([
            'http://localhost:3500/fixtures/generic.html?foo#bar',
            'http://localhost:3500/fixtures/generic.html?bar#bar',
            'http://localhost:3500/fixtures/dimensions.html?bar#bar',
            'http://localhost:3500/fixtures/dimensions.html?baz#bar',
            'http://localhost:3500/fixtures/dimensions.html#bar',
            'http://localhost:3500/fixtures/dimensions.html',
          ])
        })
      })
    })

    // https://github.com/cypress-io/cypress/issues/1311
    // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23201
    it('window immediately resolves and doesn\'t reload when visiting the same URL with hashes', { retries: 15 }, () => {
      const onLoad = cy.stub()

      cy
      .visit('http://localhost:3500/fixtures/generic.html#foo').then((win) => {
        win.foo = 'bar'
      })
      .visit('http://localhost:3500/fixtures/generic.html#foo', {
        onLoad,
      })
      .then((win) => {
        expect(win.foo).to.equal('bar')
        expect(onLoad).not.to.have.been.called
      })
    })

    it('can send headers', () => {
      cy.visit({
        url: 'http://localhost:3500/dump-headers',
        headers: {
          'x-foo-baz': 'bar-quux',
        },
      })

      cy.contains('"x-foo-baz":"bar-quux"')
    })

    it('can send user-agent header', () => {
      cy.visit({
        url: 'http://localhost:3500/dump-headers',
        headers: {
          'user-agent': 'something special',
        },
      })

      cy.contains('"user-agent":"something special"')
    })

    it('can send querystring params', () => {
      const qs = { 'foo bar': 'baz quux' }

      cy
      .visit('http://localhost:3500/dump-qs', { qs })
      .then(() => {
        cy.contains(JSON.stringify(qs))

        cy.url().should('eq', 'http://localhost:3500/dump-qs?foo%20bar=baz%20quux')
      })
    })

    describe('can send a POST request', () => {
      it('automatically urlencoded using an object body', () => {
        cy.visit('http://localhost:3500/post-only', {
          method: 'POST',
          body: {
            bar: 'baz',
          },
        })

        cy.contains('it worked!').contains('{"bar":"baz"}')
      })

      it('with any string body and headers', () => {
        cy.visit('http://localhost:3500/post-only', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            bar: 'baz',
          }),
        })

        cy.contains('it worked!').contains('{"bar":"baz"}')
      })
    })

    describe('when origins don\'t match', () => {
      beforeEach(() => {
        Cypress.emit('test:before:run', { id: 'r2' })

        cy.stub(Cypress.runner, 'getEmissions').returns([])
        cy.stub(Cypress.runner, 'getTestsState').returns([])
        cy.stub(Cypress.runner, 'getStartTime').returns('12345')
        cy.stub(Cypress.Log, 'countLogsByTests').withArgs([]).returns(1)
        cy.stub(Cypress.runner, 'countByTestState')
        .withArgs([], 'passed').returns(2)
        .withArgs([], 'failed').returns(3)
        .withArgs([], 'pending').returns(4)
      })

      it('emits preserve:run:state with title + fn', (done) => {
        const obj = {
          currentId: 'r2',
          tests: [],
          emissions: [],
          startTime: '12345',
          numLogs: 1,
          passed: 2,
          failed: 3,
          pending: 4,
        }

        const fn = function (eventName, state) {
          _.each(obj, (value, key) => {
            expect(state[key]).to.deep.eq(value)
          })

          done()
        }

        cy.stub(Cypress, 'backend').log(false)
        .withArgs('resolve:url')
        .resolves({
          isOkStatusCode: true,
          isHtml: true,
          url: 'http://localhost:4200',
        })
        .withArgs('preserve:run:state')
        .callsFake(fn)

        cy.visit('http://localhost:4200')
      })

      it('replaces window.location when origins don\'t match', (done) => {
        const fn = function (str, win) {
          const isEqual = win === top.window

          expect(isEqual).to.be.true
          expect(str).to.eq('http://localhost:4200/foo?bar=baz#/tests/integration/foo_spec.js')

          done()
        }

        const fakeUrl = Cypress.Location.create('http://localhost:3500/foo?bar=baz#/tests/integration/foo_spec.js')

        cy.stub(Cypress.utils, 'locExisting').returns(fakeUrl)
        cy.stub(Cypress.utils, 'locHref')
        .callThrough()
        .withArgs('http://localhost:4200/foo?bar=baz#/tests/integration/foo_spec.js')
        .callsFake(fn)

        cy.stub(Cypress, 'backend').log(false)
        .withArgs('resolve:url')
        .resolves({
          isOkStatusCode: true,
          isHtml: true,
          url: 'http://localhost:4200',
        })
        .withArgs('preserve:run:state')
        .resolves()

        cy.visit('http://localhost:4200')
      })
    })

    describe('location getter overrides', () => {
      beforeEach(function () {
        cy
        .visit('/fixtures/jquery.html?foo=bar#dashboard?baz=quux')
        .window().as('win').then((win) => {
          // ensure href always returns the full path
          // so our tests guarantee that in fact we are
          // overriding the location getters
          expect(win.location.href).to.include('/fixtures/jquery.html?foo=bar#dashboard?baz=quux')
        })

        this.cyWin = cy.state('window')

        this.eq = (attr, str) => {
          expect(this.cyWin.location[attr]).to.eq(str)
        }
      })

      it('hash', function () {
        this.eq('hash', '#dashboard?baz=quux')
      })

      it('hostname', function () {
        this.eq('hostname', 'localhost')
      })

      it('origin', function () {
        this.eq('origin', 'http://localhost:3500')
      })

      it('pathname', function () {
        this.eq('pathname', '/fixtures/jquery.html')
      })

      it('port', function () {
        this.eq('port', '3500')
      })

      it('protocol', function () {
        this.eq('protocol', 'http:')
      })

      it('search', function () {
        this.eq('search', '?foo=bar')
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        cy.stub(Cypress.runner, 'getEmissions').returns([])

        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'visit') {
            this.lastLog = log
          }

          this.logs.push(log)
        })

        return null
      })

      it('preserves url on subsequent visits', () => {
        cy.visit('/fixtures/jquery.html').get('button').then(function () {
          expect(this.lastLog.get('url')).to.eq('http://localhost:3500/fixtures/jquery.html')
        })
      })

      it('does not log \'Page Load\' events', () => {
        cy
        .visit('/fixtures/generic.html')
        .visit('/fixtures/jquery.html')
        .then(function () {
          this.logs.slice(0).forEach((log) => {
            expect(log.get('name')).not.eq('page load')
          })
        })
      })

      it('logs immediately before resolving', () => {
        let expected = false

        cy.on('log:added', (attrs, log) => {
          cy.removeAllListeners('log:added')

          expect(log.pick('name', 'message')).to.deep.eq({
            name: 'visit',
            message: 'localhost:3500/fixtures/jquery.html#/hash',
          })

          expected = true
        })

        cy.visit('localhost:3500/fixtures/jquery.html#/hash').then(() => {
          expect(expected).to.be.true
        })
      })

      it('logs obj once complete', () => {
        cy.visit('http://localhost:3500/fixtures/generic.html').then(function () {
          const obj = {
            state: 'passed',
            name: 'visit',
            message: 'http://localhost:3500/fixtures/generic.html',
            url: 'http://localhost:3500/fixtures/generic.html',
          }

          const { lastLog } = this

          _.each(obj, (value, key) => {
            expect(lastLog.get(key)).deep.eq(value, `expected key: ${key} to eq value: ${value}`)
          })
        })
      })

      it('logs obj once complete when onLoad is not called', () => {
        cy.visit('http://localhost:3500/fixtures/generic.html#foo')

        cy.visit('http://localhost:3500/fixtures/generic.html#foo').then(function () {
          const obj = {
            state: 'passed',
            name: 'visit',
            message: 'http://localhost:3500/fixtures/generic.html#foo',
            url: 'http://localhost:3500/fixtures/generic.html#foo',
          }

          const { lastLog } = this

          _.each(obj, (value, key) => {
            expect(lastLog.get(key)).deep.eq(value, `expected key: ${key} to eq value: ${value}`)
          })
        })
      })

      it('snapshots once', () => {
        cy.visit('/fixtures/generic.html').then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('can turn off logging when protocol is disabled', { protocolEnabled: false }, function () {
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy.visit('/timeout?ms=0', { log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', { protocolEnabled: true }, function () {
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy.visit('/timeout?ms=0', { log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog.get('name'), 'log name').to.eq('visit')
          expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
          expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(1)
        })
      })

      it('displays file attributes as consoleProps', () => {
        cy.stub(Cypress, 'backend').log(false)
        .withArgs('resolve:url')
        .resolves({
          isOkStatusCode: true,
          isHtml: true,
          contentType: 'text/html',
          url: 'http://localhost:3500/foo/bar',
          filePath: '/path/to/foo/bar',
          redirects: [1, 2],
          cookies: [{}, {}],
        })

        cy.visit('/fixtures/jquery.html').then(function () {
          expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            name: 'visit',
            type: 'command',
            props: {
              'File Served': '/path/to/foo/bar',
              'Resolved Url': 'http://localhost:3500/foo/bar',
              'Redirects': [1, 2],
              'Cookies Set': [{}, {}],
            },
          })
        })
      })

      it('displays http attributes as consoleProps', () => {
        cy.stub(Cypress, 'backend').log(false)
        .withArgs('resolve:url')
        .resolves({
          isOkStatusCode: true,
          isHtml: true,
          contentType: 'text/html',
          url: 'http://localhost:3500/foo',
          originalUrl: 'http://localhost:3500/foo',
          redirects: [1, 2],
          cookies: [{}, {}],
        })

        cy.visit('http://localhost:3500/foo').then(function () {
          expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            name: 'visit',
            type: 'command',
            props: {
              'Resolved Url': 'http://localhost:3500/foo',
              'Redirects': [1, 2],
              'Cookies Set': [{}, {}],
            },
          })
        })
      })

      it('displays originalUrl http attributes as consoleProps', () => {
        cy.stub(Cypress, 'backend').log(false)
        .withArgs('resolve:url')
        .resolves({
          isOkStatusCode: true,
          isHtml: true,
          contentType: 'text/html',
          url: 'http://localhost:3500/foo/bar',
          originalUrl: 'http://localhost:3500/foo',
          redirects: [1, 2],
          cookies: [{}, {}],
        })

        cy.visit('http://localhost:3500/foo').then(function () {
          expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            name: 'visit',
            type: 'command',
            props: {
              'Original Url': 'http://localhost:3500/foo',
              'Resolved Url': 'http://localhost:3500/foo/bar',
              'Redirects': [1, 2],
              'Cookies Set': [{}, {}],
            },
          })
        })
      })

      it('indicates redirects in the message', () => {
        cy.stub(Cypress, 'backend').log(false)
        .withArgs('resolve:url')
        .resolves({
          isOkStatusCode: true,
          isHtml: true,
          contentType: 'text/html',
          url: 'http://localhost:3500/foo/bar',
          originalUrl: 'http://localhost:3500/foo',
          redirects: [1, 2],
          cookies: [{}, {}],
        })

        cy.visit('http://localhost:3500/foo').then(function () {
          const { lastLog } = this

          expect(lastLog.get('message')).to.eq(
            'http://localhost:3500/foo -> 1 -> 2',
          )
        })
      })

      it('indicates POST in the message', () => {
        cy.visit('http://localhost:3500/post-only', {
          method: 'POST',
        }).then(function () {
          const { lastLog } = this

          expect(lastLog.get('message')).to.eq(
            'POST http://localhost:3500/post-only',
          )
        })
      })

      it('displays note in consoleProps when visiting the same page with a hash', () => {
        cy.visit('http://localhost:3500/fixtures/generic.html#foo')
        .visit('http://localhost:3500/fixtures/generic.html#foo')
        .then(function () {
          expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            name: 'visit',
            type: 'command',
            props: {
              'Note': 'Because this visit was to the same hash, the page did not reload and the onBeforeLoad and onLoad callbacks did not fire.',
            },
          })
        })
      })

      it('logs options if they are supplied', () => {
        cy.visit({
          url: 'http://localhost:3500/fixtures/generic.html',
          headers: {
            'foo': 'bar',
          },
          notReal: 'baz',
        })
        .then(function () {
          expect(this.lastLog.invoke('consoleProps').props['Options']).to.deep.eq({
            url: 'http://localhost:3500/fixtures/generic.html',
            headers: {
              'foo': 'bar',
            },
          })
        })
      })

      it('does not log options if they are not supplied', () => {
        cy.visit('http://localhost:3500/fixtures/generic.html')
        .then(function () {
          expect(this.lastLog.invoke('consoleProps').props['Options']).to.be.undefined
        })
      })
    })

    describe('errors', {
      defaultCommandTimeout: 50,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'visit') {
            this.lastLog = log
            this.logs.push(log)
          }
        })

        return null
      })

      it('sets error command state', function (done) {
        cy.stub(Cypress, 'backend').log(false)
        .withArgs('resolve:url')
        .rejects(new Error)

        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.visit('/fixtures/generic.html')
      })

      it('logs once on error', function (done) {
        cy.stub(Cypress, 'backend').log(false)
        .withArgs('resolve:url')
        .rejects(new Error)

        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)

          done()
        })

        cy.visit('/fixtures/generic.html')
      })

      it('logs once on timeout error', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(err.message).to.include('Your page did not fire its `load` event within `20ms`.')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.visit('/timeout?ms=5000', { timeout: 20 })
      })

      it('cancels resolve url promise on timeout', (done) => {
        cy.on('collect:run:state', () => {
          done(new Error('should not have tried to swap domains'))
        })

        const fn = () => {
          // resolve after 100ms
          return Promise.delay(100)
          .then(() => {
            done(new Error('should not have invoked this callback'))
          })
        }

        cy.stub(Cypress, 'backend').log(false)
        .withArgs('resolve:url')
        .callsFake(fn)

        cy.on('fail', () => {
          done()
        })

        cy.visit('/', { timeout: 20 })
      })

      it('throws when url isnt a string', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('`cy.visit()` must be called with a `url` or an `options` object containing a `url` as its 1st argument')
          expect(err.docsUrl).to.eq('https://on.cypress.io/visit')

          done()
        })

        cy.visit()
      })

      it('throws when url is specified twice', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('`cy.visit()` must be called with only one `url`. You specified two urls')
          expect(err.docsUrl).to.eq('https://on.cypress.io/visit')

          done()
        })

        cy.visit('http://foobarbaz', {
          url: 'http://foobarbaz',
        })
      })

      it('throws when method is unsupported', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('`cy.visit()` was called with an invalid method: `FOO`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/visit')

          done()
        })

        cy.visit({
          url: 'http://foobarbaz',
          method: 'FOO',
        })
      })

      it('throws when headers is not an object', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('`cy.visit()` requires the `headers` option to be an object')
          expect(err.docsUrl).to.eq('https://on.cypress.io/visit')

          done()
        })

        cy.visit({
          url: 'http://foobarbaz',
          headers: 'quux',
        })
      });

      [
        'foo',
        null,
        false,
      ].forEach((qs) => {
        const str = String(qs)

        it(`throws when qs is ${str}`, (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.contain(`\`cy.visit()\` requires the \`qs\` option to be an object, but received: \`${str}\``)

            done()
          })

          cy.visit({
            url: 'http://foobarbaz',
            qs,
          })
        })
      })

      it('throws when failOnStatusCode is false and retryOnStatusCodeFailure is true', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('These options are incompatible with each other.')

          done()
        })

        cy.visit({
          url: 'http://foobarbaz',
          failOnStatusCode: false,
          retryOnStatusCodeFailure: true,
        })
      })

      it('displays loading_network_failed when _resolveUrl throws', function (done) {
        const err1 = new Error('connect ECONNREFUSED 127.0.0.1:64646')

        // dont log else we create an endless loop!
        const emit = cy.spy(Cypress, 'emit').log(false)

        cy.stub(Cypress, 'backend').log(false)
        .withArgs('resolve:url')
        .rejects(err1)

        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(err.message).to.include(stripIndent`\
            \`cy.visit()\` failed trying to load:

            http://localhost:3500/foo.html

            We attempted to make an http request to this URL but the request failed without a response.

            We received this error at the network level:

              > Error: connect ECONNREFUSED 127.0.0.1:64646

            Common situations why this would fail:
              - you don't have internet access
              - you forgot to run / boot your web server
              - your web server isn't accessible
              - you have weird network configuration settings on your computer`)

          expect(err1.url).to.include('/foo.html')
          expect(emit).to.be.calledWith('visit:failed', err1)
          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.visit('/foo.html')
      })

      it('displays loading_file_failed when _resolveUrl resp is not ok', function (done) {
        const obj = {
          isOkStatusCode: false,
          isHtml: true,
          contentType: 'text/html',
          originalUrl: '/foo.html',
          filePath: '/path/to/foo.html',
          status: 404,
          statusText: 'Not Found',
          redirects: [],
        }

        obj.url = obj.originalUrl

        cy.stub(Cypress, 'backend').log(false)
        .withArgs('resolve:url')
        .resolves(obj)

        // dont log else we create an endless loop!
        const emit = cy.spy(Cypress, 'emit').log(false)

        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(err.message).to.include(stripIndent`\
            \`cy.visit()\` failed trying to load:

            /foo.html

            We failed looking for this file at the path:

            /path/to/foo.html

            The internal Cypress web server responded with:

              > 404: Not Found`)

          expect(emit).to.be.calledWithMatch('visit:failed', obj)
          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.visit('/foo.html')
      })

      it('displays loading_file_failed redirects when _resolveUrl resp is not ok', function (done) {
        const obj = {
          isOkStatusCode: false,
          isHtml: true,
          contentType: 'text/html',
          originalUrl: '/bar',
          filePath: '/path/to/bar/',
          status: 404,
          statusText: 'Not Found',
          redirects: [
            '301: http://localhost:3500/bar/',
          ],
        }

        obj.url = obj.originalUrl

        cy.stub(Cypress, 'backend').log(false)
        .withArgs('resolve:url')
        .resolves(obj)

        // dont log else we create an endless loop!
        const emit = cy.spy(Cypress, 'emit').log(false)

        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(err.message).to.include(stripIndent`\
            \`cy.visit()\` failed trying to load:

            /bar

            We failed looking for this file at the path:

            /path/to/bar/

            The internal Cypress web server responded with:

              > 404: Not Found

            We were redirected '1' time to:

              - 301: http://localhost:3500/bar/`)

          expect(emit).to.be.calledWithMatch('visit:failed', obj)
          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.visit('/bar')
      })

      it('displays loading_http_failed when _resolveUrl resp is not ok', function (done) {
        const obj = {
          isOkStatusCode: false,
          isHtml: true,
          contentType: 'text/html',
          originalUrl: 'https://google.com/foo',
          status: 500,
          statusText: 'Server Error',
          redirects: [],
        }

        obj.url = obj.originalUrl

        cy.stub(Cypress, 'backend').log(false)
        .withArgs('resolve:url', 'https://google.com/foo')
        .resolves(obj)

        // dont log else we create an endless loop!
        const emit = cy.spy(Cypress, 'emit').log(false)

        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(err.message).to.include(stripIndent`\
            \`cy.visit()\` failed trying to load:

            https://google.com/foo

            The response we received from your web server was:

              > 500: Server Error

            This was considered a failure because the status code was not \`2xx\`.

            If you do not want status codes to cause failures pass the option: \`failOnStatusCode: false\``)

          expect(emit).to.be.calledWithMatch('visit:failed', obj)
          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.visit('https://google.com/foo')
      })

      it('displays loading_http_failed redirects when _resolveUrl resp is not ok', function (done) {
        const obj = {
          isOkStatusCode: false,
          isHtml: true,
          contentType: 'text/html',
          originalUrl: 'https://google.com/foo',
          status: 401,
          statusText: 'Unauthorized',
          redirects: [
            '302: https://google.com/bar/',
            '301: https://gmail.com/',
          ],
        }

        obj.url = obj.originalUrl

        cy.stub(Cypress, 'backend').log(false)
        .withArgs('resolve:url', 'https://google.com/foo')
        .resolves(obj)

        // dont log else we create an endless loop!
        const emit = cy.spy(Cypress, 'emit').log(false)

        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(err.message).to.include(stripIndent`\
            \`cy.visit()\` failed trying to load:

            https://google.com/foo

            The response we received from your web server was:

              > 401: Unauthorized

            This was considered a failure because the status code was not \`2xx\`.

            This http request was redirected '2' times to:

              - 302: https://google.com/bar/
              - 301: https://gmail.com/

            If you do not want status codes to cause failures pass the option: \`failOnStatusCode: false\``)

          expect(emit).to.be.calledWithMatch('visit:failed', obj)
          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.visit('https://google.com/foo')
      })

      // https://github.com/cypress-io/cypress/issues/8506
      it('accepts text/html; + parameter as content-type', () => {
        cy.visit('http://localhost:3500/html-content-type-with-charset-param')
      });

      // https://github.com/cypress-io/cypress/issues/3101
      [{
        contentType: 'application/json',
        pathName: 'json-content-type',
      }, {
        contentType: 'text/image',
        pathName: 'invalid-content-type',
      }]
      .forEach(({ contentType, pathName }) => {
        it(`displays loading_invalid_content_type when content type is ${contentType} on http requests`, function (done) {
          cy.on('fail', (err) => {
            const { lastLog } = this

            expect(err.message).to.include(stripIndent`\
              \`cy.visit()\` failed trying to load:

              http://localhost:3500/${pathName}

              The \`content-type\` of the response we received from your web server was:

                > \`${contentType}\`

              This was considered a failure because responses must have \`content-type: 'text/html'\`

              However, you can likely use \`cy.request()\` instead of \`cy.visit()\`.

              \`cy.request()\` will automatically get and set cookies and enable you to parse responses.`)

            assertLogLength(this.logs, 1)
            expect(lastLog.get('error')).to.eq(err)

            done()
          })

          cy.visit(`http://localhost:3500/${pathName}`)
        })
      })

      it('displays loading_invalid_content_type when isHtml is false on file requests', function (done) {
        const obj = {
          isOkStatusCode: true,
          isHtml: false,
          filePath: '/path/to/bar/',
          contentType: 'application/json',
          originalUrl: 'https://google.com/foo',
          status: 200,
          statusText: 'OK',
        }

        obj.url = obj.originalUrl

        cy.stub(Cypress, 'backend').log(false)
        .withArgs('resolve:url', 'https://google.com/foo')
        .resolves(obj)

        // dont log else we create an endless loop!
        const emit = cy.spy(Cypress, 'emit').log(false)

        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(err.message).to.include(stripIndent`\
            \`cy.visit()\` failed trying to load:

            https://google.com/foo

            The \`content-type\` of the response we received from this local file was:

              > \`application/json\`

            This was considered a failure because responses must have \`content-type: 'text/html'\`

            However, you can likely use \`cy.request()\` instead of \`cy.visit()\`.

            \`cy.request()\` will automatically get and set cookies and enable you to parse responses.`)

          expect(emit).to.be.calledWithMatch('visit:failed', obj)
          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.visit('https://google.com/foo')
      })

      it('displays body_circular when body is circular', function (done) {
        const foo = {
          bar: {
            baz: {},
          },
        }

        foo.bar.baz.quux = foo

        cy.visit({
          method: 'POST',
          url: 'http://foo.invalid/',
          body: foo,
        })

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq(stripIndent`\
            The \`body\` parameter supplied to \`cy.visit()\` contained a circular reference at the path "bar.baz.quux".

            \`body\` can only be a string or an object with no circular references.`)

          expect(err.docsUrl).to.eq('https://on.cypress.io/visit')

          done()
        })
      })
    })
  })

  // TODO(webkit): fix+unskip for webkit release
  context('#page load', { browser: '!webkit' }, () => {
    it('sets initial=true and then removes', () => {
      Cookie.remove('__cypress.initial')

      expect(Cookie.get('__cypress.initial')).to.be.undefined

      let expected = false

      cy.on('window:before:unload', () => {
        expected = true

        expect(Cookie.get('__cypress.initial')).to.eq('true')
      })

      // this navigates us to a new page so
      // we should be setting the initial cookie
      cy
      .visit('/fixtures/form.html')
      .then(() => {
        cy.once('window:unload', () => {
          expect(cy.state('onPageLoadErr')).to.be.a('function')
        })

        return null
      })
      .get('a:first').click().then(() => {
        const listeners = cy.listeners('window:load')

        // everything should have unbound properly
        expect(listeners.length).to.eq(0)

        expect(expected).to.be.true

        expect(cy.state('onPageLoadErr')).to.be.null

        expect(Cookie.get('__cypress.initial')).to.be.undefined
      })
    })

    // TODO: broken - https://github.com/cypress-io/cypress/issues/4973 (chrome76+ and firefox)
    it.skip('does not reset the timeout', (done) => {
      cy.timeout(1000)

      // previously loading would reset the timeout
      // which could cause failures on the next test
      // if there was logic after a test finished running
      cy.window().then((win) => {
        const timeout = cy.spy(cy, 'timeout')

        // we are unstable at this point
        cy.on('window:before:unload', () => {
          cy.whenStable(() => {
            expect(timeout).not.to.be.called

            done()
          })
        })

        win.location.href = 'about:blank'
      })
    })

    it('does not time out current commands until stability is reached', () => {
      // on the first retry cause a page load event synchronously
      cy.on('command:retry', (options) => {
        switch (options._retries) {
          case 1: {
            const win = cy.state('window')

            // load a page which times out after 500ms
            // to guarantee that url does not time out
            const $a = win.$('<a href=\'/timeout?ms=500\'>jquery</a>')
            .appendTo(win.document.body)

            causeSynchronousBeforeUnload($a)

            break
          }
          case 2: {
            // on 2nd retry add the DOM element
            const win = cy.state('window')

            $('<div id=\'did-not-exist\'>did not exist<div>')
            .appendTo(win.document.body)

            break
          }
          case 3: {
            // and on the 3rd retry add the class
            cy.state('window')

            $('#did-not-exist').addClass('foo')

            break
          }
          default:
            return
        }
      })

      cy
      .visit('/fixtures/jquery.html')

      // make get timeout after 300ms
      // but even though our page does not load for 500ms
      // this does not time out
      .get('#did-not-exist', { timeout: 300 }).should('have.class', 'foo')
    })

    describe('errors', () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (_attrs, log) => {
          this.lastLog = log
          this.logs?.push(log)
        })

        return null
      })

      describe('can time out', () => {
        let pageLoadTimeout

        before(() => {
          pageLoadTimeout = Cypress.config().pageLoadTimeout
        })

        after(() => {
          Cypress.config('pageLoadTimeout', pageLoadTimeout)
        })

        it('times out', function (done) {
          let thenCalled = false

          cy.once('fail', (err, test) => {
            const { lastLog } = this

            // visit, window, page loading
            assertLogLength(this.logs, 3)

            expect(lastLog.get('name')).to.eq('page load')
            expect(lastLog.get('state')).to.eq('failed')
            expect(lastLog.get('error')).to.eq(err)
            expect(err.message).to.include('Your page did not fire its `load` event within `50ms`.')

            return Promise
            .delay(100)
            .then(() => {
              expect(cy.state('onPageLoadErr')).to.be.null
              expect(cy.isStopped()).to.be.true // make sure we ran our cleanup routine
              expect(thenCalled).to.be.false

              done()
            })
          })

          cy
          .visit('/fixtures/jquery.html')
          .window().then((win) => {
            Cypress.config('pageLoadTimeout', 50)
            const $a = win.$('<a href=\'/timeout?ms=500\'>jquery</a>')
            .appendTo(win.document.body)

            causeSynchronousBeforeUnload($a)

            return null
          })
          .wrap(null)
          .then(() => {
            thenCalled = true
          })
        })
      })

      it('does time out once stability is reached', function (done) {
        const logByName = (name) => {
          return _.find(this.logs, (log) => {
            return log.get('name') === name
          })
        }

        cy.on('fail', (err) => {
          cy.on('command:retry', () => {
            throw new Error('should not have retried twice')
          })

          expect(err.message).to.include('Expected to find element')

          const get = logByName('get')

          expect(get.get('error')).to.eq(err)

          return Promise.delay(200)
          .then(() => {
            expect(cy.isStopped()).to.be.true

            done()
          })
        })

        let start = null

        // on the first retry cause a page load event synchronously
        cy.on('command:retry', (options) => {
          switch (options._retries) {
            case 1: {
              // hold a ref to this
              start = options._start

              const win = cy.state('window')

              // load a page which times out after 400ms
              // to guarantee that url does not time out
              const $a = win.$('<a href=\'/timeout?ms=400\'>jquery</a>')
              .appendTo(win.document.body)

              causeSynchronousBeforeUnload($a)

              // immediately logs pending state
              expect(logByName('page load').get('state')).to.eq('pending')
            }
              break
            case 2: {
              // it should have reset this because we became
              // unstable
              expect(start).not.to.eq(options._start)

              // and by the time we retry for the 2nd time
              // the page should be loaded
              expect(logByName('page load').get('state')).to.eq('passed')
            }
              break
            default:
              return
          }
        })

        cy.visit('/fixtures/jquery.html')

        // make get timeout after only 200ms
        .get('#does-not-exist', { timeout: 200 }).should('have.class', 'foo')
      })

      return null
    })
  })

  // this tests isLoading spinner and page load event
  context('#page loading', () => {
    beforeEach(function () {
      this.logs = []

      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'page load') {
          this.lastLog = log
          this.logs.push(log)
        }
      })

      return null
    })

    // FIXME: fix flaky test (webkit): https://github.com/cypress-io/cypress/issues/24600
    it('emits \'page:loading\' before and after initial visit', { browser: '!webkit' }, () => {
      const emit = cy.spy(Cypress, 'emit').log(false).withArgs('page:loading')

      cy
      .visit('/timeout?ms=10', {
        onBeforeLoad () {
          expect(emit).to.be.calledOnce
          expect(emit.getCall(0)).to.be.calledWith('page:loading', true)
        },
      })
      .then(() => {
        expect(emit).to.be.calledTwice
        expect(emit.getCall(1)).to.be.calledWith('page:loading', false)
      })
    })

    // FIXME: fix flaky test (webkit): https://github.com/cypress-io/cypress/issues/24600
    it('emits during page navigation', { browser: '!webkit' }, () => {
      const emit = cy.spy(Cypress, 'emit').log(false).withArgs('page:loading')
      let expected = false

      cy
      .visit('/fixtures/generic.html')
      .then(() => {
        cy.once('window:unload', () => {
          expected = true
          expect(emit.callCount).to.eq(3)
          expect(emit.getCall(2)).to.be.calledWith('page:loading', true)
        })
      }).get('#dimensions').click()
      .then(() => {
        expect(expected).to.be.true
        expect(emit.callCount).to.eq(4)
        expect(emit.getCall(3)).to.be.calledWith('page:loading', false)
      })
    })

    it('does not log during initial visit', () => {
      cy.visit('/timeout?ms=10').then(function () {
        expect(this.lastLog).not.to.exist
      })
    })

    // FIXME: fix flaky test (webkit): https://github.com/cypress-io/cypress/issues/24600
    it('logs during page navigation', { browser: '!webkit' }, () => {
      let expected = false

      cy
      .visit('/fixtures/generic.html')
      .then(function () {
        cy.once('window:before:unload', () => {
          expected = true

          expect(this.lastLog).to.exist
          expect(this.lastLog.get('state')).to.eq('pending')
          expect(this.lastLog.get('message')).to.eq('--waiting for new page to load--')
          expect(this.lastLog.get('snapshots')).to.have.length(0)
        })
      }).get('#dimensions').click()
      .then(function () {
        expect(expected).to.be.true
        expect(this.lastLog.get('state')).to.eq('passed')
        expect(this.lastLog.get('message')).to.eq('--page loaded--')
        expect(this.lastLog.get('snapshots')).to.have.length(1)
      })
    })

    // FIXME: fix flaky test (webkit): https://github.com/cypress-io/cypress/issues/24600
    it('logs during form submission and yields stale element', { browser: '!webkit' }, () => {
      let expected = false

      const names = cy.queue.names()

      cy
      .visit('/fixtures/form.html')
      .then(function () {
        const $input = cy.$$('form#click-me input[type=submit]')

        cy.once('window:before:unload', () => {
          expected = true

          expect(this.lastLog).to.exist
          expect(this.lastLog.get('state')).to.eq('pending')
          expect(this.lastLog.get('message')).to.eq('--waiting for new page to load--')
          expect(this.lastLog.get('snapshots')).to.have.length(0)
        })

        cy
        .get('form#click-me')
        .find('input[type=submit]')
        .click()
        .then(function (subject) {
          expect(expected).to.be.true

          expect(this.lastLog.get('state')).to.eq('passed')
          expect(this.lastLog.get('message')).to.eq('--page loaded--')
          expect(this.lastLog.get('snapshots')).to.have.length(1)

          expect(cy.queue.names()).to.deep.eq(names.concat([
            'visit', 'then', 'get', 'find', 'click', 'then',
          ]))

          expect(Cypress.dom.isDetached(subject)).to.be.true
          expect(subject.get(0)).to.eq($input.get(0))
        })
      })
    })

    it('tests waiting on stability at the end of the command queue', (done) => {
      cy
      .visit('/fixtures/generic.html')
      .then((win) => {
        cy.on('window:load', () => {
          cy.on('command:queue:end', () => {
            done()
          })
        })

        cy.on('command:queue:before:end', () => {
          // force us to become unstable immediately
          // else the beforeunload event fires at the end
          // of the tick which is too late
          cy.isStable(false, 'testing')

          win.location.href = '/timeout?ms=100'
        })

        return null
      })
    })
  })

  // TODO(webkit): fix+unskip for webkit release
  context('#url:changed', { browser: '!webkit' }, () => {
    beforeEach(function () {
      this.logs = []

      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'new url') {
          this.lastLog = log
          this.logs.push(log)
        }
      })

      return null
    })

    describe('page navigation', () => {
      it('emits url:changed event on initial visit', () => {
        const emit = cy.spy(Cypress, 'emit').log(false).withArgs('url:changed')

        cy
        .visit('/fixtures/generic.html')
        .then(() => {
          expect(emit).to.be.calledOnce
          expect(emit).to.be.calledWith(
            'url:changed',
            'http://localhost:3500/fixtures/generic.html',
          )
        })
      })

      it('emits url:changed on 2nd visit to different page', () => {
        const emit = cy.spy(Cypress, 'emit').log(false).withArgs('url:changed')

        cy
        .visit('/fixtures/generic.html')
        .visit('/fixtures/jquery.html')
        .then(() => {
          expect(emit).to.be.calledTwice

          expect(emit).to.be.calledWith(
            'url:changed',
            'http://localhost:3500/fixtures/generic.html',
          )

          expect(emit).to.be.calledWith(
            'url:changed',
            'http://localhost:3500/fixtures/jquery.html',
          )
        })
      })

      it('does not emit url:changed twice on visit to the same page', () => {
        const emit = cy.spy(Cypress, 'emit').log(false).withArgs('url:changed')

        cy
        .visit('/fixtures/generic.html')
        .visit('/fixtures/generic.html')
        .then(() => {
          expect(emit).to.be.calledOnce
          expect(emit).to.be.calledWith(
            'url:changed',
            'http://localhost:3500/fixtures/generic.html',
          )
        })
      })

      it('does not log url:changed event on visit', () => {
        cy
        .visit('/fixtures/generic.html')
        .then(function () {
          expect(this.lastLog).not.to.exist
        })
      })

      it('emits url:changed event on page navigation', () => {
        const emit = cy.spy(Cypress, 'emit').log(false).withArgs('url:changed')

        cy
        .visit('/fixtures/generic.html')
        .get('#dimensions').click()
        .then(() => {
          expect(emit).to.be.calledTwice

          expect(emit).to.be.calledWith(
            'url:changed',
            'http://localhost:3500/fixtures/generic.html',
          )

          expect(emit).to.be.calledWith(
            'url:changed',
            'http://localhost:3500/fixtures/dimensions.html',
          )
        })
      })

      it('logs url:changed event on page navigation', () => {
        cy
        .visit('/fixtures/generic.html')
        .get('#dimensions').click()
        .then(function () {
          assertLogLength(this.logs, 1)

          expect(this.logs[0].get('message')).to.eq(
            'http://localhost:3500/fixtures/dimensions.html',
          )

          expect(this.logs[0].invoke('consoleProps')).to.deep.eq({
            name: 'new url',
            type: 'event',
            props: {
              'New Url': 'http://localhost:3500/fixtures/dimensions.html',
              'Url Updated By': 'page navigation event (before:load)',
            },
          })
        })
      })
    })

    describe('hashchange events', () => {
      it('emits url:changed event', () => {
        const emit = cy.spy(Cypress, 'emit').log(false)

        cy
        .visit('/fixtures/generic.html')
        .get('#hashchange').click()
        .then(() => {
          expect(emit).to.be.calledWith(
            'url:changed',
            'http://localhost:3500/fixtures/generic.html#hashchange',
          )
        })
      })

      it('emits url:changed event as navigation events occur', () => {
        const emit = cy.spy(Cypress, 'emit').log(false).withArgs('url:changed')

        cy
        .visit('/fixtures/generic.html')
        .get('#hashchange').click()
        .window().then((win) => {
          return new Promise((resolve) => {
            cy.once('navigation:changed', resolve)

            win.history.back()
          }).then(() => {
            return new Promise((resolve) => {
              cy.once('navigation:changed', resolve)

              win.history.forward()
            })
          }).then(() => {
            expect(emit.callCount).to.eq(4)

            expect(emit.getCall(0)).to.be.calledWith(
              'url:changed',
              'http://localhost:3500/fixtures/generic.html',
            )

            expect(emit.getCall(1)).to.be.calledWith(
              'url:changed',
              'http://localhost:3500/fixtures/generic.html#hashchange',
            )

            expect(emit.getCall(2)).to.be.calledWith(
              'url:changed',
              'http://localhost:3500/fixtures/generic.html',
            )

            expect(emit.getCall(3)).to.be.calledWith(
              'url:changed',
              'http://localhost:3500/fixtures/generic.html#hashchange',
            )
          })
        })
      })

      describe('filters page load events when going back with window navigation when testIsolation=true', () => {
        // https://github.com/cypress-io/cypress/issues/19230
        it('when going back with window navigation', () => {
          const emit = cy.spy(Cypress, 'emit').log(false).withArgs('navigation:changed')

          cy
          .visit('/fixtures/generic.html')
          .get('#hashchange').click()
          .window().then((win) => {
            return new Promise((resolve) => {
              cy.once('navigation:changed', resolve)

              win.history.back()
            }).then(() => {
              return new Promise((resolve) => {
                cy.once('navigation:changed', resolve)

                win.history.forward()
              })
            })
          })

          cy.get('#dimensions').click()
          .window().then((win) => {
            return new Promise((resolve) => {
              cy.on('navigation:changed', (event) => {
                if (event.includes('(load)')) {
                  resolve()
                }
              })

              win.history.back()
            })
            .then(() => {
              return new Promise((resolve) => {
                cy.on('navigation:changed', resolve)
                win.history.back()
              })
            })
            .then(() => {
              expect(emit.getCall(0)).to.be.calledWith(
                'navigation:changed',
                'page navigation event (before:load)',
              )

              expect(emit.getCall(1)).to.be.calledWith(
                'navigation:changed',
                'page navigation event (load)',
              )

              expect(emit.getCall(2)).to.be.calledWith(
                'navigation:changed',
                'hashchange',
              )

              expect(emit.getCall(3)).to.be.calledWithMatch(
                'navigation:changed',
                'hashchange',
              )

              expect(emit.getCall(4)).to.be.calledWithMatch(
                'navigation:changed',
                'hashchange',
              )

              expect(emit.getCall(5)).to.be.calledWithMatch(
                'navigation:changed',
                'page navigation event (before:load)',
              )

              expect(emit.getCall(6)).to.be.calledWith(
                'navigation:changed',
                'page navigation event (load)',
              )

              expect(emit.getCall(7)).to.be.calledWith(
                'navigation:changed',
                'page navigation event (before:load)',
              )

              expect(emit.getCall(8)).to.be.calledWith(
                'navigation:changed',
                'page navigation event (load)',
              )

              expect(emit.getCall(9)).to.be.calledWith(
                'navigation:changed',
                'hashchange',
              )

              expect(emit.callCount).to.eq(10)
            })
          })
        })
      })

      it('logs url changed event', () => {
        cy
        .visit('/fixtures/generic.html')
        .window().then((win) => {
          let ohc = null

          win.onhashchange = (event) => {
            ohc = event
          }

          cy
          .get('#hashchange').click()
          .then(function () {
            const { lastLog } = this

            expect(lastLog.get('message')).to.eq('http://localhost:3500/fixtures/generic.html#hashchange')
            expect(lastLog.get('type')).to.eq('parent')
            expect(lastLog.get('event')).to.be.true

            expect(lastLog.invoke('consoleProps')).to.deep.eq({
              name: 'new url',
              type: 'event',
              props: {
                'New Url': 'http://localhost:3500/fixtures/generic.html#hashchange',
                'Url Updated By': 'hashchange',
                'Args': ohc,
              },
            })
          })
        })
      })

      it('logs url:changed event as navigation events occur', () => {
        cy
        .visit('/fixtures/generic.html')
        .get('#hashchange').click()
        .window().then((win) => {
          return new Promise((resolve) => {
            cy.once('navigation:changed', resolve)

            win.history.back()
          }).then(() => {
            return new Promise((resolve) => {
              cy.once('navigation:changed', resolve)

              win.history.forward()
            })
          })
        }).then(function () {
          assertLogLength(this.logs, 3)

          expect(this.logs[0].get('message')).to.eq(
            'http://localhost:3500/fixtures/generic.html#hashchange',
          )

          expect(this.logs[1].get('message')).to.eq(
            'http://localhost:3500/fixtures/generic.html',
          )

          expect(this.logs[2].get('message')).to.eq(
            'http://localhost:3500/fixtures/generic.html#hashchange',
          )
        })
      })
    })

    describe('history.pushState', () => {
      it('emits url:changed event', (done) => {
        let times = 1

        const listener = (url) => {
          if (times === 1) {
            expect(url).to.eq('http://localhost:3500/fixtures/generic.html')
          }

          if (times === 2) {
            expect(url).to.eq('http://localhost:3500/fixtures/pushState.html')
            Cypress.removeListener('url:changed', listener)
            done()
          }

          times++
        }

        Cypress.on('url:changed', listener)

        cy
        .visit('/fixtures/generic.html')
        .window().then((win) => {
          win.history.pushState({ foo: 'bar' }, null, 'pushState.html')
        })
      })

      it('logs url changed event', () => {
        cy
        .visit('/fixtures/generic.html')
        .window().then(function (win) {
          win.history.pushState({ foo: 'bar' }, null, 'pushState.html')

          const { lastLog } = this

          expect(lastLog.get('message')).to.eq('http://localhost:3500/fixtures/pushState.html')
          expect(lastLog.get('type')).to.eq('parent')
          expect(lastLog.get('event')).to.be.true
          expect(lastLog.invoke('consoleProps')).to.deep.eq({
            name: 'new url',
            type: 'event',
            props: {
              'New Url': 'http://localhost:3500/fixtures/pushState.html',
              'Url Updated By': 'pushState',
              'Args': [
                { foo: 'bar' },
                null,
                'pushState.html',
              ],
            },
          })
        })
      })
    })

    describe('history.replaceState', () => {
      it('emits url:changed event', (done) => {
        let times = 1

        const listener = (url) => {
          if (times === 1) {
            expect(url).to.eq('http://localhost:3500/fixtures/generic.html')
          }

          if (times === 2) {
            expect(url).to.eq('http://localhost:3500/fixtures/replaceState.html')
            Cypress.removeListener('url:changed', listener)
            done()
          }

          times++
        }

        Cypress.on('url:changed', listener)

        cy
        .visit('/fixtures/generic.html')
        .window().then((win) => {
          win.history.replaceState({ foo: 'bar' }, null, 'replaceState.html')
        })
      })

      it('logs url changed event', () => {
        cy
        .visit('/fixtures/generic.html')
        .window().then(function (win) {
          win.history.replaceState({ foo: 'bar' }, null, 'replaceState.html')

          const { lastLog } = this

          expect(lastLog.get('message')).to.eq('http://localhost:3500/fixtures/replaceState.html')
          expect(lastLog.get('type')).to.eq('parent')
          expect(lastLog.get('event')).to.be.true
          expect(lastLog.invoke('consoleProps')).to.deep.eq({
            name: 'new url',
            type: 'event',
            props: {
              'New Url': 'http://localhost:3500/fixtures/replaceState.html',
              'Url Updated By': 'replaceState',
              'Args': [
                { foo: 'bar' },
                null,
                'replaceState.html',
              ],
            },
          })
        })
      })
    })
  })

  context('#form sub', () => {
    beforeEach(function () {
      this.logs = []

      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'form sub') {
          this.lastLog = log
          this.logs.push(log)
        }
      })

      return null
    })

    // FIXME: fix flaky test (webkit): https://github.com/cypress-io/cypress/issues/24600
    it('logs \'form sub\'', { browser: '!webkit' }, () => {
      let event = null

      cy
      .visit('/fixtures/form.html')
      .then(() => {
        const $form = cy.$$('#click-me').on('submit', (e) => {
          event = e.originalEvent
        })

        cy
        .get('#click-me').find('input[type=submit]').click()
        .then(function () {
          assertLogLength(this.logs, 1)

          expect(this.logs[0].get('message')).to.eq(
            '--submitting form--',
          )

          expect(this.logs[0].invoke('consoleProps')).to.deep.eq({
            name: 'form sub',
            type: 'event',
            props: {
              'Originated From': $form.get(0),
              'Args': event,
            },
          })
        })
      })
    })
  })

  context('resets state', () => {
    it('resets the server state', () => {
      cy.stub(Cypress, 'backend').log(false).callThrough()

      Cypress.emitThen('test:before:run:async', {
        id: 'r1',
        currentRetry: 1,
      })
      .then(() => {
        expect(Cypress.backend).to.be.calledWith('reset:server:state')
      })
    })
  })
})

const causeSynchronousBeforeUnload = function ($a) {
  // this causes a synchronous beforeunload event
  // chrome & firefox behave differently
  const win = $a[0].ownerDocument.defaultView

  if (Cypress.isBrowser('firefox')) {
    win.location.href = $a[0].href
  } else {
    return $a.get(0).click()
  }
}
