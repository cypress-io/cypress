require('../spec_helper')

const _ = require('lodash')
const path = require('path')
const Promise = require('bluebird')
const httpsAgent = require('https-proxy-agent')
const socketIo = require('@packages/socket/lib/browser')
const Fixtures = require('@tooling/system-tests')

const errors = require('../../lib/errors')
const { SocketE2E } = require('../../lib/socket-e2e')
const { ServerBase } = require('../../lib/server-base')
const { Automation } = require('../../lib/automation')
const preprocessor = require('../../lib/plugins/preprocessor')
const { fs } = require('../../lib/util/fs')
const session = require('../../lib/session')

const { createRoutes } = require('../../lib/routes')
const { getCtx } = require('../../lib/makeDataContext')
const { sinon } = require('../spec_helper')

let ctx

describe('lib/socket', () => {
  beforeEach(async function () {
    ctx = getCtx()
    ctx.coreData.activeBrowser = {
      path: 'path-to-browser-one',
    }

    // Don't bother initializing the child process, etc for this
    sinon.stub(ctx.actions.project, 'initializeActiveProject')

    Fixtures.scaffold()
    session.clearSessions(true)

    this.todosPath = Fixtures.projectPath('todos')

    this.server = new ServerBase()

    await ctx.actions.project.setCurrentProjectAndTestingTypeForTestSetup(this.todosPath)

    return ctx.lifecycleManager.getFullInitialConfig()
    .then((cfg) => {
      this.cfg = cfg
    })
  })

  afterEach(function () {
    Fixtures.remove()

    return this.server.close()
  })

  context('integration', () => {
    beforeEach(function (done) {
      // create a for realz socket.io connection
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

        this.automation = new Automation({
          cyNamespace: this.cfg.namespace,
          cookieNamespace: this.cfg.socketIoCookie,
          screenshotsFolder: this.cfg.screenshotsFolder,
        })

        this.server.startWebsockets(this.automation, this.cfg, this.options)
        this.socket = this.server._socket

        done = _.once(done)

        // when our real client connects then we're done
        this.socket.socketIo.on('connection', (socket) => {
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
      return this.client.disconnect()
    })

    // https://github.com/cypress-io/cypress/issues/4346
    it('can emit a circular object without crashing', function (done) {
      const foo = {
        bar: {},
      }

      foo.bar.baz = foo

      // stubbing session#getSession here just so we have something that we can
      // control the resolved value of
      sinon.stub(session, 'getSession').resolves(foo)

      return this.client.emit('backend:request', 'get:session', 'quuz', (res) => {
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

          extensionBackgroundPage = require('@packages/extension/app/v2/background')
        })

        beforeEach(function (done) {
          this.socket.socketIo.on('connection', (extClient) => {
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
          sinon.stub(chrome.cookies, 'getAll').yieldsAsync([
            { name: 'foo', value: 'f', path: '/', domain: 'localhost', secure: true, httpOnly: true, expirationDate: 123, a: 'a', b: 'c' },
            { name: 'bar', value: 'b', path: '/', domain: 'localhost', secure: false, httpOnly: false, expirationDate: 456, c: 'a', d: 'c' },
            { name: '__cypress.foo', value: 'b', path: '/', domain: 'localhost', secure: false, httpOnly: false, expirationDate: 456, c: 'a', d: 'c' },
            { name: '__cypress.bar', value: 'b', path: '/', domain: 'localhost', secure: false, httpOnly: false, expirationDate: 456, c: 'a', d: 'c' },
            { name: '__socket', value: 'b', path: '/', domain: 'localhost', secure: false, httpOnly: false, expirationDate: 456, c: 'a', d: 'c' },
          ])

          this.client.emit('automation:request', 'get:cookies', { domain: 'localhost' }, (resp) => {
            expect(resp).to.deep.eq({
              response: [
                { name: 'foo', value: 'f', path: '/', domain: 'localhost', secure: true, httpOnly: true, expiry: 123 },
                { name: 'bar', value: 'b', path: '/', domain: 'localhost', secure: false, httpOnly: false, expiry: 456 },
              ],
            })

            done()
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

        it('throws trying to set a namespaced cookie')

        it('throws trying to get a namespaced cookie')

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

        const emit = sinon.stub(this.socket.socketIo, 'emit')

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

    context('on(backend:request, save:session)', () => {
      it('saves spec sessions', function (done) {
        const sessionData = {
          id: 'spec',
          cacheAcrossSpecs: false,
        }

        this.client.emit('backend:request', 'save:session', sessionData, () => {
          const state = session.getState()

          expect(state).to.deep.eq({
            globalSessions: {},
            specSessions: {
              'spec': sessionData,
            },
          })

          done()
        })
      })

      it('saves global sessions', function (done) {
        const sessionData = {
          id: 'global',
          cacheAcrossSpecs: true,
        }

        this.client.emit('backend:request', 'save:session', sessionData, () => {
          const state = session.getState()

          expect(state).to.deep.eq({
            globalSessions: {
              'global': sessionData,
            },
            specSessions: {},
          })

          done()
        })
      })

      it('returns error if session data has no id', function (done) {
        const sessionData = {}

        this.client.emit('backend:request', 'save:session', sessionData, ({ error }) => {
          expect(error.message).to.eq('session data had no id')
          done()
        })
      })
    })

    context('on(backend:request, clear:sessions)', () => {
      it('clears spec sessions', function (done) {
        let state = session.getState()

        state.globalSessions = {
          global: { id: 'global' },
        }

        state.specSessions = {
          spec: { id: 'spec' },
        }

        this.client.emit('backend:request', 'clear:sessions', false, () => {
          expect(state).to.deep.eq({
            globalSessions: {
              'global': { id: 'global' },
            },
            specSessions: {},
          })

          done()
        })
      })

      it('clears all sessions', function (done) {
        let state = session.getState()

        state.globalSessions = {
          global: { id: 'global' },
        }

        state.specSessions = {
          spec: { id: 'spec' },
        }

        this.client.emit('backend:request', 'clear:sessions', true, () => {
          expect(state).to.deep.eq({
            globalSessions: {},
            specSessions: {},
          })

          done()
        })
      })
    })

    context('on(backend:request, get:session)', () => {
      it('returns global session', function (done) {
        const state = session.getState()

        state.globalSessions = {
          global: { id: 'global' },
        }

        this.client.emit('backend:request', 'get:session', 'global', ({ response, error }) => {
          expect(error).to.be.undefined
          expect(response).deep.eq({
            id: 'global',
          })

          done()
        })
      })

      it('returns spec session', function (done) {
        const state = session.getState()

        state.globalSessions = {}
        state.specSessions = {
          'spec': { id: 'spec' },
        }

        this.client.emit('backend:request', 'get:session', 'spec', ({ response, error }) => {
          expect(error).to.be.undefined
          expect(response).deep.eq({
            id: 'spec',
          })

          done()
        })
      })

      it('returns error when session does not exist', function (done) {
        const state = session.getState()

        state.globalSessions = {}
        state.specSessions = {}
        this.client.emit('backend:request', 'get:session', 1, ({ response, error }) => {
          expect(response).to.be.undefined
          expect(error.message).to.eq('session with id "1" not found')

          done()
        })
      })
    })

    context('on(backend:request, reset:cached:test:state)', () => {
      it('clears spec sessions', function (done) {
        const state = session.getState()

        state.globalSessions = {
          global: { id: 'global' },
        }

        state.specSessions = {
          local: { id: 'local' },
        }

        this.client.emit('backend:request', 'reset:cached:test:state', ({ error }) => {
          expect(error).to.be.undefined

          expect(state).to.deep.eq({
            globalSessions: {
              'global': { id: 'global' },
            },
            specSessions: {},
          })

          done()
        })
      })
    })
  })

  context('unit', () => {
    beforeEach(function () {
      this.mockClient = sinon.stub({
        on () {},
        emit () {},
        conn: {
          transport: {
            name: 'websocket',
          },
        },
      })

      this.io = {
        of: sinon.stub().returns({ on () {} }),
        on: sinon.stub().withArgs('connection').yields(this.mockClient),
        emit: sinon.stub(),
        close: sinon.stub(),
      }

      sinon.stub(SocketE2E.prototype, 'createSocketIo').returns(this.io)
      sinon.stub(preprocessor.emitter, 'on')

      return this.server.open(this.cfg, {
        SocketCtor: SocketE2E,
        createRoutes,
        testingType: 'e2e',
        getCurrentBrowser: () => null,
      })
      .then(() => {
        this.automation = new Automation({
          cyNamespace: this.cfg.namespace,
          cookieNamespace: this.cfg.socketIoCookie,
          screenshotsFolder: this.cfg.screenshotsFolder,
        })

        this.server.startWebsockets(this.automation, this.cfg, {})

        this.socket = this.server._socket
      })
    })

    context('constructor', () => {
      it('listens for \'file:updated\' on preprocessor', function () {
        this.cfg.watchForFileChanges = true
        new SocketE2E(this.cfg)

        expect(preprocessor.emitter.on).to.be.calledWith('file:updated')
      })

      it('does not listen for \'file:updated\' if config.watchForFileChanges is false', function () {
        preprocessor.emitter.on.reset()
        this.cfg.watchForFileChanges = false
        new SocketE2E(this.cfg)

        expect(preprocessor.emitter.on).not.to.be.called
      })
    })

    context('#sendFocusBrowserMessage', function () {
      it('sends an automation request of focus:browser:window', function () {
        sinon.stub(this.automation, 'request')

        this.socket.sendFocusBrowserMessage()

        expect(this.automation.request).to.be.calledWith('focus:browser:window', {})
      })
    })

    context('#close', () => {
      it('calls close on #io', function () {
        this.socket.close()

        expect(this.socket.socketIo.close).to.be.called
      })

      it('does not error when io isnt defined', function () {
        return this.socket.close()
      })
    })

    context('#watchTestFileByPath', () => {
      beforeEach(function () {
        this.socket.testsDir = Fixtures.project('todos/tests')
        this.filePath = `${this.socket.testsDir}/test1.js`

        return sinon.stub(preprocessor, 'getFile').resolves()
      })

      it('returns undefined if trying to watch special path __all', function () {
        const result = this.socket.watchTestFileByPath(this.cfg, {
          relative: 'integration/__all',
        })

        expect(result).to.be.undefined
      })

      it('returns undefined if #testFilePath matches arguments', function () {
        this.socket.testFilePath = path.join('integration', 'test1.js')
        const result = this.socket.watchTestFileByPath(this.cfg, {
          relative: path.join('integration', 'test1.js'),
        })

        expect(result).to.be.undefined
      })

      it('closes existing watched test file', function () {
        sinon.stub(preprocessor, 'removeFile')
        this.socket.testFilePath = 'tests/test1.js'

        return this.socket.watchTestFileByPath(this.cfg, {
          relative: 'test2.js',
        }).then(() => {
          expect(preprocessor.removeFile).to.be.calledWithMatch('test1.js', this.cfg)
        })
      })

      it('sets #testFilePath', function () {
        return this.socket.watchTestFileByPath(this.cfg, {
          relative: `${path.sep}test1.js`,
        }).then(() => {
          expect(this.socket.testFilePath).to.eq(`test1.js`)
        })
      })

      it('can normalizes leading slash', function () {
        return this.socket.watchTestFileByPath(this.cfg, {
          relative: `${path.sep}integration${path.sep}test1.js`,
        }).then(() => {
          expect(this.socket.testFilePath).to.eq(`integration${path.sep}test1.js`)
        })
      })

      it('watches file by path', function () {
        this.socket.watchTestFileByPath(this.cfg, {
          relative: `integration${path.sep}test2.coffee`,
        })

        expect(preprocessor.getFile).to.be.calledWith(`integration${path.sep}test2.coffee`, this.cfg)
      })

      it('watches file by relative path in spec object', function () {
        // this is what happens now with component / integration specs
        const spec = {
          absolute: `${path.sep}foo${path.sep}bar`,
          relative: `relative${path.sep}to${path.sep}root${path.sep}test2.coffee`,
        }

        this.socket.watchTestFileByPath(this.cfg, spec)

        expect(preprocessor.getFile).to.be.calledWith(spec.relative, this.cfg)
      })

      it('triggers watched:file:changed event when preprocessor \'file:updated\' is received', function (done) {
        sinon.stub(fs, 'statAsync').resolves()
        this.cfg.watchForFileChanges = true
        this.socket.watchTestFileByPath(this.cfg, {
          relative: 'integration/test2.coffee',
        })

        preprocessor.emitter.on.withArgs('file:updated').yield('integration/test2.coffee')

        return setTimeout(() => {
          expect(this.io.emit).to.be.calledWith('watched:file:changed')

          return done()
        }
        , 200)
      })
    })

    context('#startListening', () => {
      describe('watch:test:file', () => {
        it('listens for watch:test:file event', function () {
          this.socket.startListening(this.server.getHttpServer(), this.automation, this.cfg, {})

          expect(this.mockClient.on).to.be.calledWith('watch:test:file')
        })

        it('passes filePath to #watchTestFileByPath', function () {
          const watchTestFileByPath = sinon.stub(this.socket, 'watchTestFileByPath')

          this.mockClient.on.withArgs('watch:test:file').yields({ relative: 'foo/bar/baz' })

          this.socket.startListening(this.server.getHttpServer(), this.automation, this.cfg, {})

          expect(watchTestFileByPath).to.be.calledWith(this.cfg, { relative: 'foo/bar/baz' })
        })
      })

      describe('#onTestFileChange', () => {
        beforeEach(() => {
          return sinon.spy(fs, 'statAsync')
        })

        it('calls statAsync on .js file', function () {
          return this.socket.onTestFileChange('foo/bar.js').catch(() => {}).then(() => {
            expect(fs.statAsync).to.be.calledWith('foo/bar.js')
          })
        })

        it('calls statAsync on .coffee file', function () {
          return this.socket.onTestFileChange('foo/bar_coffee.coffee').then(() => {
            expect(fs.statAsync).to.be.calledWith('foo/bar_coffee.coffee')
          })
        })

        it('does not emit if stat throws', function () {
          return this.socket.onTestFileChange('foo/bar.js').then(() => {
            expect(this.io.emit).not.to.be.called
          })
        })
      })
    })
  })
})
