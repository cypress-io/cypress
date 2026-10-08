import { isDeepStrictEqual } from 'util'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import type { CdpEvent, CdpCommand } from '../../../lib/browsers/cdp-protocol/cdp_automation'
import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping'
import { CDPConnection } from '../../../lib/browsers/cdp-protocol/cdp-connection'
import { CDPTerminatedError, CDPAlreadyConnectedError, CDPDisconnectedError } from '../../../lib/browsers/cdp-protocol/cri-errors'
import { fireDisconnect as fireDisconnectListeners } from '../../support/helpers/cdp-disconnect'
import WebSocket from 'ws'

const DEBUGGER_URL = 'http://foo'
const CONNECT_OPTIONS = { target: DEBUGGER_URL, local: true }

type Behavior = () => unknown

// A behavior registered for the connect options wins, then a per-call-index behavior,
// then the default.
const cdp = vi.hoisted(() => {
  const state = {
    forConnectOptions: undefined as Behavior | undefined,
    onCall: new Map<number, Behavior>(),
    default: undefined as Behavior | undefined,
    callCount: 0,
    matchesConnectOptions: (_args: unknown[]) => false,
  }

  const criImport = vi.fn((...args: unknown[]) => {
    const index = state.callCount++
    const behavior = (state.matchesConnectOptions(args) && state.forConnectOptions) || state.onCall.get(index) || state.default

    return behavior?.()
  })

  const reset = () => {
    state.forConnectOptions = undefined
    state.onCall.clear()
    state.default = undefined
    state.callCount = 0
    criImport.mockClear()
  }

  return { state, criImport, reset }
})

vi.mock('chrome-remote-interface', () => {
  return { default: cdp.criImport }
})

cdp.state.matchesConnectOptions = (args) => isDeepStrictEqual(args.slice(0, 1), [CONNECT_OPTIONS])

const resolvesWith = (value?: unknown): Behavior => () => Promise.resolve(value)
const rejectsWith = (err: unknown = new Error('Error')): Behavior => () => Promise.reject(err)

type RecordedCall = { args: unknown[], callId: number }

type StubbedCdpClient = {
  send: Mock
  on: Mock
  off: Mock
  close: Mock
  _ws: WebSocket
}

// The shared cdp-disconnect helper replays on/off in sinon's global call order;
// vi.fn has no equivalent id, so record one as the stubs are invoked.
let nextCallId = 0
const recordedCalls = new WeakMap<Mock, RecordedCall[]>()

const recordingMock = () => {
  const calls: RecordedCall[] = []
  const mock = vi.fn((...args: unknown[]) => {
    calls.push({ args, callId: nextCallId++ })
  })

  recordedCalls.set(mock, calls)

  return mock
}

const asCallLog = (mock: Mock) => {
  return { getCalls: () => recordedCalls.get(mock) ?? [] } as unknown as Parameters<typeof fireDisconnectListeners>[0]
}

// sinon.createStubInstance: an instance of the class with every prototype method stubbed
const createStubInstance = <T extends object>(ctor: { prototype: T }): T => {
  const instance = Object.create(ctor.prototype)

  for (let proto = ctor.prototype; proto && proto !== Object.prototype; proto = Object.getPrototypeOf(proto)) {
    for (const key of Object.getOwnPropertyNames(proto)) {
      const descriptor = Object.getOwnPropertyDescriptor(proto, key)

      if (key !== 'constructor' && typeof descriptor?.value === 'function' && !Object.hasOwn(instance, key)) {
        instance[key] = vi.fn()
      }
    }
  }

  return instance
}

const callsStartingWith = (mock: Mock, ...expected: unknown[]) => {
  return mock.mock.calls.filter((call) => isDeepStrictEqual(call.slice(0, expected.length), expected))
}

const expectRejection = async (promise: Promise<unknown>, errorClass: new (...args: any[]) => Error, message?: string) => {
  const err = await promise.then(() => {
    throw new Error('expected promise to reject')
  }, (e) => e)

  expect(err).toBeInstanceOf(errorClass)

  if (message !== undefined) {
    expect(err.message).toContain(message)
  }
}

