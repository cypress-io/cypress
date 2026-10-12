import Bluebird from 'bluebird'
import net from 'net'
import { isDeepStrictEqual } from 'util'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock, MockInstance } from 'vitest'
import type { ProtocolManagerShape } from '@packages/types'
import type { Protocol } from 'devtools-protocol'
import { serviceWorkerClientEventHandlerName } from '@packages/proxy/lib/http/util/service-worker-manager'
import { BrowserCriClient } from '../../../lib/browsers/browser-cri-client'
import { CriClient } from '../../../lib/browsers/cdp-protocol/cri-client'
import * as protocol from '../../../lib/browsers/protocol'
import { cypressSessions } from '../../../lib/cypress-sessions'

const HOST = '127.0.0.1'
const PORT = 50505
const THROWS_PORT = 65535

type GetClientParams = {
  protocolManager?: ProtocolManagerShape
  fullyManageTabs?: boolean
}

type AsymmetricMatcher = { asymmetricMatch: (actual: unknown) => boolean }

const isAsymmetricMatcher = (value: unknown): value is AsymmetricMatcher => {
  return typeof value === 'object' && value !== null && 'asymmetricMatch' in value && typeof value.asymmetricMatch === 'function'
}

const anyArg: AsymmetricMatcher = { asymmetricMatch: () => true }

const fieldsMatching = (fields: Record<string, unknown>): AsymmetricMatcher => {
  return {
    asymmetricMatch: (actual) => {
      return typeof actual === 'object' && actual !== null && Object.entries(fields).every(([key, value]) => isDeepStrictEqual(actual[key], value))
    },
  }
}

// sinon's calledWith and withArgs match a prefix of the recorded arguments,
// where vitest's toHaveBeenCalledWith requires the exact arity
const argsMatch = (actual: unknown[], expected: unknown[]) => {
  return expected.length <= actual.length && expected.every((value, i) => {
    return isAsymmetricMatcher(value) ? value.asymmetricMatch(actual[i]) : isDeepStrictEqual(actual[i], value)
  })
}

const callsWith = (mock: Mock, ...expected: unknown[]) => {
  return mock.mock.calls.filter((call) => argsMatch(call, expected))
}

const expectCalledWith = (mock: Mock, ...expected: unknown[]) => {
  expect(callsWith(mock, ...expected), `calls matching ${String(expected[0])}`).not.toHaveLength(0)
}

const expectNotCalledWith = (mock: Mock, ...expected: unknown[]) => {
  expect(callsWith(mock, ...expected), `calls matching ${String(expected[0])}`).toHaveLength(0)
}

const expectCalledOnceWith = (mock: Mock, ...expected: unknown[]) => {
  expect(mock).toHaveBeenCalledTimes(1)
  expectCalledWith(mock, ...expected)
}

type Behavior = (...args: any[]) => unknown
type Route = { expected: unknown[], behavior?: Behavior }

// sinon withArgs semantics: the longest matching argument prefix wins, ties go
// to the latest registration, and a route without a behavior uses the default
const stub = (defaultBehavior?: Behavior) => {
  const routes: Route[] = []
  const fn = vi.fn((...args: unknown[]) => {
    const route = routes
    .filter(({ expected }) => argsMatch(args, expected))
    .sort((a, b) => a.expected.length - b.expected.length)
    .pop()

    return (route?.behavior ?? defaultBehavior)?.(...args)
  })

  const withArgs = (...expected: unknown[]) => {
    const route: Route = { expected }

    routes.push(route)

    const set = (behavior: Behavior) => {
      route.behavior = behavior

      return fn
    }

    return {
      returns: (value?: unknown) => set(() => value),
      resolves: (value?: unknown) => set(async () => value),
      rejects: (err: unknown) => set(async () => { throw err }),
      throws: (err: unknown) => set(() => { throw err }),
      callsFake: set,
    }
  }

  return Object.assign(fn, { withArgs })
}

type Stub = ReturnType<typeof stub>

const cdp = vi.hoisted(() => {
  return { state: { criImport: undefined as any } }
})

vi.mock('chrome-remote-interface', () => {
  return {
    default: Object.assign((...args: unknown[]) => cdp.state.criImport(...args), {
      Version: (...args: unknown[]) => cdp.state.criImport.Version(...args),
    }),
  }
})

const realCriClientCreate = CriClient.create

