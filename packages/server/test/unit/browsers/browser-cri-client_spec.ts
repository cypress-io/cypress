import { BrowserCriClient } from '../../../lib/browsers/browser-cri-client'
import { CriClient } from '../../../lib/browsers/cdp-protocol/cri-client'
import { expect, proxyquire, sinon } from '../../spec_helper'
import * as protocol from '../../../lib/browsers/protocol'
import { stripAnsi } from '@packages/errors'
import net from 'net'
import type { ProtocolManagerShape } from '@packages/types'
import { CyPromptManagerShape, StudioManagerShape } from '@packages/types'
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
  let off: sinon.SinonStub
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
    off = sinon.stub()
    send = sinon.stub()
    close = sinon.stub()
    onError = sinon.stub()
    onServiceWorkerClientEvent = sinon.stub()
    // the browser-level client wraps onAsynchronousError and passes an
    // onCriConnectionClosed handler, so match loosely on the stable fields
    criClientCreateStub = sinon.stub(CriClient, 'create').withArgs(sinon.match({ target: 'http://web/socket/url', protocolManager: undefined, fullyManageTabs: undefined })).resolves({
      send,
      on,
      off,
      close,
    })

    browserCriClient = proxyquire('../lib/browsers/browser-cri-client', {
      'chrome-remote-interface': criImport,
    })

    getClient = ({ protocolManager, fullyManageTabs } = {}) => {
      criClientCreateStub = criClientCreateStub.withArgs(sinon.match({ target: 'http://web/socket/url', protocolManager, fullyManageTabs })).resolves({
        send,
        on,
        off,
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

  context('service worker bindings', function () {
    it('subscribes the browser client to the session binding', async function () {
      const client = await getClient({ fullyManageTabs: true })

      client.addServiceWorkerBinding('session-1')

      expect(on).to.be.calledWith('Runtime.bindingCalled.session-1', sinon.match.func)
      expect(client.serviceWorkerBindings.has('session-1')).to.be.true
    })

    it('delivers the session binding events to the service worker event handler', async function () {
      const client = await getClient({ fullyManageTabs: true })

      client.addServiceWorkerBinding('session-1')

      const cb = on.withArgs('Runtime.bindingCalled.session-1').args[0][1]
      const event = { type: 'hasFetchHandler', scope: 'http://localhost:8080/', payload: { hasFetchHandler: true } }

      cb({ name: serviceWorkerClientEventHandlerName, payload: JSON.stringify(event) })

      expect(onServiceWorkerClientEvent).to.be.calledWith(event)
    })

    it('unsubscribes the browser client when the session detaches', async function () {
      const client = await getClient({ fullyManageTabs: true })

      client.addServiceWorkerBinding('session-1')

      const cb = on.withArgs('Runtime.bindingCalled.session-1').args[0][1]

      await on.withArgs('Target.detachedFromTarget').args[0][1]({ sessionId: 'session-1' })

      expect(off).to.be.calledWith('Runtime.bindingCalled.session-1', cb)
      expect(client.serviceWorkerBindings.has('session-1')).to.be.false
    })

    it('does not accumulate bindings across attach/detach cycles', async function () {
      const client = await getClient({ fullyManageTabs: true })
      const detach = on.withArgs('Target.detachedFromTarget').args[0][1]

      for (let i = 0; i < 10; i++) {
        client.addServiceWorkerBinding(`session-${i}`)
        await detach({ sessionId: `session-${i}` })
      }

      expect(client.serviceWorkerBindings.size).to.eq(0)
      expect(off).to.have.callCount(10)
    })

    it('ignores a detach for a session with no binding', async function () {
      const client = await getClient({ fullyManageTabs: true })

      await on.withArgs('Target.detachedFromTarget').args[0][1]({ sessionId: 'never-attached' })

      expect(off).not.to.be.called
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
          addServiceWorkerBinding: sinon.stub(),
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

    // The backfill is the one awaited send in this handler whose rejection
    // would otherwise escape as an unhandled rejection on the _manageTabs
    // listener, which has no catch of its own — hence its own try/catch.
    it('does not throw or abort the attach when Target.getTargets rejects during url backfill', async () => {
      // service_worker keeps this on the "not an extra target" branch, same
      // as the sibling error-handling tests above - not exercising the
      // separate extra-target connect path this test isn't about
      options.event.targetInfo.type = 'service_worker'
      options.event.targetInfo.url = ''
      options.browserClient.send.withArgs('Target.getTargets').rejects(new Error('target closed'))
      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()

      await expect(BrowserCriClient._onAttachToTarget(options as any)).to.be.fulfilled

      expect(options.browserClient.send).to.be.calledWith('Runtime.runIfWaitingForDebugger', undefined, 'session-id')
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

      expect(options.browserCriClient.addServiceWorkerBinding).to.be.calledWith(options.event.sessionId)
      expect(options.browserClient.send).to.be.calledWith('Runtime.addBinding', { name: serviceWorkerClientEventHandlerName }, options.event.sessionId)
    })

    // a detach landing mid-attach only releases bindings already tracked
    it('adds the service worker fetch event binding before awaiting anything', async () => {
      options.event.targetInfo.type = 'service_worker'

      await BrowserCriClient._onAttachToTarget(options as any)

      // stub-level calledBefore compares against the stub's *last* call, and
      // send is called several times here, so the ordering only holds if it is
      // pinned to the first send - the first point this can yield
      const registered = options.browserCriClient.addServiceWorkerBinding.getCall(0)
      const firstSend = options.browserClient.send.getCall(0)

      expect(firstSend, 'expected a CDP command to have been sent').not.to.be.null
      expect(registered.calledBefore(firstSend)).to.be.true
    })

    it('does not add the service worker fetch event binding for non-service_worker targets', async () => {
      options.event.targetInfo.type = 'other'

      await BrowserCriClient._onAttachToTarget(options as any)

      expect(options.browserCriClient.addServiceWorkerBinding).not.to.be.called
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

    // sessionTargetInfo is written with the event's TargetInfo before the url
    // is resolved from Target.getTargets, so a target whose attach event
    // carries url: '' must have that entry updated, or the crash-reload path
    // can't recognize it as the extension worker and holds the full timeout
    // on every idle-restart.
    it('reflects the url backfilled from Target.getTargets in a crash-reload classification, not the attach event\'s empty one', async () => {
      const browserClient = {
        send: sinon.stub().resolves(),
        on: sinon.stub(),
      }
      const browserCriClient: any = {
        sessionTargetInfo: new Map(),
        addServiceWorkerBinding: sinon.stub(),
        removeServiceWorkerBinding: sinon.stub(),
      }

      await BrowserCriClient._manageTabs({
        browserClient: browserClient as any,
        browserCriClient,
        browserName: 'Chrome',
        host: 'localhost',
        onAsynchronousError: sinon.stub(),
        port: 1234,
        childTargetInterceptionTimeoutMs: 5,
      } as any)

      const crashHandler = browserClient.on.withArgs('Inspector.targetReloadedAfterCrash').args[0][1]

      const sessionId = 'ext-session'
      const targetId = 'ext-target-id'

      browserClient.send.withArgs('Target.getTargets').resolves({
        targetInfos: [{ targetId, url: 'chrome-extension://abc123/background.js' }],
      })

      await BrowserCriClient._onAttachToTarget({
        browserClient,
        browserCriClient,
        event: {
          sessionId,
          targetInfo: { targetId, type: 'service_worker', url: '' } as Protocol.Target.TargetInfo,
          waitingForDebugger: true,
        },
        host: 'localhost',
        port: 1234,
      } as any)

      browserCriClient.waitForChildTargetInterception = sinon.stub().returns(new Promise(() => {}))

      await crashHandler({}, sessionId)

      // classified as the extension service worker from the backfilled url,
      // so it's released immediately rather than holding the full timeout
      expect(browserCriClient.waitForChildTargetInterception).not.to.have.been.called
      expect(browserClient.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, sessionId)
    })

    // Same as above but for a target that attaches already running
    // (waitingForDebugger: false) - the backfill must still land before the
    // early return just above it, or this target's sessionTargetInfo entry
    // is stuck with the attach event's empty url forever (it's never a
    // fresh attach again).
    it('reflects the url backfilled from Target.getTargets even for a target attaching with waitingForDebugger: false', async () => {
      const browserClient = {
        send: sinon.stub().resolves(),
        on: sinon.stub(),
      }
      const browserCriClient: any = {
        sessionTargetInfo: new Map(),
        addServiceWorkerBinding: sinon.stub(),
        removeServiceWorkerBinding: sinon.stub(),
      }

      await BrowserCriClient._manageTabs({
        browserClient: browserClient as any,
        browserCriClient,
        browserName: 'Chrome',
        host: 'localhost',
        onAsynchronousError: sinon.stub(),
        port: 1234,
        childTargetInterceptionTimeoutMs: 5,
      } as any)

      const crashHandler = browserClient.on.withArgs('Inspector.targetReloadedAfterCrash').args[0][1]

      const sessionId = 'ext-session'
      const targetId = 'ext-target-id'

      browserClient.send.withArgs('Target.getTargets').resolves({
        targetInfos: [{ targetId, url: 'chrome-extension://abc123/background.js' }],
      })

      await BrowserCriClient._onAttachToTarget({
        browserClient,
        browserCriClient,
        event: {
          sessionId,
          targetInfo: { targetId, type: 'service_worker', url: '' } as Protocol.Target.TargetInfo,
          waitingForDebugger: false,
        },
        host: 'localhost',
        port: 1234,
      } as any)

      browserCriClient.waitForChildTargetInterception = sinon.stub().returns(new Promise(() => {}))

      await crashHandler({}, sessionId)

      expect(browserCriClient.waitForChildTargetInterception).not.to.have.been.called
      expect(browserClient.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, sessionId)
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
        addServiceWorkerBinding: sinon.stub(),
        removeServiceWorkerBinding: sinon.stub(),
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
      // See reenableChildTargetInterception's own doc comment for why this
      // asks for a fresh re-enable rather than merely awaiting whatever
      // confirmation the page connection already has on file - a stale one
      // can't be told apart from a fresh one, so nothing here trusts either.
      it('holds for a re-enabled interception before releasing a crashed, mapped, non-extension service worker', async () => {
        const { browserClient, browserCriClient, crashHandler } = await setup()
        const targetId = 'sw-target-id'
        const sessionId = 'sw-session'

        browserCriClient.sessionTargetInfo.set(sessionId, { targetId, type: 'service_worker', url: 'https://example.test/sw.js' })

        const interceptionReenabled = Promise.withResolvers<void>()

        browserCriClient.reenableChildTargetInterception = sinon.stub().returns(interceptionReenabled.promise)

        const released = crashHandler({}, sessionId)

        await new Promise((resolve) => setImmediate(resolve))

        expect(browserCriClient.reenableChildTargetInterception).to.have.been.calledWith(targetId)
        expect(browserClient.send).not.to.have.been.calledWith('Runtime.runIfWaitingForDebugger')

        interceptionReenabled.resolve()
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
        browserCriClient.reenableChildTargetInterception = sinon.stub().returns(new Promise(() => {}))

        await crashHandler({}, sessionId)

        expect(browserCriClient.reenableChildTargetInterception).not.to.have.been.called
        expect(browserClient.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, sessionId)
      })

      // MITM parity: on that path nothing ever sets reenableChildTargetInterception,
      // so a mapped, non-extension service worker session must still release
      // immediately rather than hold against a field that will never appear.
      it('releases immediately for a mapped, non-extension service worker when reenableChildTargetInterception is unset', async () => {
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
        browserCriClient.reenableChildTargetInterception = sinon.stub().returns(new Promise(() => {}))

        await crashHandler({}, sessionId)

        expect(browserCriClient.reenableChildTargetInterception).not.to.have.been.called
        expect(browserClient.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, sessionId)
      })

      it('releases the crashed service worker once the interception-confirmation timeout elapses', async () => {
        const { browserClient, browserCriClient, crashHandler } = await setup(5)
        const sessionId = 'sw-session'

        browserCriClient.sessionTargetInfo.set(sessionId, { targetId: 'sw-target-id', type: 'service_worker', url: 'https://example.test/sw.js' })
        browserCriClient.reenableChildTargetInterception = sinon.stub().returns(new Promise(() => {}))

        await crashHandler({}, sessionId)

        expect(browserClient.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, sessionId)
      })

      it('releases immediately when the re-enable call rejects', async () => {
        const { browserClient, browserCriClient, crashHandler } = await setup()
        const sessionId = 'sw-session'

        browserCriClient.sessionTargetInfo.set(sessionId, { targetId: 'sw-target-id', type: 'service_worker', url: 'https://example.test/sw.js' })
        browserCriClient.reenableChildTargetInterception = sinon.stub().rejects(new Error('ProtocolError: Inspected target closed'))

        await crashHandler({}, sessionId)

        expect(browserClient.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, sessionId)
      })
    })
  })

  context('cross-connection interception hold with a real page CriClient (#34674)', function () {
    // Exercises the hold through an actual page-side CriClient - built the
    // same way cri-client_spec.ts builds one - wired as
    // waitForChildTargetInterception and reenableChildTargetInterception,
    // rather than stubs standing in for what those calls actually require.
    const DEBUGGER_URL = 'http://foo'
    const sessionId = 'sw-session'
    const targetId = 'sw-target-id'

    let pageClient: CriClient
    let pageCriStub: { on: sinon.SinonStub, off: sinon.SinonStub, send: sinon.SinonStub, close: sinon.SinonStub }

    const firePageCDPEvent = (method: string, params: object, eventSessionId?: string) => {
      pageCriStub.on.withArgs('event').args[0][1]({ method, params, sessionId: eventSessionId })
    }

    const drain = () => new Promise((resolve) => setImmediate(resolve))

    beforeEach(async () => {
      pageCriStub = {
        on: sinon.stub(),
        off: sinon.stub(),
        send: sinon.stub().resolves(),
        close: sinon.stub().resolves(),
      }

      const criImportForPage = sinon.stub()
      .withArgs({ target: DEBUGGER_URL, local: true })
      .resolves(pageCriStub)

      const CDPConnectionRef = proxyquire('../lib/browsers/cdp-protocol/cdp-connection', {
        'chrome-remote-interface': criImportForPage,
      }).CDPConnection

      const { CriClient: RealCriClient } = proxyquire('../lib/browsers/cdp-protocol/cri-client', {
        './cdp-connection': { CDPConnection: CDPConnectionRef },
      })

      pageClient = await RealCriClient.create({
        target: DEBUGGER_URL,
        host: HOST,
        fullyManageTabs: true,
        onAsynchronousError: sinon.stub(),
      })

      pageClient.onChildTargetAttached = sinon.stub().resolves()

      firePageCDPEvent('Target.attachedToTarget', {
        waitingForDebugger: true,
        sessionId,
        targetInfo: { type: 'service_worker', targetId },
      })

      await drain()

      await expect(pageClient.whenChildTargetHandled(targetId)).to.be.fulfilled
    })

    async function setupBrowserConnection (childTargetInterceptionTimeoutMs?: number) {
      const browserClient = {
        send: sinon.stub().resolves(),
        on: sinon.stub(),
      }
      const browserCriClient: any = {
        sessionTargetInfo: new Map(),
        waitForChildTargetInterception: (id: string) => pageClient.whenChildTargetHandled(id),
        reenableChildTargetInterception: (id: string) => pageClient.reenableChildTargetInterception(id),
      }

      browserCriClient.sessionTargetInfo.set(sessionId, { targetId, type: 'service_worker', url: 'https://example.test/sw.js' })

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

      return { browserClient, crashHandler }
    }

    // Case (a): page-first, with the page connection's OWN
    // Inspector.targetReloadedAfterCrash handling already completed (it
    // independently re-ran and committed) before the browser connection's
    // crash handler does anything. The browser connection asks for a fresh
    // re-enable anyway - re-running Fetch.enable a second time is harmless
    // - so this resolves quickly rather than waiting out a timeout.
    it('resolves via re-enable without the timeout when the page connection already completed its own re-arm for this crash', async () => {
      // a large timeout - if this test finishes quickly, the hold resolved
      // off the re-enable call, not by waiting out even a sliver of this
      const { browserClient, crashHandler } = await setupBrowserConnection(1_000_000)

      pageClient.onChildTargetAttached = sinon.stub().resolves()

      // the page connection's own crash-reload handling completes first,
      // independent of anything the browser connection does
      firePageCDPEvent('Inspector.targetReloadedAfterCrash', {}, sessionId)
      await drain()

      await crashHandler({}, sessionId)

      expect(browserClient.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, sessionId)
      // once from the page connection's own crash handling, once from the
      // browser connection's re-enable call
      expect(pageClient.onChildTargetAttached).to.have.been.calledTwice
    })

    // Case (b): browser-first - nothing has happened on the page
    // connection's own crash-reload handling yet. The browser connection's
    // reenableChildTargetInterception call evicts and re-runs the hook
    // directly, so the hold resolves once THAT re-run completes.
    it('resolves once the re-enable hook completes, browser-first', async () => {
      const { browserClient, crashHandler } = await setupBrowserConnection()

      const reEnabled = Promise.withResolvers<void>()

      pageClient.onChildTargetAttached = sinon.stub().returns(reEnabled.promise)

      const released = crashHandler({}, sessionId)

      await drain()

      expect(browserClient.send).not.to.have.been.calledWith('Runtime.runIfWaitingForDebugger')

      reEnabled.resolve()
      await released

      expect(browserClient.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, sessionId)
    })

    // Case (c): a second crash triggers its own fresh re-enable and resolves
    // on that one, not on anything left over from the first.
    it('triggers a fresh re-enable for a second crash and resolves on that crash\'s own hook', async () => {
      const { browserClient, crashHandler } = await setupBrowserConnection()

      pageClient.onChildTargetAttached = sinon.stub().resolves()

      await crashHandler({}, sessionId)

      expect(browserClient.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, sessionId)
      expect(pageClient.onChildTargetAttached).to.have.been.calledOnce

      browserClient.send.resetHistory()

      const secondReEnabled = Promise.withResolvers<void>()

      pageClient.onChildTargetAttached = sinon.stub().returns(secondReEnabled.promise)

      const released = crashHandler({}, sessionId)

      await drain()

      expect(browserClient.send).not.to.have.been.calledWith('Runtime.runIfWaitingForDebugger')
      expect(pageClient.onChildTargetAttached).to.have.been.calledOnce

      secondReEnabled.resolve()
      await released

      expect(browserClient.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, sessionId)
    })

    // Case (d): the page connection's own Inspector.targetReloadedAfterCrash
    // handler never fires at all for this crash (event missed, or simply
    // never delivered on that connection) - correctness no longer depends
    // on it. The browser-driven re-enable covers the target regardless.
    it('resolves via the browser-driven re-enable even when the page connection never receives its own crash event', async () => {
      const { browserClient, crashHandler } = await setupBrowserConnection()

      const reEnabled = Promise.withResolvers<void>()

      pageClient.onChildTargetAttached = sinon.stub().returns(reEnabled.promise)

      // firePageCDPEvent('Inspector.targetReloadedAfterCrash', ...) is
      // deliberately never called here
      const released = crashHandler({}, sessionId)

      await drain()

      expect(pageClient.onChildTargetAttached).to.have.been.calledOnceWith(sessionId)
      expect(browserClient.send).not.to.have.been.calledWith('Runtime.runIfWaitingForDebugger')

      reEnabled.resolve()
      await released

      expect(browserClient.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, sessionId)
    })

    // Case (e): the re-enable call itself rejects - unknown target, or the
    // interception hook failing. Fails open immediately, same as any other
    // wait-rejected path, rather than hanging or waiting out the timeout.
    it('releases immediately when the re-enable call rejects', async () => {
      // a large timeout - if this test finishes quickly, the hold resolved
      // off the rejection, not by waiting out even a sliver of this
      const { browserClient, crashHandler } = await setupBrowserConnection(1_000_000)

      pageClient.onChildTargetAttached = sinon.stub().rejects(new Error('ProtocolError: Inspected target closed'))

      await crashHandler({}, sessionId)

      expect(browserClient.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, sessionId)
    })

    it('releases via the timeout when the re-enable hook never resolves', async () => {
      const { browserClient, crashHandler } = await setupBrowserConnection(5)

      pageClient.onChildTargetAttached = sinon.stub().returns(new Promise(() => {}))

      await crashHandler({}, sessionId)

      expect(browserClient.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, sessionId)
    })

    // Case (f): #34674's residual window, closed. A hook invocation already
    // in flight before this crash (a stalled fresh-attach hook, or an
    // overlapping re-enable from an earlier crash) settling while this
    // crash's own hold is pending must not be what releases it - each
    // reenableChildTargetInterception call awaits its OWN hook invocation,
    // never one that merely happens to settle around the same time.
    it('does not resolve the crash hold off a stalled hook invocation that predates this crash', async () => {
      const { browserClient, crashHandler } = await setupBrowserConnection()

      const staleInvocation = Promise.withResolvers<void>()
      const crashInvocation = Promise.withResolvers<void>()

      const onChildTargetAttached = sinon.stub()

      onChildTargetAttached.onCall(0).returns(staleInvocation.promise)
      onChildTargetAttached.onCall(1).returns(crashInvocation.promise)

      pageClient.onChildTargetAttached = onChildTargetAttached

      // a hook invocation already stalled before this crash - only its
      // effect on the crash hold below matters to this test
      pageClient.reenableChildTargetInterception(targetId).catch(() => {})

      const released = crashHandler({}, sessionId)

      await drain()

      expect(onChildTargetAttached).to.have.been.calledTwice
      expect(browserClient.send).not.to.have.been.calledWith('Runtime.runIfWaitingForDebugger')

      // resolving the stale, pre-crash invocation must not satisfy this
      // crash's own hold
      staleInvocation.resolve()
      await drain()

      expect(browserClient.send).not.to.have.been.calledWith('Runtime.runIfWaitingForDebugger')

      crashInvocation.resolve()
      await released

      expect(browserClient.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, sessionId)
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
            removeServiceWorkerBinding: sinon.stub(),
          },
          event: {
            targetId: 'target-id',
          },
        }
      })

      it('releases the service worker bindings of the destroyed target', () => {
        options.browserCriClient.hasExtraTargetClient.returns(false)
        options.browserCriClient.sessionTargetInfo.set('sw-session', { targetId: 'target-id', type: 'service_worker' })
        options.browserCriClient.sessionTargetInfo.set('other-session', { targetId: 'other-target-id', type: 'service_worker' })

        BrowserCriClient._onTargetDestroyed(options as any)

        expect(options.browserCriClient.removeServiceWorkerBinding).to.be.calledOnceWith('sw-session')
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
      criClientCreateStub.withArgs({ target: '1', onAsynchronousError: onError, host: HOST, port: PORT, protocolManager: undefined, fullyManageTabs: undefined, browserClient: { on, off, send, close } }).resolves(mockPageClient)

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
      criClientCreateStub.withArgs({ target: '1', onAsynchronousError: onError, host: HOST, port: PORT, protocolManager, fullyManageTabs: true, browserClient: { on, off, send, close } }).resolves(mockPageClient)

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

      criClientCreateStub.withArgs({ target: '1', onAsynchronousError: onError, host: HOST, port: PORT, protocolManager, fullyManageTabs: true, browserClient: { on, off, send, close } }).resolves(mockPageClient)

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
      criClientCreateStub.withArgs({ target: '1', onAsynchronousError: onError, host: HOST, port: PORT, protocolManager: undefined, fullyManageTabs: undefined, browserClient: { on, off, send, close } }).resolves(mockPageClient)

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
      criClientCreateStub.withArgs({ target: '1', onAsynchronousError: onError, host: HOST, port: PORT, protocolManager: undefined, fullyManageTabs: undefined, browserClient: { on, off, send, close } }).resolves(mockPageClient)

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
