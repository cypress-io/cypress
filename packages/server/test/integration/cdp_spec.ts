process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import Debug from 'debug'
import _ from 'lodash'
import WebSocket from 'ws'
import { CdpCommand, CdpEvent } from '../../lib/browsers/cdp_automation'
import { CriClient } from '../../lib/browsers/cri-client'
import { expect, nock } from '../spec_helper'
import pDefer from 'p-defer'
import sinon from 'sinon'

// import Bluebird from 'bluebird'

const debug = Debug('cypress:server:tests')

const wsServerPort = 20000

type CDPCommands = {
  command: CdpCommand
  params?: object
}

type OnWSConnection = (wsClient: WebSocket) => void

describe('CDP Clients', () => {
  require('mocha-banner').register()

  let wsSrv: WebSocket.Server
  let criClient: CriClient
  let wsClient: WebSocket
  let messages: object[]
  let onMessage: sinon.SinonStub
  let messageResponse: ReturnType<typeof pDefer> | undefined
  let neverAck: boolean

  const startWsServer = async (onConnection?: OnWSConnection): Promise<WebSocket.Server> => {
    return new Promise((resolve, reject) => {
      const srv = new WebSocket.Server({
        port: wsServerPort,
      })

      srv.on('connection', (ws) => {
        if (onConnection) {
          onConnection(ws)
        }

        // eslint-disable-next-line no-console
        ws.on('error', console.error)
        ws.on('message', async (data) => {
          const msg = JSON.parse(data.toString())

          messages.push(msg)
          onMessage(msg)

          if (neverAck) {
            return
          }

          // ACK back if we have a msg.id
          if (msg.id) {
            if (messageResponse) {
              const message = await messageResponse.promise

              ws.send(JSON.stringify({ id: msg.id, result: message }))

              return
            }

            ws.send(JSON.stringify({
              id: msg.id,
              result: {},
            }))
          }
        })
      })

      srv.on('error', reject)
      srv.on('listening', () => {
        resolve(srv)
      })
    })
  }

  const closeWsServer = () => {
    debug('closing websocket server')

    return new Promise((resolve, reject) => {
      wsSrv.close((err) => {
        if (err) {
          return reject(err)
        }

        debug('closed websocket server')
        resolve(undefined)
      })
    })
  }

  const clientDisconnected = () => {
    return new Promise((resolve, reject) => {
      criClient.ws?.once('close', resolve)
    })
  }

  beforeEach(async () => {
    messageResponse = undefined
    messages = []

    onMessage = sinon.stub()

    nock.enableNetConnect()

    wsSrv = await startWsServer((client) => {
      wsClient = client
    })
  })

  afterEach(async () => {
    debug('after each,', !!wsSrv)
    await criClient.close().catch(() => { })
    await closeWsServer()
  })

  it('properly handles various ways to add event listeners', async () => {
    const sessionId = 'abc123'
    const method = `Network.responseReceived`
    const sessionDeferred = pDefer<void>()
    const sessionCb = sinon.stub().callsFake(sessionDeferred.resolve)
    const eventDeferred = pDefer<void>()
    const eventCb = sinon.stub().callsFake(eventDeferred.resolve)
    const globalDeferred = pDefer<void>()
    const globalCb = sinon.stub().callsFake(globalDeferred.resolve)
    const params = { foo: 'bar' }

    criClient = await CriClient.create({
      target: `ws://127.0.0.1:${wsServerPort}`,
      onAsynchronousError: (err) => {
        sessionDeferred.reject(err)
        eventDeferred.reject(err)
        globalDeferred.reject(err)
      },
    })

    criClient.on(`${method}.${sessionId}` as CdpEvent, sessionCb)
    criClient.on(method, eventCb)
    criClient.on('event' as CdpEvent, globalCb)

    wsClient.send(JSON.stringify({
      method,
      params,
      sessionId,
    }))

    await Promise.all([
      sessionDeferred.promise,
      eventDeferred.promise,
      globalDeferred.promise,
    ])

    expect(sessionCb).to.have.been.calledWith(params)
    expect(eventCb).to.have.been.calledWith(params, sessionId)
    expect(globalCb).to.have.been.calledWith({ method, params, sessionId })
  })

  context('reconnect after disconnect', () => {
    it('retries to connect', async () => {
      const stub = sinon.stub()

      return new Promise(async (resolve, reject) => {
        const onAsynchronousError = reject
        const onReconnect = resolve

        criClient = await CriClient.create({
          target: `ws://127.0.0.1:${wsServerPort}`,
          onAsynchronousError,
          onReconnect,
          onReconnectAttempt: stub,
        })

        await Promise.all([
          clientDisconnected(),
          closeWsServer(),
        ])

        wsSrv = await startWsServer()
      })
      .then((client) => {
        expect(client).to.eq(criClient)

        expect(stub).to.be.calledWith(1)
        expect(stub.callCount).to.be.gte(1)
      })
    })

    it('retries up to 20 times and then throws an error', () => {
      const stub = sinon.stub()

      return new Promise(async (resolve, reject) => {
        const onAsynchronousError = resolve
        const onReconnect = reject

        criClient = await CriClient.create({
          target: `ws://127.0.0.1:${wsServerPort}`,
          onAsynchronousError,
          onReconnect,
          onReconnectAttempt: stub,
        })

        await Promise.all([
          clientDisconnected(),
          closeWsServer(),
        ])
      })
      .then((err) => {
        expect(err).to.have.property('type', 'CDP_COULD_NOT_RECONNECT')
        expect(err).to.have.property('isFatalApiErr', true)

        expect(stub).to.be.calledWith(20)
        expect(stub.callCount).to.be.eq(20)
      })
    })

    it('stops trying to reconnect if .close() is called, and does not trigger an async error', async () => {
      const stub = sinon.stub()
      const onCriConnectionClosed = sinon.stub()
      const haltedReconnection = new Promise<void>(async (resolve, reject) => {
        onCriConnectionClosed.callsFake(resolve)
        criClient = await CriClient.create({
          target: `ws://127.0.0.1:${wsServerPort}`,
          onAsynchronousError: reject,
          onReconnect: reject,
          onReconnectAttempt: stub,
          onCriConnectionClosed,
        })

        await Promise.all([
          clientDisconnected(),
          closeWsServer(),
        ])

        criClient.close()
      })

      await haltedReconnection
      // Macrotask queue needs to flush for the event to trigger
      await (new Promise((resolve) => setImmediate(resolve)))
      expect(onCriConnectionClosed).to.have.been.called
    })

    it('continuously re-sends commands that fail due to disconnect, until target is closed', async () => {
      /**
       * This test is specifically for the case when a CRIClient websocket trampolines, and
       * enqueued messages fail due to a disconnected websocket.
       *
       * That happens if a command fails due to an in-flight disconnect, and then fails again
       * after being enqueued due to an in-flight disconnect.
       *
       * The steps taken here to reproduce:
       * 1. Connect to the websocket
       * 2. Send the command, and wait for it to be received by the websocket (but not responded to)
       * 3. Disconnect the websocket
       * 4. Allow the websocket to be reconnected after 3 tries, and wait for successful reconnection
       * 5. Wait for the command to be re-sent and received by the websocket (but not responded to)
       * 6. Disconnect the websocket.
       * 7. Allow the websocket to be reconnected after 3 tries, and wait for successful reconnection
       * 8. Wait for the command to be resent, received, and responded to successfully.
       */
      neverAck = true
      const command: CDPCommands = {
        command: 'DOM.getDocument',
        params: { depth: -1 },
      }
      let reconnectPromise = pDefer()
      let commandSent = pDefer()
      const reconnectOnThirdTry = sinon.stub().onThirdCall().callsFake(async () => {
        wsSrv = await startWsServer((ws) => {
        })
      })

      const onReconnect = sinon.stub().callsFake(() => {
        reconnectPromise.resolve()
      })

      criClient = await CriClient.create({
        target: `ws://127.0.0.1:${wsServerPort}`,
        onAsynchronousError: (e) => commandSent.reject(e),
        onReconnect,
        onReconnectAttempt: reconnectOnThirdTry,
      })

      onMessage.callsFake(() => {
        commandSent.resolve()
      })

      const cmdExecution = criClient.send(command.command, command.params)

      await commandSent.promise
      await Promise.all([clientDisconnected(), closeWsServer()])

      commandSent = pDefer()
      onMessage.resetHistory()

      reconnectOnThirdTry.resetHistory()

      await commandSent.promise

      await Promise.all([clientDisconnected(), closeWsServer()])

      reconnectOnThirdTry.resetHistory()

      reconnectPromise = pDefer()

      // set up response value
      messageResponse = pDefer()

      neverAck = false

      messageResponse.resolve({ response: true })

      const res: any = await cmdExecution

      expect(res.response).to.eq(true)

      expect(reconnectPromise.promise).to.be.fulfilled
    })

    it('reattaches subscriptions, reenables enablements, and sends pending commands on reconnect', async () => {
      let reconnectPromise = pDefer()
      let commandSent = pDefer()
      let wsClient
      const reconnectOnThirdTry = sinon.stub().onThirdCall().callsFake(async () => {
        wsSrv = await startWsServer((ws) => {
          wsClient = ws
        })
      })

      const onReconnect = sinon.stub().callsFake(() => {
        reconnectPromise.resolve()
      })

      criClient = await CriClient.create({
        target: `ws://127.0.0.1:${wsServerPort}`,
        onAsynchronousError: (e) => commandSent.reject(e),
        onReconnect,
        onReconnectAttempt: reconnectOnThirdTry,
      })

      onMessage.callsFake(() => {
        commandSent.resolve()
      })

      const enablements: CDPCommands[] = [
        { command: 'Page.enable', params: {} },
        { command: 'Network.enable', params: {} },
        { command: 'Runtime.addBinding', params: { name: 'foo' } },
        { command: 'Target.setDiscoverTargets', params: { discover: true } },
      ]

      const networkRequestSubscription = {
        eventName: 'Network.requestWillBeSent',
        cb: sinon.stub(),
        mockEvent: { foo: 'bar' },
      }
      const networkResponseSubscription = {
        eventName: 'Network.responseReceived',
        cb: sinon.stub(),
        mockEvent: { baz: 'quux' },
      }

      const subscriptions = [
        networkRequestSubscription,
        networkResponseSubscription,
      ]

      // initialize state

      for (const { command, params } of enablements) {
        await criClient.send(command, params)
      }
      for (const { eventName, cb } of subscriptions) {
        criClient.on(eventName as CdpEvent, cb)
      }

      const commandsToEnqueue: (CDPCommands & { promise?: Promise<any> })[] = [
        { command: 'Page.navigate', params: { url: 'about:blank' }, promise: undefined },
        { command: 'Performance.getMetrics', params: {}, promise: undefined },
      ]

      // prevent commands from resolving, for now
      neverAck = true
      // send each command, and wait for them to be sent (but not responded to)
      for (let i = 0; i < commandsToEnqueue.length; i++) {
        commandSent = pDefer()
        const command = commandsToEnqueue[i]

        commandsToEnqueue[i].promise = criClient.send(command.command, command.params)

        await commandSent.promise
      }

      onMessage.resetHistory()
      // disconnect the websocket, causing enqueued commands to be enqueued
      await Promise.all([clientDisconnected(), closeWsServer()])

      // re-enable responses from underlying CDP
      neverAck = false

      // CriClient should now retry to connect, and succeed on the third try. Wait for reconnect.
      // this promise is resolved when: CDP is reconnected, state is restored, and queue is drained
      await reconnectPromise.promise

      // onMessage call history was reset prior to reconnection - these are assertions about
      // calls made after that reset
      for (const { command, params } of enablements) {
        /**
         * sinon/sinon-chai's expect(stub).to.have.been.calledWith({
         *    partial: object
         * })
         * does not work as advertised, at least with our version of sinon/chai/sinon-chai.
         * because the message id has the potential to be brittle, we want to assert that
         * onmessage was called with a specific command and params, regardless of message id
         */
        const sentArgs = onMessage.args.filter(([arg]) => {
          return arg.method === command && _.isEqual(arg.params, params)
        })

        expect(sentArgs, `onMessage args for enqueued command ${command}`).to.have.lengthOf(1)
      }
      for (const { command, params } of commandsToEnqueue) {
        const sentArgs = onMessage.args.filter(([{ method, params: p }]) => {
          return method === command && _.isEqual(p, params)
        })

        expect(sentArgs, `onMessage args for enqueued command ${command}`).to.have.lengthOf(1)
      }
      // for full integration, send events that should be subscribed to, and expect that subscription
      // callback to be called
      for (const { eventName, cb, mockEvent } of subscriptions) {
        const deferred = pDefer()

        cb.onFirstCall().callsFake(deferred.resolve)
        wsClient.send(JSON.stringify({
          method: eventName,
          params: mockEvent,
        }))

        await deferred.promise
        expect(cb).to.have.been.calledWith(mockEvent)
      }
    })

    it('stops reconnecting after close is called', () => {
      return new Promise(async (resolve, reject) => {
        const onAsynchronousError = reject
        const onReconnect = reject

        const stub = sinon.stub().onThirdCall().callsFake(async () => {
          criClient.close()
          .finally(() => {
            resolve(stub)
          })
        })

        criClient = await CriClient.create({
          target: `ws://127.0.0.1:${wsServerPort}`,
          onAsynchronousError,
          onReconnect,
          onReconnectAttempt: stub,
        })

        await Promise.all([
          clientDisconnected(),
          closeWsServer(),
        ])
      })
      .then((stub) => {
        expect(criClient.closed).to.be.true
        expect((stub as sinon.SinonStub).callCount).to.be.eq(3)
      })
    })
  })
})
