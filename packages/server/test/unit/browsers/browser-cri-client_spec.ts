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

      expect(options.browserCriClient.addServiceWorkerBinding).to.be.calledWith(options.event.sessionId)
      expect(options.browserClient.send).to.be.calledWith('Runtime.addBinding', { name: serviceWorkerClientEventHandlerName }, options.event.sessionId)
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
