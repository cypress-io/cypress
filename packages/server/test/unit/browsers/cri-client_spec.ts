import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping'
import EventEmitter from 'events'
import { ProtocolManagerShape } from '@packages/types'
import type { CriClient } from '../../../lib/browsers/cri-client'
import pDefer from 'p-defer'
import type Protocol from 'devtools-protocol'
const { expect, proxyquire, sinon } = require('../../spec_helper')

const DEBUGGER_URL = 'http://foo'
const HOST = '127.0.0.1'
const PORT = 50505

describe('lib/browsers/cri-client', function () {
  let send: sinon.SinonStub
  let on: sinon.SinonStub
  let off: sinon.SinonStub

  let criImport: sinon.SinonStub & {
    New: sinon.SinonStub
  }
  let criStub: {
    send: typeof send
    on: typeof on
    off: typeof off
    close: sinon.SinonStub
    _notifier: EventEmitter
  }
  let onError: sinon.SinonStub
  let onReconnect: sinon.SinonStub

  let getClient: (options?: { host?: string, fullyManageTabs?: boolean, protocolManager?: ProtocolManagerShape }) => ReturnType<typeof CriClient.create>

  const fireCDPEvent = <T extends keyof ProtocolMapping.Events>(method: T, params: Partial<ProtocolMapping.Events[T][0]>, sessionId?: string) => {
    criStub.on.withArgs('event').args[0][1]({
      method,
      params,
      sessionId,
    })
  }

  beforeEach(function () {
    send = sinon.stub()
    onError = sinon.stub()
    onReconnect = sinon.stub()
    on = sinon.stub()
    off = sinon.stub()
    criStub = {
      on,
      off,
      send,
      close: sinon.stub().resolves(),
      _notifier: new EventEmitter(),
    }

    criImport = sinon.stub()
    .withArgs({
      target: DEBUGGER_URL,
      local: true,
    })
    .resolves(criStub)

    criImport.New = sinon.stub().withArgs({ host: HOST, port: PORT, url: 'about:blank' }).resolves({ webSocketDebuggerUrl: 'http://web/socket/url' })

    const CDPConnectionRef = proxyquire('../lib/browsers/cdp-connection', {
      'chrome-remote-interface': criImport,
    }).CDPConnection

    const { CriClient } = proxyquire('../lib/browsers/cri-client', {
      './cdp-connection': { CDPConnection: CDPConnectionRef },
    })

    getClient = ({ host, fullyManageTabs, protocolManager } = {}): Promise<CriClient> => {
      return CriClient.create({ target: DEBUGGER_URL, host, onAsynchronousError: onError, fullyManageTabs, protocolManager, onReconnect })
    }
  })

  context('.create', function () {
    it('returns an instance of the CRI client', async function () {
      const client = await getClient()

      expect(client.send).to.be.instanceOf(Function)
    })

    describe('when it has a host', () => {
      it('adds a crash listener', async () => {
        const client = await getClient({ host: HOST })

        fireCDPEvent('Target.targetCrashed', { targetId: DEBUGGER_URL })
        expect(client.crashed).to.be.true
      })
    })

    describe('when it does not have a host', () => {
      it('does not add a crash listener', async () => {
        const client = await getClient()

        fireCDPEvent('Target.targetCrashed', { targetId: DEBUGGER_URL })
        expect(client.crashed).to.be.false
      })
    })

    describe('when it has a host and is fully managed and receives an attachedToTarget event', () => {
      beforeEach(async () => {
        await getClient({ host: HOST, fullyManageTabs: true })
        criStub.send.resolves()
      })

      describe('target type is service worker, page, or other', async () => {
        it('does not enable network', async () => {
          await Promise.all(['service_worker', 'page', 'other'].map((type) => {
            return fireCDPEvent('Target.attachedToTarget', {
              targetInfo: {
                type,
              } as Protocol.Target.TargetInfo,
            })
          }))

          expect(criStub.send).not.to.have.been.calledWith('Network.enable')
        })
      })

      describe('target type is something other than service worker, page, or other', () => {
        it('enables network', async () => {
          await fireCDPEvent('Target.attachedToTarget', {
            targetInfo: {
              type: 'iframe',
            } as Protocol.Target.TargetInfo,
          })

          expect(criStub.send).to.have.been.calledWith('Network.enable')
        })
      })

      describe('target is waiting for debugger', () => {
        const sessionId = 'abc123'

        it('sends Runtime.runIfWaitingForDebugger', async () => {
          await fireCDPEvent('Target.attachedToTarget', {
            waitingForDebugger: true,
            sessionId,
            targetInfo: { type: 'service_worker' } as Protocol.Target.TargetInfo,
          })

          expect(criStub.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, sessionId)
        })

        it('does not send Runtime.runIfWaitingForDebugger if not waiting for debugger', async () => {
          await fireCDPEvent('Target.attachedToTarget', {
            waitingForDebugger: false,
            sessionId,
            targetInfo: { type: 'service_worker' } as Protocol.Target.TargetInfo,
          })

          expect(criStub.send).not.to.have.been.calledWith('Runtime.runIfWaitingForDebugger')
        })

        it('sends Runtime.runIfWaitingForDebugger even if Network.enable throws', async () => {
          criStub.send.withArgs('Network.enable').throws(new Error('ProtocolError: Inspected target closed'))

          await fireCDPEvent('Target.attachedToTarget', {
            waitingForDebugger: true,
            sessionId,
            targetInfo: { type: 'iframe' } as Protocol.Target.TargetInfo,
          })

          expect(criStub.send).to.have.been.calledWith('Network.enable').and.to.have.thrown()
          expect(criStub.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, sessionId)
        })

        it('continues even if Runtime.runIfWaitingForDebugger throws', async () => {
          criStub.send.withArgs('Runtime.runIfWaitingForDebugger').throws(new Error('ProtocolError: Inspected target closed'))

          await fireCDPEvent('Target.attachedToTarget', {
            waitingForDebugger: true,
            sessionId,
            targetInfo: { type: 'service_worker' } as Protocol.Target.TargetInfo,
          })

          expect(criStub.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, sessionId).and.to.have.thrown()
        })
      })
    })

    context('#send', function () {
      it('calls cri.send with command and data', async function () {
        send.resolves()
        const client = await getClient()

        client.send('DOM.getDocument', { depth: -1 })
        expect(send).to.be.calledWith('DOM.getDocument', { depth: -1 })
      })

      it('rejects if cri.send rejects', async function () {
        const err = new Error

        send.rejects(err)
        const client = await getClient()

        await expect(client.send('DOM.getDocument', { depth: -1 }))
        .to.be.rejectedWith(err)
      })

      it('rejects if target has crashed', async function () {
        const command = 'DOM.getDocument'
        const client = await getClient({ host: '127.0.0.1', fullyManageTabs: true })

        fireCDPEvent('Target.targetCrashed', { targetId: DEBUGGER_URL })

        await expect(client.send(command, { depth: -1 })).to.be.rejectedWith(`${command} will not run as the target browser or tab CRI connection has crashed`)
      })

      it('does not reject if attachToTarget work throws', async function () {
        criStub.send.withArgs('Network.enable').throws(new Error('ProtocolError: Inspected target navigated or closed'))
        await getClient({ host: '127.0.0.1', fullyManageTabs: true })

        // This would throw if the error was not caught
        await fireCDPEvent('Target.attachedToTarget', { targetInfo: { type: 'worker', targetId: DEBUGGER_URL, title: '', url: 'https://some_url', attached: true, canAccessOpener: true } })
      })

      context('retries', () => {
        ([
          'WebSocket is not open',
          // @see https://github.com/cypress-io/cypress/issues/7180
          'WebSocket is already in CLOSING or CLOSED state',
          'WebSocket connection closed',
        ]).forEach((msg) => {
          it(`with one '${msg}' message it retries once`, async function () {
            const err = new Error(msg)

            send.onFirstCall().rejects(err)
            send.onSecondCall().resolves()

            const client = await getClient()

            const p = client.send('DOM.getDocument', { depth: -1 })

            await criStub.on.withArgs('disconnect').args[0][1]()
            await p
            expect(send).to.be.calledTwice
          })

          it(`with two '${msg}' message it retries twice`, async () => {
            const err = new Error(msg)

            send.onFirstCall().rejects(err)
            send.onSecondCall().rejects(err)
            send.onThirdCall().resolves()

            const client = await getClient()

            const getDocumentPromise = client.send('DOM.getDocument', { depth: -1 })

            await criStub.on.withArgs('disconnect').args[0][1]()
            await criStub.on.withArgs('disconnect').args[0][1]()
            await getDocumentPromise
            expect(send).to.have.callCount(3)
          })

          it(`with two '${msg}' message it retries enablements twice`, async () => {
            const err = new Error(msg)

            send.onFirstCall().rejects(err)
            send.onSecondCall().rejects(err)
            send.onThirdCall().resolves()

            const client = await getClient()

            const enableNetworkPromise = client.send('Network.enable')

            await criStub.on.withArgs('disconnect').args[0][1]()
            await criStub.on.withArgs('disconnect').args[0][1]()
            await enableNetworkPromise
            expect(send).to.have.callCount(3)
          })
        })
      })

      context('closed', () => {
        it(`when socket is closed mid send'`, async function () {
          const err = new Error('WebSocket is not open: readyState 3 (CLOSED)')

          send.onFirstCall().rejects(err)

          const client = await getClient()

          await client.close()

          expect(client.send('DOM.getDocument', { depth: -1 })).to.be.rejectedWith('DOM.getDocument will not run as browser CRI connection was reset')
        })

        it(`when socket is closed mid send ('WebSocket connection closed' variant)`, async function () {
          const err = new Error('WebSocket connection closed')

          send.onFirstCall().rejects(err)
          const client = await getClient()

          await client.close()

          expect(client.send('DOM.getDocument', { depth: -1 })).to.be.rejectedWith('DOM.getDocument will not run as browser CRI connection was reset')
        })
      })
    })
  })

  describe('on reconnect', () => {
    it('resends *.enable commands and notifies protocol manager', async () => {
      criStub._notifier.on = sinon.stub()

      const protocolManager = {
        cdpReconnect: sinon.stub(),
      } as ProtocolManagerShape

      const client = await getClient({
        protocolManager,
      })

      client.send('Page.enable')
      // @ts-ignore
      client.send('Page.foo')
      // @ts-ignore
      client.send('Page.bar')
      client.send('Network.enable')
      // @ts-ignore
      client.send('Network.baz')

      // clear out previous calls before reconnect
      criStub.send.reset()

      // @ts-ignore
      await criStub.on.withArgs('disconnect').args[0][1]()

      const reconnection = pDefer()

      onReconnect.callsFake(() => reconnection.resolve())
      await reconnection.promise

      expect(criStub.send).to.be.calledTwice
      expect(criStub.send).to.be.calledWith('Page.enable')
      expect(criStub.send).to.be.calledWith('Network.enable')
      expect(protocolManager.cdpReconnect).to.be.called

      await criStub.on.withArgs('disconnect').args[0][1]()
    })

    it('errors if reconnecting fails', async () => {
      await getClient()

      criImport.rejects()

      // @ts-ignore
      await criStub.on.withArgs('disconnect').args[0][1]()

      await (new Promise((resolve) => setImmediate(resolve)))

      expect(onError).to.be.called

      const error = onError.lastCall.args[0]

      expect(error.messageMarkdown).to.equal('There was an error reconnecting to the Chrome DevTools protocol. Please restart the browser.')
      expect(error.isFatalApiErr).to.be.true
    })
  })
})
