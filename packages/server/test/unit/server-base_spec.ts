import '../spec_helper'
import mockery from 'mockery'
import { enable as enableMockery, mockElectron } from '../mockery_helper'
import _ from 'lodash'
import os from 'os'
import express from 'express'
import { connect } from '@packages/network'
import { setupFullConfigWithDefaults } from '@packages/config'
import { ServerBase, _forceProxyMiddleware } from '../../lib/server-base'
import { cypressSessions } from '../../lib/cypress-sessions'
import { SocketE2E } from '../../lib/socket-e2e'
import * as fileServer from '../../lib/file_server'
import * as serverErrors from '../../lib/errors'
import * as ensureUrl from '../../lib/util/ensure-url'
import { getCtx } from '@packages/data-context'
import { GracefulExit } from '../../lib/util/graceful-exit'

// index.js re-exports `create` through a non-configurable getter, so the
// underlying module is the only stubbable seam.
const httpsProxyModule = require('@packages/https-proxy/cjs/proxy')

const morganFn = function () {}

// Set by the morgan mock when `useMorgan` runs.
let lastMorganFactoryArgs

function morganMockFactory (format, options) {
  lastMorganFactoryArgs = { format, options }

  return morganFn
}

function getOpenOptions (overrides = {}) {
  return {
    SocketCtor: SocketE2E,
    testingType: 'e2e',
    onError: sinon.stub(),
    onWarning: sinon.stub(),
    getCurrentBrowser: () => null,
    getSpec: () => null,
    shouldCorrelatePreRequests: () => false,
    ...overrides,
  }
}

function createCriClient () {
  return {
    send: sinon.stub().resolves({}),
    on: sinon.stub(),
    off: sinon.stub(),
  }
}

// The browser (CDP) network path is only ever entered by installing the runtime
// that serves it, so tests that need that mode install one against a stub CRI
// client.
function enterBrowserNetworkMode (server) {
  server._socket = server._socket ?? {
    toDriver: sinon.stub(),
    close: sinon.stub(),
    setProtocolManager: sinon.stub(),
  }

  server.getCurrentBrowser = server.getCurrentBrowser ?? (() => null)
  server._netStubbingState = server._netStubbingState ?? {
    routes: [],
    requests: {},
    reset: sinon.stub(),
  }

  return server.createCdpFetchNetworkRuntime(createCriClient())
}

