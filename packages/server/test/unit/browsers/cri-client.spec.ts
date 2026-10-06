import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping'
import EventEmitter from 'events'
import { deepStrictEqual } from 'assert'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import type { ProtocolManagerShape } from '@packages/types'
import type Protocol from 'devtools-protocol'
import { fireDisconnect as fireDisconnectListeners } from '../../support/helpers/cdp-disconnect'
import { CriClient } from '../../../lib/browsers/cdp-protocol/cri-client'

type CriStub = {
  send: Mock
  on: Mock
  off: Mock
  close: Mock
  _notifier: EventEmitter
}

type CriClientInstance = InstanceType<typeof CriClient>

// cri-client reaches chrome-remote-interface through cdp-connection, so mocking
// the leaf module covers both hops without stubbing cdp-connection itself
const cdp = vi.hoisted(() => {
  const state: { criStub: unknown } = { criStub: null }

  const criImport = Object.assign(vi.fn(async () => state.criStub), {
    New: vi.fn(async () => ({ webSocketDebuggerUrl: 'http://web/socket/url' })),
  })

  return { state, criImport }
})

vi.mock('chrome-remote-interface', () => {
  return { default: cdp.criImport }
})

const DEBUGGER_URL = 'http://foo'
const HOST = '127.0.0.1'

type RecordedCall = { args: unknown[], callId: number }

// The shared cdp-disconnect helper replays on/off in sinon's global call order;
// vi.fn has no equivalent id, so record one as the stubs are invoked and hand
// the helper a getCalls() view over the recording.
let nextCallId = 0
let onCalls: RecordedCall[] = []
let offCalls: RecordedCall[] = []

const recordInto = (calls: RecordedCall[]) => {
  return vi.fn((...args: unknown[]) => {
    calls.push({ args, callId: nextCallId++ })
  })
}

const asCallLog = (calls: RecordedCall[]) => {
  return { getCalls: () => calls } as unknown as Parameters<typeof fireDisconnectListeners>[0]
}

const callsMatching = (mock: Mock, expected: unknown[]) => {
  return mock.mock.calls.filter((call) => {
    try {
      deepStrictEqual(call.slice(0, expected.length), expected)

      return true
    } catch {
      return false
    }
  })
}

// sinon's calledWith matches a prefix of the recorded arguments, where vitest's
// toHaveBeenCalledWith requires the exact arity
const expectCalledWith = (mock: Mock, ...expected: unknown[]) => {
  expect(callsMatching(mock, expected), `calls matching ${String(expected[0])}`).not.toHaveLength(0)
}

const expectNotCalledWith = (mock: Mock, ...expected: unknown[]) => {
  expect(callsMatching(mock, expected), `calls matching ${String(expected[0])}`).toHaveLength(0)
}

const expectCalledWithAndThrew = (mock: Mock, command: string) => {
  const index = mock.mock.calls.findIndex((call) => call[0] === command)

  expect(index, `a call to ${command}`).toBeGreaterThanOrEqual(0)
  expect(mock.mock.results[index].type).toBe('throw')
}

