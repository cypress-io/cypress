import { BrowserCriClient } from '../../../lib/browsers/browser-cri-client'
import * as CriClient from '../../../lib/browsers/cri-client'
import { expect, proxyquire, sinon } from '../../spec_helper'
import * as protocol from '../../../lib/browsers/protocol'
import { stripAnsi } from '@packages/errors'
import net from 'net'
import { ProtocolManagerShape } from '@packages/types'
import type { Protocol } from 'devtools-protocol'

const HOST = '127.0.0.1'
const PORT = 50505
const THROWS_PORT = 65535

type GetClientParams = {
  protocolManager?: ProtocolManagerShape
  fullyManageTabs?: boolean
}

describe('lib/browsers/cri-client', function () {
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
    criClientCreateStub = sinon.stub(CriClient, 'create').withArgs({ target: 'http://web/socket/url', onAsynchronousError: onError, onReconnect: undefined, protocolManager: undefined, fullyManageTabs: undefined }).resolves({
      send,
      on,
      close,
    })

    browserCriClient = proxyquire('../lib/browsers/browser-cri-client', {
      'chrome-remote-interface': criImport,
    })

    getClient = ({ protocolManager, fullyManageTabs } = {}) => {
      criClientCreateStub = criClientCreateStub.withArgs({ target: 'http://web/socket/url', onAsynchronousError: onError, onReconnect: undefined, protocolManager, fullyManageTabs }).resolves({
        send,
        on,
        close,
      })

      return browserCriClient.BrowserCriClient.create({ hosts: ['127.0.0.1'], port: PORT, browserName: 'Chrome', onAsynchronousError: onError, protocolManager, fullyManageTabs })
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

      await browserCriClient.BrowserCriClient.create({ hosts: ['127.0.0.1', '::1'], port: THROWS_PORT, browserName: 'Chrome', onAsynchronousError: onError })

      expect(criImport.Version).to.be.calledOnce
    })

    it('retries when Version fails', async function () {
      sinon.stub(protocol, '_getDelayMsForRetry')
      .onFirstCall().returns(100)
      .onSecondCall().returns(100)
      .onThirdCall().returns(100)

      const client = await browserCriClient.BrowserCriClient.create({ hosts: ['127.0.0.1'], port: THROWS_PORT, browserName: 'Chrome', onAsynchronousError: onError })

      expect(client.attachToTargetUrl).to.be.instanceOf(Function)

      expect(criImport.Version).to.be.calledThrice
    })

    it('throws when Version fails more than allowed', async function () {
      sinon.stub(protocol, '_getDelayMsForRetry')
      .onFirstCall().returns(100)
      .onSecondCall().returns(undefined)

      await expect(browserCriClient.BrowserCriClient.create({ hosts: ['127.0.0.1'], port: THROWS_PORT, browserName: 'Chrome', onAsynchronousError: onError })).to.be.rejected

      expect(criImport.Version).to.be.calledTwice
    })
  })

  context('._onAttachToTarget', () => {
    let options: any

    beforeEach(() => {
      options = {
        browserClient: {
          send: sinon.stub(),
        },
        browserCriClient: {
          addExtraTargetClient: sinon.stub(),
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
      await criClient.on.lastCall.args[1]({ requestId: 'request-id' })

      expect(criClient.send).to.be.calledWith('Fetch.continueRequest', {
        requestId: 'request-id',
        headers: [{ name: 'X-Cypress-Is-From-Extra-Target', value: 'true' }],
      })
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
      })

      it('closes the extra target client', () => {
        const client = { close: sinon.stub().resolves() }

        options.browserCriClient.getExtraTargetClient.returns({ client })

        BrowserCriClient._onTargetDestroyed(options as any)

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
    })
  })

  context('#ensureMinimumProtocolVersion', function () {
    function withProtocolVersion (actual, test) {
      return getClient()
      .then((client: any) => {
        client.versionInfo = { 'Protocol-Version': actual }

        return client.ensureMinimumProtocolVersion(test)
      })
    }

    it('resolves if protocolVersion = current', function () {
      return expect(withProtocolVersion('1.3', '1.3')).to.be.fulfilled
    })

    it('resolves if protocolVersion > current', function () {
      return expect(withProtocolVersion('1.4', '1.3')).to.be.fulfilled
    })

    it('rejects if protocolVersion < current', function () {
      return expect(withProtocolVersion('1.2', '1.3')).to.be
      .rejected.then((err) => {
        expect(stripAnsi(err.message)).to.eq(`A minimum CDP version of 1.3 is required, but the current browser has 1.2.`)
      })
    })
  })

  context('#attachToTargetUrl', function () {
    it('creates a page client when the passed in url is found', async function () {
      const mockPageClient = {}

      send.withArgs('Target.getTargets').resolves({ targetInfos: [{ targetId: '1', url: 'http://foo.com' }, { targetId: '2', url: 'http://bar.com' }] })
      criClientCreateStub.withArgs({ target: '1', onAsynchronousError: onError, host: HOST, port: PORT, protocolManager: undefined, fullyManageTabs: undefined, browserClient: { on, send, close } }).resolves(mockPageClient)

      const browserClient = await getClient()

      const client = await browserClient.attachToTargetUrl('http://foo.com')

      expect(client).to.be.equal(mockPageClient)
    })

    it('creates a page client when the passed in url is found and notifies the protocol manager and fully managed tabs', async function () {
      const mockPageClient = {}
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
      expect(protocolManager.connectToBrowser).to.be.calledWith(client)
    })

    it('creates a page client when the passed in url is found and notifies the protocol manager and fully managed tabs and attaching to target throws', async function () {
      const mockPageClient = {}
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
      expect(protocolManager.connectToBrowser).to.be.calledWith(client)

      // This would throw if the error was not caught
      await on.withArgs('Target.attachedToTarget').args[0][1]({ targetInfo: { type: 'worker' } })
    })

    it('retries when the passed in url is not found', async function () {
      sinon.stub(protocol, '_getDelayMsForRetry')
      .onFirstCall().returns(100)
      .onSecondCall().returns(100)
      .onThirdCall().returns(100)

      const mockPageClient = {}

      send.withArgs('Target.getTargets').resolves({ targetInfos: [{ targetId: '1', url: 'http://foo.com' }, { targetId: '2', url: 'http://bar.com' }] })
      send.withArgs('Target.getTargets').resolves({ targetInfos: [{ targetId: '1', url: 'http://foo.com' }, { targetId: '2', url: 'http://bar.com' }] })
      send.withArgs('Target.getTargets').resolves({ targetInfos: [{ targetId: '1', url: 'http://foo.com' }, { targetId: '2', url: 'http://bar.com' }, { targetId: '3', url: 'http://baz.com' }] })
      criClientCreateStub.withArgs({ target: '1', onAsynchronousError: onError, host: HOST, port: PORT, protocolManager: undefined, fullyManageTabs: undefined, browserClient: { on, send, close } }).resolves(mockPageClient)

      const browserClient = await getClient()

      const client = await browserClient.attachToTargetUrl('http://foo.com')

      expect(client).to.be.equal(mockPageClient)
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
      }

      const mockUpdatedCurrentlyAttachedTarget = {
        targetId: '101',
      }

      send.withArgs('Target.createTarget', { url: 'about:blank' }).resolves(mockUpdatedCurrentlyAttachedTarget)
      send.withArgs('Target.closeTarget', { targetId: '100' }).resolves()
      criClientCreateStub.withArgs({ target: '101', onAsynchronousError: onError, host: HOST, port: PORT, protocolManager: undefined, fullyManageTabs: undefined }).resolves(mockUpdatedCurrentlyAttachedTarget)

      const browserClient = await getClient() as any

      browserClient.currentlyAttachedTarget = mockCurrentlyAttachedTarget

      await browserClient.resetBrowserTargets(true)

      expect(mockCurrentlyAttachedTarget.close).to.be.called
      expect(browserClient.currentlyAttachedTarget).to.eql(mockUpdatedCurrentlyAttachedTarget)
    })

    it('closes the currently attached target without keeping a tab open', async function () {
      const mockCurrentlyAttachedTarget = {
        targetId: '100',
        close: sinon.stub().resolves(sinon.stub().resolves()),
      }

      send.withArgs('Target.closeTarget', { targetId: '100' }).resolves()

      const browserClient = await getClient() as any

      browserClient.currentlyAttachedTarget = mockCurrentlyAttachedTarget

      await browserClient.resetBrowserTargets(false)

      expect(mockCurrentlyAttachedTarget.close).to.be.called
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
  })

  context('#close', function () {
    it('closes the currently attached target if it exists and the browser client', async function () {
      const mockCurrentlyAttachedTarget = {
        close: sinon.stub().resolves(),
      }

      const browserClient = await getClient() as any

      browserClient.currentlyAttachedTarget = mockCurrentlyAttachedTarget

      await browserClient.close()

      expect(mockCurrentlyAttachedTarget.close).to.be.called
      expect(close).to.be.called
    })

    it('just the browser client with no currently attached target', async function () {
      const browserClient = await getClient() as any

      await browserClient.close()

      expect(close).to.be.called
    })
  })
})