describe('lib/server-base', () => {
  beforeEach(function () {
    // put_protocol_artifact_spec and others call mockery.deregisterAll(); re-enable and
    // re-register per test so require('morgan') is always our mock.
    enableMockery(mockery)
    mockElectron(mockery)
    mockery.registerMock('morgan', morganMockFactory)

    this.fileServer = {
      close () {},
      port () {
        return 1111
      },
    }

    sinon.stub(fileServer, 'create').returns(this.fileServer)

    return setupFullConfigWithDefaults({ projectRoot: '/foo/bar/', config: { supportFile: false } }, getCtx().file.getFilesByGlob)
    .then((cfg) => {
      this.config = cfg
      this.server = new ServerBase(cfg)

      this.oldFileServer = this.server._fileServer
      this.server._fileServer = this.fileServer
    })
  })

  afterEach(function () {
    return this.server && this.server.close()
  })

  describe('#createExpressApp', () => {
    beforeEach(function () {
      this.use = sinon.spy(express.application, 'use')
    })

    it('instantiates express instance without morgan', function () {
      const app = this.server.createExpressApp({ morgan: false })

      expect(app.get('view engine')).to.eq('html')

      expect(this.use).not.to.be.calledWith(morganFn)
    })

    it('requires morgan if true', function () {
      const useMorganStub = sinon.stub(this.server, 'useMorgan').returns(morganFn)

      this.server.createExpressApp({ morgan: true })

      expect(useMorganStub).to.have.been.calledOnce
    })
  })

  describe('#useMorgan', () => {
    beforeEach(function () {
      GracefulExit.resetForTesting()
      sinon.stub(process, 'exit')
      lastMorganFactoryArgs = undefined
      // CI or other specs may set a low timeout; if the race timer wins before
      // flushAndExit clears processTeardown, skip() still mirrors isShuttingDown
      // and the post-await assertion flakes (see graceful_exit_spec teardown test).
      delete process.env.CYPRESS_INTERNAL_TEARDOWN_TIMEOUT
    })

    afterEach(function () {
      GracefulExit.resetForTesting()
      delete process.env.CYPRESS_INTERNAL_TEARDOWN_TIMEOUT
      process.exit.restore()
    })

    it('passes dev format and skip that mirrors GracefulExit.isShuttingDown', async function () {
      this.server.useMorgan()

      const req = { proxiedUrl: '/__cypress/iframes/foo', headers: {} }

      expect(lastMorganFactoryArgs.format).to.eq('dev')
      expect(lastMorganFactoryArgs.options.skip(req)).to.be.false

      let resolveStep
      const stepPromise = new Promise((resolve) => {
        resolveStep = resolve
      })

      GracefulExit.addStep(() => stepPromise, 'slow-step')

      const exitPromise = GracefulExit.exitGracefully(0)

      expect(lastMorganFactoryArgs.options.skip(req)).to.be.true

      resolveStep()

      await exitPromise

      expect(lastMorganFactoryArgs.options.skip(req)).to.be.false
    })

    describe('tap request logging', () => {
      let getCurrent

      beforeEach(function () {
        getCurrent = sinon.stub(cypressSessions, 'getCurrent').returns({ sessionId: 'abc' })
        this.server.useMorgan()
      })

      afterEach(() => {
        getCurrent.restore()
      })

      const skip = (proxiedUrl, headers = {}) => {
        return lastMorganFactoryArgs.options.skip({ proxiedUrl, headers })
      }

      it('skips the non-proxied session probe', () => {
        expect(skip('/__cypress/sessions/abc')).to.be.true
      })

      it('skips a non-proxied tap graphql request carrying the current session id', () => {
        expect(skip('/__cypress/tap/graphql/TapSpecs', { 'x-cypress-session-id': 'abc' })).to.be.true
      })

      it('logs a tap graphql request whose session id header does not match', () => {
        expect(skip('/__cypress/tap/graphql/TapSpecs', { 'x-cypress-session-id': 'nope' })).to.be.false
      })

      it('logs a graphql request from the app, which sends no session id header', () => {
        expect(skip('/__cypress/graphql/Specs')).to.be.false
      })

      it('logs a proxied request that mimics the probe path', () => {
        expect(skip('http://example.com/__cypress/sessions/abc')).to.be.false
      })

      it('logs everything else', () => {
        expect(skip('/__cypress/iframes/foo')).to.be.false
      })
    })
  })

  describe('#open', () => {
    beforeEach(function () {
      sinon.stub(this.server, 'createServer').resolves()
    })

    it('calls #createExpressApp with morgan', function () {
      sinon.spy(this.server, 'createExpressApp')
      _.extend(this.config, { port: 54321, morgan: false })

      return this.server.open(this.config, getOpenOptions())
      .then(() => {
        expect(this.server.createExpressApp).to.be.calledWithMatch({ morgan: false })
      })
    })

    it('calls #createServer with app and config', function () {
      _.extend(this.config, { port: 54321 })
      const app = { use: sinon.stub() }

      sinon.stub(this.server, 'createExpressApp').returns(app)

      return this.server.open(this.config, getOpenOptions())
      .then(() => {
        expect(this.server.createServer).to.have.been.calledWith(app, this.config, sinon.match.func)
      })
    })

    // The browser is unknown at open, so the MITM runtime must always be built:
    // a later Firefox/WebKit launch has nothing else to fall back to.
    it('creates networkProxy regardless of forceHttp1', function () {
      _.extend(this.config, { port: 54321, forceHttp1: false })
      const app = { use: sinon.stub() }

      sinon.stub(this.server, 'createExpressApp').returns(app)
      sinon.spy(this.server, 'createNetworkProxy')

      return this.server.open(this.config, getOpenOptions())
      .then(() => {
        expect(this.server.createNetworkProxy).to.have.been.called
        expect(this.server._networkProxy).to.exist
        expect(this.server._netStubbingState).to.exist
      })
    })

    it('does not create the https proxy at open', function () {
      _.extend(this.config, { port: 54321 })
      const app = { use: sinon.stub() }

      sinon.stub(this.server, 'createExpressApp').returns(app)

      return this.server.open(this.config, getOpenOptions())
      .then(() => {
        expect(this.server._httpsProxy).to.be.undefined
      })
    })
  })

  describe('#setNetworkMode', () => {
    beforeEach(function () {
      this.server._openConfig = this.config
      this.server._proxyRuntime = {
        networkProxy: { id: 'mitm' },
      }

      this.netStubbingState = { id: 'owned-by-open' }
      this.server._netStubbingState = this.netStubbingState

      this.ensureHttpsProxy = sinon.stub(this.server, 'ensureHttpsProxy').resolves()
    })

    it('publishes the MITM path, and its https proxy, for a launch that needs the proxy', async function () {
      await this.server.setNetworkMode(false)

      expect(this.server.isBrowserNetworkMode()).to.be.false
      expect(this.ensureHttpsProxy).to.have.been.called
      expect(this.server._networkProxy).to.eq(this.server._proxyRuntime.networkProxy)
    })

    // The CDP runtime needs the page CRI client, which does not exist yet, so
    // claiming the browser network mode here would point every request-time gate
    // at a pipeline that cannot serve it.
    it('does not claim the browser network mode before its runtime exists', async function () {
      await this.server.setNetworkMode(false)
      await this.server.setNetworkMode(true)

      expect(this.server.isBrowserNetworkMode()).to.be.false
      expect(this.server._networkProxy).to.eq(this.server._proxyRuntime.networkProxy)
    })

    it('leaves the https proxy alone for a browser network launch, so no root CA is generated', async function () {
      await this.server.setNetworkMode(true)

      expect(this.ensureHttpsProxy).not.to.have.been.called
    })

    // A browser switch in open mode relaunches against this same instance, and
    // nothing else tears the CDP Fetch runtime down.
    it('stops the CDP runtime and restores the proxy runtime when switching back', async function () {
      const cdpNetworkProxy = { dispose: sinon.stub() }
      const stop = sinon.stub().resolves()

      this.server._cdpFetchRuntime = { networkProxy: cdpNetworkProxy, stop }
      this.server._networkProxy = cdpNetworkProxy
      this.server._networkMode = 'browser'

      await this.server.setNetworkMode(false)

      expect(this.server.isBrowserNetworkMode()).to.be.false
      expect(stop).to.have.been.called
      expect(this.server._cdpFetchRuntime).to.be.undefined
      expect(this.server._networkProxy).to.eq(this.server._proxyRuntime.networkProxy)
      // the server owns the netStubbingState, so a runtime handoff must not move it
      expect(this.server._netStubbingState).to.eq(this.netStubbingState)
    })

    // The old browser stays alive until browsers.open kills it, so it issues
    // requests across every awaited step of the switch. A step where the mode
    // and the installed NetworkProxy disagree routes those into the pipeline
    // that is not installed.
    it('never publishes a mode the installed NetworkProxy cannot serve', async function () {
      const cdpNetworkProxy = { dispose: sinon.stub() }
      const samples: { cdp: boolean, proxy: unknown }[] = []
      const sample = () => {
        samples.push({ cdp: this.server.isBrowserNetworkMode(), proxy: this.server._networkProxy })
      }

      this.ensureHttpsProxy.callsFake(async () => sample())

      this.server._cdpFetchRuntime = {
        networkProxy: cdpNetworkProxy,
        stop: sinon.stub().callsFake(async () => sample()),
      }

      this.server._networkProxy = cdpNetworkProxy
      this.server._networkMode = 'browser'

      sample()
      await this.server.setNetworkMode(false)
      sample()

      expect(samples).to.have.length(4)
      samples.forEach(({ cdp, proxy }, index) => {
        expect(cdp, `sample ${index} reads CDP only while the CDP proxy is installed`).to.eq(proxy === cdpNetworkProxy)
      })
    })
  })

  describe('#ensureHttpsProxy', () => {
    it('creates the https proxy once, on demand', async function () {
      const app = this.server.createExpressApp({ morgan: false })

      await this.server.createServer(app, {})

      expect(this.server._httpsProxy).to.be.undefined

      await this.server.ensureHttpsProxy()

      const httpsProxy = this.server._httpsProxy

      expect(httpsProxy).to.exist

      await this.server.ensureHttpsProxy()

      expect(this.server._httpsProxy).to.eq(httpsProxy)
    })

    // The proxy binds against this server's port; resolving without one would
    // read as "already created" and defer CA generation into a TLS handshake.
    it('rejects when the server is not listening yet', async function () {
      let err

      try {
        await this.server.ensureHttpsProxy()
      } catch (e) {
        err = e
      }

      expect(err?.message).to.include('createServer must first be called')
      expect(this.server._httpsProxy).to.be.undefined
      expect(this.server._httpsProxyReady).to.be.undefined
    })

    // Memoizing the rejection would make one transient failure fatal for every
    // later launch and CONNECT in the session.
    it('does not memoize a failure, so a later launch retries', async function () {
      const app = this.server.createExpressApp({ morgan: false })

      await this.server.createServer(app, {})

      const create = sinon.stub(httpsProxyModule, 'create')

      create.onFirstCall().rejects(new Error('EACCES: cannot write the root CA'))
      create.onSecondCall().resolves({ close: sinon.stub().resolves() })

      let err

      try {
        await this.server.ensureHttpsProxy()
      } catch (e) {
        err = e
      }

      expect(err?.message).to.include('EACCES')
      expect(this.server._httpsProxyReady).to.be.undefined

      await this.server.ensureHttpsProxy()

      expect(this.server._httpsProxy).to.exist
      expect(create).to.have.been.calledTwice
    })
  })

  describe('#closeHttpsProxy', () => {
    // Closing mid-creation used to close nothing, then leave a fully listening
    // SNI server with no owner holding its port.
    it('closes an https proxy that finishes creating during close()', async function () {
      const app = this.server.createExpressApp({ morgan: false })

      await this.server.createServer(app, {})

      const close = sinon.stub().resolves()
      let finishCreation

      sinon.stub(httpsProxyModule, 'create').returns(new Promise((resolve) => {
        finishCreation = () => resolve({ close })
      }))

      const ready = this.server.ensureHttpsProxy()
      const closing = this.server.close()

      finishCreation()

      await ready
      await closing

      expect(close).to.have.been.calledOnce
      expect(this.server._httpsProxy).to.be.undefined
      // a stale memo would hand out a proxy bound to a destroyed http server
      expect(this.server._httpsProxyReady).to.be.undefined
    })
  })

  describe('#createCdpFetchNetworkRuntime', () => {
    const createClient = createCriClient

    beforeEach(function () {
      this.server._openConfig = this.config
      this.server._socket = {
        toDriver: sinon.stub(),
        close: sinon.stub(),
        setProtocolManager: sinon.stub(),
      }

      this.server.getCurrentBrowser = () => null
      this.server._netStubbingState = {
        routes: [],
        requests: {},
        reset: sinon.stub(),
      }
    })

    it('starts the CDP Fetch runtime and exposes its network context', async function () {
      const client = createClient()
      const isAUTFrame = sinon.stub().resolves(false)

      await this.server.createCdpFetchNetworkRuntime(client, isAUTFrame)

      expect(client.on).to.have.been.calledWith('Fetch.requestPaused')
      expect(client.send).to.have.been.calledWith('Fetch.enable', {
        patterns: [{
          requestStage: 'Request',
        }, {
          requestStage: 'Response',
        }],
      })

      expect(this.server._cdpFetchRuntime).to.exist
      expect(this.server._netStubbingState).to.exist
      // The request-time ctx reads its interception core off the installed
      // NetworkProxy, so this observes the pointers production middleware
      // observes.
      expect(this.server._networkProxy).to.eq(this.server._cdpFetchRuntime.networkProxy)
      expect(this.server._networkProxy.http.networkInterceptionCore).to.eq(this.server._cdpFetchRuntime.networkInterceptionCore)
    })

    // Publishing the mode any earlier would point the request-time gates at a
    // CDP pipeline that does not exist yet; any later would leave them on MITM
    // semantics while the CDP NetworkProxy is already installed.
    it('publishes the browser network mode together with the runtime that serves it', async function () {
      const client = createClient()
      const modeDuringStart: boolean[] = []

      // Fetch.enable is the last step of start()
      client.send.withArgs('Fetch.enable').callsFake(async () => {
        modeDuringStart.push(this.server.isBrowserNetworkMode())
      })

      expect(this.server.isBrowserNetworkMode()).to.be.false

      await this.server.createCdpFetchNetworkRuntime(client)

      expect(this.server.isBrowserNetworkMode()).to.be.true
      expect(this.server._networkProxy).to.eq(this.server._cdpFetchRuntime.networkProxy)
      expect(modeDuringStart).to.deep.eq([true])
    })

    // DriverInterceptRegistrationAdapter binds to the state object created at open,
    // so a launch that replaced it would leave every cy.intercept() registered
    // against a state the installed runtime never matches.
    it('keeps one netStubbingState across open, a browser-path launch, and the switch back', async function () {
      _.extend(this.config, { port: 54321 })
      sinon.stub(this.server, 'createExpressApp').returns({ use: sinon.stub() })
      sinon.stub(this.server, 'createServer').resolves()
      sinon.stub(this.server, 'ensureHttpsProxy').resolves()

      await this.server.open(this.config, getOpenOptions())

      const state = this.server._netStubbingState

      expect(state).to.exist
      expect(this.server._networkProxy.http.netStubbingState).to.equal(state)

      await this.server.createCdpFetchNetworkRuntime(createClient())

      expect(this.server.isBrowserNetworkMode()).to.be.true
      expect(this.server._netStubbingState).to.equal(state)
      expect(this.server._networkProxy.http.netStubbingState).to.equal(state)

      await this.server.setNetworkMode(false)

      expect(this.server.isBrowserNetworkMode()).to.be.false
      expect(this.server._netStubbingState).to.equal(state)
      expect(this.server._networkProxy.http.netStubbingState).to.equal(state)
    })

    // Each runtime constructs its interception core (and the policy
    // registration inside it) into its own NetworkProxy, and the middleware
    // ctx reads the core off whichever NetworkProxy is installed. So the
    // handoff invariant — every shared runtime pointer moves with
    // `_networkMode` in one synchronous step — is observable here: after each
    // switch, the middleware-visible core must be the active runtime's, never
    // the other one's.
    it('hands the middleware-visible interception core over with the runtime, in both directions', async function () {
      _.extend(this.config, { port: 54321 })
      sinon.stub(this.server, 'createExpressApp').returns({ use: sinon.stub() })
      sinon.stub(this.server, 'createServer').resolves()
      sinon.stub(this.server, 'ensureHttpsProxy').resolves()

      await this.server.open(this.config, getOpenOptions())

      const mitmCore = this.server._proxyRuntime.networkInterceptionCore

      expect(this.server._networkProxy.http.networkInterceptionCore).to.equal(mitmCore)

      await this.server.createCdpFetchNetworkRuntime(createClient())

      const cdpCore = this.server._cdpFetchRuntime.networkInterceptionCore

      expect(cdpCore).not.to.equal(mitmCore)
      expect(this.server.isBrowserNetworkMode()).to.be.true
      expect(this.server._networkProxy.http.networkInterceptionCore).to.equal(cdpCore)

      await this.server.setNetworkMode(false)

      expect(this.server.isBrowserNetworkMode()).to.be.false
      expect(this.server._networkProxy.http.networkInterceptionCore).to.equal(mitmCore)
    })

    it('applies a previously stored protocol manager to the late-bound CDP NetworkProxy', async function () {
      const client = createClient()
      const protocolManager = { isProtocolEnabled: true } as any

      this.server.setProtocolManager(protocolManager)
      this.server.setPreRequestTimeout(1234)

      expect(this.server._networkProxy).to.be.undefined

      await this.server.createCdpFetchNetworkRuntime(client)

      expect(this.server._networkProxy.http.preRequests.protocolManager).to.equal(protocolManager)
      expect(this.server._networkProxy.http.preRequests.requestTimeout).to.equal(1234)
    })

    it('clears _networkProxy before disposing the previous CDP runtime', async function () {
      const client = createClient()

      await this.server.createCdpFetchNetworkRuntime(client)

      const firstProxy = this.server._networkProxy
      let networkProxyDuringDispose: NetworkProxy | undefined | null = null

      sinon.stub(firstProxy, 'dispose').callsFake(() => {
        networkProxyDuringDispose = this.server._networkProxy
      })

      await this.server['swapCdpFetchRuntime']()

      expect(networkProxyDuringDispose).to.be.undefined
      expect(this.server._networkProxy).to.be.undefined
    })

    it('stops the previous CDP Fetch runtime before replacing it', async function () {
      const firstClient = createClient()
      const secondClient = createClient()

      await this.server.createCdpFetchNetworkRuntime(firstClient)

      const firstProxy = this.server._networkProxy
      const disposeSpy = sinon.spy(firstProxy, 'dispose')

      await this.server.createCdpFetchNetworkRuntime(secondClient)

      expect(firstClient.send).to.have.been.calledWith('Fetch.disable')
      expect(disposeSpy).to.have.been.calledOnce
      expect(secondClient.send).to.have.been.calledWith('Fetch.enable')
      expect(this.server._networkProxy).to.not.equal(firstProxy)
    })

    // A replacement (spec change, new tab, relaunch) leaves the browser on the
    // native path throughout, so the mode must never transit 'proxy' while the
    // outgoing runtime is stopping: the request-time gates would redirect the
    // browser's path-only requests to the client route and hand them to a
    // pipeline that expects absolute-form URLs.
    it('never publishes the MITM path while a replaced CDP runtime is still stopping', async function () {
      _.extend(this.config, { port: 54321 })
      sinon.stub(this.server, 'createExpressApp').returns({ use: sinon.stub() })
      sinon.stub(this.server, 'createServer').resolves()

      await this.server.open(this.config, getOpenOptions())

      const mitmProxy = this.server._networkProxy
      const firstClient = createClient()
      const secondClient = createClient()

      await this.server.createCdpFetchNetworkRuntime(firstClient)

      let releaseFetchDisable: (() => void) | undefined

      firstClient.send.withArgs('Fetch.disable').callsFake(() => {
        return new Promise<void>((resolve) => {
          releaseFetchDisable = resolve
        })
      })

      const replacing = this.server.createCdpFetchNetworkRuntime(secondClient)

      expect(releaseFetchDisable, 'the outgoing runtime is mid-teardown').to.be.a('function')
      expect(this.server.isBrowserNetworkMode(), 'network mode mid-swap').to.be.true
      expect(this.server._networkProxy, 'installed proxy mid-swap').not.to.equal(mitmProxy)
      // one session cannot have two Fetch owners, so the successor waits
      expect(secondClient.send).not.to.have.been.calledWith('Fetch.enable')

      releaseFetchDisable!()

      await replacing

      expect(this.server.isBrowserNetworkMode()).to.be.true
      expect(this.server._networkProxy).to.equal(this.server._cdpFetchRuntime.networkProxy)
      expect(secondClient.send).to.have.been.calledWith('Fetch.enable')
    })

    it('disposes NetworkProxy only after Fetch.disable completes', async function () {
      const client = createClient()

      await this.server.createCdpFetchNetworkRuntime(client)

      const proxy = this.server._networkProxy
      const disposeSpy = sinon.spy(proxy, 'dispose')
      let disposeDuringFetchDisable = false

      client.send.withArgs('Fetch.disable').callsFake(async () => {
        disposeDuringFetchDisable = disposeSpy.called
      })

      await this.server['swapCdpFetchRuntime']()

      expect(disposeDuringFetchDisable).to.be.false
      expect(client.send).to.have.been.calledWith('Fetch.disable')
      expect(disposeSpy).to.have.been.calledOnce
    })

    it('still starts the new runtime when stopping the previous one fails', async function () {
      const firstClient = createClient()
      const secondClient = createClient()

      await this.server.createCdpFetchNetworkRuntime(firstClient)

      // the previous page client is typically gone by the time a new spec or
      // relaunch replaces the runtime
      firstClient.send.withArgs('Fetch.disable').rejects(new Error('Fetch.disable will not run as the target browser or tab CRI connection has crashed'))

      await this.server.createCdpFetchNetworkRuntime(secondClient)

      expect(secondClient.send).to.have.been.calledWith('Fetch.enable')
      expect(this.server._cdpFetchRuntime).to.exist
    })

    it('resets CDP Fetch between tests without disabling Fetch', async function () {
      const client = createClient()

      await this.server.createCdpFetchNetworkRuntime(client)
      client.send.resetHistory()

      this.server['resetCdpFetchRuntime']()

      expect(client.send).not.to.have.been.calledWith('Fetch.disable')
    })

    it('stops and disposes the CDP Fetch runtime on server close', async function () {
      const client = createClient()

      await this.server.createCdpFetchNetworkRuntime(client)

      const proxy = this.server._networkProxy
      const disposeSpy = sinon.spy(proxy, 'dispose')

      sinon.stub(this.server._remoteStates, 'set')
      this.server.isListening = true
      this.server._server = {
        destroyAsync: sinon.stub().resolves(),
      }

      await this.server['_close']()

      expect(disposeSpy).to.have.been.calledOnce
      expect(client.send).to.have.been.calledWith('Fetch.disable')
      expect(this.server._cdpFetchRuntime).to.be.undefined
      expect(this.server._networkProxy).to.be.undefined
    })

    // The runner document and an AUT document escape the same way but need
    // different remedies, so the warning has to tell them apart.
    context('interception escape warning', () => {
      async function escape (server, url: string) {
        const client = createClient()

        await server.createCdpFetchNetworkRuntime(client)

        // the transport listens for this event alongside the escape detector,
        // so deliver it to every listener the way the connection would
        client.on.withArgs('Network.responseReceived').getCalls().forEach(({ args: [, listener] }) => {
          listener({
            requestId: '1',
            type: 'Document',
            response: { url, fromServiceWorker: true },
          })
        })
      }

      beforeEach(function () {
        sinon.stub(serverErrors, 'warning')
      })

      it('reports an escaped runner document as one', async function () {
        await escape(this.server, 'https://example.com/__/#/specs/runner?file=cypress/e2e/spec.cy.js')

        expect(serverErrors.warning).to.have.been.calledOnceWith('BROWSER_NETWORK_INTERCEPTION_ESCAPE', sinon.match.string, true)
      })

      it('reports an escaped AUT document as one', async function () {
        await escape(this.server, 'https://example.com/dashboard')

        expect(serverErrors.warning).to.have.been.calledOnceWith('BROWSER_NETWORK_INTERCEPTION_ESCAPE', sinon.match.string, false)
      })

      it('falls back to the generic variant when the escaped url cannot be parsed', async function () {
        await escape(this.server, 'http://')

        expect(serverErrors.warning).to.have.been.calledOnceWith('BROWSER_NETWORK_INTERCEPTION_ESCAPE', sinon.match.string, false)
      })
    })
  })

  describe('#attachCdpFetchExtraTarget', () => {
    const createClient = createCriClient

    beforeEach(function () {
      this.server._openConfig = this.config
      this.server._socket = {
        toDriver: sinon.stub(),
        close: sinon.stub(),
        setProtocolManager: sinon.stub(),
      }

      this.server.getCurrentBrowser = () => null
      this.server._netStubbingState = {
        routes: [],
        requests: {},
        reset: sinon.stub(),
      }
    })

    it('delegates to the CDP Fetch runtime when present', async function () {
      const pageClient = createClient()
      const extraClient = createClient()

      await this.server.createCdpFetchNetworkRuntime(pageClient)

      const detach = sinon.stub().resolves()
      const attachExtraTarget = sinon.stub(this.server._cdpFetchRuntime, 'attachExtraTarget').resolves(detach)

      const result = await this.server.attachCdpFetchExtraTarget(extraClient)

      expect(attachExtraTarget).to.have.been.calledOnceWith(extraClient)
      expect(result).to.equal(detach)
    })

    it('returns undefined when there is no CDP Fetch runtime', async function () {
      const result = await this.server.attachCdpFetchExtraTarget(createClient())

      expect(result).to.be.undefined
    })
  })

  describe('#createServer', () => {
    beforeEach(function () {
      this.port = 54321
      this.app = this.server.createExpressApp({ morgan: true })
    })

    describe('remote state', () => {
      beforeEach(function () {
        sinon.stub(this.server, '_listen').callsFake((port) => Promise.resolve(port))
        sinon.stub(this.server, '_port').returns(this.port)
      })

      it('sets remote state to baseUrl when baseUrl is provided', function () {
        sinon.stub(ensureUrl, 'isListening').resolves()
        const setSpy = sinon.spy(this.server._remoteStates, 'set')

        return this.server.createServer(this.app, { port: this.port, baseUrl: 'http://localhost:9999' })
        .then(() => {
          expect(setSpy).to.have.been.calledWith('http://localhost:9999')
        })
      })

      it('sets remote state to <root> when baseUrl is not provided', function () {
        const setSpy = sinon.spy(this.server._remoteStates, 'set')

        return this.server.createServer(this.app, { port: this.port })
        .then(() => {
          expect(setSpy).to.have.been.calledWith('<root>')
        })
      })

      it('calls fileServer.create before _listen', function () {
        // fileServer.create is awaited before _listen so its
        // port is known when the primary remote state is computed via
        // _stateFromUrl('<root>').
        return this.server.createServer(this.app, { port: this.port })
        .then(() => {
          sinon.assert.callOrder(fileServer.create, this.server._listen)
        })
      })

      it('establishes primary remote state after fileServer is ready', function () {
        // `_fileServer` must already exist when `_remoteStates.set` runs — its
        // port is read synchronously by `_stateFromUrl('<root>')`.
        let fileServerAtSetCall

        const realSet = this.server._remoteStates.set.bind(this.server._remoteStates)
        const setStub = sinon.stub(this.server._remoteStates, 'set').callsFake((...args) => {
          fileServerAtSetCall = this.server._fileServer

          return realSet(...args)
        })

        return this.server.createServer(this.app, { port: this.port })
        .then(() => {
          expect(setStub).to.have.been.calledOnceWithExactly('<root>')
          expect(fileServerAtSetCall, 'fileServer must be ready when set runs').to.exist
        })
      })

      // The https proxy is only needed on the MITM path, so it waits for a
      // browser that needs it rather than generating a root CA at every open.
      it('does not create httpsProxy', function () {
        return this.server.createServer(this.app, { port: this.port })
        .then(() => {
          expect(this.server._httpsProxy).to.be.undefined
        })
      })

      it('registers connect listener', function () {
        return this.server.createServer(this.app, { port: this.port })
        .then(() => {
          expect(this.server.server.listenerCount('connect')).to.be.greaterThan(0)
        })
      })
    })

    it('isListening=true', function () {
      return this.server.createServer(this.app, { port: this.port })
      .then(() => {
        expect(this.server.isListening).to.be.true
      })
    })

    it('resolves with http server port', function () {
      return this.server.createServer(this.app, { port: this.port })
      .then(([port]) => {
        expect(port).to.eq(this.port)
      })
    })

    it('all servers listen only on localhost and no other interface', function () {
      let interfaces

      try {
        interfaces = _.flatten(_.values(os.networkInterfaces()))
      } catch (e) {
        this.skip()
      }

      const nonLoopback = interfaces.find((iface) => {
        return (iface.family === 'IPv4') && (iface.address !== '127.0.0.1')
      })

      if (!nonLoopback) {
        this.skip()
      }

      fileServer.create.restore()
      this.server._fileServer = this.oldFileServer

      // byPortAndAddress has no timeout; connecting to non-loopback with nothing listening
      // can hang until TCP timeout. Cap wait so the test doesn't hang.
      const connectTimeoutMs = 1000

      // verify that we can connect to `port` over loopback
      // and not over another configured IPv4 address
      const tryOnlyLoopbackConnect = (port) => {
        const nonLoopbackAttempt = Promise.race([
          connect.byPortAndAddress(port, nonLoopback),
          new Promise((_, reject) => setTimeout(() => reject(new Error('connect timeout')), connectTimeoutMs)),
        ])

        return Promise.all([
          connect.byPortAndAddress(port, '127.0.0.1'),
          nonLoopbackAttempt
          .then(() => {
            throw new Error(`Shouldn't be able to connect on ${nonLoopback.address}:${port}`)
          }).catch((err) => {
            if (err.code === 'ECONNREFUSED' || err.message === 'connect timeout') return

            throw err
          }),
        ])
      }

      return this.server.createServer(this.app, {})
      .then(async ([port]) => {
        await this.server.ensureHttpsProxy()

        return Promise.all([
          port,
          this.server._fileServer.port(),
          this.server._httpsProxy._sniPort,
        ].map(tryOnlyLoopbackConnect))
      })
    })

    it('resolves with warning if cannot connect to baseUrl', function () {
      sinon.stub(ensureUrl, 'isListening').rejects()

      return this.server.createServer(this.app, { port: this.port, baseUrl: `http://localhost:${this.port}` })
      .then(([port, warning]) => {
        expect(warning.type).to.eq('CANNOT_CONNECT_BASE_URL_WARNING')

        expect(warning.message).to.include(this.port)
      })
    })

    describe('errors', () => {
      it('rejects with portInUse', function () {
        return this.server.createServer(this.app, { port: this.port })
        .then(() => {
          return this.server.createServer(this.app, { port: this.port })
        }).then(() => {
          throw new Error('should have failed but didn\'t')
        }).catch((err) => {
          expect(err.type).to.eq('PORT_IN_USE_SHORT')

          expect(err.message).to.include(this.port)
        })
      })
    })
  })

  describe('#end', () => {
    it('calls this._socket.end', function () {
      const socket = sinon.stub({
        end () {},
        close () {},
      })

      this.server._socket = socket

      this.server.end()

      expect(socket.end).to.be.called
    })

    it('is noop without this._socket', function () {
      return this.server.end()
    })
  })

  describe('#startWebsockets', () => {
    beforeEach(function () {
      this.startListening = sinon.stub(SocketE2E.prototype, 'startListening')
    })

    it('sets _socket and calls _socket#startListening', function () {
      return this.server.open(this.config, getOpenOptions())
      .then(() => {
        const arg2 = {}

        this.server.startWebsockets(1, 2, arg2)

        expect(this.startListening).to.be.calledWith(this.server.getHttpServer(), 1, 2, arg2)
      })
    })

    describe('onResetServerState', () => {
      beforeEach(function () {
        this.config.blockHosts = 'localhost:3131'

        return this.server.open(this.config, getOpenOptions())
        .then(() => {
          this.websocketOptions = {} as Record<string, any>
          this.server.startWebsockets(1, 2, this.websocketOptions)
        })
      })

      it('applies the blockHosts value the driver resolved for the upcoming test', function () {
        this.websocketOptions.onResetServerState({ blockHosts: ['*.pendo.io'] })

        expect(this.server._openConfig.blockHosts).to.deep.eq(['*.pendo.io'])
      })

      it('applies null so an override can clear blocking', function () {
        this.websocketOptions.onResetServerState({ blockHosts: null })

        expect(this.server._openConfig.blockHosts).to.be.null
      })

      it('leaves blockHosts alone when the payload omits it', function () {
        this.websocketOptions.onResetServerState({})

        expect(this.server._openConfig.blockHosts).to.eq('localhost:3131')
      })

      it('leaves blockHosts alone when there is no payload', function () {
        this.websocketOptions.onResetServerState()

        expect(this.server._openConfig.blockHosts).to.eq('localhost:3131')
      })

      it('is read by the network runtime, which shares the config object', function () {
        this.websocketOptions.onResetServerState({ blockHosts: ['*.pendo.io'] })

        expect(this.server._networkProxy.http.config.blockHosts).to.deep.eq(['*.pendo.io'])
      })
    })

    // The CDP Fetch runtime swaps NetworkProxy at each launch, so the getter must
    // read whichever instance is current rather than capture one.
    it('reads the rendered-HTML-origins map off the current network proxy', function () {
      return this.server.open(this.config, getOpenOptions())
      .then(() => {
        const options: Record<string, any> = {}

        this.server.startWebsockets(1, 2, options)

        this.server._networkProxy.http.getRenderedHTMLOrigins()['http://example.com'] = true

        expect(options.getRenderedHTMLOrigins()).to.deep.eq({ 'http://example.com': true })

        this.server._networkProxy = undefined

        expect(options.getRenderedHTMLOrigins()).to.deep.eq({})
      })
    })
  })

  describe('#reset', () => {
    beforeEach(function () {
      return this.server.open(this.config, getOpenOptions())
      .then(() => {
        this.buffers = this.server._networkProxy.http

        return sinon.stub(this.buffers, 'reset')
      })
    })

    it('resets the buffers', function () {
      this.server.reset()

      expect(this.buffers.reset).to.be.called
    })

    it('restores the project-level blockHosts so an override cannot leak into the next spec', function () {
      this.server._projectBlockHosts = 'localhost:3131'
      this.server._openConfig.blockHosts = null

      this.server.reset()

      expect(this.server._openConfig.blockHosts).to.eq('localhost:3131')
    })

    it('sets the domain to the previous base url if set', function () {
      this.server._baseUrl = 'http://localhost:3000'
      this.server.reset()

      expect(this.server._remoteStates.current().strategy).to.equal('http')
    })

    it('sets the domain to <root> if not set', function () {
      this.server.reset()

      expect(this.server._remoteStates.current().strategy).to.equal('file')
    })
  })

  describe('#close', () => {
    it('resolves true successfully bailing out early', function () {
      return this.server.close().then((res) => {
        expect(res[0]).to.be.true
      })
    })

    it('returns a promise', function () {
      expect(this.server.close()).to.respondTo('then')
    })

    it('calls close on this.server', function () {
      return this.server.open(this.config, getOpenOptions())
      .then(() => {
        return this.server.close()
      })
    })

    it('isListening=false', function () {
      return this.server.open(this.config, getOpenOptions())
      .then(() => {
        return this.server.close()
      }).then(() => {
        expect(this.server.isListening).to.be.false
      })
    })

    it('calls close on this._socket', function () {
      this.server._socket = { close: sinon.spy() }

      return this.server.close()
      .then(() => {
        expect(this.server._socket.close).to.be.calledOnce
      })
    })

    // The standing MITM runtime outlives every launch, and a ServerBase is
    // created per ProjectBase.open() — so without this its PreRequests sweep
    // timer and the Http graph behind it accumulate per project open.
    it('disposes the standing MITM NetworkProxy', async function () {
      await this.server.open(this.config, getOpenOptions())

      const dispose = sinon.spy(this.server._proxyRuntime.networkProxy, 'dispose')

      await this.server.close()

      expect(dispose).to.have.been.calledOnce
      expect(this.server._networkProxy).to.be.undefined
      expect(this.server._proxyRuntime).to.be.undefined
    })
  })

  describe('#proxyWebsockets', () => {
    beforeEach(function () {
      this.proxy = sinon.stub({
        ws () {},
        on () {},
      })

      this.socket = sinon.stub({ end () {} })
      this.head = {}
    })

    it('is noop if req.url startsWith socketIoRoute', function () {
      const remotePort = 12345
      const req = {
        url: '/foobarbaz',
        socket: { remotePort, remoteAddress: '127.0.0.1' },
      }

      this.server.socketAllowed.add({
        localPort: remotePort,
        once: _.noop,
      })

      const noop = this.server.proxyWebsockets(this.proxy, '/foo', req, this.socket, this.head)

      expect(noop).to.be.undefined
    })

    // The CONNECT allow-list is a live registry of open proxy sockets, so a
    // stretch on the browser (CDP) network path (which never CONNECTs) leaves it
    // empty. A MITM browser repopulates it via onConnect before it upgrades, so
    // nothing needs to clear it on a switch.
    it('switches gates between loopback and the CONNECT allow-list', async function () {
      this.server._openConfig = this.config

      const remotePort = 12345
      const req = {
        url: '/foo/bar',
        socket: { remotePort, remoteAddress: '127.0.0.1' },
      }
      const write = sinon.stub()

      await enterBrowserNetworkMode(this.server)

      this.server.proxyWebsockets(this.proxy, '/foo', req, { ...this.socket, write }, this.head)

      expect(write, 'loopback is the only gate on the browser (CDP) network path').not.to.have.been.called
      expect(this.server.socketAllowed.allowedLocalPorts).to.be.empty

      sinon.stub(this.server, 'ensureHttpsProxy').resolves()
      await this.server.setNetworkMode(false)

      this.server.proxyWebsockets(this.proxy, '/foo', req, { ...this.socket, write }, this.head)

      expect(write, 'an unregistered port is refused on the MITM path').to.have.been.called

      write.resetHistory()
      this.server.socketAllowed.add({ localPort: remotePort, once: _.noop })

      this.server.proxyWebsockets(this.proxy, '/foo', req, { ...this.socket, write }, this.head)

      expect(write, 'the CONNECT that precedes the upgrade re-registers the port').not.to.have.been.called
    })

    it('calls proxy.ws with hostname + port', function () {
      this.server.remoteStates.set('https://www.google.com')

      const req = {
        connection: {
          encrypted: true,
        },
        url: '/',
        headers: {
          host: 'www.google.com',
        },
      }

      this.server.proxyWebsockets(this.proxy, '/foo', req, this.socket, this.head)

      expect(this.proxy.ws).to.be.calledWithMatch(req, this.socket, this.head, {
        secure: false,
        target: {
          host: 'www.google.com',
          port: '443',
          protocol: 'https:',
        },
      })
    })

    it('ends the socket if its writable and there is no __cypress.remoteHost', function () {
      const req = {
        url: '/',
        headers: {
          cookie: 'foo=bar',
        },
      }

      this.server.proxyWebsockets(this.proxy, '/foo', req, this.socket, this.head)
      expect(this.socket.end).not.to.be.called

      this.socket.writable = true
      this.server.proxyWebsockets(this.proxy, '/foo', req, this.socket, this.head)

      expect(this.socket.end).to.be.called
    })
  })

  describe('#_forceProxyMiddleware', () => {
    const clientRoute = '/__/'
    let getCurrent

    beforeEach(() => {
      getCurrent = sinon.stub(cypressSessions, 'getCurrent')
    })

    afterEach(() => {
      getCurrent.restore()
    })

    const run = (req, { clientRoute: route = clientRoute, namespace } = {}) => {
      const res = { redirect: sinon.spy() }
      const next = sinon.spy()

      // these assert the HTTP/1 proxy path, where the force-proxy redirect applies
      _forceProxyMiddleware(route, namespace, () => false)(req, res, next)

      return { res, next }
    }

    const nonProxied = (proxiedUrl, headers = {}) => ({ proxiedUrl, headers })

    it('lets a non-proxied graphql request through when the session id header matches', () => {
      getCurrent.returns({ sessionId: 'abc' })

      const { res, next } = run(nonProxied('/__cypress/tap/graphql/TapSpecs', { 'x-cypress-session-id': 'abc' }))

      expect(next).to.be.calledOnce
      expect(res.redirect).not.to.be.called
    })

    it('redirects a non-proxied graphql request whose session id header is missing', () => {
      getCurrent.returns({ sessionId: 'abc' })

      const { res, next } = run(nonProxied('/__cypress/tap/graphql/TapSpecs'))

      expect(res.redirect).to.be.calledWith(clientRoute)
      expect(next).not.to.be.called
    })

    it('redirects when the session id header does not match the current session', () => {
      getCurrent.returns({ sessionId: 'abc' })

      const { res, next } = run(nonProxied('/__cypress/tap/graphql/TapSpecs', { 'x-cypress-session-id': 'nope' }))

      expect(res.redirect).to.be.calledWith(clientRoute)
      expect(next).not.to.be.called
    })

    it('redirects when the session id header is duplicated (array-valued)', () => {
      getCurrent.returns({ sessionId: 'abc' })

      const { res, next } = run(nonProxied('/__cypress/tap/graphql/TapSpecs', { 'x-cypress-session-id': ['abc', 'abc'] }))

      expect(res.redirect).to.be.calledWith(clientRoute)
      expect(next).not.to.be.called
    })

    it('redirects a graphql request when no session is running', () => {
      getCurrent.returns(null)

      const { res, next } = run(nonProxied('/__cypress/tap/graphql/TapSpecs', { 'x-cypress-session-id': 'abc' }))

      expect(res.redirect).to.be.calledWith(clientRoute)
      expect(next).not.to.be.called
    })

    it('lets a proxied graphql request through without a session id header', () => {
      getCurrent.returns({ sessionId: 'abc' })

      const { res, next } = run({ proxiedUrl: 'http://localhost:2020/__cypress/tap/graphql/TapSpecs', headers: {} })

      expect(next).to.be.calledOnce
      expect(res.redirect).not.to.be.called
    })

    // packages/app's Cypress-in-Cypress config overrides `namespace` this way.
    it('lets a tap request through when the project overrides the namespace', () => {
      getCurrent.returns({ sessionId: 'abc' })

      const { res, next } = run(
        nonProxied('/__cypress/tap/graphql/TapSpecs', { 'x-cypress-session-id': 'abc' }),
        { clientRoute: '/__app/', namespace: '__cypress-app' },
      )

      expect(next).to.be.calledOnce
      expect(res.redirect).not.to.be.called
    })

    it('still lets the read-only sessions probe bypass without a header', () => {
      getCurrent.returns({ sessionId: 'abc' })

      const { res, next } = run(nonProxied('/__cypress/sessions/whatever'))

      expect(next).to.be.calledOnce
      expect(res.redirect).not.to.be.called
    })
  })

  describe('#onConnect', () => {
    const FORBIDDEN = 'HTTP/1.1 403 Forbidden\r\n\r\nProxy is disabled\r\n'
    const BAD_GATEWAY = 'HTTP/1.1 502 Bad Gateway\r\n\r\nProxy is not ready\r\n'

    beforeEach(function () {
      this.server._openConfig = this.config
      this.connectSocket = {
        write: sinon.stub(),
        end: sinon.stub(),
        once: sinon.stub(),
      }

      this.ensureHttpsProxy = sinon.stub(this.server, 'ensureHttpsProxy').resolves()
    })

    // A leftover browser on this port, or a machine-level system proxy, can
    // CONNECT before any launch resolves the path. Tunneling it would also
    // generate a root CA a CDP-destined run never needs.
    it('responds 403 before a launch has claimed the proxy', async function () {
      await this.server.onConnect({ url: 'example.com:443' }, this.connectSocket, null)

      expect(this.connectSocket.write).to.have.been.calledWith(FORBIDDEN)
      expect(this.connectSocket.end).to.have.been.called
      expect(this.ensureHttpsProxy).not.to.have.been.called
    })

    it('responds 403 on the browser (CDP) network path', async function () {
      await enterBrowserNetworkMode(this.server)

      await this.server.onConnect({ url: 'example.com:443' }, this.connectSocket, null)

      expect(this.connectSocket.write).to.have.been.calledWith(FORBIDDEN)
      expect(this.connectSocket.end).to.have.been.called
    })

    // Creation can fail (root CA write, SNI bind); a CONNECT retries it and
    // answers 502 rather than tearing the socket down on an unhandled rejection.
    it('responds 502 on the MITM path when the https proxy could not be created', async function () {
      await this.server.setNetworkMode(false)

      this.ensureHttpsProxy.rejects(new Error('EACCES: cannot write the root CA'))

      expect(this.server._httpsProxy).to.be.undefined

      await this.server.onConnect({ url: 'example.com:443' }, this.connectSocket, null)

      expect(this.connectSocket.write).to.have.been.calledWith(BAD_GATEWAY)
      expect(this.connectSocket.end).to.have.been.called
    })

    it('hands the CONNECT to the https proxy once it is up', async function () {
      const connect = sinon.stub()

      this.server._httpsProxy = { connect, close: sinon.stub() }

      await this.server.setNetworkMode(false)
      await this.server.onConnect({ url: 'example.com:443' }, this.connectSocket, null)

      expect(connect).to.have.been.called
      expect(this.connectSocket.write).not.to.have.been.called
    })
  })
})
