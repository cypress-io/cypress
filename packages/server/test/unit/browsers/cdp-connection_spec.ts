import type CDP from 'chrome-remote-interface'
import type { CdpClient, CDPConnection, CDPConnectionOptions } from '../../../lib/browsers/cdp-connection'
import type { debugCdpConnection } from '../../../lib/browsers/debug-cdp-connection'
import type { CdpEvent, CdpCommand } from '../../../lib/browsers/cdp_automation'
import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping'
import { CDPTerminatedError, CDPAlreadyConnectedError, CDPDisconnectedError } from '../../../lib/browsers/cri-errors'
import WebSocket from 'ws'
import pDefer, { DeferredPromise } from 'p-defer'
const { expect, proxyquire, sinon } = require('../../spec_helper')

const DEBUGGER_URL = 'http://foo'

type CDPConnectionCtor = new (_options: CDP.Options, connectionOptions: CDPConnectionOptions) => CDPConnection

describe('CDPConnection', () => {
  let stubbedCDPClient: sinon.SinonStubbedInstance<Partial<CdpClient> & { _ws?: sinon.SinonStubbedInstance<WebSocket> }>
  let stubbedWebSocket: sinon.SinonStubbedInstance<WebSocket>
  let stubbedDebugger: sinon.SinonStub<Parameters<typeof debugCdpConnection>, ReturnType<typeof debugCdpConnection>>

  let CDPConnection: CDPConnectionCtor
  let CDPImport: sinon.SinonStub

  let cdpConnection: CDPConnection

  let onReconnectCb: sinon.SinonStub
  let onReconnectAttemptCb: sinon.SinonStub
  let onReconnectErrCb: sinon.SinonStub
  let onConnectionClosedCb: sinon.SinonStub

  const createStubbedCdpClient = () => {
    return {
      send: sinon.stub(),
      on: sinon.stub(),
      off: sinon.stub(),
      close: sinon.stub().resolves(),
      _ws: stubbedWebSocket,
    }
  }

  beforeEach(() => {
    stubbedWebSocket = sinon.createStubInstance(WebSocket)

    stubbedCDPClient = createStubbedCdpClient()

    stubbedDebugger = sinon.stub().callsFake(() => {})

    CDPImport = sinon.stub()

    CDPConnection = proxyquire('../lib/browsers/cdp-connection', {
      'chrome-remote-interface': CDPImport,
      './debug-cdp-connection': stubbedDebugger,
    }).CDPConnection

    cdpConnection = new CDPConnection({
      target: DEBUGGER_URL,
      local: true,
    }, { automaticallyReconnect: false })

    onReconnectCb = sinon.stub()
    onReconnectAttemptCb = sinon.stub()
    onReconnectErrCb = sinon.stub()
    onConnectionClosedCb = sinon.stub()

    cdpConnection.addConnectionEventListener('cdp-connection-reconnect', onReconnectCb)
    cdpConnection.addConnectionEventListener('cdp-connection-reconnect-attempt', onReconnectAttemptCb)
    cdpConnection.addConnectionEventListener('cdp-connection-reconnect-error', onReconnectErrCb)
    cdpConnection.addConnectionEventListener('cdp-connection-closed', onConnectionClosedCb)
  })

  describe('.connect()', () => {
    describe('when CDP connects', () => {
      beforeEach(() => {
        CDPImport.withArgs({ target: DEBUGGER_URL, local: true }).resolves(stubbedCDPClient)
      })

      it('resolves', async () => {
        await expect(cdpConnection.connect()).to.be.fulfilled
      })

      describe('when there is already an active connection', () => {
        beforeEach(async () => {
          await cdpConnection.connect()
        })

        it('rejects with a CDPAlreadyConnectedError', async () => {
          await expect(cdpConnection.connect()).to.be.rejectedWith(CDPAlreadyConnectedError, DEBUGGER_URL)
        })
      })
    })

    describe('when CDP fails to connect', () => {
      let someErr: Error

      beforeEach(() => {
        someErr = new Error('some error')
        CDPImport.withArgs({ target: DEBUGGER_URL, local: true }).rejects(someErr)
      })

      it('rejects', async () => {
        await expect(cdpConnection.connect()).to.be.rejectedWith(someErr)
      })
    })

    describe('when the connection has been terminated', () => {
      beforeEach(async () => {
        await cdpConnection.disconnect()
      })

      it('rejects with a CdpTerminatedError', async () => {
        await expect(cdpConnection.connect()).to.be.rejectedWith(CDPTerminatedError, DEBUGGER_URL)
      })
    })

    describe('when CDP disconnects', () => {
      beforeEach(async () => {
        CDPImport.withArgs({ target: DEBUGGER_URL, local: true }).resolves(stubbedCDPClient)
        await cdpConnection.connect()
      })

      it('does not add a reconnect listener', async () => {
        //@ts-expect-error
        expect(stubbedCDPClient.on?.withArgs('disconnect')).not.to.have.been.called
      })
    })
  })

  describe('.disconnect()', () => {
    describe('when the connection has not been terminated and there is an active connection', () => {
      beforeEach(async () => {
        CDPImport.withArgs({ target: DEBUGGER_URL, local: true }).resolves(stubbedCDPClient)

        await cdpConnection.connect()
      })

      it('removes any event listeners that have been added', async () => {
        await cdpConnection.disconnect()

        const calls = stubbedCDPClient.on?.getCalls()

        if (calls?.length) {
          for (const call of calls) {
            const [event, listener] = call.args

            expect(stubbedCDPClient.off).to.have.been.calledWith(event, listener)
          }
        }
      })

      it('closes the CDP connection', async () => {
        await cdpConnection.disconnect()
        expect(stubbedCDPClient.close).to.have.been.called
      })

      it('marks this connection as terminated', async () => {
        await cdpConnection.disconnect()
        expect(cdpConnection.terminated).to.be.true
      })

      it('emits the cdp-connection-closed connection event', async () => {
        await cdpConnection.disconnect()
        await new Promise((resolve) => setImmediate(resolve))
        expect(onConnectionClosedCb).to.have.been.called
      })

      describe('when the connection has already been terminated', () => {
        beforeEach(async () => {
          await cdpConnection.disconnect()
          stubbedCDPClient.close?.resetHistory()
          onConnectionClosedCb.reset()
        })

        it('does not emit a lifecycle event, remove listeners, etc', async () => {
          await expect(cdpConnection.disconnect()).to.be.fulfilled
          expect(onConnectionClosedCb).not.to.have.been.called
          expect(cdpConnection.terminated).to.be.true
          expect(stubbedCDPClient.close).not.to.have.been.called
        })
      })
    })

    describe('when there is no active connection', () => {
      it('does not throw, emit a lifecycle event, remove listeners, or call close on the cdp client', async () => {
        await expect(cdpConnection.disconnect()).to.be.fulfilled
        expect(onConnectionClosedCb).not.to.have.been.called
        expect(cdpConnection.terminated).to.be.true
        expect(stubbedCDPClient.close).not.to.have.been.called
      })
    })
  })

  describe('.send()', () => {
    const method: CdpCommand = 'Runtime.runScript'
    const params = { scriptId: 'efg' }
    const sessionId = 'abc'

    describe('when the connection has been established', () => {
      beforeEach(async () => {
        CDPImport.withArgs({ target: DEBUGGER_URL, local: true }).resolves(stubbedCDPClient)
        await cdpConnection.connect()
      })

      describe('when the CDP command resolves', () => {
        const resolve: ProtocolMapping.Commands['Runtime.runScript']['returnType'] = {
          result: {
            type: 'undefined',
          },
        }

        beforeEach(() => {
          stubbedCDPClient.send?.withArgs(method, params, sessionId).resolves(resolve)
        })

        it('resolves with the same value', async () => {
          await expect(cdpConnection.send(method, params, sessionId)).to.eventually.eq(resolve)
        })
      })

      describe('when the CDP command rejects with a general error', () => {
        const err = new Error('some err')

        beforeEach(() => {
          stubbedCDPClient.send?.rejects(err)
        })

        it('rejects with the same error', async () => {
          await expect(cdpConnection.send(method, params, sessionId)).to.be.rejectedWith(err)
        })
      })

      describe('when the CDP command rejects with a websocket disconnection error message', () => {
        ['WebSocket connection closed', 'WebSocket is not open', 'WebSocket is already in CLOSING or CLOSED state'].forEach((msg) => {
          it(` it rejects "${msg}" with a CDPDisconnectedError`, async () => {
            const err = new Error(msg)

            stubbedCDPClient.send?.rejects(err)
            await expect(cdpConnection.send(method, params, sessionId)).to.be.rejectedWith(CDPDisconnectedError)
          })
        })
      })
    })

    describe('when the connection has yet to be established', () => {
      it('rejects with a CDPDisconnectedError', async () => {
        await expect(cdpConnection.send(method, params, sessionId)).to.be.rejectedWith(CDPDisconnectedError, 'has not been established')
      })
    })

    describe('when the connection has been terminated', () => {
      it('rejects with a CDPDisconnectedError', async () => {
        CDPImport.withArgs({ target: DEBUGGER_URL, local: true }).resolves(stubbedCDPClient)
        await cdpConnection.connect()
        await cdpConnection.disconnect()
        await expect(cdpConnection.send(method, params, sessionId)).to.be.rejectedWith(CDPDisconnectedError, 'terminated')
      })
    })
  })

  describe('.on()', () => {
    const event: CdpEvent = 'Browser.downloadProgress'
    const params = { some: 'params' }

    it('calls the callback when cdp client broadcasts the event', async () => {
      const cb = sinon.stub()

      CDPImport.withArgs({ target: DEBUGGER_URL, local: true }).resolves(stubbedCDPClient)

      await cdpConnection.connect()
      cdpConnection.on(event, cb)

      //@ts-expect-error
      stubbedCDPClient.on?.withArgs('event').args[0][1]({
        method: event,
        params,
      })

      await (new Promise((resolve) => setImmediate(resolve)))
      expect(cb).to.have.been.calledWith(params)
    })
  })

  describe('.off()', () => {
    const event: CdpEvent = 'Browser.downloadProgress'
    const params = { some: 'params' }

    it('no longer calls the callback when cdp client broadcasts the event', async () => {
      const cb = sinon.stub()

      cdpConnection.on(event, cb)
      CDPImport.withArgs({ target: DEBUGGER_URL, local: true }).resolves(stubbedCDPClient)

      await cdpConnection.connect()
      cdpConnection.off(event, cb)

      //@ts-expect-error
      stubbedCDPClient.on?.withArgs('event').args[0][1]({
        method: event,
        params,
      })

      await (new Promise((resolve) => setImmediate(resolve)))
      expect(cb).not.to.have.been.calledWith(params)
    })
  })

  describe('when created with auto reconnect behavior enabled and disconnected', () => {
    let deferredReconnection: DeferredPromise<any>

    beforeEach(async () => {
      cdpConnection = new CDPConnection({
        target: DEBUGGER_URL,
        local: true,
      }, { automaticallyReconnect: true })

      cdpConnection.addConnectionEventListener('cdp-connection-reconnect', onReconnectCb)
      cdpConnection.addConnectionEventListener('cdp-connection-reconnect-attempt', onReconnectAttemptCb)
      cdpConnection.addConnectionEventListener('cdp-connection-reconnect-error', onReconnectErrCb)

      deferredReconnection = pDefer()
      onReconnectCb.callsFake(() => deferredReconnection.resolve())
      onReconnectErrCb.callsFake(() => deferredReconnection.reject())
      CDPImport.withArgs({ target: DEBUGGER_URL, local: true }).resolves(stubbedCDPClient)

      await cdpConnection.connect()
      // @ts-expect-error
      stubbedCDPClient.on?.withArgs('disconnect').args[0][1]()
      CDPImport.reset()
    })

    it('reconnects when disconnected and reconnection succeeds on the third try', async () => {
      CDPImport.onFirstCall().rejects()
      CDPImport.onSecondCall().rejects()

      const newCDPClientStub = createStubbedCdpClient()

      CDPImport.onThirdCall().resolves(newCDPClientStub)

      await deferredReconnection.promise

      expect(onReconnectAttemptCb).to.have.callCount(3)
      expect(onReconnectCb).to.be.called
      expect(onReconnectErrCb).not.to.be.called
    })

    it('rejects when disconnected and reconnection fails after 20 attempts', async () => {
      CDPImport.rejects()
      await expect(deferredReconnection.promise).to.be.rejected
      expect(onReconnectErrCb).to.be.called
      expect(onReconnectAttemptCb).to.have.callCount(20)
    })
  })
})
