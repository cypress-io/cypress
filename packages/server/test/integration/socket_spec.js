require('../spec_helper')

const _ = require('lodash')
const path = require('path')
const Promise = require('bluebird')
const socketIo = require('@packages/socket/lib/browser')
const httpsAgent = require('https-proxy-agent')

const errors = require('../../lib/errors')
const { SocketE2E } = require('../../lib/socket-e2e')
const { ServerE2E } = require('../../lib/server-e2e')
const { Automation } = require('../../lib/automation')
const exec = require('../../lib/exec')

const Fixtures = require('@tooling/system-tests')
const firefoxUtil = require('../../lib/browsers/firefox-util').default
const { createRoutes } = require('../../lib/routes')
const { getCtx } = require('../../lib/makeDataContext')
const { sinon } = require('../spec_helper')

let ctx

describe('lib/socket-e2e', () => {
  beforeEach(async function () {
    ctx = getCtx()
    ctx.coreData.activeBrowser = {
      path: 'path-to-browser-one',
    }

    // Don't bother initializing the child process, etc for this
    sinon.stub(ctx.actions.project, 'initializeActiveProject')

    Fixtures.scaffold()

    this.todosPath = Fixtures.projectPath('todos')

    this.server = new ServerE2E()

    await ctx.actions.project.setCurrentProjectAndTestingTypeForTestSetup(this.todosPath)

    await ctx.lifecycleManager.getFullInitialConfig()
    .then((cfg) => {
      this.cfg = cfg
    })

    // create a real socket.io connection
    // so we can test server emit / client emit events
    this.server.open(this.cfg, {
      SocketCtor: SocketE2E,
      createRoutes,
      testingType: 'e2e',
      getCurrentBrowser: () => null,
    })
    .then(() => {
      this.options = {
        onSavedStateChanged: sinon.spy(),
      }

      this.automation = new Automation(this.cfg.namespace, this.cfg.socketIoCookie, this.cfg.screenshotsFolder)

      this.server.startWebsockets(this.automation, this.cfg, this.options)
      this.socket = this.server._socket

      done = _.once(done)

      // when our real client connects then we're done
      this.socket.io.on('connection', (socket) => {
        this.socketClient = socket

        return done()
      })

      const { proxyUrl, socketIoRoute } = this.cfg

      // force node into legit proxy mode like a browser
      this.agent = new httpsAgent(`http://localhost:${this.cfg.port}`)

      this.client = socketIo.client(proxyUrl, {
        agent: this.agent,
        path: socketIoRoute,
        transports: ['websocket'],
      })
    })
  })

  afterEach(function () {
    Fixtures.remove()
    this.client.disconnect()

    return this.server.close()
  })

  // https://github.com/cypress-io/cypress/issues/4346
  it('can emit a circular object without crashing', function (done) {
    const foo = {
      bar: {},
    }

    foo.bar.baz = foo

    // going to stub exec here just so we have something that we can
    // control the resolved value of
    sinon.stub(exec, 'run').resolves(foo)

    return this.client.emit('backend:request', 'exec', 'quuz', (res) => {
      expect(res.response).to.deep.eq(foo)

      return done()
    })
  })

  context('on(automation:request)', () => {
    describe('#onAutomation', () => {
      let extensionBackgroundPage = null
      let chrome

      before(() => {
        global.window = {}

        chrome = global.chrome = {
          cookies: {
            set () {},
            getAll () {},
            remove () {},
            onChanged: {
              addListener () {},
            },
          },
          downloads: {
            onCreated: {
              addListener () {},
            },
            onChanged: {
              addListener () {},
            },
          },
          runtime: {

          },
          tabs: {
            query () {},
            executeScript () {},
          },
          webRequest: {
            onBeforeSendHeaders: {
              addListener () {},
            },
          },
        }

        extensionBackgroundPage = require('@packages/extension/app/background')
      })

      beforeEach(function (done) {
        this.socket.io.on('connection', (extClient) => {
          this.extClient = extClient

          return this.extClient.on('automation:client:connected', () => {
            return done()
          })
        })

        return extensionBackgroundPage.connect(this.cfg.proxyUrl, this.cfg.socketIoRoute, { agent: this.agent })
      })

      afterEach(function () {
        return this.extClient.disconnect()
      })

      after(() => {
        chrome = null
      })

      it('does not return cypress namespace or socket io cookies', function (done) {
        sinon.stub(chrome.cookies, 'getAll')
        .withArgs({ domain: 'localhost' })
        .yieldsAsync([
          { name: 'foo', value: 'f', path: '/', domain: 'localhost', secure: true, httpOnly: true, expirationDate: 123, a: 'a', b: 'c' },
          { name: 'bar', value: 'b', path: '/', domain: 'localhost', secure: false, httpOnly: false, expirationDate: 456, c: 'a', d: 'c' },
          { name: '__cypress.foo', value: 'b', path: '/', domain: 'localhost', secure: false, httpOnly: false, expirationDate: 456, c: 'a', d: 'c' },
          { name: '__cypress.bar', value: 'b', path: '/', domain: 'localhost', secure: false, httpOnly: false, expirationDate: 456, c: 'a', d: 'c' },
          { name: '__socket', value: 'b', path: '/', domain: 'localhost', secure: false, httpOnly: false, expirationDate: 456, c: 'a', d: 'c' },
        ])

        return this.client.emit('automation:request', 'get:cookies', { domain: 'localhost' }, (resp) => {
          expect(resp).to.deep.eq({
            response: [
              { name: 'foo', value: 'f', path: '/', domain: 'localhost', secure: true, httpOnly: true, expiry: 123 },
              { name: 'bar', value: 'b', path: '/', domain: 'localhost', secure: false, httpOnly: false, expiry: 456 },
            ],
          })

          return done()
        })
      })

      it('does not clear any namespaced cookies', function (done) {
        sinon.stub(chrome.cookies, 'getAll')
        .withArgs({ name: 'session', domain: 'google.com' })
        .yieldsAsync([
          { name: 'session', value: 'key', path: '/', domain: 'google.com', secure: true, httpOnly: true, expirationDate: 123, a: 'a', b: 'c' },
        ])

        sinon.stub(chrome.cookies, 'remove')
        .withArgs({ name: 'session', url: 'https://google.com/' })
        .yieldsAsync(
          { name: 'session', url: 'https://google.com/', storeId: '123' },
        )

        const cookies = [
          { name: 'session', value: 'key', path: '/', domain: 'google.com', secure: true, httpOnly: true, expiry: 123 },
          { domain: 'localhost', name: '__cypress.initial', value: true },
          { domain: 'localhost', name: '__socket', value: '123abc' },
        ]

        return this.client.emit('automation:request', 'clear:cookies', cookies, (resp) => {
          expect(resp).to.deep.eq({
            response: [
              { name: 'session', value: 'key', path: '/', domain: 'google.com', secure: true, httpOnly: true, expiry: 123 },
            ],
          })

          return done()
        })
      })

      it('throws trying to clear namespaced cookie')

      it('throws when automation:response has an error in it')

      it('throws when no clients connected to automation', function (done) {
        this.extClient.disconnect()

        return this.client.emit('automation:request', 'get:cookies', { domain: 'foo' }, (resp) => {
          expect(resp.error.message).to.eq('Could not process \'get:cookies\'. No automation clients connected.')

          return done()
        })
      })

      it('returns early if disconnect event is from another browser', function (done) {
        const delaySpy = sinon.spy(Promise, 'delay')

        this.extClient.on('disconnect', () => {
          expect(delaySpy).to.not.have.been.calledWith(2000)

          return done()
        })

        ctx.coreData.activeBrowser = { path: 'path-to-browser-two' }
        this.extClient.disconnect()
      })

      it('returns true when tab matches magic string', function (done) {
        const code = 'var s; (s = document.getElementById(\'__cypress-string\')) && s.textContent'

        sinon.stub(chrome.tabs, 'query')
        .withArgs({ windowType: 'normal' })
        .yieldsAsync([{ id: 1, url: 'http://localhost' }])

        sinon.stub(chrome.tabs, 'executeScript')
        .withArgs(1, { code })
        .yieldsAsync(['string'])

        return this.client.emit('is:automation:client:connected', { element: '__cypress-string', randomString: 'string' }, (resp) => {
          expect(resp).to.be.true

          return done()
        })
      })

      it('returns true after retrying', function (done) {
        sinon.stub(extensionBackgroundPage, 'query').resolves(true)

        // just force isSocketConnected to return false until the 4th retry
        const iSC = sinon.stub(this.socket, 'isSocketConnected')

        iSC
        .onCall(0).returns(false)
        .onCall(1).returns(false)
        .onCall(2).returns(false)
        .onCall(3).returns(true)

        // oA.resolves(true)

        return this.client.emit('is:automation:client:connected', { element: '__cypress-string', randomString: 'string' }, (resp) => {
          expect(iSC.callCount).to.eq(4)
          // expect(oA.callCount).to.eq(1)

          expect(resp).to.be.true

          return done()
        })
      })

      it('returns false when times out', function (done) {
        const code = 'var s; (s = document.getElementById(\'__cypress-string\')) && s.textContent'

        sinon.stub(chrome.tabs, 'query')
        .withArgs({ url: 'CHANGE_ME_HOST/*', windowType: 'normal' })
        .yieldsAsync([{ id: 1 }])

        sinon.stub(chrome.tabs, 'executeScript')
        .withArgs(1, { code })
        .yieldsAsync(['foobarbaz'])

        // reduce the timeout so we dont have to wait so long
        return this.client.emit('is:automation:client:connected', { element: '__cypress-string', randomString: 'string', timeout: 100 }, (resp) => {
          expect(resp).to.be.false

          return done()
        })
      })

      it('retries multiple times and stops after timing out', function (done) {
        // just force isSocketConnected to return false until the 4th retry
        const iSC = sinon.stub(this.socket, 'isSocketConnected')

        // reduce the timeout so we dont have to wait so long
        return this.client.emit('is:automation:client:connected', { element: '__cypress-string', randomString: 'string', timeout: 200 }, (resp) => {
          const {
            callCount,
          } = iSC

          // it retries every 25ms so explect that
          // this function was called at least 2 times
          expect(callCount).to.be.gt(2)

          expect(resp).to.be.false

          return _.delay(() => {
            // wait another 100ms and make sure
            // that it was canceled and not continuously
            // retried!
            // if we remove Promise.config({cancellation: true})
            // then this will fail. bluebird has changed its
            // cancelation logic before and so we want to use
            // an integration test to ensure this works as expected
            expect(callCount).to.eq(iSC.callCount)

            return done()
          }
          , 1000)
        })
      })
    })

    describe('options.onAutomationRequest', () => {
      beforeEach(function () {
        this.ar = sinon.stub(this.automation, 'request')
      })

      it('calls onAutomationRequest with message and data', function (done) {
        this.ar.withArgs('focus', { foo: 'bar' }).resolves([])

        return this.client.emit('automation:request', 'focus', { foo: 'bar' }, (resp) => {
          expect(resp).to.deep.eq({ response: [] })

          return done()
        })
      })

      it('calls callback with error on rejection', function (done) {
        const error = new Error('foo')

        this.ar.withArgs('focus', { foo: 'bar' }).rejects(error)

        return this.client.emit('automation:request', 'focus', { foo: 'bar' }, (resp) => {
          expect(resp.error.message).to.deep.eq(error.message)

          return done()
        })
      })

      it('does not return __cypress or __socket namespaced cookies', () => {})

      it('throws when onAutomationRequest rejects')

      it('is:automation:client:connected returns true', function (done) {
        this.ar.withArgs('is:automation:client:connected', { randomString: 'foo' }).resolves(true)

        return this.client.emit('is:automation:client:connected', { randomString: 'foo' }, (resp) => {
          expect(resp).to.be.true

          return done()
        })
      })
    })
  })

  context('on(automation:push:request)', () => {
    beforeEach(function (done) {
      this.socketClient.on('automation:client:connected', () => {
        return done()
      })

      return this.client.emit('automation:client:connected')
    })

    it('emits \'automation:push:message\'', function (done) {
      const data = { cause: 'explicit', cookie: { name: 'foo', value: 'bar' }, removed: true }

      const emit = sinon.stub(this.socket.io, 'emit')

      return this.client.emit('automation:push:request', 'change:cookie', data, () => {
        expect(emit).to.be.calledWith('automation:push:message', 'change:cookie', {
          cookie: { name: 'foo', value: 'bar' },
          message: 'Cookie Removed: \'foo\'',
          removed: true,
        })

        return done()
      })
    })
  })

  context('on(watch:test:file)', () => {
    it('calls socket#watchTestFileByPath with config, spec argument', function (done) {
      sinon.stub(this.socket, 'watchTestFileByPath')

      const specArgument = {}

      return this.client.emit('watch:test:file', specArgument, () => {
        expect(this.socket.watchTestFileByPath).to.be.calledWith(this.cfg, specArgument)

        return done()
      })
    })
  })

  context('on(app:connect)', () => {
    it('calls options.onConnect with socketId and socket', function (done) {
      this.options.onConnect = function (socketId, socket) {
        expect(socketId).to.eq('sid-123')
        expect(socket.connected).to.be.true

        return done()
      }

      return this.client.emit('app:connect', 'sid-123')
    })
  })

  context('on(backend:request, preserve:run:state)', () => {
    it('preserves state', function (done) {
      this.client.emit('backend:request', 'preserve:run:state', 'foo')
      this.client.emit('get:existing:run:state', (state) => {
        expect(state).to.eq('foo')
      })
    })

    it('errors when fixtures fails', function (done) {
      const cb = function (resp) {
        expect(resp.error.message).to.include('A fixture file could not be found')
        expect(resp.error.message).to.include('does-not-exist.txt')

        return done()
      }

      return this.client.emit('backend:request', 'get:fixture', 'does-not-exist.txt', {}, cb)
    })

    it('passes Buffers through intact', function (done) {
      const cb = function (resp) {
        expect(resp.response).to.eql(Buffer.from('[{"json": true}]'))

        return done()
      }

      return this.client.emit('backend:request', 'get:fixture', 'foo', { encoding: null }, cb)
    })
  })
  context('on(backend:request, get:fixture)', () => {
    it('returns the fixture object', function (done) {
      const cb = function (resp) {
        expect(resp.response).to.deep.eq([
          { 'json': true },
        ])

        return done()
      }

      return this.client.emit('backend:request', 'get:fixture', 'foo', cb)
    })

    it('errors when fixtures fails', function (done) {
      const cb = function (resp) {
        expect(resp.error.message).to.include('A fixture file could not be found')
        expect(resp.error.message).to.include('does-not-exist.txt')

        return done()
      }

      return this.client.emit('backend:request', 'get:fixture', 'does-not-exist.txt', {}, cb)
    })

    it('passes Buffers through intact', function (done) {
      const cb = function (resp) {
        expect(resp.response).to.eql(Buffer.from('[{"json": true}]'))

        return done()
      }

      return this.client.emit('backend:request', 'get:fixture', 'foo', { encoding: null }, cb)
    })
  })

  context('on(backend:request, get:fixture)', () => {
    it('returns the fixture object', function (done) {
      const cb = function (resp) {
        expect(resp.response).to.deep.eq([
          { 'json': true },
        ])

        return done()
      }

      return this.client.emit('backend:request', 'get:fixture', 'foo', cb)
    })

    it('errors when fixtures fails', function (done) {
      const cb = function (resp) {
        expect(resp.error.message).to.include('A fixture file could not be found')
        expect(resp.error.message).to.include('does-not-exist.txt')

        return done()
      }

      return this.client.emit('backend:request', 'get:fixture', 'does-not-exist.txt', {}, cb)
    })

    it('passes Buffers through intact', function (done) {
      const cb = function (resp) {
        expect(resp.response).to.eql(Buffer.from('[{"json": true}]'))

        return done()
      }

      return this.client.emit('backend:request', 'get:fixture', 'foo', { encoding: null }, cb)
    })
  })

  context('on(backend:request, http:request)', () => {
    it('calls socket#onRequest', function (done) {
      sinon.stub(this.options, 'onRequest').resolves({ foo: 'bar' })

      return this.client.emit('backend:request', 'http:request', 'foo', (resp) => {
        expect(resp.response).to.deep.eq({ foo: 'bar' })

        return done()
      })
    })

    it('catches errors and clones them', function (done) {
      const err = new Error('foo bar baz')

      sinon.stub(this.options, 'onRequest').rejects(err)

      return this.client.emit('backend:request', 'http:request', 'foo', (resp) => {
        expect(resp.error).to.deep.eq(errors.cloneErr(err))

        return done()
      })
    })
  })

  context('on(exec)', () => {
    it('calls exec#run with project root and options', function (done) {
      const run = sinon.stub(exec, 'run').returns(Promise.resolve('Desktop Music Pictures'))

      return this.client.emit('backend:request', 'exec', { cmd: 'ls' }, (resp) => {
        expect(run).to.be.calledWith(this.cfg.projectRoot, { cmd: 'ls' })
        expect(resp.response).to.eq('Desktop Music Pictures')

        return done()
      })
    })

    it('errors when execution fails, passing through timedOut', function (done) {
      const error = new Error('command not found: lsd')

      error.timedOut = true
      sinon.stub(exec, 'run').rejects(error)

      return this.client.emit('backend:request', 'exec', { cmd: 'lsd' }, (resp) => {
        expect(resp.error.message).to.equal('command not found: lsd')
        expect(resp.error.timedOut).to.be.true

        return done()
      })
    })
  })

  context('on(firefox:force:gc)', () => {
    it('calls firefoxUtil#collectGarbage', function (done) {
      sinon.stub(firefoxUtil, 'collectGarbage').resolves()

      return this.client.emit('backend:request', 'firefox:force:gc', (resp) => {
        expect(firefoxUtil.collectGarbage).to.be.calledOnce
        expect(resp.error).to.be.undefined

        return done()
      })
    })

    it('errors when collectGarbage throws', function (done) {
      const err = new Error('foo')

      sinon.stub(firefoxUtil, 'collectGarbage').throws(err)

      return this.client.emit('backend:request', 'firefox:force:gc', (resp) => {
        expect(firefoxUtil.collectGarbage).to.be.calledOnce
        expect(resp.error.message).to.eq(err.message)

        return done()
      })
    })
  })

  context('on(save:app:state)', () => {
    it('calls onSavedStateChanged with the state', function (done) {
      return this.client.emit('save:app:state', { reporterWidth: 500 }, () => {
        expect(this.options.onSavedStateChanged).to.be.calledWith({ reporterWidth: 500 })

        return done()
      })
    })
  })

  context('#isRunnerSocketConnected', function () {
    it('returns false when runner is not connected', function () {
      expect(this.socket.isRunnerSocketConnected()).to.eq(false)
    })

    context('runner connected', () => {
      beforeEach(function (done) {
        this.socketClient.on('automation:client:connected', () => {
          this.socketClient.on('runner:connected', () => {
            return done()
          })

          this.client.emit('runner:connected')
        })

        return this.client.emit('automation:client:connected')
      })

      it('returns true when runner is connected', function () {
        expect(this.socket.isRunnerSocketConnected()).to.eq(true)
      })
    })
  })

  context('on(cross:origin:bridge:ready)', () => {
    it('emits cross:origin:bridge:ready on local bus', function (done) {
      this.server.socket.localBus.once('cross:origin:bridge:ready', ({ originPolicy }) => {
        expect(originPolicy).to.equal('http://foobar.com')

        done()
      })

      this.client.emit('backend:request', 'cross:origin:bridge:ready', { originPolicy: 'http://foobar.com' }, () => {})
    })
  })

  context('on(cross:origin:release:html)', () => {
    it('emits cross:origin:release:html on local bus', function (done) {
      this.server.socket.localBus.once('cross:origin:release:html', () => {
        done()
      })

      this.client.emit('backend:request', 'cross:origin:release:html', () => {})
    })
  })

  context('on(cross:origin:finished)', () => {
    it('emits cross:origin:finished on local bus', function (done) {
      this.server.socket.localBus.once('cross:origin:finished', (originPolicy) => {
        expect(originPolicy).to.equal('http://foobar.com')

        done()
      })

      // add the origin before calling cross:origin:finished (otherwise we'll fail trying to remove the origin)
      this.client.emit('backend:request', 'cross:origin:bridge:ready', { originPolicy: 'http://foobar.com' }, () => {})

      this.client.emit('backend:request', 'cross:origin:finished', 'http://foobar.com', () => {})
    })
  })
})
