import { BrowserCriClient } from '../../../lib/browsers/browser-cri-client'
import { CriClient } from '../../../lib/browsers/cdp-protocol/cri-client'
import { expect, proxyquire, sinon } from '../../spec_helper'
import * as protocol from '../../../lib/browsers/protocol'
import { stripAnsi } from '@packages/errors'
import net from 'net'
import { ProtocolManagerShape, CyPromptManagerShape, StudioManagerShape } from '@packages/types'
import type { Protocol } from 'devtools-protocol'
import { serviceWorkerClientEventHandlerName } from '@packages/proxy/lib/http/util/service-worker-manager'
import { cypressSessions } from '../../../lib/cypress-sessions'

const HOST = '127.0.0.1'
const PORT = 50505
const THROWS_PORT = 65535

type GetClientParams = {
  protocolManager?: ProtocolManagerShape
  fullyManageTabs?: boolean
}

describe('lib/browsers/browser-cri-client', function () {
  let browserCriClient: {
    BrowserCriClient: {
      create: typeof BrowserCriClient.create
    }
  }
  let send: sinon.SinonStub
  let on: sinon.SinonStub
  let close: sinon.SinonStub
  let criClientCreateStub: sinon.SinonStub
  let criImport: sinon.SinonStub & {
    Version: sinon.SinonStub
  }
  let onError: sinon.SinonStub
  let onServiceWorkerClientEvent: sinon.SinonStub
  let getClient: (options?: GetClientParams) => ReturnType<typeof BrowserCriClient.create>

  beforeEach(function () {
    sinon.stub(protocol, '_connectAsync')

    criImport = sinon.stub()

    criImport.Version = sinon.stub()
    criImport.Version.withArgs({ host: HOST, port: PORT, useHostName: true }).resolves({ webSocketDebuggerUrl: 'http://web/socket/url' })
    criImport.Version.withArgs({ host: HOST, port: THROWS_PORT, useHostName: true })
    .onFirstCall().throws()
    .onSecondCall().throws()
    .onThirdCall().resolves({ webSocketDebuggerUrl: 'http://web/socket/url' })

    on = sinon.stub()
    send = sinon.stub()
    close = sinon.stub()
    onError = sinon.stub()
    // the browser-level client wraps onAsynchronousError and passes an
    // onCriConnectionClosed handler, so match loosely on the stable fields
    criClientCreateStub = sinon.stub(CriClient, 'create').withArgs(sinon.match({ target: 'http://web/socket/url', protocolManager: undefined, fullyManageTabs: undefined })).resolves({
      send,
      on,
      close,
    })

    browserCriClient = proxyquire('../lib/browsers/browser-cri-client', {
      'chrome-remote-interface': criImport,
    })

    getClient = ({ protocolManager, fullyManageTabs } = {}) => {
      criClientCreateStub = criClientCreateStub.withArgs(sinon.match({ target: 'http://web/socket/url', protocolManager, fullyManageTabs })).resolves({
        send,
        on,
        close,
      })

      return browserCriClient.BrowserCriClient.create({ hosts: ['127.0.0.1'], port: PORT, browserName: 'Chrome', onAsynchronousError: onError, protocolManager, fullyManageTabs, onServiceWorkerClientEvent })
    }
  })

  context('.create', function () {
    it('returns an instance of the Browser CRI client', async function () {
      const client = await getClient()

      expect(client.attachToTargetUrl).to.be.instanceOf(Function)
    })

    it('throws an error when _connectAsync fails', async function () {
      (protocol._connectAsync as any).restore()
      sinon.stub(protocol, '_connectAsync').throws()

      await expect(getClient()).to.be.rejected
    })

    it('attempts to connect to multiple hosts', async function () {
      (protocol._connectAsync as any).restore()
      const socket = new net.Socket()

      sinon.stub(net, 'connect').callsFake((opts, onConnect) => {
        process.nextTick(() => {
          // throw an error on 127.0.0.1 so ::1 can connect
          if (opts.host === '127.0.0.1') {
            socket.emit('error', new Error())
          } else {
            onConnect()
          }
        })

        return socket
      })

      criImport.Version.withArgs({ host: '::1', port: THROWS_PORT, useHostName: true }).resolves({ webSocketDebuggerUrl: 'http://web/socket/url' })

      await browserCriClient.BrowserCriClient.create({ hosts: ['127.0.0.1', '::1'], port: THROWS_PORT, browserName: 'Chrome', onAsynchronousError: onError, onServiceWorkerClientEvent })

      expect(criImport.Version).to.be.calledOnce
    })

    it('retries when Version fails', async function () {
      sinon.stub(protocol, '_getDelayMsForRetry')
      .onFirstCall().returns(100)
      .onSecondCall().returns(100)
      .onThirdCall().returns(100)

      const client = await browserCriClient.BrowserCriClient.create({ hosts: ['127.0.0.1'], port: THROWS_PORT, browserName: 'Chrome', onAsynchronousError: onError, onServiceWorkerClientEvent })

      expect(client.attachToTargetUrl).to.be.instanceOf(Function)

      expect(criImport.Version).to.be.calledThrice
    })

    it('throws when Version fails more than allowed', async function () {
      sinon.stub(protocol, '_getDelayMsForRetry')
      .onFirstCall().returns(100)
      .onSecondCall().returns(undefined)

      await expect(browserCriClient.BrowserCriClient.create({ hosts: ['127.0.0.1'], port: THROWS_PORT, browserName: 'Chrome', onAsynchronousError: onError, onServiceWorkerClientEvent })).to.be.rejected

      expect(criImport.Version).to.be.calledTwice
    })

    it('advertises the browser websocket url to cypress sessions once connected', async function () {
      const setCdpBrowserWsUrl = sinon.stub(cypressSessions, 'setCdpBrowserWsUrl')

      await getClient()

      expect(setCdpBrowserWsUrl).to.be.calledWith('http://web/socket/url')
    })

    it('clears the cypress sessions cdp url when the browser connection is lost', async function () {
      const setCdpBrowserWsUrl = sinon.stub(cypressSessions, 'setCdpBrowserWsUrl')

      await getClient()

      const createArgs = criClientCreateStub.getCall(0).args[0]

      setCdpBrowserWsUrl.resetHistory()

      // a graceful disconnect, or reconnection halting due to closure
      createArgs.onCriConnectionClosed()
      expect(setCdpBrowserWsUrl).to.be.calledWith(null)

      setCdpBrowserWsUrl.resetHistory()

      // the browser crashed or was quit externally: reconnection ultimately failed
      const err = new Error('reconnect failed')

      createArgs.onAsynchronousError(err)
      expect(setCdpBrowserWsUrl).to.be.calledWith(null)
      // the original error handler still runs
      expect(onError).to.be.calledWith(err)
    })
  })

  context('._onAttachToTarget', () => {
    let options: any

    beforeEach(() => {
      options = {
        browserClient: {
          send: sinon.stub(),
          on: sinon.stub(),
        },
        browserCriClient: {
          addExtraTargetClient: sinon.stub(),
          getExtraTargetClient: sinon.stub().returns(undefined),
          currentlyAttachedTarget: {
            targetId: 'main-target-id',
          },
          resettingBrowserTargets: false,
          sessionTargetInfo: new Map(),
        },
        CriConstructor: sinon.stub(),
        event: {
          sessionId: 'session-id',
          targetInfo: {
            targetId: 'target-id',
            type: 'page',
            url: 'http://the.url',
          } as Protocol.Target.TargetInfo,
          waitingForDebugger: true,
        },
        host: 'localhost',
        port: 1234,
      }
    })

    it('is a noop if not waiting for debugger', async () => {
      options.event.waitingForDebugger = false

      await BrowserCriClient._onAttachToTarget(options as any)

      expect(options.browserClient.send).not.to.be.called
    })

    it('gets url from Target.getTargets if not in event', async () => {
      options.event.targetInfo.url = ''

      options.browserClient.send.withArgs('Target.getTargets').resolves({
        targetInfos: [{
          targetId: 'target-id',
          url: 'devtools://some.devtools',
        }],
      })

      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()

      await BrowserCriClient._onAttachToTarget(options as any)

      expect(options.browserClient.send).to.be.calledWith('Target.getTargets')
    })

    it('is a noop sending Runtime.runIfWaitingForDebugger if resetting browser targets', async () => {
      options.browserCriClient.resettingBrowserTargets = true
      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()

      await BrowserCriClient._onAttachToTarget(options as any)

      expect(options.CriConstructor).not.to.be.called
      expect(options.browserClient.send).to.be.calledWith('Runtime.runIfWaitingForDebugger', undefined, 'session-id')
    })

    it('is a noop sending Runtime.runIfWaitingForDebugger if target is the main Cypress tab', async () => {
      options.event.targetInfo.targetId = 'main-target-id'
      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()

      await BrowserCriClient._onAttachToTarget(options as any)

      expect(options.CriConstructor).not.to.be.called
      expect(options.browserClient.send).to.be.calledWith('Runtime.runIfWaitingForDebugger', undefined, 'session-id')
    })

    it('is a noop sending Runtime.runIfWaitingForDebugger if target is not a tab or window', async () => {
      options.event.targetInfo.type = 'service_worker'
      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()

      await BrowserCriClient._onAttachToTarget(options as any)

      expect(options.CriConstructor).not.to.be.called
      expect(options.browserClient.send).to.be.calledWith('Runtime.runIfWaitingForDebugger', undefined, 'session-id')
    })

    it('is a noop sending Runtime.runIfWaitingForDebugger if target is DevTools', async () => {
      options.event.targetInfo.url = 'devtools://dev.tools'
      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()

      await BrowserCriClient._onAttachToTarget(options as any)

      expect(options.CriConstructor).not.to.be.called
      expect(options.browserClient.send).to.be.calledWith('Runtime.runIfWaitingForDebugger', undefined, 'session-id')
    })

    it('is a noop sending Runtime.runIfWaitingForDebugger if target is the Launchpad', async () => {
      options.event.targetInfo.url = 'http://localhost:1234/__launchpad'
      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()

      await BrowserCriClient._onAttachToTarget(options as any)

      expect(options.CriConstructor).not.to.be.called
      expect(options.browserClient.send).to.be.calledWith('Runtime.runIfWaitingForDebugger', undefined, 'session-id')
    })

    it('is a noop sending Runtime.runIfWaitingForDebugger if part of a chrome extension', async () => {
      options.event.targetInfo.url = 'chrome-extension://some.extension'
      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()

      await BrowserCriClient._onAttachToTarget(options as any)

      expect(options.CriConstructor).not.to.be.called
      expect(options.browserClient.send).to.be.calledWith('Runtime.runIfWaitingForDebugger', undefined, 'session-id')
    })

    it('is a noop sending Runtime.runIfWaitingForDebugger if connecting to target errors', async () => {
      options.CriConstructor.rejects(new Error('failed to connect'))
      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()

      await BrowserCriClient._onAttachToTarget(options as any)

      expect(options.CriConstructor).to.be.called
      expect(options.browserCriClient.addExtraTargetClient).not.to.be.called
      expect(options.browserClient.send).to.be.calledWith('Runtime.runIfWaitingForDebugger', undefined, 'session-id')
    })

    it('connects to target and sends Fetch.enable', async () => {
      const criClient = {
        send: sinon.stub(),
        on: sinon.stub(),
      }

      options.CriConstructor.returns(criClient)
      options.browserClient.send.withArgs('Fetch.enable').resolves()
      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()

      await BrowserCriClient._onAttachToTarget(options as any)

      expect(options.CriConstructor).to.be.called
      expect(options.browserCriClient.addExtraTargetClient).to.be.calledWith(options.event.targetInfo, criClient)
      expect(criClient.send).to.be.calledWith('Fetch.enable')
      expect(criClient.on).to.be.calledWith('Fetch.requestPaused', sinon.match.func)
      expect(options.browserClient.send).to.be.calledWith('Runtime.runIfWaitingForDebugger', undefined, 'session-id')
    })

    it('does not throw if Fetch.enable on extra target throws', () => {
      const extraTargetCriClient = {
        send: sinon.stub().withArgs('Fetch.enable').rejects('Fetch.enable failed'),
        on: sinon.stub(),
      }

      options.CriConstructor.resolves(extraTargetCriClient)

      options.browserClient.send.withArgs('Fetch.enable').resolves()
      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()

      expect(BrowserCriClient._onAttachToTarget(options as any)).to.be.fulfilled
    })

    it('adds the service worker fetch event binding', async () => {
      options.event.targetInfo.type = 'service_worker'

      await BrowserCriClient._onAttachToTarget(options as any)

      expect(options.browserClient.on).to.be.calledWith('Runtime.bindingCalled.session-id', sinon.match.func)
      expect(options.browserClient.send).to.be.calledWith('Runtime.addBinding', { name: serviceWorkerClientEventHandlerName }, options.event.sessionId)
    })

    it('does not add the service worker fetch event binding for non-service_worker targets', async () => {
      options.event.targetInfo.type = 'other'

      await BrowserCriClient._onAttachToTarget(options as any)

      expect(options.browserClient.on).not.to.be.calledWith('Runtime.bindingCalled.session-id', sinon.match.func)
      expect(options.browserClient.send).not.to.be.calledWith('Runtime.addBinding', { name: serviceWorkerClientEventHandlerName }, options.event.sessionId)
    })

    it('adds X-Cypress-Is-From-Extra-Target header to requests from extra target', async () => {
      const criClient = {
        send: sinon.stub(),
        on: sinon.stub(),
      }

      options.CriConstructor.returns(criClient)
      options.browserClient.send.withArgs('Fetch.enable').resolves()
      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()
      criClient.send.withArgs('Fetch.continueRequest').resolves()

      await BrowserCriClient._onAttachToTarget(options as any)
      await criClient.on.lastCall.args[1]({
        requestId: 'request-id',
        request: { headers: { 'X-Another-Custom-Header': 'value' } },
      })

      expect(criClient.send).to.be.calledWith('Fetch.continueRequest', {
        requestId: 'request-id',
        headers: [
          { name: 'X-Another-Custom-Header', value: 'value' },
          { name: 'X-Cypress-Is-From-Extra-Target', value: 'true' },
        ],
      })
    })

    it('delegates Fetch ownership to onExtraTargetCriClientReady when provided', async () => {
      const criClient = {
        send: sinon.stub(),
        on: sinon.stub(),
      }
      const detach = sinon.stub().resolves()
      const onExtraTargetCriClientReady = sinon.stub().resolves(detach)
      const tracked = { client: criClient, targetInfo: options.event.targetInfo }

      options.CriConstructor.returns(criClient)
      options.browserCriClient.onExtraTargetCriClientReady = onExtraTargetCriClientReady
      options.browserCriClient.getExtraTargetClient.returns(tracked)
      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()

      await BrowserCriClient._onAttachToTarget(options as any)

      expect(onExtraTargetCriClientReady).to.be.calledOnceWith(criClient)
      expect(tracked.detach).to.equal(detach)
      expect(criClient.send).not.to.be.calledWith('Fetch.enable')
      expect(criClient.on).not.to.be.calledWith('Fetch.requestPaused', sinon.match.func)
    })

    it('releases the transport when the extra target is destroyed during attach', async () => {
      const criClient = {
        send: sinon.stub(),
        on: sinon.stub(),
      }
      // a detach that never settles models an extra target whose own CDP
      // connection is already gone — if _onAttachToTarget awaited this, the
      // test would time out instead of completing
      const detach = sinon.stub().returns(new Promise(() => {}))
      const onExtraTargetCriClientReady = sinon.stub().resolves(detach)

      options.CriConstructor.returns(criClient)
      options.browserCriClient.onExtraTargetCriClientReady = onExtraTargetCriClientReady
      // Target destroyed mid-await — tracker entry already removed
      options.browserCriClient.getExtraTargetClient.returns(undefined)
      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()

      await BrowserCriClient._onAttachToTarget(options as any)

      expect(onExtraTargetCriClientReady).to.be.calledOnceWith(criClient)
      expect(detach).to.be.calledOnce
      expect(criClient.send).not.to.be.calledWith('Fetch.enable')
      expect(criClient.on).not.to.be.calledWith('Fetch.requestPaused', sinon.match.func)
    })

    it('falls back to header-only continue when onExtraTargetCriClientReady throws', async () => {
      const criClient = {
        send: sinon.stub(),
        on: sinon.stub(),
      }

      options.CriConstructor.returns(criClient)
      options.browserCriClient.onExtraTargetCriClientReady = sinon.stub().rejects(new Error('attach failed'))
      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()
      criClient.send.withArgs('Fetch.enable').resolves()
      criClient.send.withArgs('Fetch.continueRequest').resolves()

      await BrowserCriClient._onAttachToTarget(options as any)

      expect(criClient.send).to.be.calledWith('Fetch.enable')
      expect(criClient.on).to.be.calledWith('Fetch.requestPaused', sinon.match.func)

      await criClient.on.lastCall.args[1]({
        requestId: 'request-id',
        request: { headers: {} },
      })

      expect(criClient.send).to.be.calledWith('Fetch.continueRequest', {
        requestId: 'request-id',
        headers: [
          { name: 'X-Cypress-Is-From-Extra-Target', value: 'true' },
        ],
      })
    })

    it('falls back to header-only continue when onExtraTargetCriClientReady returns undefined', async () => {
      const criClient = {
        send: sinon.stub(),
        on: sinon.stub(),
      }

      options.CriConstructor.returns(criClient)
      options.browserCriClient.onExtraTargetCriClientReady = sinon.stub().resolves(undefined)
      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()
      criClient.send.withArgs('Fetch.enable').resolves()

      await BrowserCriClient._onAttachToTarget(options as any)

      expect(criClient.send).to.be.calledWith('Fetch.enable')
      expect(criClient.on).to.be.calledWith('Fetch.requestPaused', sinon.match.func)
    })

    it('ignores any errors from continuing request', async () => {
      const criClient = {
        send: sinon.stub(),
        on: sinon.stub(),
      }

      options.CriConstructor.returns(criClient)
      options.browserClient.send.withArgs('Fetch.enable').resolves()
      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()
      criClient.send.withArgs('Fetch.continueRequest').rejects(new Error('continuing request failed'))

      await BrowserCriClient._onAttachToTarget(options as any)
      await criClient.on.lastCall.args[1]({ requestId: 'request-id', request: { url: '' } })
      // error is caught or else the test would fail
    })

    // Recorded so a later crash-and-reload on this session (which carries no
    // TargetInfo of its own - see Inspector.targetReloadedAfterCrash) can
    // still be told apart as a service worker (or not) and routed through
    // the same interception hold as a fresh attach (#34674).
    it('records the session -> TargetInfo mapping for every attach, not just service workers', async () => {
      // iframe (like service_worker) takes the "not an extra target" branch
      // directly; the default 'page' type would otherwise route through the
      // extra-target connect flow this test isn't exercising.
      options.event.targetInfo.type = 'iframe'
      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()

      await BrowserCriClient._onAttachToTarget(options as any)

      expect(options.browserCriClient.sessionTargetInfo.get('session-id')).to.equal(options.event.targetInfo)
    })

    // Ordering proof, same shape as elsewhere in this file: the mapping must
    // be visible to a lookup that races the handler, not just to one that
    // waits for it to finish - Inspector.targetReloadedAfterCrash can fire
    // for this session before this attach has awaited anything.
    it('records the session -> TargetInfo mapping before the first await (Network.enable)', async () => {
      options.event.targetInfo.type = 'iframe'
      options.browserClient.send.withArgs('Network.enable', sinon.match.any, 'session-id').returns(new Promise(() => {}))

      // not awaited - the handler is left suspended inside Network.enable
      BrowserCriClient._onAttachToTarget(options as any)

      await new Promise((resolve) => setImmediate(resolve))

      expect(options.browserCriClient.sessionTargetInfo.get('session-id')).to.equal(options.event.targetInfo)
    })

    // #34674: a paused service worker attaches on both this (browser-level)
    // connection and the page connection. Releasing it here before the page
    // connection has enabled session-scoped Fetch interception lets the
    // worker's first navigations bypass interception entirely.
    describe('waitForChildTargetInterception (#34674)', () => {
      beforeEach(() => {
        options.event.targetInfo.type = 'service_worker'
        options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()
      })

      it('awaits it before releasing a paused service worker', async () => {
        const interceptionConfirmed = Promise.withResolvers<void>()

        options.browserCriClient.waitForChildTargetInterception = sinon.stub().returns(interceptionConfirmed.promise)

        const attached = BrowserCriClient._onAttachToTarget(options as any)

        await new Promise((resolve) => setImmediate(resolve))

        expect(options.browserCriClient.waitForChildTargetInterception).to.have.been.calledWith('target-id')
        expect(options.browserClient.send).not.to.have.been.calledWith('Runtime.runIfWaitingForDebugger')

        interceptionConfirmed.resolve()
        await attached

        expect(options.browserClient.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, 'session-id')
      })

      it('releases the worker once the timeout elapses without confirmation', async () => {
        options.childTargetInterceptionTimeoutMs = 5
        options.browserCriClient.waitForChildTargetInterception = sinon.stub().returns(new Promise(() => {}))

        await BrowserCriClient._onAttachToTarget(options as any)

        expect(options.browserClient.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, 'session-id')
      })

      it('releases the worker if the waiter rejects', async () => {
        options.browserCriClient.waitForChildTargetInterception = sinon.stub().rejects(new Error('ProtocolError: Inspected target closed'))

        await BrowserCriClient._onAttachToTarget(options as any)

        expect(options.browserClient.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, 'session-id')
      })

      it('releases immediately when no waiter is registered (field absent)', async () => {
        expect(options.browserCriClient.waitForChildTargetInterception).to.be.undefined

        await BrowserCriClient._onAttachToTarget(options as any)

        expect(options.browserClient.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, 'session-id')
      })

      it('is never consulted for a non-service-worker target (iframe)', async () => {
        options.event.targetInfo.type = 'iframe'
        options.browserCriClient.waitForChildTargetInterception = sinon.stub().returns(new Promise(() => {}))

        await BrowserCriClient._onAttachToTarget(options as any)

        expect(options.browserCriClient.waitForChildTargetInterception).not.to.have.been.called
        expect(options.browserClient.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, 'session-id')
      })

      // The page connection never attaches the Cypress extension's own
      // service worker, so it would eat the full timeout on every attach and
      // on every MV3 idle-restart, stalling the extension's own automation.
      it('is never consulted for the extension service worker, and releases immediately', async () => {
        options.event.targetInfo.url = 'chrome-extension://abc123/background.js'
        options.browserCriClient.waitForChildTargetInterception = sinon.stub().returns(new Promise(() => {}))

        await BrowserCriClient._onAttachToTarget(options as any)

        expect(options.browserCriClient.waitForChildTargetInterception).not.to.have.been.called
        expect(options.browserClient.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, 'session-id')
      })

      it('is never consulted for an extra target (popup/page)', async () => {
        options.event.targetInfo.type = 'page'
        const criClient = {
          send: sinon.stub(),
          on: sinon.stub(),
        }

        options.CriConstructor.returns(criClient)
        options.browserClient.send.withArgs('Fetch.enable').resolves()
        options.browserCriClient.waitForChildTargetInterception = sinon.stub().returns(new Promise(() => {}))

        await BrowserCriClient._onAttachToTarget(options as any)

        expect(options.browserCriClient.waitForChildTargetInterception).not.to.have.been.called
        expect(options.browserClient.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, 'session-id')
      })
    })
  })

  context('._manageTabs', () => {
    // Exercises the real Target.detachedFromTarget and
    // Inspector.targetReloadedAfterCrash listeners _manageTabs registers,
    // rather than calling private handlers directly - there's no other way
    // to reach them.
    async function setup (childTargetInterceptionTimeoutMs?: number) {
      const browserClient = {
        send: sinon.stub().resolves(),
        on: sinon.stub(),
      }
      const browserCriClient: any = {
        sessionTargetInfo: new Map(),
      }

      await BrowserCriClient._manageTabs({
        browserClient: browserClient as any,
        browserCriClient,
        browserName: 'Chrome',
        host: 'localhost',
        onAsynchronousError: sinon.stub(),
        port: 1234,
        ...(childTargetInterceptionTimeoutMs !== undefined ? { childTargetInterceptionTimeoutMs } : {}),
      } as any)

      const crashHandler = browserClient.on.withArgs('Inspector.targetReloadedAfterCrash').args[0][1]
      const detachHandler = browserClient.on.withArgs('Target.detachedFromTarget').args[0][1]

      return { browserClient, browserCriClient, crashHandler, detachHandler }
    }

    describe('Target.detachedFromTarget', () => {
      it('evicts the session -> TargetInfo mapping', async () => {
        const { browserCriClient, detachHandler } = await setup()
        const sessionId = 'sw-session'

        browserCriClient.sessionTargetInfo.set(sessionId, { targetId: 'sw-target-id', type: 'service_worker', url: 'https://example.test/sw.js' })

        detachHandler({ sessionId, targetId: 'sw-target-id' })

        expect(browserCriClient.sessionTargetInfo.has(sessionId)).to.be.false
      })
    })

    // #34674: mid-test, an AUT navigation can make a service worker "crash"
    // in CDP terms. Inspector.targetReloadedAfterCrash is a second release
    // path for the exact same worker _onAttachToTarget originally paused -
    // released here uninstrumented, it can serve the crash-and-reload's own
    // navigation (and any that follow) with zero pauses, the same escape
    // #34674 closes on the ordinary attach path.
    describe('Inspector.targetReloadedAfterCrash', () => {
      it('awaits confirmed interception before releasing a crashed, mapped, non-extension service worker', async () => {
        const { browserClient, browserCriClient, crashHandler } = await setup()
        const targetId = 'sw-target-id'
        const sessionId = 'sw-session'

        browserCriClient.sessionTargetInfo.set(sessionId, { targetId, type: 'service_worker', url: 'https://example.test/sw.js' })

        const interceptionConfirmed = Promise.withResolvers<void>()

        browserCriClient.waitForChildTargetInterception = sinon.stub().returns(interceptionConfirmed.promise)

        const released = crashHandler({}, sessionId)

        await new Promise((resolve) => setImmediate(resolve))

        expect(browserCriClient.waitForChildTargetInterception).to.have.been.calledWith(targetId)
        expect(browserClient.send).not.to.have.been.calledWith('Runtime.runIfWaitingForDebugger')

        interceptionConfirmed.resolve()
        await released

        expect(browserClient.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, sessionId)
      })

      it('releases immediately when the session has no recorded TargetInfo', async () => {
        const { browserClient, crashHandler } = await setup()

        await crashHandler({}, 'unmapped-session')

        expect(browserClient.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, 'unmapped-session')
      })

      it('releases immediately for a mapped extension service worker', async () => {
        const { browserClient, browserCriClient, crashHandler } = await setup()
        const sessionId = 'ext-session'

        browserCriClient.sessionTargetInfo.set(sessionId, { targetId: 'ext-target', type: 'service_worker', url: 'chrome-extension://abc123/background.js' })
        browserCriClient.waitForChildTargetInterception = sinon.stub().returns(new Promise(() => {}))

        await crashHandler({}, sessionId)

        expect(browserCriClient.waitForChildTargetInterception).not.to.have.been.called
        expect(browserClient.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, sessionId)
      })

      // MITM parity: on that path nothing ever sets waitForChildTargetInterception,
      // so a mapped, non-extension service worker session must still release
      // immediately rather than hold against a field that will never appear.
      it('releases immediately for a mapped, non-extension service worker when waitForChildTargetInterception is unset', async () => {
        const { browserClient, browserCriClient, crashHandler } = await setup()
        const sessionId = 'sw-session'

        browserCriClient.sessionTargetInfo.set(sessionId, { targetId: 'sw-target-id', type: 'service_worker', url: 'https://example.test/sw.js' })

        await crashHandler({}, sessionId)

        expect(browserClient.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, sessionId)
      })

      it('releases a mapped, non-service-worker session immediately without consulting the field', async () => {
        const { browserClient, browserCriClient, crashHandler } = await setup()
        const sessionId = 'page-session'

        browserCriClient.sessionTargetInfo.set(sessionId, { targetId: 'page-target', type: 'page', url: 'https://example.test/' })
        browserCriClient.waitForChildTargetInterception = sinon.stub().returns(new Promise(() => {}))

        await crashHandler({}, sessionId)

        expect(browserCriClient.waitForChildTargetInterception).not.to.have.been.called
        expect(browserClient.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, sessionId)
      })

      it('releases the crashed service worker once the interception-confirmation timeout elapses', async () => {
        const { browserClient, browserCriClient, crashHandler } = await setup(5)
        const sessionId = 'sw-session'

        browserCriClient.sessionTargetInfo.set(sessionId, { targetId: 'sw-target-id', type: 'service_worker', url: 'https://example.test/sw.js' })
        browserCriClient.waitForChildTargetInterception = sinon.stub().returns(new Promise(() => {}))

        await crashHandler({}, sessionId)

        expect(browserClient.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, sessionId)
      })
    })
  })

  context('._onTargetDestroyed', () => {
    describe('when not the currently attached target', () => {
      let options: any

      beforeEach(() => {
        options = {
          browserCriClient: {
            hasExtraTargetClient: sinon.stub().returns(true),
            getExtraTargetClient: sinon.stub(),
            removeExtraTargetClient: sinon.stub(),
            currentlyAttachedTarget: {
              targetId: 'main-target-id',
              close: sinon.stub().resolves(),
            },
            currentlyAttachedProtocolTarget: {
              close: sinon.stub().resolves(),
            },
            currentlyAttachedCyPromptTarget: {
              close: sinon.stub().resolves(),
            },
            currentlyAttachedStudioTarget: {
              close: sinon.stub().resolves(),
            },
            resettingBrowserTargets: false,
            sessionTargetInfo: new Map(),
          },
          event: {
            targetId: 'target-id',
          },
        }
      })

      it('is noop if target is not currently tracked', () => {
        options.browserCriClient.hasExtraTargetClient.returns(false)

        BrowserCriClient._onTargetDestroyed(options as any)

        expect(options.browserCriClient.getExtraTargetClient).not.to.be.called
        expect(options.browserCriClient.currentlyAttachedTarget.close).not.to.be.called
        expect(options.browserCriClient.currentlyAttachedProtocolTarget.close).not.to.be.called
        expect(options.browserCriClient.currentlyAttachedCyPromptTarget.close).not.to.be.called
        expect(options.browserCriClient.currentlyAttachedStudioTarget.close).not.to.be.called
      })

      it('closes the extra target client', () => {
        const client = { close: sinon.stub().resolves() }

        options.browserCriClient.getExtraTargetClient.returns({ client })

        BrowserCriClient._onTargetDestroyed(options as any)

        expect(client.close).to.be.called
      })

      it('detaches the extra target Fetch transport when present', () => {
        const detach = sinon.stub().resolves()
        const client = { close: sinon.stub().resolves() }

        options.browserCriClient.getExtraTargetClient.returns({ client, detach })

        BrowserCriClient._onTargetDestroyed(options as any)

        expect(detach).to.be.called
        expect(client.close).to.be.called
      })

      it('ignores errors closing the extra target client', () => {
        const client = { close: sinon.stub().rejects(new Error('closing failed')) }

        options.browserCriClient.getExtraTargetClient.returns({ client })

        BrowserCriClient._onTargetDestroyed(options as any)

        expect(options.browserCriClient.removeExtraTargetClient).to.be.calledWith('target-id')
        // error is caught or else the test would fail
      })

      it('removes the extra target client from the tracker', () => {
        const client = { close: sinon.stub().resolves() }

        options.browserCriClient.getExtraTargetClient.returns({ client })

        BrowserCriClient._onTargetDestroyed(options as any)

        expect(options.browserCriClient.removeExtraTargetClient).to.be.calledWith('target-id')
      })

      it('closes the studio target', () => {
        options.browserCriClient.gracefulShutdown = true
        options.event.targetId = 'main-target-id'
        options.browserCriClient.currentlyAttachedStudioTarget.close.resolves()

        BrowserCriClient._onTargetDestroyed(options as any)

        expect(options.browserCriClient.currentlyAttachedStudioTarget.close).to.be.called
      })

      it('ignores errors closing the studio target', () => {
        options.browserCriClient.gracefulShutdown = true
        options.event.targetId = 'main-target-id'
        options.browserCriClient.currentlyAttachedStudioTarget.close.rejects(new Error('closing failed'))

        BrowserCriClient._onTargetDestroyed(options as any)

        expect(options.browserCriClient.currentlyAttachedStudioTarget.close).to.be.called
      })

      it('closes the cyPrompt target', () => {
        options.browserCriClient.gracefulShutdown = true
        options.event.targetId = 'main-target-id'
        options.browserCriClient.currentlyAttachedCyPromptTarget.close.resolves()

        BrowserCriClient._onTargetDestroyed(options as any)

        expect(options.browserCriClient.currentlyAttachedCyPromptTarget.close).to.be.called
      })

      it('ignores errors closing the cyPrompt target', () => {
        options.browserCriClient.gracefulShutdown = true
        options.event.targetId = 'main-target-id'
        options.browserCriClient.currentlyAttachedCyPromptTarget.close.rejects(new Error('closing failed'))

        BrowserCriClient._onTargetDestroyed(options as any)

        expect(options.browserCriClient.currentlyAttachedCyPromptTarget.close).to.be.called
      })

      // Target.targetDestroyed carries no sessionId, unlike detachedFromTarget
      // - this is the fallback sweep for whichever session(s) were recorded
      // against the destroyed targetId (#34674).
      it('evicts any session -> TargetInfo mapping recorded for the destroyed target', () => {
        options.browserCriClient.hasExtraTargetClient.returns(false)
        options.browserCriClient.sessionTargetInfo.set('sw-session', { targetId: 'target-id', type: 'service_worker', url: 'https://example.test/sw.js' })
        options.browserCriClient.sessionTargetInfo.set('other-session', { targetId: 'some-other-target-id', type: 'page', url: 'https://example.test/' })

        BrowserCriClient._onTargetDestroyed(options as any)

        expect(options.browserCriClient.sessionTargetInfo.has('sw-session')).to.be.false
        expect(options.browserCriClient.sessionTargetInfo.has('other-session')).to.be.true
      })
    })
  })

  context('#attachToTargetUrl', function () {
    it('creates a page client when the passed in url is found', async function () {
      const mockProtocolClient = {}
      const mockPageClient = {
        clone: sinon.stub().onFirstCall().returns(mockProtocolClient),
      }

      send.withArgs('Target.getTargets').resolves({ targetInfos: [{ targetId: '1', url: 'http://foo.com' }, { targetId: '2', url: 'http://bar.com' }] })
      criClientCreateStub.withArgs({ target: '1', onAsynchronousError: onError, host: HOST, port: PORT, protocolManager: undefined, fullyManageTabs: undefined, browserClient: { on, send, close } }).resolves(mockPageClient)

      const browserClient = await getClient()

      const client = await browserClient.attachToTargetUrl('http://foo.com')

      expect(client).to.be.equal(mockPageClient)
      expect(browserClient.currentlyAttachedProtocolTarget).to.be.equal(mockProtocolClient)
    })

    it('creates a page client when the passed in url is found and notifies the protocol manager and fully managed tabs', async function () {
      const mockProtocolClient = {}
      const mockPageClient = {
        clone: sinon.stub().onFirstCall().returns(mockProtocolClient),
      }
      const protocolManager: any = {
        connectToBrowser: sinon.stub().resolves(),
      }

      send.withArgs('Target.getTargets').resolves({ targetInfos: [{ targetId: '1', url: 'http://foo.com' }, { targetId: '2', url: 'http://bar.com' }] })
      send.withArgs('Target.setDiscoverTargets', { discover: true })
      on.withArgs('Target.targetDestroyed', sinon.match.func)
      criClientCreateStub.withArgs({ target: '1', onAsynchronousError: onError, host: HOST, port: PORT, protocolManager, fullyManageTabs: true, browserClient: { on, send, close } }).resolves(mockPageClient)

      const browserClient = await getClient({ protocolManager, fullyManageTabs: true })

      const client = await browserClient.attachToTargetUrl('http://foo.com')

      expect(client).to.be.equal(mockPageClient)
      expect(browserClient.currentlyAttachedProtocolTarget).to.be.equal(mockProtocolClient)
      expect(protocolManager.connectToBrowser).to.be.calledWith(browserClient.currentlyAttachedProtocolTarget)
    })

    it('creates a page client when the passed in url is found and notifies the protocol manager and fully managed tabs and attaching to target throws', async function () {
      const mockProtocolClient = {}
      const mockPageClient = {
        clone: sinon.stub().onFirstCall().returns(mockProtocolClient),
      }
      const protocolManager: any = {
        connectToBrowser: sinon.stub().resolves(),
      }

      send.withArgs('Target.getTargets').resolves({ targetInfos: [{ targetId: '1', url: 'http://foo.com' }, { targetId: '2', url: 'http://bar.com' }] })
      send.withArgs('Target.setDiscoverTargets', { discover: true })
      on.withArgs('Target.targetDestroyed', sinon.match.func)

      send.withArgs('Network.enable').throws(new Error('ProtocolError: Inspected target navigated or closed'))

      criClientCreateStub.withArgs({ target: '1', onAsynchronousError: onError, host: HOST, port: PORT, protocolManager, fullyManageTabs: true, browserClient: { on, send, close } }).resolves(mockPageClient)

      const browserClient = await getClient({ protocolManager, fullyManageTabs: true })

      const client = await browserClient.attachToTargetUrl('http://foo.com')

      expect(client).to.be.equal(mockPageClient)
      expect(browserClient.currentlyAttachedProtocolTarget).to.be.equal(mockProtocolClient)
      expect(protocolManager.connectToBrowser).to.be.calledWith(browserClient.currentlyAttachedProtocolTarget)

      // This would throw if the error was not caught
      await on.withArgs('Target.attachedToTarget').args[0][1]({ targetInfo: { type: 'worker' } })
    })

    it('retries when the passed in url is not found', async function () {
      sinon.stub(protocol, '_getDelayMsForRetry')
      .onFirstCall().returns(100)
      .onSecondCall().returns(100)
      .onThirdCall().returns(100)

      const mockProtocolClient = {}
      const mockPageClient = {
        clone: sinon.stub().returns(mockProtocolClient),
      }

      send.withArgs('Target.getTargets').resolves({ targetInfos: [{ targetId: '1', url: 'http://foo.com' }, { targetId: '2', url: 'http://bar.com' }] })
      send.withArgs('Target.getTargets').resolves({ targetInfos: [{ targetId: '1', url: 'http://foo.com' }, { targetId: '2', url: 'http://bar.com' }] })
      send.withArgs('Target.getTargets').resolves({ targetInfos: [{ targetId: '1', url: 'http://foo.com' }, { targetId: '2', url: 'http://bar.com' }, { targetId: '3', url: 'http://baz.com' }] })
      criClientCreateStub.withArgs({ target: '1', onAsynchronousError: onError, host: HOST, port: PORT, protocolManager: undefined, fullyManageTabs: undefined, browserClient: { on, send, close } }).resolves(mockPageClient)

      const browserClient = await getClient()

      const client = await browserClient.attachToTargetUrl('http://foo.com')

      expect(client).to.be.equal(mockPageClient)
      expect(browserClient.currentlyAttachedProtocolTarget).to.be.equal(mockProtocolClient)
    })

    it('throws when the passed in url is not found after retrying', async function () {
      sinon.stub(protocol, '_getDelayMsForRetry')
      .onFirstCall().returns(100)
      .onSecondCall().returns(undefined)

      const mockPageClient = {}

      send.withArgs('Target.getTargets').resolves({ targetInfos: [{ targetId: '1', url: 'http://foo.com' }, { targetId: '2', url: 'http://bar.com' }] })
      send.withArgs('Target.getTargets').resolves({ targetInfos: [{ targetId: '1', url: 'http://foo.com' }, { targetId: '2', url: 'http://bar.com' }] })
      criClientCreateStub.withArgs({ target: '1', onAsynchronousError: onError, host: HOST, port: PORT, protocolManager: undefined, fullyManageTabs: undefined, browserClient: { on, send, close } }).resolves(mockPageClient)

      const browserClient = await getClient()

      await expect(browserClient.attachToTargetUrl('http://baz.com')).to.be.rejected
    })
  })

  context('#resetBrowserTargets', function () {
    it('closes the currently attached target while keeping a tab open', async function () {
      const mockCurrentlyAttachedTarget = {
        targetId: '100',
        close: sinon.stub().resolves(sinon.stub().resolves()),
        queue: {
          subscriptions: [{
            eventName: 'Network.requestWillBeSent',
            cb: sinon.stub(),
          }],
        },
      }

      const mockCurrentlyAttachedProtocolTarget = {
        targetId: '100',
        close: sinon.stub().resolves(sinon.stub().resolves()),
        queue: {
          subscriptions: [{
            eventName: 'Network.requestWillBeSent',
            cb: sinon.stub(),
          }],
        },
      }

      const mockCurrentlyAttachedCyPromptTarget = {
        targetId: '100',
        close: sinon.stub().resolves(sinon.stub().resolves()),
        queue: {
          subscriptions: [{
            eventName: 'Network.requestWillBeSent',
            cb: sinon.stub(),
          }],
        },
      }

      const mockCurrentlyAttachedStudioTarget = {
        targetId: '100',
        close: sinon.stub().resolves(sinon.stub().resolves()),
        queue: {
          subscriptions: [{
            eventName: 'Network.requestWillBeSent',
            cb: sinon.stub(),
          }],
        },
      }

      const mockUpdatedCurrentlyAttachedProtocolTarget = {
        targetId: '101',
      }

      const mockUpdatedCurrentlyAttachedCyPromptTarget = {
        targetId: '101',
      }

      const mockUpdatedCurrentlyAttachedStudioTarget = {
        targetId: '101',
      }

      const mockUpdatedCurrentlyAttachedTarget = {
        targetId: '101',
        clone: sinon.stub()
          .onFirstCall().returns(mockUpdatedCurrentlyAttachedProtocolTarget)
          .onSecondCall().returns(mockUpdatedCurrentlyAttachedCyPromptTarget)
          .onThirdCall().returns(mockUpdatedCurrentlyAttachedStudioTarget),
      }

      send.withArgs('Target.createTarget', { url: 'about:blank' }).resolves(mockUpdatedCurrentlyAttachedTarget)
      send.withArgs('Target.closeTarget', { targetId: '100' }).resolves()

      const browserClient = await getClient() as any

      criClientCreateStub.withArgs({ target: '101', onAsynchronousError: onError, host: HOST, port: PORT, protocolManager: undefined, fullyManageTabs: undefined, browserClient: browserClient.browserClient }).resolves(mockUpdatedCurrentlyAttachedTarget)

      browserClient.currentlyAttachedTarget = mockCurrentlyAttachedTarget
      browserClient.currentlyAttachedProtocolTarget = mockCurrentlyAttachedProtocolTarget
      browserClient.currentlyAttachedCyPromptTarget = mockCurrentlyAttachedCyPromptTarget
      browserClient.currentlyAttachedStudioTarget = mockCurrentlyAttachedStudioTarget
      browserClient.browserClient.off = sinon.stub()

      await browserClient.resetBrowserTargets(true)

      expect(mockCurrentlyAttachedTarget.close).to.be.called
      expect(browserClient.currentlyAttachedTarget).to.eql(mockUpdatedCurrentlyAttachedTarget)
      expect(browserClient.currentlyAttachedProtocolTarget).to.eql(mockUpdatedCurrentlyAttachedProtocolTarget)
      expect(browserClient.currentlyAttachedCyPromptTarget).to.eql(mockUpdatedCurrentlyAttachedCyPromptTarget)
      expect(browserClient.currentlyAttachedStudioTarget).to.eql(mockUpdatedCurrentlyAttachedStudioTarget)
      expect(browserClient.browserClient.off).to.be.calledWith('Network.requestWillBeSent', mockCurrentlyAttachedTarget.queue.subscriptions[0].cb)
      expect(browserClient.browserClient.off).to.be.calledWith('Network.requestWillBeSent', mockCurrentlyAttachedProtocolTarget.queue.subscriptions[0].cb)
      expect(browserClient.browserClient.off).to.be.calledWith('Network.requestWillBeSent', mockCurrentlyAttachedCyPromptTarget.queue.subscriptions[0].cb)
      expect(browserClient.browserClient.off).to.be.calledWith('Network.requestWillBeSent', mockCurrentlyAttachedStudioTarget.queue.subscriptions[0].cb)
    })

    it('closes the currently attached target without keeping a tab open', async function () {
      const mockCurrentlyAttachedTarget = {
        targetId: '100',
        close: sinon.stub().resolves(sinon.stub().resolves()),
        queue: {
          subscriptions: [],
        },
      }

      const mockCurrentlyAttachedProtocolTarget = {
        targetId: '100',
        close: sinon.stub().resolves(sinon.stub().resolves()),
        queue: {
          subscriptions: [],
        },
      }

      const mockCurrentlyAttachedCyPromptTarget = {
        targetId: '100',
        close: sinon.stub().resolves(sinon.stub().resolves()),
        queue: {
          subscriptions: [],
        },
      }

      const mockCurrentlyAttachedStudioTarget = {
        targetId: '100',
        close: sinon.stub().resolves(sinon.stub().resolves()),
        queue: {
          subscriptions: [],
        },
      }

      send.withArgs('Target.closeTarget', { targetId: '100' }).resolves()

      const browserClient = await getClient() as any

      browserClient.currentlyAttachedTarget = mockCurrentlyAttachedTarget
      browserClient.currentlyAttachedProtocolTarget = mockCurrentlyAttachedProtocolTarget
      browserClient.currentlyAttachedCyPromptTarget = mockCurrentlyAttachedCyPromptTarget
      browserClient.currentlyAttachedStudioTarget = mockCurrentlyAttachedStudioTarget

      await browserClient.resetBrowserTargets(false)

      expect(mockCurrentlyAttachedTarget.close).to.be.called
      expect(mockCurrentlyAttachedProtocolTarget.close).to.be.called
      expect(mockCurrentlyAttachedCyPromptTarget.close).to.be.called
      expect(mockCurrentlyAttachedStudioTarget.close).to.be.called
      expect(browserClient.currentlyAttachedTarget).to.be.undefined
      expect(browserClient.currentlyAttachedProtocolTarget).to.be.undefined
      expect(browserClient.currentlyAttachedCyPromptTarget).to.be.undefined
      expect(browserClient.currentlyAttachedStudioTarget).to.be.undefined
    })

    it('throws when there is no currently attached target', async function () {
      const browserClient = await getClient() as any

      await expect(browserClient.resetBrowserTargets()).to.be.rejected
    })
  })

  context('#closeExtraTargets', () => {
    it('closes any extra tracked targets', async () => {
      const browserClient = await getClient() as any

      browserClient.browserClient.send = sinon.stub().resolves()

      browserClient.addExtraTargetClient({ targetId: 'target-id-1' }, {})
      browserClient.addExtraTargetClient({ targetId: 'target-id-2' }, {})

      await browserClient.closeExtraTargets()

      expect(browserClient.browserClient.send).to.be.calledWith('Target.closeTarget', { targetId: 'target-id-1' })
      expect(browserClient.browserClient.send).to.be.calledWith('Target.closeTarget', { targetId: 'target-id-2' })
    })

    it('ignores errors', async () => {
      const browserClient = await getClient() as any

      browserClient.browserClient.send = sinon.stub().resolves()
      browserClient.browserClient.send.onFirstCall().rejects(new Error('failed to close target'))

      browserClient.addExtraTargetClient({ targetId: 'target-id-1' }, {})
      browserClient.addExtraTargetClient({ targetId: 'target-id-2' }, {})

      await browserClient.closeExtraTargets()

      expect(browserClient.browserClient.send).to.be.calledWith('Target.closeTarget', { targetId: 'target-id-1' })
      expect(browserClient.browserClient.send).to.be.calledWith('Target.closeTarget', { targetId: 'target-id-2' })
      // error is caught or else the test would fail
    })

    it('does not wait on the extra target Fetch transport detaching', async () => {
      const browserClient = await getClient() as any

      browserClient.browserClient.send = sinon.stub().resolves()

      browserClient.addExtraTargetClient({ targetId: 'target-id-1' }, {})
      // a detach that never settles models an extra target whose own CDP
      // connection is already gone
      browserClient.getExtraTargetClient('target-id-1').detach = sinon.stub().returns(new Promise(() => {}))

      await browserClient.closeExtraTargets()

      expect(browserClient.browserClient.send).to.be.calledWith('Target.closeTarget', { targetId: 'target-id-1' })
    })
  })

  context('#close', function () {
    it('closes the currently attached target if it exists and the browser client', async function () {
      const mockCurrentlyAttachedTarget = {
        close: sinon.stub().resolves(),
      }

      const mockCurrentlyAttachedProtocolTarget = {
        close: sinon.stub().resolves(),
      }

      const mockCurrentlyAttachedCyPromptTarget = {
        close: sinon.stub().resolves(),
      }

      const mockCurrentlyAttachedStudioTarget = {
        close: sinon.stub().resolves(),
      }

      const browserClient = await getClient() as any

      browserClient.currentlyAttachedTarget = mockCurrentlyAttachedTarget
      browserClient.currentlyAttachedProtocolTarget = mockCurrentlyAttachedProtocolTarget
      browserClient.currentlyAttachedCyPromptTarget = mockCurrentlyAttachedCyPromptTarget
      browserClient.currentlyAttachedStudioTarget = mockCurrentlyAttachedStudioTarget

      await browserClient.close()

      expect(mockCurrentlyAttachedTarget.close).to.be.called
      expect(mockCurrentlyAttachedProtocolTarget.close).to.be.called
      expect(mockCurrentlyAttachedCyPromptTarget.close).to.be.called
      expect(mockCurrentlyAttachedStudioTarget.close).to.be.called
    })

    it('just the browser client with no currently attached target', async function () {
      const browserClient = await getClient() as any

      await browserClient.close()

      expect(close).to.be.called
    })
  })
})