describe('lib/browsers/browser-cri-client', function () {
  let send: Stub
  let on: Mock
  let off: Mock
  let close: Mock
  let removeSessionEnablements: Mock
  let criClientCreate: Stub
  let criImport: Stub & {
    Version: Stub
  }
  let connectAsync: MockInstance
  let onError: Mock
  let onServiceWorkerClientEvent: Mock
  let getClient: (options?: GetClientParams) => ReturnType<typeof BrowserCriClient.create>

  beforeEach(function () {
    connectAsync = vi.spyOn(protocol, '_connectAsync').mockReturnValue(Bluebird.resolve())

    criImport = Object.assign(stub(), { Version: stub() })

    criImport.Version.withArgs({ host: HOST, port: PORT, useHostName: true }).resolves({ webSocketDebuggerUrl: 'http://web/socket/url' })
    criImport.Version.withArgs({ host: HOST, port: THROWS_PORT, useHostName: true }).callsFake(vi.fn()
    .mockImplementationOnce(() => { throw new Error() })
    .mockImplementationOnce(() => { throw new Error() })
    .mockResolvedValueOnce({ webSocketDebuggerUrl: 'http://web/socket/url' }))

    cdp.state.criImport = criImport

    on = vi.fn()
    off = vi.fn()
    send = stub()
    close = vi.fn()
    removeSessionEnablements = vi.fn()
    onError = vi.fn()
    onServiceWorkerClientEvent = vi.fn()
    criClientCreate = stub()
    vi.spyOn(CriClient, 'create').mockImplementation(criClientCreate)

    getClient = ({ protocolManager, fullyManageTabs } = {}) => {
      // the browser-level client wraps onAsynchronousError and passes an
      // onCriConnectionClosed handler, so match loosely on the stable fields
      criClientCreate.withArgs(fieldsMatching({ target: 'http://web/socket/url', protocolManager, fullyManageTabs })).resolves({
        send,
        on,
        off,
        close,
        removeSessionEnablements,
      })

      return BrowserCriClient.create({ hosts: ['127.0.0.1'], port: PORT, browserName: 'Chrome', onAsynchronousError: onError, protocolManager, fullyManageTabs, onServiceWorkerClientEvent })
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('.create', function () {
    it('returns an instance of the Browser CRI client', async function () {
      const client = await getClient()

      expect(client.attachToTargetUrl).toBeInstanceOf(Function)
    })

    it('throws an error when _connectAsync fails', async function () {
      connectAsync.mockImplementation(() => {
        throw new Error()
      })

      await expect(getClient()).rejects.toThrow()
    })

    it('attempts to connect to multiple hosts', async function () {
      connectAsync.mockRestore()
      const socket = new net.Socket()

      vi.spyOn(net, 'connect').mockImplementation((opts: any, onConnect: any) => {
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

      await BrowserCriClient.create({ hosts: ['127.0.0.1', '::1'], port: THROWS_PORT, browserName: 'Chrome', onAsynchronousError: onError, onServiceWorkerClientEvent })

      expect(criImport.Version).toHaveBeenCalledTimes(1)
    })

    it('retries when Version fails', async function () {
      vi.spyOn(protocol, '_getDelayMsForRetry')
      .mockReturnValue(undefined)
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(100)

      const client = await BrowserCriClient.create({ hosts: ['127.0.0.1'], port: THROWS_PORT, browserName: 'Chrome', onAsynchronousError: onError, onServiceWorkerClientEvent })

      expect(client.attachToTargetUrl).toBeInstanceOf(Function)

      expect(criImport.Version).toHaveBeenCalledTimes(3)
    })

    it('throws when Version fails more than allowed', async function () {
      vi.spyOn(protocol, '_getDelayMsForRetry')
      .mockReturnValue(undefined)
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(undefined)

      await expect(BrowserCriClient.create({ hosts: ['127.0.0.1'], port: THROWS_PORT, browserName: 'Chrome', onAsynchronousError: onError, onServiceWorkerClientEvent })).rejects.toThrow()

      expect(criImport.Version).toHaveBeenCalledTimes(2)
    })

    it('advertises the browser websocket url to cypress sessions once connected', async function () {
      const setCdpBrowserWsUrl = vi.spyOn(cypressSessions, 'setCdpBrowserWsUrl').mockImplementation(() => {})

      await getClient()

      expectCalledWith(setCdpBrowserWsUrl as unknown as Mock, 'http://web/socket/url')
    })

    it('clears the cypress sessions cdp url when the browser connection is lost', async function () {
      const setCdpBrowserWsUrl = vi.spyOn(cypressSessions, 'setCdpBrowserWsUrl').mockImplementation(() => {})

      await getClient()

      const createArgs = criClientCreate.mock.calls[0][0] as any

      setCdpBrowserWsUrl.mockClear()

      // a graceful disconnect, or reconnection halting due to closure
      createArgs.onCriConnectionClosed()
      expect(setCdpBrowserWsUrl).toHaveBeenCalledWith(null)

      setCdpBrowserWsUrl.mockClear()

      // the browser crashed or was quit externally: reconnection ultimately failed
      const err = new Error('reconnect failed')

      createArgs.onAsynchronousError(err)
      expect(setCdpBrowserWsUrl).toHaveBeenCalledWith(null)
      // the original error handler still runs
      expectCalledWith(onError, err)
    })
  })

  describe('service worker bindings', function () {
    it('subscribes the browser client to the session binding', async function () {
      const client = await getClient({ fullyManageTabs: true })

      client.addServiceWorkerBinding('session-1')

      expectCalledWith(on, 'Runtime.bindingCalled.session-1', expect.any(Function))
      expect(client.serviceWorkerBindings.has('session-1')).toBe(true)
    })

    it('delivers the session binding events to the service worker event handler', async function () {
      const client = await getClient({ fullyManageTabs: true })

      client.addServiceWorkerBinding('session-1')

      const cb = callsWith(on, 'Runtime.bindingCalled.session-1')[0][1]
      const event = { type: 'hasFetchHandler', scope: 'http://localhost:8080/', payload: { hasFetchHandler: true } }

      cb({ name: serviceWorkerClientEventHandlerName, payload: JSON.stringify(event) })

      expectCalledWith(onServiceWorkerClientEvent, event)
    })

    it('replaces an existing binding without stranding its listener', async function () {
      const client = await getClient({ fullyManageTabs: true })

      client.addServiceWorkerBinding('session-1')

      const firstListener = callsWith(on, 'Runtime.bindingCalled.session-1')[0][1]

      client.addServiceWorkerBinding('session-1')

      expectCalledOnceWith(off, 'Runtime.bindingCalled.session-1', firstListener)
      expect(client.serviceWorkerBindings.size).toBe(1)
    })

    it('unsubscribes the browser client when the session detaches', async function () {
      const client = await getClient({ fullyManageTabs: true })

      client.addServiceWorkerBinding('session-1')

      const cb = callsWith(on, 'Runtime.bindingCalled.session-1')[0][1]

      await callsWith(on, 'Target.detachedFromTarget')[0][1]({ sessionId: 'session-1' })

      expectCalledWith(off, 'Runtime.bindingCalled.session-1', cb)
      expect(client.serviceWorkerBindings.has('session-1')).toBe(false)
    })

    it('does not accumulate bindings across attach/detach cycles', async function () {
      const client = await getClient({ fullyManageTabs: true })
      const detach = callsWith(on, 'Target.detachedFromTarget')[0][1]

      for (let i = 0; i < 10; i++) {
        client.addServiceWorkerBinding(`session-${i}`)
        await detach({ sessionId: `session-${i}` })
      }

      expect(client.serviceWorkerBindings.size).toBe(0)
      expect(off).toHaveBeenCalledTimes(10)
    })

    it('ignores a detach for a session with no binding', async function () {
      const client = await getClient({ fullyManageTabs: true })

      await callsWith(on, 'Target.detachedFromTarget')[0][1]({ sessionId: 'never-attached' })

      expect(off).not.toHaveBeenCalled()
    })
  })

  describe('._onAttachToTarget', () => {
    let options: any

    beforeEach(() => {
      options = {
        browserClient: {
          send: stub(),
          on: vi.fn(),
        },
        browserCriClient: {
          addExtraTargetClient: vi.fn(),
          addServiceWorkerBinding: vi.fn(),
          getExtraTargetClient: vi.fn(() => undefined),
          currentlyAttachedTarget: {
            targetId: 'main-target-id',
          },
          resettingBrowserTargets: false,
          sessionTargetInfo: new Map(),
        },
        CriConstructor: vi.fn(),
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

      expect(options.browserClient.send).not.toHaveBeenCalled()
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

      expectCalledWith(options.browserClient.send, 'Target.getTargets')
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

      await BrowserCriClient._onAttachToTarget(options as any)

      expectCalledWith(options.browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, 'session-id')
    })

    it('is a noop sending Runtime.runIfWaitingForDebugger if resetting browser targets', async () => {
      options.browserCriClient.resettingBrowserTargets = true
      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()

      await BrowserCriClient._onAttachToTarget(options as any)

      expect(options.CriConstructor).not.toHaveBeenCalled()
      expectCalledWith(options.browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, 'session-id')
    })

    it('is a noop sending Runtime.runIfWaitingForDebugger if target is the main Cypress tab', async () => {
      options.event.targetInfo.targetId = 'main-target-id'
      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()

      await BrowserCriClient._onAttachToTarget(options as any)

      expect(options.CriConstructor).not.toHaveBeenCalled()
      expectCalledWith(options.browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, 'session-id')
    })

    it('is a noop sending Runtime.runIfWaitingForDebugger if target is not a tab or window', async () => {
      options.event.targetInfo.type = 'service_worker'
      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()

      await BrowserCriClient._onAttachToTarget(options as any)

      expect(options.CriConstructor).not.toHaveBeenCalled()
      expectCalledWith(options.browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, 'session-id')
    })

    it('is a noop sending Runtime.runIfWaitingForDebugger if target is DevTools', async () => {
      options.event.targetInfo.url = 'devtools://dev.tools'
      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()

      await BrowserCriClient._onAttachToTarget(options as any)

      expect(options.CriConstructor).not.toHaveBeenCalled()
      expectCalledWith(options.browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, 'session-id')
    })

    it('is a noop sending Runtime.runIfWaitingForDebugger if target is the Launchpad', async () => {
      options.event.targetInfo.url = 'http://localhost:1234/__launchpad'
      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()

      await BrowserCriClient._onAttachToTarget(options as any)

      expect(options.CriConstructor).not.toHaveBeenCalled()
      expectCalledWith(options.browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, 'session-id')
    })

    it('is a noop sending Runtime.runIfWaitingForDebugger if part of a chrome extension', async () => {
      options.event.targetInfo.url = 'chrome-extension://some.extension'
      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()

      await BrowserCriClient._onAttachToTarget(options as any)

      expect(options.CriConstructor).not.toHaveBeenCalled()
      expectCalledWith(options.browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, 'session-id')
    })

    it('is a noop sending Runtime.runIfWaitingForDebugger if connecting to target errors', async () => {
      options.CriConstructor.mockRejectedValue(new Error('failed to connect'))
      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()

      await BrowserCriClient._onAttachToTarget(options as any)

      expect(options.CriConstructor).toHaveBeenCalled()
      expect(options.browserCriClient.addExtraTargetClient).not.toHaveBeenCalled()
      expectCalledWith(options.browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, 'session-id')
    })

    it('connects to target and sends Fetch.enable', async () => {
      const criClient = {
        send: stub(),
        on: vi.fn(),
      }

      options.CriConstructor.mockReturnValue(criClient)
      options.browserClient.send.withArgs('Fetch.enable').resolves()
      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()

      await BrowserCriClient._onAttachToTarget(options as any)

      expect(options.CriConstructor).toHaveBeenCalled()
      expectCalledWith(options.browserCriClient.addExtraTargetClient, options.event.targetInfo, criClient)
      expectCalledWith(criClient.send, 'Fetch.enable')
      expectCalledWith(criClient.on, 'Fetch.requestPaused', expect.any(Function))
      expectCalledWith(options.browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, 'session-id')
    })

    it('does not throw if Fetch.enable on extra target throws', async () => {
      const fetchEnableFailed = Object.assign(new Error(''), { name: 'Fetch.enable failed' })
      const extraTargetCriClient = {
        send: vi.fn(async () => {
          throw fetchEnableFailed
        }),
        on: vi.fn(),
      }

      options.CriConstructor.mockResolvedValue(extraTargetCriClient)

      options.browserClient.send.withArgs('Fetch.enable').resolves()
      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()

      await BrowserCriClient._onAttachToTarget(options as any)
    })

    it('adds the service worker fetch event binding', async () => {
      options.event.targetInfo.type = 'service_worker'

      await BrowserCriClient._onAttachToTarget(options as any)

      expectCalledWith(options.browserCriClient.addServiceWorkerBinding, options.event.sessionId)
      expectCalledWith(options.browserClient.send, 'Runtime.addBinding', { name: serviceWorkerClientEventHandlerName }, options.event.sessionId)
    })

    // a detach landing mid-attach only releases bindings already tracked
    it('adds the service worker fetch event binding before awaiting anything', async () => {
      options.event.targetInfo.type = 'service_worker'

      await BrowserCriClient._onAttachToTarget(options as any)

      // pinned to the first send - the first point this can yield
      const registered = options.browserCriClient.addServiceWorkerBinding.mock.invocationCallOrder[0]
      const firstSend = options.browserClient.send.mock.invocationCallOrder[0]

      expect(firstSend, 'expected a CDP command to have been sent').toBeDefined()
      expect(registered, 'expected the binding to have been added').toBeDefined()
      expect(registered).toBeLessThan(firstSend)
    })

    it('does not add the service worker fetch event binding for non-service_worker targets', async () => {
      options.event.targetInfo.type = 'other'

      await BrowserCriClient._onAttachToTarget(options as any)

      expect(options.browserCriClient.addServiceWorkerBinding).not.toHaveBeenCalled()
      expectNotCalledWith(options.browserClient.send, 'Runtime.addBinding', { name: serviceWorkerClientEventHandlerName }, options.event.sessionId)
    })

    it('adds X-Cypress-Is-From-Extra-Target header to requests from extra target', async () => {
      const criClient = {
        send: stub(),
        on: vi.fn(),
      }

      options.CriConstructor.mockReturnValue(criClient)
      options.browserClient.send.withArgs('Fetch.enable').resolves()
      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()
      criClient.send.withArgs('Fetch.continueRequest').resolves()

      await BrowserCriClient._onAttachToTarget(options as any)
      await criClient.on.mock.lastCall![1]({
        requestId: 'request-id',
        request: { headers: { 'X-Another-Custom-Header': 'value' } },
      })

      expectCalledWith(criClient.send, 'Fetch.continueRequest', {
        requestId: 'request-id',
        headers: [
          { name: 'X-Another-Custom-Header', value: 'value' },
          { name: 'X-Cypress-Is-From-Extra-Target', value: 'true' },
        ],
      })
    })

    it('delegates Fetch ownership to onExtraTargetCriClientReady when provided', async () => {
      const criClient = {
        send: stub(),
        on: vi.fn(),
      }
      const detach = vi.fn(async () => {})
      const onExtraTargetCriClientReady = vi.fn(async () => detach)
      const tracked: any = { client: criClient, targetInfo: options.event.targetInfo }

      options.CriConstructor.mockReturnValue(criClient)
      options.browserCriClient.onExtraTargetCriClientReady = onExtraTargetCriClientReady
      options.browserCriClient.getExtraTargetClient.mockReturnValue(tracked)
      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()

      await BrowserCriClient._onAttachToTarget(options as any)

      expectCalledOnceWith(onExtraTargetCriClientReady, criClient)
      expect(tracked.detach).toBe(detach)
      expectNotCalledWith(criClient.send, 'Fetch.enable')
      expectNotCalledWith(criClient.on, 'Fetch.requestPaused', expect.any(Function))
    })

    it('releases the transport when the extra target is destroyed during attach', async () => {
      const criClient = {
        send: stub(),
        on: vi.fn(),
      }
      // a detach that never settles models an extra target whose own CDP
      // connection is already gone — if _onAttachToTarget awaited this, the
      // test would time out instead of completing
      const detach = vi.fn(() => new Promise(() => {}))
      const onExtraTargetCriClientReady = vi.fn(async () => detach)

      options.CriConstructor.mockReturnValue(criClient)
      options.browserCriClient.onExtraTargetCriClientReady = onExtraTargetCriClientReady
      // Target destroyed mid-await — tracker entry already removed
      options.browserCriClient.getExtraTargetClient.mockReturnValue(undefined)
      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()

      await BrowserCriClient._onAttachToTarget(options as any)

      expectCalledOnceWith(onExtraTargetCriClientReady, criClient)
      expect(detach).toHaveBeenCalledTimes(1)
      expectNotCalledWith(criClient.send, 'Fetch.enable')
      expectNotCalledWith(criClient.on, 'Fetch.requestPaused', expect.any(Function))
    })

    it('falls back to header-only continue when onExtraTargetCriClientReady throws', async () => {
      const criClient = {
        send: stub(),
        on: vi.fn(),
      }

      options.CriConstructor.mockReturnValue(criClient)
      options.browserCriClient.onExtraTargetCriClientReady = vi.fn(async () => {
        throw new Error('attach failed')
      })

      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()
      criClient.send.withArgs('Fetch.enable').resolves()
      criClient.send.withArgs('Fetch.continueRequest').resolves()

      await BrowserCriClient._onAttachToTarget(options as any)

      expectCalledWith(criClient.send, 'Fetch.enable')
      expectCalledWith(criClient.on, 'Fetch.requestPaused', expect.any(Function))

      await criClient.on.mock.lastCall![1]({
        requestId: 'request-id',
        request: { headers: {} },
      })

      expectCalledWith(criClient.send, 'Fetch.continueRequest', {
        requestId: 'request-id',
        headers: [
          { name: 'X-Cypress-Is-From-Extra-Target', value: 'true' },
        ],
      })
    })

    it('falls back to header-only continue when onExtraTargetCriClientReady returns undefined', async () => {
      const criClient = {
        send: stub(),
        on: vi.fn(),
      }

      options.CriConstructor.mockReturnValue(criClient)
      options.browserCriClient.onExtraTargetCriClientReady = vi.fn(async () => undefined)
      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()
      criClient.send.withArgs('Fetch.enable').resolves()

      await BrowserCriClient._onAttachToTarget(options as any)

      expectCalledWith(criClient.send, 'Fetch.enable')
      expectCalledWith(criClient.on, 'Fetch.requestPaused', expect.any(Function))
    })

    it('ignores any errors from continuing request', async () => {
      const criClient = {
        send: stub(),
        on: vi.fn(),
      }

      options.CriConstructor.mockReturnValue(criClient)
      options.browserClient.send.withArgs('Fetch.enable').resolves()
      options.browserClient.send.withArgs('Runtime.runIfWaitingForDebugger').resolves()
      criClient.send.withArgs('Fetch.continueRequest').rejects(new Error('continuing request failed'))

      await BrowserCriClient._onAttachToTarget(options as any)
      await criClient.on.mock.lastCall![1]({ requestId: 'request-id', request: { url: '' } })
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

      expect(options.browserCriClient.sessionTargetInfo.get('session-id')).toBe(options.event.targetInfo)
    })

    // Ordering proof, same shape as elsewhere in this file: the mapping must
    // be visible to a lookup that races the handler, not just to one that
    // waits for it to finish - Inspector.targetReloadedAfterCrash can fire
    // for this session before this attach has awaited anything.
    it('records the session -> TargetInfo mapping before the first await (Network.enable)', async () => {
      options.event.targetInfo.type = 'iframe'
      options.browserClient.send.withArgs('Network.enable', anyArg, 'session-id').returns(new Promise(() => {}))

      // not awaited - the handler is left suspended inside Network.enable
      BrowserCriClient._onAttachToTarget(options as any)

      await new Promise((resolve) => setImmediate(resolve))

      expect(options.browserCriClient.sessionTargetInfo.get('session-id')).toBe(options.event.targetInfo)
    })

    // sessionTargetInfo is written with the event's TargetInfo before the url
    // is resolved from Target.getTargets, so a target whose attach event
    // carries url: '' must have that entry updated, or the crash-reload path
    // can't recognize it as the extension worker and holds the full timeout
    // on every idle-restart.
    it('reflects the url backfilled from Target.getTargets in a crash-reload classification, not the attach event\'s empty one', async () => {
      const browserClient = {
        send: stub(async () => {}),
        on: vi.fn(),
        removeSessionEnablements: vi.fn(),
      }
      const browserCriClient: any = {
        sessionTargetInfo: new Map(),
        addServiceWorkerBinding: vi.fn(),
        removeServiceWorkerBinding: vi.fn(),
      }

      await BrowserCriClient._manageTabs({
        browserClient: browserClient as any,
        browserCriClient,
        browserName: 'Chrome',
        host: 'localhost',
        onAsynchronousError: vi.fn(),
        port: 1234,
        childTargetInterceptionTimeoutMs: 5,
      } as any)

      const crashHandler = callsWith(browserClient.on, 'Inspector.targetReloadedAfterCrash')[0][1]

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

      browserCriClient.waitForChildTargetInterception = vi.fn(() => new Promise(() => {}))

      await crashHandler({}, sessionId)

      // classified as the extension service worker from the backfilled url,
      // so it's released immediately rather than holding the full timeout
      expect(browserCriClient.waitForChildTargetInterception).not.toHaveBeenCalled()
      expectCalledWith(browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, sessionId)
    })

    // Same as above but for a target that attaches already running
    // (waitingForDebugger: false) - the backfill must still land before the
    // early return just above it, or this target's sessionTargetInfo entry
    // is stuck with the attach event's empty url forever (it's never a
    // fresh attach again).
    it('reflects the url backfilled from Target.getTargets even for a target attaching with waitingForDebugger: false', async () => {
      const browserClient = {
        send: stub(async () => {}),
        on: vi.fn(),
        removeSessionEnablements: vi.fn(),
      }
      const browserCriClient: any = {
        sessionTargetInfo: new Map(),
        addServiceWorkerBinding: vi.fn(),
        removeServiceWorkerBinding: vi.fn(),
      }

      await BrowserCriClient._manageTabs({
        browserClient: browserClient as any,
        browserCriClient,
        browserName: 'Chrome',
        host: 'localhost',
        onAsynchronousError: vi.fn(),
        port: 1234,
        childTargetInterceptionTimeoutMs: 5,
      } as any)

      const crashHandler = callsWith(browserClient.on, 'Inspector.targetReloadedAfterCrash')[0][1]

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

      browserCriClient.waitForChildTargetInterception = vi.fn(() => new Promise(() => {}))

      await crashHandler({}, sessionId)

      expect(browserCriClient.waitForChildTargetInterception).not.toHaveBeenCalled()
      expectCalledWith(browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, sessionId)
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

        options.browserCriClient.waitForChildTargetInterception = vi.fn(() => interceptionConfirmed.promise)

        const attached = BrowserCriClient._onAttachToTarget(options as any)

        await new Promise((resolve) => setImmediate(resolve))

        expectCalledWith(options.browserCriClient.waitForChildTargetInterception, 'target-id')
        expectNotCalledWith(options.browserClient.send, 'Runtime.runIfWaitingForDebugger')

        interceptionConfirmed.resolve()
        await attached

        expectCalledWith(options.browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, 'session-id')
      })

      it('releases the worker once the timeout elapses without confirmation', async () => {
        options.childTargetInterceptionTimeoutMs = 5
        options.browserCriClient.waitForChildTargetInterception = vi.fn(() => new Promise(() => {}))

        await BrowserCriClient._onAttachToTarget(options as any)

        expectCalledWith(options.browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, 'session-id')
      })

      it('releases the worker if the waiter rejects', async () => {
        options.browserCriClient.waitForChildTargetInterception = vi.fn(async () => {
          throw new Error('ProtocolError: Inspected target closed')
        })

        await BrowserCriClient._onAttachToTarget(options as any)

        expectCalledWith(options.browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, 'session-id')
      })

      it('releases immediately when no waiter is registered (field absent)', async () => {
        expect(options.browserCriClient.waitForChildTargetInterception).toBeUndefined()

        await BrowserCriClient._onAttachToTarget(options as any)

        expectCalledWith(options.browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, 'session-id')
      })

      it('is never consulted for a non-service-worker target (iframe)', async () => {
        options.event.targetInfo.type = 'iframe'
        options.browserCriClient.waitForChildTargetInterception = vi.fn(() => new Promise(() => {}))

        await BrowserCriClient._onAttachToTarget(options as any)

        expect(options.browserCriClient.waitForChildTargetInterception).not.toHaveBeenCalled()
        expectCalledWith(options.browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, 'session-id')
      })

      // The page connection never attaches the Cypress extension's own
      // service worker, so it would eat the full timeout on every attach and
      // on every MV3 idle-restart, stalling the extension's own automation.
      it('is never consulted for the extension service worker, and releases immediately', async () => {
        options.event.targetInfo.url = 'chrome-extension://abc123/background.js'
        options.browserCriClient.waitForChildTargetInterception = vi.fn(() => new Promise(() => {}))

        await BrowserCriClient._onAttachToTarget(options as any)

        expect(options.browserCriClient.waitForChildTargetInterception).not.toHaveBeenCalled()
        expectCalledWith(options.browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, 'session-id')
      })

      it('is never consulted for an extra target (popup/page)', async () => {
        options.event.targetInfo.type = 'page'
        const criClient = {
          send: stub(),
          on: vi.fn(),
        }

        options.CriConstructor.mockReturnValue(criClient)
        options.browserClient.send.withArgs('Fetch.enable').resolves()
        options.browserCriClient.waitForChildTargetInterception = vi.fn(() => new Promise(() => {}))

        await BrowserCriClient._onAttachToTarget(options as any)

        expect(options.browserCriClient.waitForChildTargetInterception).not.toHaveBeenCalled()
        expectCalledWith(options.browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, 'session-id')
      })
    })
  })

  describe('._manageTabs', () => {
    // Exercises the real Target.detachedFromTarget and
    // Inspector.targetReloadedAfterCrash listeners _manageTabs registers,
    // rather than calling private handlers directly - there's no other way
    // to reach them.
    async function setup (childTargetInterceptionTimeoutMs?: number) {
      const browserClient = {
        send: stub(async () => {}),
        on: vi.fn(),
        removeSessionEnablements: vi.fn(),
      }
      const browserCriClient: any = {
        sessionTargetInfo: new Map(),
        addServiceWorkerBinding: vi.fn(),
        removeServiceWorkerBinding: vi.fn(),
      }

      await BrowserCriClient._manageTabs({
        browserClient: browserClient as any,
        browserCriClient,
        browserName: 'Chrome',
        host: 'localhost',
        onAsynchronousError: vi.fn(),
        port: 1234,
        ...(childTargetInterceptionTimeoutMs !== undefined ? { childTargetInterceptionTimeoutMs } : {}),
      } as any)

      const crashHandler = callsWith(browserClient.on, 'Inspector.targetReloadedAfterCrash')[0][1]
      const detachHandler = callsWith(browserClient.on, 'Target.detachedFromTarget')[0][1]

      return { browserClient, browserCriClient, crashHandler, detachHandler }
    }

    describe('Target.detachedFromTarget', () => {
      it('evicts the session -> TargetInfo mapping', async () => {
        const { browserCriClient, detachHandler } = await setup()
        const sessionId = 'sw-session'

        browserCriClient.sessionTargetInfo.set(sessionId, { targetId: 'sw-target-id', type: 'service_worker', url: 'https://example.test/sw.js' })

        detachHandler({ sessionId, targetId: 'sw-target-id' })

        expect(browserCriClient.sessionTargetInfo.has(sessionId)).toBe(false)
      })

      it('releases the enablements recorded for the session', async () => {
        const { browserClient, detachHandler } = await setup()

        detachHandler({ sessionId: 'sw-session', targetId: 'sw-target-id' })

        expectCalledOnceWith(browserClient.removeSessionEnablements, 'sw-session')
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

        browserCriClient.reenableChildTargetInterception = vi.fn(() => interceptionReenabled.promise)

        const released = crashHandler({}, sessionId)

        await new Promise((resolve) => setImmediate(resolve))

        expectCalledWith(browserCriClient.reenableChildTargetInterception, targetId)
        expectNotCalledWith(browserClient.send, 'Runtime.runIfWaitingForDebugger')

        interceptionReenabled.resolve()
        await released

        expectCalledWith(browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, sessionId)
      })

      it('releases immediately when the session has no recorded TargetInfo', async () => {
        const { browserClient, crashHandler } = await setup()

        await crashHandler({}, 'unmapped-session')

        expectCalledWith(browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, 'unmapped-session')
      })

      it('releases immediately for a mapped extension service worker', async () => {
        const { browserClient, browserCriClient, crashHandler } = await setup()
        const sessionId = 'ext-session'

        browserCriClient.sessionTargetInfo.set(sessionId, { targetId: 'ext-target', type: 'service_worker', url: 'chrome-extension://abc123/background.js' })
        browserCriClient.reenableChildTargetInterception = vi.fn(() => new Promise(() => {}))

        await crashHandler({}, sessionId)

        expect(browserCriClient.reenableChildTargetInterception).not.toHaveBeenCalled()
        expectCalledWith(browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, sessionId)
      })

      // MITM parity: on that path nothing ever sets reenableChildTargetInterception,
      // so a mapped, non-extension service worker session must still release
      // immediately rather than hold against a field that will never appear.
      it('releases immediately for a mapped, non-extension service worker when reenableChildTargetInterception is unset', async () => {
        const { browserClient, browserCriClient, crashHandler } = await setup()
        const sessionId = 'sw-session'

        browserCriClient.sessionTargetInfo.set(sessionId, { targetId: 'sw-target-id', type: 'service_worker', url: 'https://example.test/sw.js' })

        await crashHandler({}, sessionId)

        expectCalledWith(browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, sessionId)
      })

      it('releases a mapped, non-service-worker session immediately without consulting the field', async () => {
        const { browserClient, browserCriClient, crashHandler } = await setup()
        const sessionId = 'page-session'

        browserCriClient.sessionTargetInfo.set(sessionId, { targetId: 'page-target', type: 'page', url: 'https://example.test/' })
        browserCriClient.reenableChildTargetInterception = vi.fn(() => new Promise(() => {}))

        await crashHandler({}, sessionId)

        expect(browserCriClient.reenableChildTargetInterception).not.toHaveBeenCalled()
        expectCalledWith(browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, sessionId)
      })

      it('releases the crashed service worker once the interception-confirmation timeout elapses', async () => {
        const { browserClient, browserCriClient, crashHandler } = await setup(5)
        const sessionId = 'sw-session'

        browserCriClient.sessionTargetInfo.set(sessionId, { targetId: 'sw-target-id', type: 'service_worker', url: 'https://example.test/sw.js' })
        browserCriClient.reenableChildTargetInterception = vi.fn(() => new Promise(() => {}))

        await crashHandler({}, sessionId)

        expectCalledWith(browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, sessionId)
      })

      it('releases immediately when the re-enable call rejects', async () => {
        const { browserClient, browserCriClient, crashHandler } = await setup()
        const sessionId = 'sw-session'

        browserCriClient.sessionTargetInfo.set(sessionId, { targetId: 'sw-target-id', type: 'service_worker', url: 'https://example.test/sw.js' })
        browserCriClient.reenableChildTargetInterception = vi.fn(async () => {
          throw new Error('ProtocolError: Inspected target closed')
        })

        await crashHandler({}, sessionId)

        expectCalledWith(browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, sessionId)
      })
    })
  })

  describe('cross-connection interception hold with a real page CriClient (#34674)', function () {
    // Exercises the hold through an actual page-side CriClient - built the
    // same way cri-client.spec.ts builds one - wired as
    // waitForChildTargetInterception and reenableChildTargetInterception,
    // rather than stubs standing in for what those calls actually require.
    const DEBUGGER_URL = 'http://foo'
    const sessionId = 'sw-session'
    const targetId = 'sw-target-id'

    let pageClient: CriClient
    let pageCriStub: { on: Mock, off: Mock, send: Mock, close: Mock }

    const firePageCDPEvent = (method: string, params: object, eventSessionId?: string) => {
      callsWith(pageCriStub.on, 'event')[0][1]({ method, params, sessionId: eventSessionId })
    }

    const drain = () => new Promise((resolve) => setImmediate(resolve))

    beforeEach(async () => {
      pageCriStub = {
        on: vi.fn(),
        off: vi.fn(),
        send: vi.fn(async () => {}),
        close: vi.fn(async () => {}),
      }

      cdp.state.criImport = vi.fn(async () => pageCriStub)

      pageClient = await realCriClientCreate.call(CriClient, {
        target: DEBUGGER_URL,
        host: HOST,
        fullyManageTabs: true,
        onAsynchronousError: vi.fn(),
      })

      pageClient.onChildTargetAttached = vi.fn(async () => {})

      firePageCDPEvent('Target.attachedToTarget', {
        waitingForDebugger: true,
        sessionId,
        targetInfo: { type: 'service_worker', targetId },
      })

      await drain()

      await pageClient.whenChildTargetHandled(targetId)
    })

    async function setupBrowserConnection (childTargetInterceptionTimeoutMs?: number) {
      const browserClient = {
        send: stub(async () => {}),
        on: vi.fn(),
        removeSessionEnablements: vi.fn(),
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
        onAsynchronousError: vi.fn(),
        port: 1234,
        ...(childTargetInterceptionTimeoutMs !== undefined ? { childTargetInterceptionTimeoutMs } : {}),
      } as any)

      const crashHandler = callsWith(browserClient.on, 'Inspector.targetReloadedAfterCrash')[0][1]

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

      pageClient.onChildTargetAttached = vi.fn(async () => {})

      // the page connection's own crash-reload handling completes first,
      // independent of anything the browser connection does
      firePageCDPEvent('Inspector.targetReloadedAfterCrash', {}, sessionId)
      await drain()

      await crashHandler({}, sessionId)

      expectCalledWith(browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, sessionId)
      // once from the page connection's own crash handling, once from the
      // browser connection's re-enable call
      expect(pageClient.onChildTargetAttached).toHaveBeenCalledTimes(2)
    })

    // Case (b): browser-first - nothing has happened on the page
    // connection's own crash-reload handling yet. The browser connection's
    // reenableChildTargetInterception call evicts and re-runs the hook
    // directly, so the hold resolves once THAT re-run completes.
    it('resolves once the re-enable hook completes, browser-first', async () => {
      const { browserClient, crashHandler } = await setupBrowserConnection()

      const reEnabled = Promise.withResolvers<void>()

      pageClient.onChildTargetAttached = vi.fn(() => reEnabled.promise)

      const released = crashHandler({}, sessionId)

      await drain()

      expectNotCalledWith(browserClient.send, 'Runtime.runIfWaitingForDebugger')

      reEnabled.resolve()
      await released

      expectCalledWith(browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, sessionId)
    })

    // Case (c): a second crash triggers its own fresh re-enable and resolves
    // on that one, not on anything left over from the first.
    it('triggers a fresh re-enable for a second crash and resolves on that crash\'s own hook', async () => {
      const { browserClient, crashHandler } = await setupBrowserConnection()

      pageClient.onChildTargetAttached = vi.fn(async () => {})

      await crashHandler({}, sessionId)

      expectCalledWith(browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, sessionId)
      expect(pageClient.onChildTargetAttached).toHaveBeenCalledTimes(1)

      browserClient.send.mockClear()

      const secondReEnabled = Promise.withResolvers<void>()

      pageClient.onChildTargetAttached = vi.fn(() => secondReEnabled.promise)

      const released = crashHandler({}, sessionId)

      await drain()

      expectNotCalledWith(browserClient.send, 'Runtime.runIfWaitingForDebugger')
      expect(pageClient.onChildTargetAttached).toHaveBeenCalledTimes(1)

      secondReEnabled.resolve()
      await released

      expectCalledWith(browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, sessionId)
    })

    // Case (d): the page connection's own Inspector.targetReloadedAfterCrash
    // handler never fires at all for this crash (event missed, or simply
    // never delivered on that connection) - correctness no longer depends
    // on it. The browser-driven re-enable covers the target regardless.
    it('resolves via the browser-driven re-enable even when the page connection never receives its own crash event', async () => {
      const { browserClient, crashHandler } = await setupBrowserConnection()

      const reEnabled = Promise.withResolvers<void>()

      pageClient.onChildTargetAttached = vi.fn(() => reEnabled.promise)

      // firePageCDPEvent('Inspector.targetReloadedAfterCrash', ...) is
      // deliberately never called here
      const released = crashHandler({}, sessionId)

      await drain()

      expectCalledOnceWith(pageClient.onChildTargetAttached as Mock, sessionId)
      expectNotCalledWith(browserClient.send, 'Runtime.runIfWaitingForDebugger')

      reEnabled.resolve()
      await released

      expectCalledWith(browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, sessionId)
    })

    // Case (e): the re-enable call itself rejects - unknown target, or the
    // interception hook failing. Fails open immediately, same as any other
    // wait-rejected path, rather than hanging or waiting out the timeout.
    it('releases immediately when the re-enable call rejects', async () => {
      // a large timeout - if this test finishes quickly, the hold resolved
      // off the rejection, not by waiting out even a sliver of this
      const { browserClient, crashHandler } = await setupBrowserConnection(1_000_000)

      pageClient.onChildTargetAttached = vi.fn(async () => {
        throw new Error('ProtocolError: Inspected target closed')
      })

      await crashHandler({}, sessionId)

      expectCalledWith(browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, sessionId)
    })

    it('releases via the timeout when the re-enable hook never resolves', async () => {
      const { browserClient, crashHandler } = await setupBrowserConnection(5)

      pageClient.onChildTargetAttached = vi.fn(() => new Promise<void>(() => {}))

      await crashHandler({}, sessionId)

      expectCalledWith(browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, sessionId)
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

      const onChildTargetAttached = vi.fn()
      .mockReturnValueOnce(staleInvocation.promise)
      .mockReturnValueOnce(crashInvocation.promise)

      pageClient.onChildTargetAttached = onChildTargetAttached

      // a hook invocation already stalled before this crash - only its
      // effect on the crash hold below matters to this test
      pageClient.reenableChildTargetInterception(targetId).catch(() => {})

      const released = crashHandler({}, sessionId)

      await drain()

      expect(onChildTargetAttached).toHaveBeenCalledTimes(2)
      expectNotCalledWith(browserClient.send, 'Runtime.runIfWaitingForDebugger')

      // resolving the stale, pre-crash invocation must not satisfy this
      // crash's own hold
      staleInvocation.resolve()
      await drain()

      expectNotCalledWith(browserClient.send, 'Runtime.runIfWaitingForDebugger')

      crashInvocation.resolve()
      await released

      expectCalledWith(browserClient.send, 'Runtime.runIfWaitingForDebugger', undefined, sessionId)
    })
  })

  describe('._onTargetDestroyed', () => {
    describe('when not the currently attached target', () => {
      let options: any

      beforeEach(() => {
        options = {
          browserCriClient: {
            hasExtraTargetClient: vi.fn(() => true),
            getExtraTargetClient: vi.fn(),
            removeExtraTargetClient: vi.fn(),
            currentlyAttachedTarget: {
              targetId: 'main-target-id',
              close: vi.fn(async () => {}),
            },
            currentlyAttachedProtocolTarget: {
              close: vi.fn(async () => {}),
            },
            currentlyAttachedCyPromptTarget: {
              close: vi.fn(async () => {}),
            },
            currentlyAttachedStudioTarget: {
              close: vi.fn(async () => {}),
            },
            resettingBrowserTargets: false,
            sessionTargetInfo: new Map(),
            removeServiceWorkerBinding: vi.fn(),
          },
          browserClient: {
            removeSessionEnablements: vi.fn(),
          },
          event: {
            targetId: 'target-id',
          },
        }
      })

      it('releases the per-session state of the destroyed target', () => {
        options.browserCriClient.hasExtraTargetClient.mockReturnValue(false)
        options.browserCriClient.sessionTargetInfo.set('sw-session', { targetId: 'target-id', type: 'service_worker' })
        options.browserCriClient.sessionTargetInfo.set('other-session', { targetId: 'other-target-id', type: 'service_worker' })

        BrowserCriClient._onTargetDestroyed(options as any)

        expectCalledOnceWith(options.browserCriClient.removeServiceWorkerBinding, 'sw-session')
        expectCalledOnceWith(options.browserClient.removeSessionEnablements, 'sw-session')
      })

      it('is noop if target is not currently tracked', () => {
        options.browserCriClient.hasExtraTargetClient.mockReturnValue(false)

        BrowserCriClient._onTargetDestroyed(options as any)

        expect(options.browserCriClient.getExtraTargetClient).not.toHaveBeenCalled()
        expect(options.browserCriClient.currentlyAttachedTarget.close).not.toHaveBeenCalled()
        expect(options.browserCriClient.currentlyAttachedProtocolTarget.close).not.toHaveBeenCalled()
        expect(options.browserCriClient.currentlyAttachedCyPromptTarget.close).not.toHaveBeenCalled()
        expect(options.browserCriClient.currentlyAttachedStudioTarget.close).not.toHaveBeenCalled()
      })

      it('closes the extra target client', () => {
        const client = { close: vi.fn(async () => {}) }

        options.browserCriClient.getExtraTargetClient.mockReturnValue({ client })

        BrowserCriClient._onTargetDestroyed(options as any)

        expect(client.close).toHaveBeenCalled()
      })

      it('detaches the extra target Fetch transport when present', () => {
        const detach = vi.fn(async () => {})
        const client = { close: vi.fn(async () => {}) }

        options.browserCriClient.getExtraTargetClient.mockReturnValue({ client, detach })

        BrowserCriClient._onTargetDestroyed(options as any)

        expect(detach).toHaveBeenCalled()
        expect(client.close).toHaveBeenCalled()
      })

      it('ignores errors closing the extra target client', () => {
        const client = {
          close: vi.fn(async () => {
            throw new Error('closing failed')
          }),
        }

        options.browserCriClient.getExtraTargetClient.mockReturnValue({ client })

        BrowserCriClient._onTargetDestroyed(options as any)

        expectCalledWith(options.browserCriClient.removeExtraTargetClient, 'target-id')
        // error is caught or else the test would fail
      })

      it('removes the extra target client from the tracker', () => {
        const client = { close: vi.fn(async () => {}) }

        options.browserCriClient.getExtraTargetClient.mockReturnValue({ client })

        BrowserCriClient._onTargetDestroyed(options as any)

        expectCalledWith(options.browserCriClient.removeExtraTargetClient, 'target-id')
      })

      it('closes the studio target', () => {
        options.browserCriClient.gracefulShutdown = true
        options.event.targetId = 'main-target-id'
        options.browserCriClient.currentlyAttachedStudioTarget.close.mockResolvedValue(undefined)

        BrowserCriClient._onTargetDestroyed(options as any)

        expect(options.browserCriClient.currentlyAttachedStudioTarget.close).toHaveBeenCalled()
      })

      it('ignores errors closing the studio target', () => {
        options.browserCriClient.gracefulShutdown = true
        options.event.targetId = 'main-target-id'
        options.browserCriClient.currentlyAttachedStudioTarget.close.mockRejectedValue(new Error('closing failed'))

        BrowserCriClient._onTargetDestroyed(options as any)

        expect(options.browserCriClient.currentlyAttachedStudioTarget.close).toHaveBeenCalled()
      })

      it('closes the cyPrompt target', () => {
        options.browserCriClient.gracefulShutdown = true
        options.event.targetId = 'main-target-id'
        options.browserCriClient.currentlyAttachedCyPromptTarget.close.mockResolvedValue(undefined)

        BrowserCriClient._onTargetDestroyed(options as any)

        expect(options.browserCriClient.currentlyAttachedCyPromptTarget.close).toHaveBeenCalled()
      })

      it('ignores errors closing the cyPrompt target', () => {
        options.browserCriClient.gracefulShutdown = true
        options.event.targetId = 'main-target-id'
        options.browserCriClient.currentlyAttachedCyPromptTarget.close.mockRejectedValue(new Error('closing failed'))

        BrowserCriClient._onTargetDestroyed(options as any)

        expect(options.browserCriClient.currentlyAttachedCyPromptTarget.close).toHaveBeenCalled()
      })

      // Target.targetDestroyed carries no sessionId, unlike detachedFromTarget
      // - this is the fallback sweep for whichever session(s) were recorded
      // against the destroyed targetId (#34674).
      it('evicts any session -> TargetInfo mapping recorded for the destroyed target', () => {
        options.browserCriClient.hasExtraTargetClient.mockReturnValue(false)
        options.browserCriClient.sessionTargetInfo.set('sw-session', { targetId: 'target-id', type: 'service_worker', url: 'https://example.test/sw.js' })
        options.browserCriClient.sessionTargetInfo.set('other-session', { targetId: 'some-other-target-id', type: 'page', url: 'https://example.test/' })

        BrowserCriClient._onTargetDestroyed(options as any)

        expect(options.browserCriClient.sessionTargetInfo.has('sw-session')).toBe(false)
        expect(options.browserCriClient.sessionTargetInfo.has('other-session')).toBe(true)
      })
    })
  })

  describe('#attachToTargetUrl', function () {
    it('creates a page client when the passed in url is found', async function () {
      const mockProtocolClient = {}
      const mockPageClient = {
        clone: vi.fn().mockReturnValueOnce(mockProtocolClient),
      }

      send.withArgs('Target.getTargets').resolves({ targetInfos: [{ targetId: '1', url: 'http://foo.com' }, { targetId: '2', url: 'http://bar.com' }] })
      criClientCreate.withArgs({ target: '1', onAsynchronousError: onError, host: HOST, port: PORT, protocolManager: undefined, fullyManageTabs: undefined, browserClient: { on, off, send, close, removeSessionEnablements } }).resolves(mockPageClient)

      const browserClient = await getClient()

      const client = await browserClient.attachToTargetUrl('http://foo.com')

      expect(client).toBe(mockPageClient)
      expect(browserClient.currentlyAttachedProtocolTarget).toBe(mockProtocolClient)
    })

    it('creates a page client when the passed in url is found and notifies the protocol manager and fully managed tabs', async function () {
      const mockProtocolClient = {}
      const mockPageClient = {
        clone: vi.fn().mockReturnValueOnce(mockProtocolClient),
      }
      const protocolManager: any = {
        connectToBrowser: vi.fn(async () => {}),
      }

      send.withArgs('Target.getTargets').resolves({ targetInfos: [{ targetId: '1', url: 'http://foo.com' }, { targetId: '2', url: 'http://bar.com' }] })
      criClientCreate.withArgs({ target: '1', onAsynchronousError: onError, host: HOST, port: PORT, protocolManager, fullyManageTabs: true, browserClient: { on, off, send, close, removeSessionEnablements } }).resolves(mockPageClient)

      const browserClient = await getClient({ protocolManager, fullyManageTabs: true })

      const client = await browserClient.attachToTargetUrl('http://foo.com')

      expect(client).toBe(mockPageClient)
      expect(browserClient.currentlyAttachedProtocolTarget).toBe(mockProtocolClient)
      expectCalledWith(protocolManager.connectToBrowser, browserClient.currentlyAttachedProtocolTarget)
    })

    it('creates a page client when the passed in url is found and notifies the protocol manager and fully managed tabs and attaching to target throws', async function () {
      const mockProtocolClient = {}
      const mockPageClient = {
        clone: vi.fn().mockReturnValueOnce(mockProtocolClient),
      }
      const protocolManager: any = {
        connectToBrowser: vi.fn(async () => {}),
      }

      send.withArgs('Target.getTargets').resolves({ targetInfos: [{ targetId: '1', url: 'http://foo.com' }, { targetId: '2', url: 'http://bar.com' }] })

      send.withArgs('Network.enable').throws(new Error('ProtocolError: Inspected target navigated or closed'))

      criClientCreate.withArgs({ target: '1', onAsynchronousError: onError, host: HOST, port: PORT, protocolManager, fullyManageTabs: true, browserClient: { on, off, send, close, removeSessionEnablements } }).resolves(mockPageClient)

      const browserClient = await getClient({ protocolManager, fullyManageTabs: true })

      const client = await browserClient.attachToTargetUrl('http://foo.com')

      expect(client).toBe(mockPageClient)
      expect(browserClient.currentlyAttachedProtocolTarget).toBe(mockProtocolClient)
      expectCalledWith(protocolManager.connectToBrowser, browserClient.currentlyAttachedProtocolTarget)

      // This would throw if the error was not caught
      await callsWith(on, 'Target.attachedToTarget')[0][1]({ targetInfo: { type: 'worker' } })
    })

    it('retries when the passed in url is not found', async function () {
      vi.spyOn(protocol, '_getDelayMsForRetry')
      .mockReturnValue(undefined)
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(100)

      const mockProtocolClient = {}
      const mockPageClient = {
        clone: vi.fn(() => mockProtocolClient),
      }

      send.withArgs('Target.getTargets').resolves({ targetInfos: [{ targetId: '1', url: 'http://foo.com' }, { targetId: '2', url: 'http://bar.com' }] })
      send.withArgs('Target.getTargets').resolves({ targetInfos: [{ targetId: '1', url: 'http://foo.com' }, { targetId: '2', url: 'http://bar.com' }] })
      send.withArgs('Target.getTargets').resolves({ targetInfos: [{ targetId: '1', url: 'http://foo.com' }, { targetId: '2', url: 'http://bar.com' }, { targetId: '3', url: 'http://baz.com' }] })
      criClientCreate.withArgs({ target: '1', onAsynchronousError: onError, host: HOST, port: PORT, protocolManager: undefined, fullyManageTabs: undefined, browserClient: { on, off, send, close, removeSessionEnablements } }).resolves(mockPageClient)

      const browserClient = await getClient()

      const client = await browserClient.attachToTargetUrl('http://foo.com')

      expect(client).toBe(mockPageClient)
      expect(browserClient.currentlyAttachedProtocolTarget).toBe(mockProtocolClient)
    })

    it('throws when the passed in url is not found after retrying', async function () {
      vi.spyOn(protocol, '_getDelayMsForRetry')
      .mockReturnValue(undefined)
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(undefined)

      const mockPageClient = {}

      send.withArgs('Target.getTargets').resolves({ targetInfos: [{ targetId: '1', url: 'http://foo.com' }, { targetId: '2', url: 'http://bar.com' }] })
      send.withArgs('Target.getTargets').resolves({ targetInfos: [{ targetId: '1', url: 'http://foo.com' }, { targetId: '2', url: 'http://bar.com' }] })
      criClientCreate.withArgs({ target: '1', onAsynchronousError: onError, host: HOST, port: PORT, protocolManager: undefined, fullyManageTabs: undefined, browserClient: { on, off, send, close, removeSessionEnablements } }).resolves(mockPageClient)

      const browserClient = await getClient()

      await expect(browserClient.attachToTargetUrl('http://baz.com')).rejects.toThrow()
    })
  })

  describe('#resetBrowserTargets', function () {
    it('closes the currently attached target while keeping a tab open', async function () {
      const mockCurrentlyAttachedTarget = {
        targetId: '100',
        close: vi.fn(async () => vi.fn(async () => {})),
        queue: {
          subscriptions: [{
            eventName: 'Network.requestWillBeSent',
            cb: vi.fn(),
          }],
        },
      }

      const mockCurrentlyAttachedProtocolTarget = {
        targetId: '100',
        close: vi.fn(async () => vi.fn(async () => {})),
        queue: {
          subscriptions: [{
            eventName: 'Network.requestWillBeSent',
            cb: vi.fn(),
          }],
        },
      }

      const mockCurrentlyAttachedCyPromptTarget = {
        targetId: '100',
        close: vi.fn(async () => vi.fn(async () => {})),
        queue: {
          subscriptions: [{
            eventName: 'Network.requestWillBeSent',
            cb: vi.fn(),
          }],
        },
      }

      const mockCurrentlyAttachedStudioTarget = {
        targetId: '100',
        close: vi.fn(async () => vi.fn(async () => {})),
        queue: {
          subscriptions: [{
            eventName: 'Network.requestWillBeSent',
            cb: vi.fn(),
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
        clone: vi.fn()
        .mockReturnValueOnce(mockUpdatedCurrentlyAttachedProtocolTarget)
        .mockReturnValueOnce(mockUpdatedCurrentlyAttachedCyPromptTarget)
        .mockReturnValueOnce(mockUpdatedCurrentlyAttachedStudioTarget),
      }

      send.withArgs('Target.createTarget', { url: 'about:blank' }).resolves(mockUpdatedCurrentlyAttachedTarget)
      send.withArgs('Target.closeTarget', { targetId: '100' }).resolves()

      const browserClient = await getClient() as any

      criClientCreate.withArgs({ target: '101', onAsynchronousError: onError, host: HOST, port: PORT, protocolManager: undefined, fullyManageTabs: undefined, browserClient: browserClient.browserClient }).resolves(mockUpdatedCurrentlyAttachedTarget)

      browserClient.currentlyAttachedTarget = mockCurrentlyAttachedTarget
      browserClient.currentlyAttachedProtocolTarget = mockCurrentlyAttachedProtocolTarget
      browserClient.currentlyAttachedCyPromptTarget = mockCurrentlyAttachedCyPromptTarget
      browserClient.currentlyAttachedStudioTarget = mockCurrentlyAttachedStudioTarget
      browserClient.browserClient.off = vi.fn()

      await browserClient.resetBrowserTargets(true)

      expect(mockCurrentlyAttachedTarget.close).toHaveBeenCalled()
      expect(browserClient.currentlyAttachedTarget).toStrictEqual(mockUpdatedCurrentlyAttachedTarget)
      expect(browserClient.currentlyAttachedProtocolTarget).toStrictEqual(mockUpdatedCurrentlyAttachedProtocolTarget)
      expect(browserClient.currentlyAttachedCyPromptTarget).toStrictEqual(mockUpdatedCurrentlyAttachedCyPromptTarget)
      expect(browserClient.currentlyAttachedStudioTarget).toStrictEqual(mockUpdatedCurrentlyAttachedStudioTarget)
      expectCalledWith(browserClient.browserClient.off, 'Network.requestWillBeSent', mockCurrentlyAttachedTarget.queue.subscriptions[0].cb)
      expectCalledWith(browserClient.browserClient.off, 'Network.requestWillBeSent', mockCurrentlyAttachedProtocolTarget.queue.subscriptions[0].cb)
      expectCalledWith(browserClient.browserClient.off, 'Network.requestWillBeSent', mockCurrentlyAttachedCyPromptTarget.queue.subscriptions[0].cb)
      expectCalledWith(browserClient.browserClient.off, 'Network.requestWillBeSent', mockCurrentlyAttachedStudioTarget.queue.subscriptions[0].cb)
    })

    it('closes the currently attached target without keeping a tab open', async function () {
      const mockCurrentlyAttachedTarget = {
        targetId: '100',
        close: vi.fn(async () => vi.fn(async () => {})),
        queue: {
          subscriptions: [],
        },
      }

      const mockCurrentlyAttachedProtocolTarget = {
        targetId: '100',
        close: vi.fn(async () => vi.fn(async () => {})),
        queue: {
          subscriptions: [],
        },
      }

      const mockCurrentlyAttachedCyPromptTarget = {
        targetId: '100',
        close: vi.fn(async () => vi.fn(async () => {})),
        queue: {
          subscriptions: [],
        },
      }

      const mockCurrentlyAttachedStudioTarget = {
        targetId: '100',
        close: vi.fn(async () => vi.fn(async () => {})),
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

      expect(mockCurrentlyAttachedTarget.close).toHaveBeenCalled()
      expect(mockCurrentlyAttachedProtocolTarget.close).toHaveBeenCalled()
      expect(mockCurrentlyAttachedCyPromptTarget.close).toHaveBeenCalled()
      expect(mockCurrentlyAttachedStudioTarget.close).toHaveBeenCalled()
      expect(browserClient.currentlyAttachedTarget).toBeUndefined()
      expect(browserClient.currentlyAttachedProtocolTarget).toBeUndefined()
      expect(browserClient.currentlyAttachedCyPromptTarget).toBeUndefined()
      expect(browserClient.currentlyAttachedStudioTarget).toBeUndefined()
    })

    it('throws when there is no currently attached target', async function () {
      const browserClient = await getClient() as any

      await expect(browserClient.resetBrowserTargets()).rejects.toThrow()
    })
  })

  describe('#closeExtraTargets', () => {
    it('closes any extra tracked targets', async () => {
      const browserClient = await getClient() as any

      browserClient.browserClient.send = vi.fn(async () => {})

      browserClient.addExtraTargetClient({ targetId: 'target-id-1' }, {})
      browserClient.addExtraTargetClient({ targetId: 'target-id-2' }, {})

      await browserClient.closeExtraTargets()

      expectCalledWith(browserClient.browserClient.send, 'Target.closeTarget', { targetId: 'target-id-1' })
      expectCalledWith(browserClient.browserClient.send, 'Target.closeTarget', { targetId: 'target-id-2' })
    })

    it('ignores errors', async () => {
      const browserClient = await getClient() as any

      browserClient.browserClient.send = vi.fn(async () => {})
      browserClient.browserClient.send.mockRejectedValueOnce(new Error('failed to close target'))

      browserClient.addExtraTargetClient({ targetId: 'target-id-1' }, {})
      browserClient.addExtraTargetClient({ targetId: 'target-id-2' }, {})

      await browserClient.closeExtraTargets()

      expectCalledWith(browserClient.browserClient.send, 'Target.closeTarget', { targetId: 'target-id-1' })
      expectCalledWith(browserClient.browserClient.send, 'Target.closeTarget', { targetId: 'target-id-2' })
      // error is caught or else the test would fail
    })

    it('does not wait on the extra target Fetch transport detaching', async () => {
      const browserClient = await getClient() as any

      browserClient.browserClient.send = vi.fn(async () => {})

      browserClient.addExtraTargetClient({ targetId: 'target-id-1' }, {})
      // a detach that never settles models an extra target whose own CDP
      // connection is already gone
      browserClient.getExtraTargetClient('target-id-1').detach = vi.fn(() => new Promise(() => {}))

      await browserClient.closeExtraTargets()

      expectCalledWith(browserClient.browserClient.send, 'Target.closeTarget', { targetId: 'target-id-1' })
    })
  })

  describe('#close', function () {
    it('closes the currently attached target if it exists and the browser client', async function () {
      const mockCurrentlyAttachedTarget = {
        close: vi.fn(async () => {}),
      }

      const mockCurrentlyAttachedProtocolTarget = {
        close: vi.fn(async () => {}),
      }

      const mockCurrentlyAttachedCyPromptTarget = {
        close: vi.fn(async () => {}),
      }

      const mockCurrentlyAttachedStudioTarget = {
        close: vi.fn(async () => {}),
      }

      const browserClient = await getClient() as any

      browserClient.currentlyAttachedTarget = mockCurrentlyAttachedTarget
      browserClient.currentlyAttachedProtocolTarget = mockCurrentlyAttachedProtocolTarget
      browserClient.currentlyAttachedCyPromptTarget = mockCurrentlyAttachedCyPromptTarget
      browserClient.currentlyAttachedStudioTarget = mockCurrentlyAttachedStudioTarget

      await browserClient.close()

      expect(mockCurrentlyAttachedTarget.close).toHaveBeenCalled()
      expect(mockCurrentlyAttachedProtocolTarget.close).toHaveBeenCalled()
      expect(mockCurrentlyAttachedCyPromptTarget.close).toHaveBeenCalled()
      expect(mockCurrentlyAttachedStudioTarget.close).toHaveBeenCalled()
    })

    it('just the browser client with no currently attached target', async function () {
      const browserClient = await getClient() as any

      await browserClient.close()

      expect(close).toHaveBeenCalled()
    })
  })
})
