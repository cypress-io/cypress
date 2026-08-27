import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping'
import EventEmitter from 'events'
import { ProtocolManagerShape } from '@packages/types'
import type { CriClient } from '../../../lib/browsers/cdp-protocol/cri-client'
import type Protocol from 'devtools-protocol'
import { fireDisconnect as fireDisconnectListeners } from '../../support/helpers/cdp-disconnect'
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

  // wraps the shared helper over the current criStub
  const fireDisconnect = () => fireDisconnectListeners(criStub.on, criStub.off)

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

    const CDPConnectionRef = proxyquire('../lib/browsers/cdp-protocol/cdp-connection', {
      'chrome-remote-interface': criImport,
    }).CDPConnection

    const { CriClient } = proxyquire('../lib/browsers/cdp-protocol/cri-client', {
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

      describe('target type is service worker, page, or other', () => {
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

    describe('when a child target (service worker / out-of-process iframe) attaches', () => {
      const sessionId = 'sw-session'
      let client: CriClient

      // drains the async attach handler, which fireCDPEvent invokes without
      // awaiting
      const drain = () => new Promise((resolve) => setImmediate(resolve))

      beforeEach(async () => {
        client = await getClient({ host: HOST, fullyManageTabs: true })
        criStub.send.resolves()
      })

      it('enables interception on the session before releasing the debugger', async () => {
        const enabled = Promise.withResolvers<void>()

        client.onChildTargetAttached = sinon.stub().returns(enabled.promise)

        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: true,
          sessionId,
          targetInfo: { type: 'service_worker' } as Protocol.Target.TargetInfo,
        })

        await drain()

        expect(client.onChildTargetAttached).to.have.been.calledOnceWith(sessionId)

        // a worker released before its session is intercepted fetches its own
        // script straight off the network, bypassing the middleware onion
        expect(criStub.send).not.to.have.been.calledWith('Runtime.runIfWaitingForDebugger')

        enabled.resolve()
        await drain()

        expect(criStub.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, sessionId)
      })

      it('enables interception on origin-isolated iframe sessions before releasing the debugger', async () => {
        // an out-of-process iframe's (OOPIF) subresources are fetched on its
        // own session (e.g. an https spec-bridge iframe on an origin-keyed
        // google origin); released uninstrumented, its runner bundle request
        // escapes to the real origin
        const enabled = Promise.withResolvers<void>()

        client.onChildTargetAttached = sinon.stub().returns(enabled.promise)

        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: true,
          sessionId,
          targetInfo: { type: 'iframe' } as Protocol.Target.TargetInfo,
        })

        await drain()

        expect(client.onChildTargetAttached).to.have.been.calledOnceWith(sessionId)
        expect(criStub.send).not.to.have.been.calledWith('Runtime.runIfWaitingForDebugger')

        enabled.resolve()
        await drain()

        expect(criStub.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, sessionId)
      })

      it('does not enable interception for other target types', async () => {
        client.onChildTargetAttached = sinon.stub().resolves()

        await Promise.all(['page', 'other'].map((type) => {
          return fireCDPEvent('Target.attachedToTarget', {
            waitingForDebugger: true,
            sessionId,
            targetInfo: { type } as Protocol.Target.TargetInfo,
          })
        }))

        await drain()

        expect(client.onChildTargetAttached).not.to.have.been.called
      })

      it('releases the debugger even when enabling interception fails', async () => {
        client.onChildTargetAttached = sinon.stub().rejects(new Error('ProtocolError: Inspected target closed'))

        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: true,
          sessionId,
          targetInfo: { type: 'service_worker' } as Protocol.Target.TargetInfo,
        })

        await drain()

        // losing interception on one worker must not strand the target paused
        expect(criStub.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, sessionId)
      })

      it('releases the debugger when no interception hook is registered', async () => {
        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: true,
          sessionId,
          targetInfo: { type: 'service_worker' } as Protocol.Target.TargetInfo,
        })

        await drain()

        expect(criStub.send).to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, sessionId)
      })
    })

    describe('#whenChildTargetHandled', () => {
      const targetId = 'target-id'
      const sessionId = 'sw-session'
      let client: CriClient

      const drain = () => new Promise((resolve) => setImmediate(resolve))

      beforeEach(async () => {
        client = await getClient({ host: HOST, fullyManageTabs: true })
        criStub.send.resolves()
      })

      it('resolves a waiter registered before the target attaches', async () => {
        let resolved = false

        client.whenChildTargetHandled(targetId).then(() => {
          resolved = true
        })

        await drain()
        expect(resolved).to.be.false

        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: false,
          targetInfo: { type: 'page', targetId } as Protocol.Target.TargetInfo,
        })

        await drain()

        expect(resolved).to.be.true
      })

      it('resolves immediately for a target that already finished attaching', async () => {
        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: false,
          targetInfo: { type: 'page', targetId } as Protocol.Target.TargetInfo,
        })

        await drain()

        await expect(client.whenChildTargetHandled(targetId)).to.be.fulfilled
      })

      it('resolves pending waiters when the client closes, rather than leaving them hanging on a dead connection', async () => {
        let resolved = false

        client.whenChildTargetHandled('never-attaches').then(() => {
          resolved = true
        })

        await client.close()

        expect(resolved).to.be.true
      })

      // Order-proof against a deferred onChildTargetAttached hook, same style
      // as the "enables interception ... before releasing the debugger" test
      // above: completion must not be observable until the hook (and the
      // Fetch enable it runs) has actually finished.
      it('resolves only after the onChildTargetAttached hook completes', async () => {
        const enabled = Promise.withResolvers<void>()
        let resolved = false

        client.onChildTargetAttached = sinon.stub().returns(enabled.promise)

        client.whenChildTargetHandled(targetId).then(() => {
          resolved = true
        })

        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: true,
          sessionId,
          targetInfo: { type: 'service_worker', targetId } as Protocol.Target.TargetInfo,
        })

        await drain()

        expect(resolved).to.be.false

        enabled.resolve()
        await drain()

        expect(resolved).to.be.true
      })

      // "Handled" must mean interception is actually on, not merely that the
      // hook ran: a worker whose session-scoped Fetch.enable failed must not
      // be reported confirmed to a sibling connection deciding whether to
      // release it (#34674 hold).
      it('does not resolve when the onChildTargetAttached hook rejects', async () => {
        const enabled = Promise.withResolvers<void>()
        let resolved = false

        client.onChildTargetAttached = sinon.stub().returns(enabled.promise)

        client.whenChildTargetHandled(targetId).then(() => {
          resolved = true
        })

        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: true,
          sessionId,
          targetInfo: { type: 'service_worker', targetId } as Protocol.Target.TargetInfo,
        })

        await drain()

        expect(resolved).to.be.false

        enabled.reject(new Error('ProtocolError: Inspected target closed'))
        await drain()

        expect(resolved).to.be.false

        // still released via close(), same as any other stranded waiter
        await client.close()

        expect(resolved).to.be.true
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

        expect(resolved).to.be.true
      })

      it('resolves immediately for a waiter registered after the client has already closed', async () => {
        await client.close()

        await expect(client.whenChildTargetHandled('anything')).to.be.fulfilled
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

        expect(client.closed).to.be.false

        await expect(client.whenChildTargetHandled(targetId)).to.be.fulfilled
      })

      it('resolves a waiter already registered when the connection terminally disconnects', async () => {
        const client = await getClient()
        let resolved = false

        client.whenChildTargetHandled(targetId).then(() => {
          resolved = true
        })

        await fireDisconnect()

        expect(resolved).to.be.true
      })
    })

    describe('eviction on detach/destroy (#34674 service worker restarts)', () => {
      const targetId = 'target-id'
      const sessionId = 'sw-session'
      let client: CriClient

      const drain = () => new Promise((resolve) => setImmediate(resolve))

      beforeEach(async () => {
        client = await getClient({ host: HOST, fullyManageTabs: true })
        criStub.send.resolves()
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

        await expect(client.whenChildTargetHandled(targetId)).to.be.fulfilled

        fireCDPEvent('Target.detachedFromTarget', { sessionId, targetId })

        await drain()

        const enabled = Promise.withResolvers<void>()
        let resolved = false

        client.onChildTargetAttached = sinon.stub().returns(enabled.promise)

        client.whenChildTargetHandled(targetId).then(() => {
          resolved = true
        })

        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: true,
          sessionId,
          targetInfo: { type: 'service_worker', targetId } as Protocol.Target.TargetInfo,
        })

        await drain()

        expect(resolved).to.be.false

        enabled.resolve()
        await drain()

        expect(resolved).to.be.true
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

        expect(resolved).to.be.false
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

        expect(resolved).to.be.false
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

        client.onChildTargetAttached = sinon.stub().returns(enabled.promise)

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

        expect(resolved).to.be.false
      })

      it('resolves a pending waiter promptly when its target detaches', async () => {
        let resolved = false

        client.whenChildTargetHandled(targetId).then(() => {
          resolved = true
        })

        await drain()
        expect(resolved).to.be.false

        fireCDPEvent('Target.detachedFromTarget', { sessionId, targetId })

        await drain()

        expect(resolved).to.be.true
      })
    })

    // The browser connection's crash handler and this connection's own
    // Inspector.targetReloadedAfterCrash handler race on independent
    // websockets - nothing orders which one the browser sees first. Without
    // this, the browser connection's hold can read a stale "handled" entry
    // this connection hasn't evicted yet and release the worker on a false
    // confirmation (#34674). invalidateChildTargetHandled lets the browser
    // connection invalidate deterministically before it holds, rather than
    // depending on this connection's own crash-reload handler winning the race.
    describe('#invalidateChildTargetHandled', () => {
      const targetId = 'target-id'
      let client: CriClient

      const drain = () => new Promise((resolve) => setImmediate(resolve))

      beforeEach(async () => {
        client = await getClient({ host: HOST, fullyManageTabs: true })
        criStub.send.resolves()
      })

      it('removes a confirmed target from the handled set, so a fresh whenChildTargetHandled call waits again', async () => {
        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: false,
          targetInfo: { type: 'page', targetId } as Protocol.Target.TargetInfo,
        })

        await drain()

        await expect(client.whenChildTargetHandled(targetId)).to.be.fulfilled

        client.invalidateChildTargetHandled(targetId)

        let resolved = false

        client.whenChildTargetHandled(targetId).then(() => {
          resolved = true
        })

        await drain()

        expect(resolved).to.be.false
      })

      it('does not resolve or evict an already-registered waiter', async () => {
        let resolved = false

        client.whenChildTargetHandled(targetId).then(() => {
          resolved = true
        })

        client.invalidateChildTargetHandled(targetId)

        await drain()

        expect(resolved).to.be.false

        // the pre-registered waiter is still intact - a subsequent commit
        // for the same targetId resolves it, same as if invalidate had
        // never been called
        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: false,
          targetInfo: { type: 'page', targetId } as Protocol.Target.TargetInfo,
        })

        await drain()

        expect(resolved).to.be.true
      })

      it('is a no-op for a target that was never handled', () => {
        expect(() => client.invalidateChildTargetHandled(targetId)).not.to.throw()
      })
    })

    describe('Inspector.targetReloadedAfterCrash (#34674 crash-and-reload re-arm)', () => {
      const targetId = 'target-id'
      const sessionId = 'sw-session'
      let client: CriClient

      const drain = () => new Promise((resolve) => setImmediate(resolve))

      beforeEach(async () => {
        client = await getClient({ host: HOST, fullyManageTabs: true })
        criStub.send.resolves()
      })

      const attachServiceWorker = async () => {
        client.onChildTargetAttached = sinon.stub().resolves()

        fireCDPEvent('Target.attachedToTarget', {
          waitingForDebugger: true,
          sessionId,
          targetInfo: { type: 'service_worker', targetId } as Protocol.Target.TargetInfo,
        })

        await drain()
      }

      it('re-invokes the hook for a known service worker session, without releasing the debugger itself', async () => {
        await attachServiceWorker()

        await expect(client.whenChildTargetHandled(targetId)).to.be.fulfilled

        client.onChildTargetAttached = sinon.stub().resolves()
        criStub.send.resetHistory()

        fireCDPEvent('Inspector.targetReloadedAfterCrash', {}, sessionId)

        await drain()

        expect(client.onChildTargetAttached).to.have.been.calledOnceWith(sessionId)

        // releasing a crash-reloaded target from here is the browser
        // connection's job, not this one's
        expect(criStub.send).not.to.have.been.calledWith('Runtime.runIfWaitingForDebugger', undefined, sessionId)
      })

      it('resolves a whenChildTargetHandled promise obtained after the crash event only once the re-run resolves', async () => {
        await attachServiceWorker()

        const reEnabled = Promise.withResolvers<void>()

        client.onChildTargetAttached = sinon.stub().returns(reEnabled.promise)

        fireCDPEvent('Inspector.targetReloadedAfterCrash', {}, sessionId)

        let resolved = false

        client.whenChildTargetHandled(targetId).then(() => {
          resolved = true
        })

        await drain()

        expect(resolved).to.be.false

        reEnabled.resolve()
        await drain()

        expect(resolved).to.be.true
      })

      it('leaves the target unhandled when the re-run hook rejects', async () => {
        await attachServiceWorker()

        const reEnabled = Promise.withResolvers<void>()

        client.onChildTargetAttached = sinon.stub().returns(reEnabled.promise)

        fireCDPEvent('Inspector.targetReloadedAfterCrash', {}, sessionId)

        let resolved = false

        client.whenChildTargetHandled(targetId).then(() => {
          resolved = true
        })

        reEnabled.reject(new Error('ProtocolError: Inspected target closed'))
        await drain()

        expect(resolved).to.be.false
      })

      it('does nothing for an unknown session', async () => {
        client.onChildTargetAttached = sinon.stub().resolves()

        fireCDPEvent('Inspector.targetReloadedAfterCrash', {}, 'unknown-session')

        await drain()

        expect(client.onChildTargetAttached).not.to.have.been.called
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

        client.onChildTargetAttached = sinon.stub().resolves()

        fireCDPEvent('Inspector.targetReloadedAfterCrash', {}, sessionId)

        await drain()

        expect(client.onChildTargetAttached).not.to.have.been.called
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

            await fireDisconnect()
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

            await fireDisconnect()
            await fireDisconnect()
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

            await fireDisconnect()
            await fireDisconnect()
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

          await expect(client.send('DOM.getDocument', { depth: -1 })).to.be.rejectedWith('DOM.getDocument will not run as the CRI connection to Target')
        })

        it(`when socket is closed mid send ('WebSocket connection closed' variant)`, async function () {
          const err = new Error('WebSocket connection closed')

          send.onFirstCall().rejects(err)
          const client = await getClient()

          await client.close()

          await expect(client.send('DOM.getDocument', { depth: -1 })).to.be.rejectedWith('DOM.getDocument will not run as the CRI connection to Target')
        })
      })

      context('when reconnection is disabled (cypress-in-cypress)', () => {
        beforeEach(() => {
          process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF = 'true'
        })

        afterEach(() => {
          delete process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF
        })

        it('rejects an enqueued command when the socket terminally disconnects', async function () {
          const client = await getClient()

          // a send that fails like a closed socket gets enqueued to await a reconnect
          send.onFirstCall().rejects(new Error('WebSocket is not open: readyState 3 (CLOSED)'))

          const pending = client.send('Fetch.disable')

          // let the failed send settle into the queue before disconnecting
          await new Promise((resolve) => setImmediate(resolve))

          // with reconnection disabled, this disconnect is terminal - no reconnect will ever flush the queue
          await fireDisconnect()

          await expect(pending).to.be.rejectedWith('The CRI connection to Target')
        })

        it('rejects sends after the socket has terminally disconnected instead of enqueuing them', async function () {
          const client = await getClient()

          await fireDisconnect()

          await expect(client.send('Fetch.disable')).to.be.rejectedWith('Fetch.disable will not run as the CRI connection to Target')
        })

        it('marks the client closed once a terminal disconnect has already happened', async function () {
          const client = await getClient()

          await fireDisconnect()

          await expect(client.close()).to.be.fulfilled
          expect(client.closed).to.be.true
        })
      })
    })
  })

  context('clone', () => {
    it('returns a new CriClient with the same options', async () => {
      const client = await getClient()

      const cloned = await client.clone()

      expect(cloned['targetId']).to.equal(client['targetId'])
      expect(cloned['onAsynchronousError']).to.equal(client['onAsynchronousError'])
      expect(cloned['host']).to.equal(client['host'])
      expect(cloned['port']).to.equal(client['port'])
      expect(cloned['protocolManager']).to.equal(client['protocolManager'])
      expect(cloned['fullyManageTabs']).to.equal(client['fullyManageTabs'])
      expect(cloned['browserClient']).to.equal(client['browserClient'])
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

      await fireDisconnect()

      const reconnection = Promise.withResolvers()

      onReconnect.callsFake(() => reconnection.resolve())
      await reconnection.promise

      expect(criStub.send).to.be.calledTwice
      expect(criStub.send).to.be.calledWith('Page.enable')
      expect(criStub.send).to.be.calledWith('Network.enable')
      expect(protocolManager.cdpReconnect).to.be.called

      await fireDisconnect()
    })

    it('does not resend a domain that was disabled', async () => {
      const client = await getClient()

      client.send('Page.enable')
      client.send('Fetch.enable')
      client.send('Fetch.disable')

      // clear out previous calls before reconnect
      criStub.send.reset()

      await fireDisconnect()

      const reconnection = Promise.withResolvers()

      onReconnect.callsFake(() => reconnection.resolve())
      await reconnection.promise

      expect(criStub.send).to.be.calledOnce
      expect(criStub.send).to.be.calledWith('Page.enable')
      expect(criStub.send).not.to.be.calledWith('Fetch.enable')

      await fireDisconnect()
    })

    it('prunes disabled domains per session', async () => {
      const client = await getClient()

      client.send('Fetch.enable', undefined, 'session-a')
      client.send('Fetch.enable', undefined, 'session-b')
      client.send('Fetch.disable', undefined, 'session-a')

      // clear out previous calls before reconnect
      criStub.send.reset()

      await fireDisconnect()

      const reconnection = Promise.withResolvers()

      onReconnect.callsFake(() => reconnection.resolve())
      await reconnection.promise

      expect(criStub.send).to.be.calledOnce
      expect(criStub.send).to.be.calledWith('Fetch.enable', undefined, 'session-b')
      expect(criStub.send).not.to.be.calledWith('Fetch.enable', undefined, 'session-a')

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
      criStub.send.reset()

      await fireDisconnect()

      const reconnection = Promise.withResolvers()

      onReconnect.callsFake(() => reconnection.resolve())
      await reconnection.promise

      expect(criStub.send).to.be.calledOnce
      expect(criStub.send).to.be.calledWith('Fetch.enable', undefined, 'session-a')

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
      criStub.send.reset()

      await fireDisconnect()

      const reconnection = Promise.withResolvers()

      onReconnect.callsFake(() => reconnection.resolve())
      await reconnection.promise

      expect(criStub.send).to.be.calledTwice
      expect(criStub.send).to.be.calledWith('Runtime.addBinding', { name: 'a' })
      expect(criStub.send).to.be.calledWith('Runtime.addBinding', { name: 'b' })

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
      criStub.send.reset()

      await fireDisconnect()

      const reconnection = Promise.withResolvers()

      onReconnect.callsFake(() => reconnection.resolve())
      await reconnection.promise

      expect(criStub.send).to.be.calledTwice
      expect(criStub.send).to.be.calledWith('Fetch.enable', { patterns: [{ requestStage: 'Request' }] }, 'session-a')
      expect(criStub.send).to.be.calledWith('Fetch.enable', { patterns: [{ requestStage: 'Response' }] }, 'session-a')

      await fireDisconnect()
    })

    it('errors if reconnecting fails', async () => {
      await getClient()

      criImport.rejects()

      await fireDisconnect()

      await (new Promise((resolve) => setImmediate(resolve)))

      expect(onError).to.be.called

      const error = onError.lastCall.args[0]

      expect(error.messageMarkdown).to.equal('There was an error reconnecting to the Chrome DevTools protocol. Please restart the browser.')
      expect(error.isFatalApiErr).to.be.true
    })

    it('rejects previously enqueued commands when reconnection exhausts its retries and gives up', async () => {
      send.onFirstCall().rejects(new Error('WebSocket is not open: readyState 3 (CLOSED)'))

      const client = await getClient()

      const pending = client.send('DOM.getDocument', { depth: -1 })

      // let the failed send settle into the queue before reconnection starts failing
      await new Promise((resolve) => setImmediate(resolve))

      criImport.rejects()

      await fireDisconnect()

      await expect(pending).to.be.rejectedWith('The CRI connection to Target')
    })
  })
})