describe('lib/browsers/cri-client', () => {
  let send: Mock
  let on: Mock
  let off: Mock

  let criStub: CriStub
  let onError: Mock
  let onReconnect: Mock

  let getClient: (options?: { host?: string, fullyManageTabs?: boolean, protocolManager?: ProtocolManagerShape }) => Promise<CriClientInstance>

  const fireCDPEvent = <T extends keyof ProtocolMapping.Events>(method: T, params: Partial<ProtocolMapping.Events[T][0]>, sessionId?: string) => {
    const listener = onCalls.find((call) => call.args[0] === 'event')?.args[1] as (payload: unknown) => unknown

    return listener({
      method,
      params,
      sessionId,
    })
  }

  // wraps the shared helper over the current criStub
  const fireDisconnect = () => fireDisconnectListeners(asCallLog(onCalls), asCallLog(offCalls))

  beforeEach(() => {
    send = vi.fn()
    onError = vi.fn()
    onReconnect = vi.fn()
    onCalls = []
    offCalls = []
    on = recordInto(onCalls)
    off = recordInto(offCalls)
    criStub = {
      on,
      off,
      send,
      close: vi.fn(async () => {}),
      _notifier: new EventEmitter(),
    }

    cdp.state.criStub = criStub
    cdp.criImport.mockReset()
    cdp.criImport.mockImplementation(async () => criStub)
    cdp.criImport.New.mockReset()
    cdp.criImport.New.mockImplementation(async () => ({ webSocketDebuggerUrl: 'http://web/socket/url' }))

    getClient = ({ host, fullyManageTabs, protocolManager } = {}): Promise<CriClientInstance> => {
      return CriClient.create({ target: DEBUGGER_URL, host, onAsynchronousError: onError, fullyManageTabs, protocolManager, onReconnect })
    }
  })

  describe('.create', () => {
    it('returns an instance of the CRI client', async () => {
      const client = await getClient()

      expect(client.send).toBeInstanceOf(Function)
    })

    describe('when it has a host', () => {
      it('adds a crash listener', async () => {
        const client = await getClient({ host: HOST })

        fireCDPEvent('Target.targetCrashed', { targetId: DEBUGGER_URL })
        expect(client.crashed).toBe(true)
      })
    })

    describe('when it does not have a host', () => {
      it('does not add a crash listener', async () => {
        const client = await getClient()

        fireCDPEvent('Target.targetCrashed', { targetId: DEBUGGER_URL })
        expect(client.crashed).toBe(false)
      })
    })

    describe('when it has a host and is fully managed and receives an attachedToTarget event', () => {
      beforeEach(async () => {
        await getClient({ host: HOST, fullyManageTabs: true })
        criStub.send.mockResolvedValue(undefined)
      })

      describe('target type is service worker, page, or other', () => {
        it('does not enable network', async () => {
          await Promise.all(['service_worker', 'page', 'other'].map((type) => {
            return fireCDPEvent('Target.attachedToTarget', {
              targetInfo: {
                type,
              } as Protocol.Target.TargetInfo,
            })
          }))

          expectNotCalledWith(criStub.send, 'Network.enable')
        })
      })

      describe('target type is something other than service worker, page, or other', () => {
        it('enables network', async () => {
          await fireCDPEvent('Target.attachedToTarget', {
            targetInfo: {
              type: 'iframe',
            } as Protocol.Target.TargetInfo,
          })

          expectCalledWith(criStub.send, 'Network.enable')
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

          expectCalledWith(criStub.send, 'Runtime.runIfWaitingForDebugger', undefined, sessionId)
        })

        it('does not send Runtime.runIfWaitingForDebugger if not waiting for debugger', async () => {
          await fireCDPEvent('Target.attachedToTarget', {
            waitingForDebugger: false,
            sessionId,
            targetInfo: { type: 'service_worker' } as Protocol.Target.TargetInfo,
          })

          expectNotCalledWith(criStub.send, 'Runtime.runIfWaitingForDebugger')
        })

        it('sends Runtime.runIfWaitingForDebugger even if Network.enable throws', async () => {
          criStub.send.mockImplementation((command: string) => {
            if (command === 'Network.enable') {
              throw new Error('ProtocolError: Inspected target closed')
            }

            return Promise.resolve()
          })

          await fireCDPEvent('Target.attachedToTarget', {
            waitingForDebugger: true,
            sessionId,
            targetInfo: { type: 'iframe' } as Protocol.Target.TargetInfo,
          })

          expectCalledWithAndThrew(criStub.send, 'Network.enable')
          expectCalledWith(criStub.send, 'Runtime.runIfWaitingForDebugger', undefined, sessionId)
        })

        it('continues even if Runtime.runIfWaitingForDebugger throws', async () => {
          criStub.send.mockImplementation((command: string) => {
            if (command === 'Runtime.runIfWaitingForDebugger') {
              throw new Error('ProtocolError: Inspected target closed')
            }

            return Promise.resolve()
          })

          await fireCDPEvent('Target.attachedToTarget', {
            waitingForDebugger: true,
            sessionId,
            targetInfo: { type: 'service_worker' } as Protocol.Target.TargetInfo,
          })

          expectCalledWith(criStub.send, 'Runtime.runIfWaitingForDebugger', undefined, sessionId)
          expectCalledWithAndThrew(criStub.send, 'Runtime.runIfWaitingForDebugger')
        })
      })
    })

    describe('when a child target (service worker / out-of-process iframe) attaches', () => {
      const sessionId = 'sw-session'
      let client: CriClientInstance

      // drains the async attach handler, which fireCDPEvent invokes without
      // awaiting
      const drain = () => new Promise((resolve) => setImmediate(resolve))

      beforeEach(async () => {
        client = await getClient({ host: HOST, fullyManageTabs: true })
        criStub.send.mockResolvedValue(undefined)
      })

      it('enables interception on the session before releasing the debugger', async () => {
        const enabled = Promise.withResolvers<void>()

        client.onChildTargetAttached = vi.fn(() => enabled.promise)

        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: true,
          sessionId,
          targetInfo: { type: 'service_worker' } as Protocol.Target.TargetInfo,
        })

        await drain()

        expect(client.onChildTargetAttached).toHaveBeenCalledExactlyOnceWith(sessionId)

        // a worker released before its session is intercepted fetches its own
        // script straight off the network, bypassing the middleware onion
        expectNotCalledWith(criStub.send, 'Runtime.runIfWaitingForDebugger')

        enabled.resolve()
        await drain()

        expectCalledWith(criStub.send, 'Runtime.runIfWaitingForDebugger', undefined, sessionId)
      })

      it('enables interception on origin-isolated iframe sessions before releasing the debugger', async () => {
        // an out-of-process iframe's (OOPIF) subresources are fetched on its
        // own session (e.g. an https spec-bridge iframe on an origin-keyed
        // google origin); released uninstrumented, its runner bundle request
        // escapes to the real origin
        const enabled = Promise.withResolvers<void>()

        client.onChildTargetAttached = vi.fn(() => enabled.promise)

        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: true,
          sessionId,
          targetInfo: { type: 'iframe' } as Protocol.Target.TargetInfo,
        })

        await drain()

        expect(client.onChildTargetAttached).toHaveBeenCalledExactlyOnceWith(sessionId)
        expectNotCalledWith(criStub.send, 'Runtime.runIfWaitingForDebugger')

        enabled.resolve()
        await drain()

        expectCalledWith(criStub.send, 'Runtime.runIfWaitingForDebugger', undefined, sessionId)
      })

      it('does not enable interception for other target types', async () => {
        client.onChildTargetAttached = vi.fn(async () => {})

        await Promise.all(['page', 'other'].map((type) => {
          return fireCDPEvent('Target.attachedToTarget', {
            waitingForDebugger: true,
            sessionId,
            targetInfo: { type } as Protocol.Target.TargetInfo,
          })
        }))

        await drain()

        expect(client.onChildTargetAttached).not.toHaveBeenCalled()
      })

      it('releases the debugger even when enabling interception fails', async () => {
        client.onChildTargetAttached = vi.fn(async () => {
          throw new Error('ProtocolError: Inspected target closed')
        })

        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: true,
          sessionId,
          targetInfo: { type: 'service_worker' } as Protocol.Target.TargetInfo,
        })

        await drain()

        // losing interception on one worker must not strand the target paused
        expectCalledWith(criStub.send, 'Runtime.runIfWaitingForDebugger', undefined, sessionId)
      })

      it('releases the debugger when no interception hook is registered', async () => {
        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: true,
          sessionId,
          targetInfo: { type: 'service_worker' } as Protocol.Target.TargetInfo,
        })

        await drain()

        expectCalledWith(criStub.send, 'Runtime.runIfWaitingForDebugger', undefined, sessionId)
      })
    })

    describe('#whenChildTargetHandled', () => {
      const targetId = 'target-id'
      const sessionId = 'sw-session'
      let client: CriClientInstance

      const drain = () => new Promise((resolve) => setImmediate(resolve))

      beforeEach(async () => {
        client = await getClient({ host: HOST, fullyManageTabs: true })
        criStub.send.mockResolvedValue(undefined)
      })

      it('resolves a waiter registered before the target attaches', async () => {
        let resolved = false

        client.whenChildTargetHandled(targetId).then(() => {
          resolved = true
        })

        await drain()
        expect(resolved).toBe(false)

        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: false,
          targetInfo: { type: 'page', targetId } as Protocol.Target.TargetInfo,
        })

        await drain()

        expect(resolved).toBe(true)
      })

      it('resolves immediately for a target that already finished attaching', async () => {
        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: false,
          targetInfo: { type: 'page', targetId } as Protocol.Target.TargetInfo,
        })

        await drain()

        await expect(client.whenChildTargetHandled(targetId)).resolves.toBeUndefined()
      })

      it('resolves pending waiters when the client closes, rather than leaving them hanging on a dead connection', async () => {
        let resolved = false

        client.whenChildTargetHandled('never-attaches').then(() => {
          resolved = true
        })

        await client.close()

        expect(resolved).toBe(true)
      })

      // Order-proof against a deferred onChildTargetAttached hook, same style
      // as the "enables interception ... before releasing the debugger" test
      // above: completion must not be observable until the hook (and the
      // Fetch enable it runs) has actually finished.
      it('resolves only after the onChildTargetAttached hook completes', async () => {
        const enabled = Promise.withResolvers<void>()
        let resolved = false

        client.onChildTargetAttached = vi.fn(() => enabled.promise)

        client.whenChildTargetHandled(targetId).then(() => {
          resolved = true
        })

        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: true,
          sessionId,
          targetInfo: { type: 'service_worker', targetId } as Protocol.Target.TargetInfo,
        })

        await drain()

        expect(resolved).toBe(false)

        enabled.resolve()
        await drain()

        expect(resolved).toBe(true)
      })

      // "Handled" must mean interception is actually on, not merely that the
      // hook ran: a worker whose session-scoped Fetch.enable failed must not
      // be reported confirmed to a sibling connection deciding whether to
      // release it (#34674 hold).
      it('does not resolve when the onChildTargetAttached hook rejects', async () => {
        const enabled = Promise.withResolvers<void>()
        let resolved = false

        client.onChildTargetAttached = vi.fn(() => enabled.promise)

        client.whenChildTargetHandled(targetId).then(() => {
          resolved = true
        })

        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: true,
          sessionId,
          targetInfo: { type: 'service_worker', targetId } as Protocol.Target.TargetInfo,
        })

        await drain()

        expect(resolved).toBe(false)

        enabled.reject(new Error('ProtocolError: Inspected target closed'))
        await drain()

        expect(resolved).toBe(false)

        // still released via close(), same as any other stranded waiter
        await client.close()

        expect(resolved).toBe(true)
      })

      it('commits a service worker target with no interception hook registered', async () => {
        let resolved = false

        client.whenChildTargetHandled(targetId).then(() => {
          resolved = true
        })

        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: false,
          targetInfo: { type: 'service_worker', targetId } as Protocol.Target.TargetInfo,
        })

        await drain()

        expect(resolved).toBe(true)
      })

      it('resolves immediately for a waiter registered after the client has already closed', async () => {
        await client.close()

        await expect(client.whenChildTargetHandled('anything')).resolves.toBeUndefined()
      })
    })

    // A terminal disconnect (see cdp-connection.ts) sets cdpConnection.terminated
    // without going through close() - _closed can still read false. A waiter
    // left registered against a connection that's never processing another
    // Target.attachedToTarget would otherwise hang forever.
    describe('#whenChildTargetHandled when the connection has terminally disconnected', () => {
      const targetId = 'target-id'

      // reconnection must be disabled for a disconnect to be terminal - see
      // the "when reconnection is disabled (cypress-in-cypress)" context above
      beforeEach(() => {
        process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF = 'true'
      })

      afterEach(() => {
        delete process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF
      })

      it('resolves immediately once the connection has terminated, even though close() was never called', async () => {
        const client = await getClient()

        await fireDisconnect()

        expect(client.closed).toBe(false)

        await expect(client.whenChildTargetHandled(targetId)).resolves.toBeUndefined()
      })

      it('resolves a waiter already registered when the connection terminally disconnects', async () => {
        const client = await getClient()
        let resolved = false

        client.whenChildTargetHandled(targetId).then(() => {
          resolved = true
        })

        await fireDisconnect()

        expect(resolved).toBe(true)
      })
    })

    describe('eviction on detach/destroy (#34674 service worker restarts)', () => {
      const targetId = 'target-id'
      const sessionId = 'sw-session'
      let client: CriClientInstance

      const drain = () => new Promise((resolve) => setImmediate(resolve))

      beforeEach(async () => {
        client = await getClient({ host: HOST, fullyManageTabs: true })
        criStub.send.mockResolvedValue(undefined)
      })

      // Guards against a target id being reused for a restarted service
      // worker instance — without evicting the stale "handled" entry on
      // detach, a waiter registered for the new instance would resolve
      // immediately against the old one's completion, reinstating the
      // exact race #34674 fixes.
      it('waits again for a target that re-attaches after detaching', async () => {
        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: false,
          targetInfo: { type: 'service_worker', targetId } as Protocol.Target.TargetInfo,
        })

        await drain()

        await expect(client.whenChildTargetHandled(targetId)).resolves.toBeUndefined()

        fireCDPEvent('Target.detachedFromTarget', { sessionId, targetId })

        await drain()

        const enabled = Promise.withResolvers<void>()
        let resolved = false

        client.onChildTargetAttached = vi.fn(() => enabled.promise)

        client.whenChildTargetHandled(targetId).then(() => {
          resolved = true
        })

        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: true,
          sessionId,
          targetInfo: { type: 'service_worker', targetId } as Protocol.Target.TargetInfo,
        })

        await drain()

        expect(resolved).toBe(false)

        enabled.resolve()
        await drain()

        expect(resolved).toBe(true)
      })

      // A detach event is not guaranteed to arrive before a reused targetId's
      // next attach - _onChildTargetDetached already evicts on an observed
      // detach, but the plain attach path must not depend on that having
      // happened: it needs to evict the stale entry itself, symmetric with
      // the crash-reload re-arm (which already does this before it re-runs
      // the hook).
      it('does not resolve off a stale handled entry when a targetId re-attaches without an observed detach', async () => {
        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: false,
          targetInfo: { type: 'service_worker', targetId } as Protocol.Target.TargetInfo,
        })

        await drain()

        await expect(client.whenChildTargetHandled(targetId)).resolves.toBeUndefined()

        // no detach observed in between - a new instance simply attaches
        // under the same targetId
        const enabled = Promise.withResolvers<void>()

        client.onChildTargetAttached = vi.fn(() => enabled.promise)

        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: true,
          sessionId,
          targetInfo: { type: 'service_worker', targetId } as Protocol.Target.TargetInfo,
        })

        let resolved = false

        client.whenChildTargetHandled(targetId).then(() => {
          resolved = true
        })

        await drain()

        expect(resolved).toBe(false)

        enabled.resolve()
        await drain()

        expect(resolved).toBe(true)
      })

      it('does not retain a stale "handled" entry for a target that detached without re-attaching', async () => {
        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: false,
          targetInfo: { type: 'service_worker', targetId } as Protocol.Target.TargetInfo,
        })

        await drain()

        fireCDPEvent('Target.detachedFromTarget', { sessionId, targetId })

        await drain()

        let resolved = false

        client.whenChildTargetHandled(targetId).then(() => {
          resolved = true
        })

        await drain()

        expect(resolved).toBe(false)
      })

      it('also evicts on Target.targetDestroyed, in case that is what actually arrives on this connection', async () => {
        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: false,
          targetInfo: { type: 'service_worker', targetId } as Protocol.Target.TargetInfo,
        })

        await drain()

        fireCDPEvent('Target.targetDestroyed', { targetId })

        await drain()

        let resolved = false

        client.whenChildTargetHandled(targetId).then(() => {
          resolved = true
        })

        await drain()

        expect(resolved).toBe(false)
      })

      // A detach that arrives while the attach handler is still suspended
      // mid-flight (at onChildTargetAttached, here) finds nothing in
      // _handledTargetIds to evict yet — the entry doesn't exist until the
      // handler resumes and adds it, by which point the detach has already
      // passed. Without an in-flight identity check, that resumed handler
      // still adds the (now-stale) entry, permanently short-circuiting a
      // fresh waiter for whatever comes next.
      it('does not mark a target handled from a stale attach that resumes after a mid-flight detach', async () => {
        const enabled = Promise.withResolvers<void>()

        client.onChildTargetAttached = vi.fn(() => enabled.promise)

        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: true,
          sessionId,
          targetInfo: { type: 'service_worker', targetId } as Protocol.Target.TargetInfo,
        })

        await drain()

        fireCDPEvent('Target.detachedFromTarget', { sessionId, targetId })

        await drain()

        // the stale attach's hook now resolves and the handler resumes
        enabled.resolve()
        await drain()

        let resolved = false

        client.whenChildTargetHandled(targetId).then(() => {
          resolved = true
        })

        await drain()

        expect(resolved).toBe(false)
      })

      it('resolves a pending waiter promptly when its target detaches', async () => {
        let resolved = false

        client.whenChildTargetHandled(targetId).then(() => {
          resolved = true
        })

        await drain()
        expect(resolved).toBe(false)

        fireCDPEvent('Target.detachedFromTarget', { sessionId, targetId })

        await drain()

        expect(resolved).toBe(true)
      })
    })

    // The browser connection's crash-reload hold calls this directly instead
    // of reading whatever this connection's own crash handler happened to
    // commit (#34674). Because the returned promise can only settle from a
    // re-run that STARTS after this is called, it can never be satisfied by
    // a confirmation that predates the call - no counter, generation, or
    // snapshot needed to tell them apart, in any ordering between this
    // connection's own crash-reload handling and the caller's.
    describe('#reenableChildTargetInterception', () => {
      const targetId = 'target-id'
      const sessionId = 'sw-session'
      let client: CriClientInstance

      const drain = () => new Promise((resolve) => setImmediate(resolve))

      beforeEach(async () => {
        client = await getClient({ host: HOST, fullyManageTabs: true })
        criStub.send.mockResolvedValue(undefined)
      })

      const attachServiceWorker = async () => {
        client.onChildTargetAttached = vi.fn(async () => {})

        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: true,
          sessionId,
          targetInfo: { type: 'service_worker', targetId } as Protocol.Target.TargetInfo,
        })

        await drain()
      }

      it('evicts the stale handled entry, re-runs the hook against the session on file, and commits on success', async () => {
        await attachServiceWorker()

        await expect(client.whenChildTargetHandled(targetId)).resolves.toBeUndefined()

        const reEnabled = Promise.withResolvers<void>()

        client.onChildTargetAttached = vi.fn(() => reEnabled.promise)

        const reenabled = client.reenableChildTargetInterception(targetId)

        // evicted synchronously - a waiter registered right after the call
        // stays pending, not resolved off the stale pre-call entry
        let resolved = false

        client.whenChildTargetHandled(targetId).then(() => {
          resolved = true
        })

        await drain()

        expect(resolved).toBe(false)
        expect(client.onChildTargetAttached).toHaveBeenCalledExactlyOnceWith(sessionId)

        reEnabled.resolve()

        await expect(reenabled).resolves.toBeUndefined()
        await drain()

        expect(resolved).toBe(true)
      })

      // A target that has never been seen at all (no session, no handled
      // entry) has nothing stale to confuse a wait with - a crash event can
      // race ahead of the initial Target.attachedToTarget event actually
      // being processed by this connection yet, so this behaves like the
      // fresh-attach hold: wait, and let the caller's own timeout cover it.
      it('waits via whenChildTargetHandled for a target that has never been seen', async () => {
        // a hook must be registered, or the earlier no-hook check would
        // reject before ever reaching the never-seen-target branch below
        client.onChildTargetAttached = vi.fn(async () => {})

        let resolved = false
        let rejected = false

        client.reenableChildTargetInterception('never-seen-target').then(
          () => {
            resolved = true
          },
          () => {
            rejected = true
          },
        )

        await drain()

        expect(resolved).toBe(false)
        expect(rejected).toBe(false)

        // a concurrent attach for that same targetId eventually commits
        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: false,
          targetInfo: { type: 'page', targetId: 'never-seen-target' } as Protocol.Target.TargetInfo,
        })

        await drain()

        expect(resolved).toBe(true)
        expect(rejected).toBe(false)
      })

      // Unlike a never-seen target, a stale handled entry means this target
      // WAS confirmed before - waiting here would resolve immediately off
      // that stale entry and hand the caller a false confirmation for a
      // target whose session has since gone away.
      it('rejects when the target has no session on file but still has a stale handled entry', async () => {
        await attachServiceWorker()

        await expect(client.whenChildTargetHandled(targetId)).resolves.toBeUndefined()

        // a late detach carrying only the session (no targetId) evicts
        // _targetSessions but leaves the stale handled entry behind
        fireCDPEvent('Target.detachedFromTarget', { sessionId })

        await drain()

        await expect(client.reenableChildTargetInterception(targetId)).rejects.toThrow()
      })

      it('rejects when no interception hook is registered', async () => {
        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: true,
          sessionId,
          targetInfo: { type: 'service_worker', targetId } as Protocol.Target.TargetInfo,
        })

        await drain()

        await expect(client.reenableChildTargetInterception(targetId)).rejects.toThrow()
      })

      it('rejects when the hook rejects, and does not mark the target handled', async () => {
        await attachServiceWorker()

        client.onChildTargetAttached = vi.fn(async () => {
          throw new Error('ProtocolError: Inspected target closed')
        })

        await expect(client.reenableChildTargetInterception(targetId)).rejects.toThrow()

        let resolved = false

        client.whenChildTargetHandled(targetId).then(() => {
          resolved = true
        })

        await drain()

        expect(resolved).toBe(false)
      })

      it('rejects once the connection has closed', async () => {
        await attachServiceWorker()

        await client.close()

        await expect(client.reenableChildTargetInterception(targetId)).rejects.toThrow()
      })

      // The exact missed-detach scenario the fresh-attach eviction (item 1)
      // exists for: a re-attach under a new session preceded the old
      // session's late detach. That late detach must only evict
      // _targetSessions if it still points at the detaching session -
      // otherwise it wipes the LIVE mapping to the new session, and a later
      // re-enable finds no session on file at all.
      it('keeps the live session mapping when a late detach arrives for a session superseded under the same targetId', async () => {
        const sessionOne = 'sw-session-1'
        const sessionTwo = 'sw-session-2'

        client.onChildTargetAttached = vi.fn(async () => {})

        // S1 attaches under targetId
        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: true,
          sessionId: sessionOne,
          targetInfo: { type: 'service_worker', targetId } as Protocol.Target.TargetInfo,
        })

        await drain()

        // S2 re-attaches under the SAME targetId before S1's own detach arrives
        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: true,
          sessionId: sessionTwo,
          targetInfo: { type: 'service_worker', targetId } as Protocol.Target.TargetInfo,
        })

        await drain()

        // S1's detach arrives late, after S2 has already taken over targetId -
        // no targetId on this event (documented deprecated, can be absent),
        // so only the session-keyed eviction branch runs
        fireCDPEvent('Target.detachedFromTarget', { sessionId: sessionOne })

        await drain()

        client.onChildTargetAttached = vi.fn(async () => {})

        await expect(client.reenableChildTargetInterception(targetId)).resolves.toBeUndefined()

        expect(client.onChildTargetAttached).toHaveBeenCalledExactlyOnceWith(sessionTwo)
      })

      // Same scenario, but the late detach DOES carry a targetId - the
      // common case in practice (Chromium still populates the deprecated
      // field). The targetId-keyed branch must not clobber the live S2
      // mapping the session-keyed branch just protected.
      it('keeps the live session mapping when a late, targetId-carrying detach arrives for a session superseded under the same targetId', async () => {
        const sessionOne = 'sw-session-1'
        const sessionTwo = 'sw-session-2'

        client.onChildTargetAttached = vi.fn(async () => {})

        // S1 attaches under targetId
        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: true,
          sessionId: sessionOne,
          targetInfo: { type: 'service_worker', targetId } as Protocol.Target.TargetInfo,
        })

        await drain()

        // S2 re-attaches under the SAME targetId before S1's own detach arrives
        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: true,
          sessionId: sessionTwo,
          targetInfo: { type: 'service_worker', targetId } as Protocol.Target.TargetInfo,
        })

        await drain()

        // S1's detach arrives late, carrying targetId this time
        fireCDPEvent('Target.detachedFromTarget', { sessionId: sessionOne, targetId })

        await drain()

        client.onChildTargetAttached = vi.fn(async () => {})

        await expect(client.reenableChildTargetInterception(targetId)).resolves.toBeUndefined()

        expect(client.onChildTargetAttached).toHaveBeenCalledExactlyOnceWith(sessionTwo)
      })

      // A detach arriving while the re-run is suspended mid-flight
      // invalidates its token the same way it would for a fresh attach or
      // crash re-arm - the resumed commit becomes a no-op rather than
      // marking a detached target handled, even though the hook itself
      // still resolved (so reenableChildTargetInterception's own promise
      // still fulfills - the caller asked for interception, and it did run).
      it('does not mark the target handled if it detaches while the re-run is in flight', async () => {
        await attachServiceWorker()

        const reEnabled = Promise.withResolvers<void>()

        client.onChildTargetAttached = vi.fn(() => reEnabled.promise)

        const reenabled = client.reenableChildTargetInterception(targetId)

        fireCDPEvent('Target.detachedFromTarget', { sessionId, targetId })

        await drain()

        reEnabled.resolve()

        await expect(reenabled).resolves.toBeUndefined()

        let resolved = false

        client.whenChildTargetHandled(targetId).then(() => {
          resolved = true
        })

        await drain()

        expect(resolved).toBe(false)
      })
    })

    describe('Inspector.targetReloadedAfterCrash (#34674 crash-and-reload re-arm)', () => {
      const targetId = 'target-id'
      const sessionId = 'sw-session'
      let client: CriClientInstance

      const drain = () => new Promise((resolve) => setImmediate(resolve))

      beforeEach(async () => {
        client = await getClient({ host: HOST, fullyManageTabs: true })
        criStub.send.mockResolvedValue(undefined)
      })

      const attachServiceWorker = async () => {
        client.onChildTargetAttached = vi.fn(async () => {})

        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: true,
          sessionId,
          targetInfo: { type: 'service_worker', targetId } as Protocol.Target.TargetInfo,
        })

        await drain()
      }

      it('re-invokes the hook for a known service worker session, without releasing the debugger itself', async () => {
        await attachServiceWorker()

        await expect(client.whenChildTargetHandled(targetId)).resolves.toBeUndefined()

        client.onChildTargetAttached = vi.fn(async () => {})
        criStub.send.mockClear()

        fireCDPEvent('Inspector.targetReloadedAfterCrash', {}, sessionId)

        await drain()

        expect(client.onChildTargetAttached).toHaveBeenCalledExactlyOnceWith(sessionId)

        // releasing a crash-reloaded target from here is the browser
        // connection's job, not this one's
        expectNotCalledWith(criStub.send, 'Runtime.runIfWaitingForDebugger', undefined, sessionId)
      })

      it('resolves a whenChildTargetHandled promise obtained after the crash event only once the re-run resolves', async () => {
        await attachServiceWorker()

        const reEnabled = Promise.withResolvers<void>()

        client.onChildTargetAttached = vi.fn(() => reEnabled.promise)

        fireCDPEvent('Inspector.targetReloadedAfterCrash', {}, sessionId)

        let resolved = false

        client.whenChildTargetHandled(targetId).then(() => {
          resolved = true
        })

        await drain()

        expect(resolved).toBe(false)

        reEnabled.resolve()
        await drain()

        expect(resolved).toBe(true)
      })

      it('leaves the target unhandled when the re-run hook rejects', async () => {
        await attachServiceWorker()

        const reEnabled = Promise.withResolvers<void>()

        client.onChildTargetAttached = vi.fn(() => reEnabled.promise)

        fireCDPEvent('Inspector.targetReloadedAfterCrash', {}, sessionId)

        let resolved = false

        client.whenChildTargetHandled(targetId).then(() => {
          resolved = true
        })

        reEnabled.reject(new Error('ProtocolError: Inspected target closed'))
        await drain()

        expect(resolved).toBe(false)
      })

      it('does nothing for an unknown session', async () => {
        client.onChildTargetAttached = vi.fn(async () => {})

        fireCDPEvent('Inspector.targetReloadedAfterCrash', {}, 'unknown-session')

        await drain()

        expect(client.onChildTargetAttached).not.toHaveBeenCalled()
      })

      // Target.detachedFromTarget always carries a sessionId, even on the
      // (documented deprecated but still occasionally missing) events that
      // omit targetId - a stale _sessionTargets entry surviving such a
      // detach would let a later crash-reload on the reused session id
      // re-invoke the hook for a target that already detached.
      it('evicts the session mapping from a detach event that carries a sessionId but no targetId', async () => {
        await attachServiceWorker()

        fireCDPEvent('Target.detachedFromTarget', { sessionId })

        await drain()

        client.onChildTargetAttached = vi.fn(async () => {})

        fireCDPEvent('Inspector.targetReloadedAfterCrash', {}, sessionId)

        await drain()

        expect(client.onChildTargetAttached).not.toHaveBeenCalled()
      })
    })

    describe('#send', () => {
      it('calls cri.send with command and data', async () => {
        send.mockResolvedValue(undefined)
        const client = await getClient()

        client.send('DOM.getDocument', { depth: -1 })
        expectCalledWith(send, 'DOM.getDocument', { depth: -1 })
      })

      it('rejects if cri.send rejects', async () => {
        const err = new Error()

        send.mockRejectedValue(err)
        const client = await getClient()

        await expect(client.send('DOM.getDocument', { depth: -1 })).rejects.toBe(err)
      })

      it('rejects if target has crashed', async () => {
        const command = 'DOM.getDocument'
        const client = await getClient({ host: '127.0.0.1', fullyManageTabs: true })

        fireCDPEvent('Target.targetCrashed', { targetId: DEBUGGER_URL })

        await expect(client.send(command, { depth: -1 })).rejects.toThrow(`${command} will not run as the target browser or tab CRI connection has crashed`)
      })

      it('does not reject if attachToTarget work throws', async () => {
        criStub.send.mockImplementation((command: string) => {
          if (command === 'Network.enable') {
            throw new Error('ProtocolError: Inspected target navigated or closed')
          }

          return Promise.resolve()
        })

        await getClient({ host: '127.0.0.1', fullyManageTabs: true })

        // This would throw if the error was not caught
        await fireCDPEvent('Target.attachedToTarget', { targetInfo: { type: 'worker', targetId: DEBUGGER_URL, title: '', url: 'https://some_url', attached: true, canAccessOpener: true } })
      })

      describe('retries', () => {
        ([
          'WebSocket is not open',
          // @see https://github.com/cypress-io/cypress/issues/7180
          'WebSocket is already in CLOSING or CLOSED state',
          'WebSocket connection closed',
        ]).forEach((msg) => {
          it(`with one '${msg}' message it retries once`, async () => {
            const err = new Error(msg)

            send.mockRejectedValueOnce(err)
            send.mockResolvedValueOnce(undefined)

            const client = await getClient()

            const p = client.send('DOM.getDocument', { depth: -1 })

            await fireDisconnect()
            await p
            expect(send).toHaveBeenCalledTimes(2)
          })

          it(`with two '${msg}' message it retries twice`, async () => {
            const err = new Error(msg)

            send.mockRejectedValueOnce(err)
            send.mockRejectedValueOnce(err)
            send.mockResolvedValueOnce(undefined)

            const client = await getClient()

            const getDocumentPromise = client.send('DOM.getDocument', { depth: -1 })

            await fireDisconnect()
            await fireDisconnect()
            await getDocumentPromise
            expect(send).toHaveBeenCalledTimes(3)
          })

          it(`with two '${msg}' message it retries enablements twice`, async () => {
            const err = new Error(msg)

            send.mockRejectedValueOnce(err)
            send.mockRejectedValueOnce(err)
            send.mockResolvedValueOnce(undefined)

            const client = await getClient()

            const enableNetworkPromise = client.send('Network.enable')

            await fireDisconnect()
            await fireDisconnect()
            await enableNetworkPromise
            expect(send).toHaveBeenCalledTimes(3)
          })
        })
      })

      describe('closed', () => {
        it(`when socket is closed mid send'`, async () => {
          const err = new Error('WebSocket is not open: readyState 3 (CLOSED)')

          send.mockRejectedValueOnce(err)

          const client = await getClient()

          await client.close()

          await expect(client.send('DOM.getDocument', { depth: -1 })).rejects.toThrow('DOM.getDocument will not run as the CRI connection to Target')
        })

        it(`when socket is closed mid send ('WebSocket connection closed' variant)`, async () => {
          const err = new Error('WebSocket connection closed')

          send.mockRejectedValueOnce(err)
          const client = await getClient()

          await client.close()

          await expect(client.send('DOM.getDocument', { depth: -1 })).rejects.toThrow('DOM.getDocument will not run as the CRI connection to Target')
        })
      })

      describe('when reconnection is disabled (cypress-in-cypress)', () => {
        beforeEach(() => {
          process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF = 'true'
        })

        afterEach(() => {
          delete process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF
        })

        it('rejects an enqueued command when the socket terminally disconnects', async () => {
          const client = await getClient()

          // a send that fails like a closed socket gets enqueued to await a reconnect
          send.mockRejectedValueOnce(new Error('WebSocket is not open: readyState 3 (CLOSED)'))

          const pending = client.send('Fetch.disable')

          // let the failed send settle into the queue before disconnecting
          await new Promise((resolve) => setImmediate(resolve))

          // with reconnection disabled, this disconnect is terminal - no reconnect will ever flush the queue
          await fireDisconnect()

          await expect(pending).rejects.toThrow('The CRI connection to Target')
        })

        it('rejects sends after the socket has terminally disconnected instead of enqueuing them', async () => {
          const client = await getClient()

          await fireDisconnect()

          await expect(client.send('Fetch.disable')).rejects.toThrow('Fetch.disable will not run as the CRI connection to Target')
        })

        it('marks the client closed once a terminal disconnect has already happened', async () => {
          const client = await getClient()

          await fireDisconnect()

          await expect(client.close()).resolves.toBeUndefined()
          expect(client.closed).toBe(true)
        })
      })
    })
  })

  describe('#off', () => {
    const noop = () => {}

    it('removes the subscription', async () => {
      const client = await getClient()

      client.on('Page.loadEventFired', noop)
      client.off('Page.loadEventFired', noop)

      expect(client.queue.subscriptions).toHaveLength(0)
    })

    it('leaves other subscriptions in place when the callback was never registered', async () => {
      const client = await getClient()

      client.on('Network.requestWillBeSent', noop)

      // resetBrowserTargets replays every page subscription against the browser
      // client, which only holds the Network.* ones - the rest must be no-ops
      client.off('Page.loadEventFired', noop)
      client.off('Page.frameAttached', () => {})

      expect(client.queue.subscriptions).toHaveLength(1)
      expect(client.queue.subscriptions[0].eventName).toBe('Network.requestWillBeSent')
    })
  })

  describe('#removeSessionEnablements', () => {
    it('drops only the detached session\'s enablements', async () => {
      const client = await getClient()

      await client.send('Network.enable', undefined, 'session-1')
      await client.send('Runtime.addBinding', { name: 'binding' }, 'session-1')
      await client.send('Network.enable', undefined, 'session-2')
      await client.send('Target.setDiscoverTargets', { discover: true })

      client.removeSessionEnablements('session-1')

      expect(client.queue.enableCommands).toEqual([
        { command: 'Network.enable', sessionId: 'session-2' },
        { command: 'Target.setDiscoverTargets', params: { discover: true } },
      ])
    })

    it('leaves the browser-level enablements alone when given no session', async () => {
      const client = await getClient()

      await client.send('Target.setDiscoverTargets', { discover: true })

      client.removeSessionEnablements(undefined as any)

      expect(client.queue.enableCommands).toHaveLength(1)
    })
  })

  describe('clone', () => {
    it('returns a new CriClient with the same options', async () => {
      const client = await getClient()

      const cloned = await client.clone()

      expect(cloned['targetId']).toBe(client['targetId'])
      expect(cloned['onAsynchronousError']).toBe(client['onAsynchronousError'])
      expect(cloned['host']).toBe(client['host'])
      expect(cloned['port']).toBe(client['port'])
      expect(cloned['protocolManager']).toBe(client['protocolManager'])
      expect(cloned['fullyManageTabs']).toBe(client['fullyManageTabs'])
      expect(cloned['browserClient']).toBe(client['browserClient'])
    })
  })

  describe('on reconnect', () => {
    it('resends *.enable commands and notifies protocol manager', async () => {
      criStub._notifier.on = vi.fn() as typeof criStub._notifier.on

      const protocolManager = {
        cdpReconnect: vi.fn(),
      } as unknown as ProtocolManagerShape

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
      criStub.send.mockReset()

      await fireDisconnect()

      const reconnection = Promise.withResolvers<void>()

      onReconnect.mockImplementation(() => reconnection.resolve())
      await reconnection.promise

      expect(criStub.send).toHaveBeenCalledTimes(2)
      expectCalledWith(criStub.send, 'Page.enable')
      expectCalledWith(criStub.send, 'Network.enable')
      expect(protocolManager.cdpReconnect).toHaveBeenCalled()

      await fireDisconnect()
    })

    it('does not resend a domain that was disabled', async () => {
      const client = await getClient()

      client.send('Page.enable')
      client.send('Fetch.enable')
      client.send('Fetch.disable')

      // clear out previous calls before reconnect
      criStub.send.mockReset()

      await fireDisconnect()

      const reconnection = Promise.withResolvers<void>()

      onReconnect.mockImplementation(() => reconnection.resolve())
      await reconnection.promise

      expect(criStub.send).toHaveBeenCalledTimes(1)
      expectCalledWith(criStub.send, 'Page.enable')
      expectNotCalledWith(criStub.send, 'Fetch.enable')

      await fireDisconnect()
    })

    it('prunes disabled domains per session', async () => {
      const client = await getClient()

      client.send('Fetch.enable', undefined, 'session-a')
      client.send('Fetch.enable', undefined, 'session-b')
      client.send('Fetch.disable', undefined, 'session-a')

      // clear out previous calls before reconnect
      criStub.send.mockReset()

      await fireDisconnect()

      const reconnection = Promise.withResolvers<void>()

      onReconnect.mockImplementation(() => reconnection.resolve())
      await reconnection.promise

      expect(criStub.send).toHaveBeenCalledTimes(1)
      expectCalledWith(criStub.send, 'Fetch.enable', undefined, 'session-b')
      expectNotCalledWith(criStub.send, 'Fetch.enable', undefined, 'session-a')

      await fireDisconnect()
    })

    // A crash-reload re-arm (#34674) re-sends Fetch.enable for a session
    // that was already enabled once; without deduping, every re-arm over a
    // connection's lifetime adds another entry that's replayed on every
    // future reconnect.
    it('replaces rather than duplicates an existing enable command for the same command + session', async () => {
      const client = await getClient()

      client.send('Fetch.enable', undefined, 'session-a')
      client.send('Fetch.enable', undefined, 'session-a')

      // clear out previous calls before reconnect
      criStub.send.mockReset()

      await fireDisconnect()

      const reconnection = Promise.withResolvers<void>()

      onReconnect.mockImplementation(() => reconnection.resolve())
      await reconnection.promise

      expect(criStub.send).toHaveBeenCalledTimes(1)
      expectCalledWith(criStub.send, 'Fetch.enable', undefined, 'session-a')

      await fireDisconnect()
    })

    // Runtime.addBinding is sent multiple times with DIFFERENT names and no
    // sessionId (utils.ts registers 'cypressUtilityBinding'; cdp-socket.ts
    // registers a distinct `cypressSendToServer-${namespace}` binding per
    // namespace) - deduping on (command, sessionId) alone would collapse
    // these into one, silently dropping the others on reconnect.
    it('replays multiple Runtime.addBinding registrations with different params, not just the last one', async () => {
      const client = await getClient()

      client.send('Runtime.addBinding', { name: 'a' })
      client.send('Runtime.addBinding', { name: 'b' })

      // clear out previous calls before reconnect
      criStub.send.mockReset()

      await fireDisconnect()

      const reconnection = Promise.withResolvers<void>()

      onReconnect.mockImplementation(() => reconnection.resolve())
      await reconnection.promise

      expect(criStub.send).toHaveBeenCalledTimes(2)
      expectCalledWith(criStub.send, 'Runtime.addBinding', { name: 'a' })
      expectCalledWith(criStub.send, 'Runtime.addBinding', { name: 'b' })

      await fireDisconnect()
    })

    // JSON.stringify's ARRAY-replacer form (Object.keys(p).sort()) acts as a
    // key allowlist at every nesting level, not just the top one - a nested
    // pattern object's own keys (requestStage) aren't in that top-level
    // allowlist, so they'd be stripped entirely and two different pattern
    // sets of the same shape would serialize identically and collide.
    it('replays two Fetch.enable sends with different nested pattern params, not just the last one', async () => {
      const client = await getClient()

      client.send('Fetch.enable', { patterns: [{ requestStage: 'Request' }] }, 'session-a')
      client.send('Fetch.enable', { patterns: [{ requestStage: 'Response' }] }, 'session-a')

      // clear out previous calls before reconnect
      criStub.send.mockReset()

      await fireDisconnect()

      const reconnection = Promise.withResolvers<void>()

      onReconnect.mockImplementation(() => reconnection.resolve())
      await reconnection.promise

      expect(criStub.send).toHaveBeenCalledTimes(2)
      expectCalledWith(criStub.send, 'Fetch.enable', { patterns: [{ requestStage: 'Request' }] }, 'session-a')
      expectCalledWith(criStub.send, 'Fetch.enable', { patterns: [{ requestStage: 'Response' }] }, 'session-a')

      await fireDisconnect()
    })

    // JSON.stringify throws on a circular reference (or a BigInt) - params
    // built from live CDP objects aren't guaranteed serializable, and a send()
    // that throws here would break every caller, not just the dedupe logic.
    it('does not throw when params are not JSON-serializable', async () => {
      const client = await getClient()
      const circular: any = { name: 'a' }

      circular.self = circular

      expect(() => client.send('Runtime.addBinding', circular)).not.toThrow()
    })

    it('errors if reconnecting fails', async () => {
      await getClient()

      cdp.criImport.mockRejectedValue(new Error())

      await fireDisconnect()

      await (new Promise((resolve) => setImmediate(resolve)))

      expect(onError).toHaveBeenCalled()

      const error = onError.mock.calls[onError.mock.calls.length - 1][0]

      expect(error.messageMarkdown).toBe('There was an error reconnecting to the Chrome DevTools protocol. Please restart the browser.')
      expect(error.isFatalApiErr).toBe(true)
    })

    it('rejects previously enqueued commands when reconnection exhausts its retries and gives up', async () => {
      send.mockRejectedValueOnce(new Error('WebSocket is not open: readyState 3 (CLOSED)'))

      const client = await getClient()

      const pending = client.send('DOM.getDocument', { depth: -1 })

      // let the failed send settle into the queue before reconnection starts failing
      await new Promise((resolve) => setImmediate(resolve))

      cdp.criImport.mockRejectedValue(new Error())

      await fireDisconnect()

      await expect(pending).rejects.toThrow('The CRI connection to Target')
    })
  })
})