describe('CDPConnection', () => {
  let stubbedCDPClient: StubbedCdpClient
  let stubbedWebSocket: WebSocket

  let cdpConnection: CDPConnection

  let onReconnectCb: Mock
  let onReconnectAttemptCb: Mock
  let onReconnectErrCb: Mock
  let onConnectionClosedCb: Mock

  const createStubbedCdpClient = (): StubbedCdpClient => {
    return {
      send: vi.fn(),
      on: recordingMock(),
      off: recordingMock(),
      close: vi.fn().mockResolvedValue(undefined),
      _ws: stubbedWebSocket,
    }
  }

  // wraps the shared helper over the current stubbedCDPClient
  const fireDisconnect = () => fireDisconnectListeners(asCallLog(stubbedCDPClient.on), asCallLog(stubbedCDPClient.off))

  const listenerRegisteredFor = (event: string, index: number) => {
    const calls = callsStartingWith(stubbedCDPClient.on, event)

    return calls.at(index)![1] as (...args: unknown[]) => unknown
  }

  beforeEach(() => {
    stubbedWebSocket = createStubInstance(WebSocket)

    stubbedCDPClient = createStubbedCdpClient()

    cdp.reset()

    cdpConnection = new CDPConnection({
      target: DEBUGGER_URL,
      local: true,
    }, { automaticallyReconnect: false })

    onReconnectCb = vi.fn()
    onReconnectAttemptCb = vi.fn()
    onReconnectErrCb = vi.fn()
    onConnectionClosedCb = vi.fn()

    cdpConnection.addConnectionEventListener('cdp-connection-reconnect', onReconnectCb)
    cdpConnection.addConnectionEventListener('cdp-connection-reconnect-attempt', onReconnectAttemptCb)
    cdpConnection.addConnectionEventListener('cdp-connection-reconnect-error', onReconnectErrCb)
    cdpConnection.addConnectionEventListener('cdp-connection-closed', onConnectionClosedCb)
  })

  describe('.connect()', () => {
    describe('when CDP connects', () => {
      beforeEach(() => {
        cdp.state.forConnectOptions = resolvesWith(stubbedCDPClient)
      })

      it('resolves', async () => {
        await expect(cdpConnection.connect()).resolves.toBeUndefined()
      })

      describe('when there is already an active connection', () => {
        beforeEach(async () => {
          await cdpConnection.connect()
        })

        it('rejects with a CDPAlreadyConnectedError', async () => {
          await expectRejection(cdpConnection.connect(), CDPAlreadyConnectedError, DEBUGGER_URL)
        })
      })
    })

    describe('when CDP fails to connect', () => {
      let someErr: Error

      beforeEach(() => {
        someErr = new Error('some error')
        cdp.state.forConnectOptions = rejectsWith(someErr)
      })

      it('rejects', async () => {
        await expect(cdpConnection.connect()).rejects.toBe(someErr)
      })
    })

    describe('when the connection has been terminated', () => {
      beforeEach(async () => {
        await cdpConnection.disconnect()
      })

      it('rejects with a CdpTerminatedError', async () => {
        await expectRejection(cdpConnection.connect(), CDPTerminatedError, DEBUGGER_URL)
      })
    })

    describe('when CDP disconnects', () => {
      beforeEach(async () => {
        cdp.state.forConnectOptions = resolvesWith(stubbedCDPClient)
        await cdpConnection.connect()
      })

      // this connection was constructed with automaticallyReconnect: false (see outer beforeEach),
      // so a disconnect of the underlying socket is permanent - there is no reconnection attempt
      // to eventually bring it back.
      it('marks the connection terminated and emits cdp-connection-closed', async () => {
        await fireDisconnect()

        expect(cdpConnection.terminated).toBe(true)
        expect(onConnectionClosedCb).toHaveBeenCalled()
      })

      it('rejects subsequent sends as terminated', async () => {
        await fireDisconnect()

        await expectRejection(cdpConnection.send('Page.enable'), CDPDisconnectedError, 'terminated')
      })
    })
  })

  describe('.disconnect()', () => {
    describe('when the connection has not been terminated and there is an active connection', () => {
      beforeEach(async () => {
        cdp.state.forConnectOptions = resolvesWith(stubbedCDPClient)

        await cdpConnection.connect()
      })

      it('removes the event and disconnect listeners it registered', async () => {
        const eventListener = listenerRegisteredFor('event', 0)
        const disconnectListener = listenerRegisteredFor('disconnect', -1)

        await cdpConnection.disconnect()

        expect(callsStartingWith(stubbedCDPClient.off, 'event', eventListener)).not.toHaveLength(0)
        expect(callsStartingWith(stubbedCDPClient.off, 'disconnect', disconnectListener)).not.toHaveLength(0)
      })

      it('closes the CDP connection', async () => {
        await cdpConnection.disconnect()
        expect(stubbedCDPClient.close).toHaveBeenCalled()
      })

      it('marks this connection as terminated', async () => {
        await cdpConnection.disconnect()
        expect(cdpConnection.terminated).toBe(true)
      })

      it('emits the cdp-connection-closed connection event', async () => {
        await cdpConnection.disconnect()
        await new Promise((resolve) => setImmediate(resolve))
        expect(onConnectionClosedCb).toHaveBeenCalled()
      })

      describe('when the connection has already been terminated', () => {
        beforeEach(async () => {
          await cdpConnection.disconnect()
          stubbedCDPClient.close.mockClear()
          onConnectionClosedCb.mockReset()
        })

        it('does not emit a lifecycle event, remove listeners, etc', async () => {
          await expect(cdpConnection.disconnect()).resolves.toBeUndefined()
          expect(onConnectionClosedCb).not.toHaveBeenCalled()
          expect(cdpConnection.terminated).toBe(true)
          expect(stubbedCDPClient.close).not.toHaveBeenCalled()
        })
      })
    })

    describe('when there is no active connection', () => {
      it('does not throw, emit a lifecycle event, remove listeners, or call close on the cdp client', async () => {
        await expect(cdpConnection.disconnect()).resolves.toBeUndefined()
        expect(onConnectionClosedCb).not.toHaveBeenCalled()
        expect(cdpConnection.terminated).toBe(true)
        expect(stubbedCDPClient.close).not.toHaveBeenCalled()
      })
    })
  })

  describe('.send()', () => {
    const method: CdpCommand = 'Runtime.runScript'
    const params = { scriptId: 'efg' }
    const sessionId = 'abc'

    describe('when the connection has been established', () => {
      beforeEach(async () => {
        cdp.state.forConnectOptions = resolvesWith(stubbedCDPClient)
        await cdpConnection.connect()
      })

      describe('when the CDP command resolves', () => {
        const resolve: ProtocolMapping.Commands['Runtime.runScript']['returnType'] = {
          result: {
            type: 'undefined',
          },
        }

        beforeEach(() => {
          stubbedCDPClient.send.mockImplementation((...args: unknown[]) => {
            return isDeepStrictEqual(args.slice(0, 3), [method, params, sessionId]) ? Promise.resolve(resolve) : undefined
          })
        })

        it('resolves with the same value', async () => {
          await expect(cdpConnection.send(method, params, sessionId)).resolves.toBe(resolve)
        })
      })

      describe('when the CDP command rejects with a general error', () => {
        const err = new Error('some err')

        beforeEach(() => {
          stubbedCDPClient.send.mockRejectedValue(err)
        })

        it('rejects with the same error', async () => {
          await expect(cdpConnection.send(method, params, sessionId)).rejects.toBe(err)
        })
      })

      describe('when the CDP command rejects with a websocket disconnection error message', () => {
        ['WebSocket connection closed', 'WebSocket is not open', 'WebSocket is already in CLOSING or CLOSED state'].forEach((msg) => {
          it(` it rejects "${msg}" with a CDPDisconnectedError`, async () => {
            const err = new Error(msg)

            stubbedCDPClient.send.mockRejectedValue(err)
            await expectRejection(cdpConnection.send(method, params, sessionId), CDPDisconnectedError)
          })
        })
      })
    })

    describe('when the connection has yet to be established', () => {
      it('rejects with a CDPDisconnectedError', async () => {
        await expectRejection(cdpConnection.send(method, params, sessionId), CDPDisconnectedError, 'has not been established')
      })
    })

    describe('when the connection has been terminated', () => {
      it('rejects with a CDPDisconnectedError', async () => {
        cdp.state.forConnectOptions = resolvesWith(stubbedCDPClient)
        await cdpConnection.connect()
        await cdpConnection.disconnect()
        await expectRejection(cdpConnection.send(method, params, sessionId), CDPDisconnectedError, 'terminated')
      })
    })
  })

  describe('.on()', () => {
    const event: CdpEvent = 'Browser.downloadProgress'
    const params = { some: 'params' }

    it('calls the callback when cdp client broadcasts the event', async () => {
      const cb = vi.fn()

      cdp.state.forConnectOptions = resolvesWith(stubbedCDPClient)

      await cdpConnection.connect()
      cdpConnection.on(event, cb)

      listenerRegisteredFor('event', 0)({
        method: event,
        params,
      })

      await (new Promise((resolve) => setImmediate(resolve)))
      expect(callsStartingWith(cb, params)).not.toHaveLength(0)
    })
  })

  describe('.off()', () => {
    const event: CdpEvent = 'Browser.downloadProgress'
    const params = { some: 'params' }

    it('no longer calls the callback when cdp client broadcasts the event', async () => {
      const cb = vi.fn()

      cdpConnection.on(event, cb)
      cdp.state.forConnectOptions = resolvesWith(stubbedCDPClient)

      await cdpConnection.connect()
      cdpConnection.off(event, cb)

      listenerRegisteredFor('event', 0)({
        method: event,
        params,
      })

      await (new Promise((resolve) => setImmediate(resolve)))
      expect(callsStartingWith(cb, params)).toHaveLength(0)
    })
  })

  describe('.ws', () => {
    it('returns undefined before a connection has been established', () => {
      expect(cdpConnection.ws).toBeUndefined()
    })

    it('returns the underlying websocket once connected', async () => {
      cdp.state.forConnectOptions = resolvesWith(stubbedCDPClient)
      await cdpConnection.connect()

      expect(cdpConnection.ws).toBe(stubbedWebSocket)
    })

    it('returns undefined rather than throwing after a terminal disconnect', async () => {
      cdp.state.forConnectOptions = resolvesWith(stubbedCDPClient)
      await cdpConnection.connect()

      // this connection was constructed with automaticallyReconnect: false (see outer
      // beforeEach), so this disconnect is terminal and clears out the underlying connection
      await fireDisconnect()

      expect(cdpConnection.ws).toBeUndefined()
    })
  })

  describe('when created with auto reconnect behavior enabled and disconnected', () => {
    let deferredReconnection: PromiseWithResolvers<any>

    beforeEach(async () => {
      cdpConnection = new CDPConnection({
        target: DEBUGGER_URL,
        local: true,
      }, { automaticallyReconnect: true })

      cdpConnection.addConnectionEventListener('cdp-connection-reconnect', onReconnectCb)
      cdpConnection.addConnectionEventListener('cdp-connection-reconnect-attempt', onReconnectAttemptCb)
      cdpConnection.addConnectionEventListener('cdp-connection-reconnect-error', onReconnectErrCb)

      deferredReconnection = Promise.withResolvers()
      onReconnectCb.mockImplementation(() => deferredReconnection.resolve(undefined))
      onReconnectErrCb.mockImplementation(() => deferredReconnection.reject())
      cdp.state.forConnectOptions = resolvesWith(stubbedCDPClient)

      await cdpConnection.connect()
      fireDisconnect()
      cdp.reset()
    })

    it('does not mark the connection terminated (reconnection is attempted instead)', async () => {
      expect(cdpConnection.terminated).toBe(false)

      // let the reconnection attempt kicked off in beforeEach settle so it doesn't
      // leak a pending CDPImport call into the next test
      cdp.state.default = resolvesWith(stubbedCDPClient)
      await deferredReconnection.promise
    })

    it('reconnects when disconnected and reconnection succeeds on the third try', async () => {
      cdp.state.onCall.set(0, rejectsWith())
      cdp.state.onCall.set(1, rejectsWith())

      const newCDPClientStub = createStubbedCdpClient()

      cdp.state.onCall.set(2, resolvesWith(newCDPClientStub))

      await deferredReconnection.promise

      expect(onReconnectAttemptCb).toHaveBeenCalledTimes(3)
      expect(onReconnectCb).toHaveBeenCalled()
      expect(onReconnectErrCb).not.toHaveBeenCalled()
    })

    it('rejects when disconnected and reconnection fails after 20 attempts', async () => {
      cdp.state.default = rejectsWith()
      await expect(deferredReconnection.promise).rejects.toBeUndefined()
      expect(onReconnectErrCb).toHaveBeenCalled()
      expect(onReconnectAttemptCb).toHaveBeenCalledTimes(20)
    })
  })
})
