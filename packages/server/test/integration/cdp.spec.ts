process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import Debug from 'debug'
import _ from 'lodash'
import WebSocket from 'ws'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import type { CdpCommand, CdpEvent } from '../../lib/browsers/cdp-protocol/cdp_automation'
import { CriClient } from '../../lib/browsers/cdp-protocol/cri-client'

const debug = Debug('cypress:server:tests')

const wsServerPort = 20000

type CDPCommands = {
  command: CdpCommand
  params?: object
}

type OnWSConnection = (wsClient: WebSocket) => void

// Runs `onThirdCall` on the third call since the mock was created or last cleared,
// and returns undefined on every other call.
const mockOnThirdCall = (onThirdCall: () => Promise<void>): Mock => {
  const mock = vi.fn()

  mock.mockImplementation(() => {
    if (mock.mock.calls.length === 3) {
      return onThirdCall()
    }

    return undefined
  })

  return mock
}

describe('CDP Clients', () => {
  let wsSrv: WebSocket.Server
  let criClient: CriClient
  let wsClient: WebSocket
  let messages: object[]
  let onMessage: Mock
  let messageResponse: ReturnType<typeof Promise.withResolvers> | undefined
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

    onMessage = vi.fn()

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
    const sessionDeferred = Promise.withResolvers<void>()
    const sessionCb = vi.fn(sessionDeferred.resolve)
    const eventDeferred = Promise.withResolvers<void>()
    const eventCb = vi.fn(eventDeferred.resolve)
    const globalDeferred = Promise.withResolvers<void>()
    const globalCb = vi.fn(globalDeferred.resolve)
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

    expect(sessionCb).toHaveBeenCalledWith(params)
    expect(eventCb).toHaveBeenCalledWith(params, sessionId)
    expect(globalCb).toHaveBeenCalledWith({ method, params, sessionId })
  })

  describe('reconnect after disconnect', () => {
    it('retries to connect', async () => {
      const stub = vi.fn()

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
        expect(client).toBe(criClient)

        expect(stub).toHaveBeenCalledWith(1)
        expect(stub.mock.calls.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('retries up to 20 times and then throws an error', () => {
      const stub = vi.fn()

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
        expect(err).toHaveProperty('type', 'CDP_COULD_NOT_RECONNECT')
        expect(err).toHaveProperty('isFatalApiErr', true)

        expect(stub).toHaveBeenCalledWith(20)
        expect(stub).toHaveBeenCalledTimes(20)
      })
    })

    it('stops trying to reconnect if .close() is called, and does not trigger an async error', async () => {
      const stub = vi.fn()
      const onCriConnectionClosed = vi.fn()
      const haltedReconnection = new Promise<void>(async (resolve, reject) => {
        onCriConnectionClosed.mockImplementation(resolve)
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
      expect(onCriConnectionClosed).toHaveBeenCalled()
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
      let reconnectPromise = Promise.withResolvers()
      let commandSent = Promise.withResolvers()
      const reconnectOnThirdTry = mockOnThirdCall(async () => {
        wsSrv = await startWsServer((ws) => {
        })
      })

      const onReconnect = vi.fn(() => {
        reconnectPromise.resolve()
      })

      criClient = await CriClient.create({
        target: `ws://127.0.0.1:${wsServerPort}`,
        onAsynchronousError: (e) => commandSent.reject(e),
        onReconnect,
        onReconnectAttempt: reconnectOnThirdTry,
      })

      onMessage.mockImplementation(() => {
        commandSent.resolve()
      })

      const cmdExecution = criClient.send(command.command, command.params)

      await commandSent.promise
      await Promise.all([clientDisconnected(), closeWsServer()])

      commandSent = Promise.withResolvers()
      onMessage.mockClear()

      reconnectOnThirdTry.mockClear()

      await commandSent.promise

      await Promise.all([clientDisconnected(), closeWsServer()])

      reconnectOnThirdTry.mockClear()

      reconnectPromise = Promise.withResolvers()

      // set up response value
      messageResponse = Promise.withResolvers()

      neverAck = false

      messageResponse.resolve({ response: true })

      const res: any = await cmdExecution

      expect(res.response).toBe(true)

      await expect(reconnectPromise.promise).resolves.toBeUndefined()
    })

    it('reattaches subscriptions, reenables enablements, and sends pending commands on reconnect', async () => {
      const reconnectPromise = Promise.withResolvers()
      let commandSent = Promise.withResolvers()
      let wsClient
      const reconnectOnThirdTry = mockOnThirdCall(async () => {
        wsSrv = await startWsServer((ws) => {
          wsClient = ws
        })
      })

      const onReconnect = vi.fn(() => {
        reconnectPromise.resolve()
      })

      criClient = await CriClient.create({
        target: `ws://127.0.0.1:${wsServerPort}`,
        onAsynchronousError: (e) => commandSent.reject(e),
        onReconnect,
        onReconnectAttempt: reconnectOnThirdTry,
      })

      onMessage.mockImplementation(() => {
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
        cb: vi.fn(),
        mockEvent: { foo: 'bar' },
      }
      const networkResponseSubscription = {
        eventName: 'Network.responseReceived',
        cb: vi.fn(),
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
        commandSent = Promise.withResolvers()
        const command = commandsToEnqueue[i]

        commandsToEnqueue[i].promise = criClient.send(command.command, command.params)

        await commandSent.promise
      }

      onMessage.mockClear()
      // disconnect the websocket, causing enqueued commands to be enqueued
      await Promise.all([clientDisconnected(), closeWsServer()])

      // re-enable responses from underlying CDP
      neverAck = false

      // CriClient should now retry to connect, and succeed on the third try. Wait for reconnect.
      // this promise is resolved when: CDP is reconnected, state is restored, and queue is drained
      await reconnectPromise.promise

      // onMessage call history was cleared prior to reconnection - these are assertions about
      // calls made after that reset. The message id is brittle, so match on command and params only.
      for (const { command, params } of enablements) {
        const sentArgs = onMessage.mock.calls.filter(([arg]) => {
          return arg.method === command && _.isEqual(arg.params, params)
        })

        expect(sentArgs, `onMessage args for enqueued command ${command}`).toHaveLength(1)
      }
      for (const { command, params } of commandsToEnqueue) {
        const sentArgs = onMessage.mock.calls.filter(([{ method, params: p }]) => {
          return method === command && _.isEqual(p, params)
        })

        expect(sentArgs, `onMessage args for enqueued command ${command}`).toHaveLength(1)
      }
      // for full integration, send events that should be subscribed to, and expect that subscription
      // callback to be called
      for (const { eventName, cb, mockEvent } of subscriptions) {
        const deferred = Promise.withResolvers()

        cb.mockImplementationOnce(deferred.resolve)
        wsClient.send(JSON.stringify({
          method: eventName,
          params: mockEvent,
        }))

        await deferred.promise
        expect(cb.mock.calls.map(([arg]) => arg)).toContainEqual(mockEvent)
      }
    })

    it('stops reconnecting after close is called', () => {
      return new Promise<Mock>(async (resolve, reject) => {
        const onAsynchronousError = reject
        const onReconnect = reject

        const stub = mockOnThirdCall(async () => {
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
        expect(criClient.closed).toBe(true)
        expect(stub).toHaveBeenCalledTimes(3)
      })
    })
  })
})
