export {} // make typescript see this as a module

const { _, Promise } = Cypress

type FooWindow = Cypress.AUTWindow & { foo?: string }

describe('src/cy/commands/navigation', () => {
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
        win.sessionStorage.setItem('redirectCount', '21')
      })

      cy.visit('fixtures/redirection-loop-a.html')
    })

    describe('when only hashes are changing when testIsolation=true', () => {
      it('short circuits the visit if the page will not refresh', () => {
        let count = 0
        const urls: string[] = []

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

    // https://github.com/cypress-io/cypress/issues/652
    it('fires hashchange for each visit to the same URL with a different hash', () => {
      cy.visit('/fixtures/issue-652.html')
      cy.visit('/fixtures/issue-652.html#one')
      cy.visit('/fixtures/issue-652.html#two')
      cy.visit('/fixtures/issue-652.html#three')

      cy.get('#visited')
      .should('contain', 'one')
      .should('contain', 'two')
      .should('contain', 'three')
    })

    // https://github.com/cypress-io/cypress/issues/3975
    describe('page that redirects from an XHR onload handler', () => {
      it('lands on the redirected URL', () => {
        cy.visit('/fixtures/nested/3975_a.html')
        cy.get('h1').should('contain', 'Loaded')
        cy.url().should('include', 'b.html')
      })

      it('lands on the redirected URL across repeated visits', () => {
        cy.visit('/fixtures/nested/3975_a.html')
        cy.get('h1').should('contain', 'Loaded')
        cy.url().should('include', 'b.html')
        cy.visit('/fixtures/nested/3975_a.html')
        cy.get('h1').should('contain', 'Loaded')
        cy.url().should('include', 'b.html')
      })

      it('intercepts XHR onload and preserves window.event on about:blank', () => {
        const win = cy.state('window')
        const x = new win.XMLHttpRequest()

        function onloadFn (e) {
          if (x.onload === onloadFn) {
            throw new Error('onload not intercepted')
          }

          if (win.event !== e) {
            throw new Error('Wrong win.event')
          }
        }

        x.onload = onloadFn

        x.open('GET', '/fixtures/nested/3975_a.html')
        x.send()
      })
    })

    // https://github.com/cypress-io/cypress/issues/1311
    // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23201
    it('window immediately resolves and doesn\'t reload when visiting the same URL with hashes', { retries: 15 }, () => {
      const onLoad = cy.stub()

      cy
      .visit('http://localhost:3500/fixtures/generic.html#foo').then((win: FooWindow) => {
        win.foo = 'bar'
      })
      .visit('http://localhost:3500/fixtures/generic.html#foo', {
        onLoad,
      })
      .then((win: FooWindow) => {
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
      let mockGetTestsState

      beforeEach(() => {
        Cypress.emit('test:before:run', { id: 'r2' })

        cy.stub(Cypress.runner, 'getEmissions').returns([])
        mockGetTestsState = cy.stub(Cypress.runner, 'getTestsState').returns([])
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

        cy.visit('http://localhost:4200').then(() => {
          expect(mockGetTestsState).to.be.calledWith('r2')
        })
      })

      it('replaces window.location when origins don\'t match', (done) => {
        const fn = function (str, win) {
          const isEqual = win === top?.window

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

        cy.visit('http://localhost:4200').then(() => {
          expect(mockGetTestsState).to.be.calledWith('r2')
        })
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

      it('can turn off logging when protocol is disabled', function () {
        cy.state('isProtocolEnabled', false)
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy.visit('/timeout?ms=0', { log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', function () {
        cy.state('isProtocolEnabled', true)
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
        // @ts-expect-error - notReal is not a visit option
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
  })
})
