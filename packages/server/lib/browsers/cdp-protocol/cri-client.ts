import debugModule from 'debug'
import { CDPCommandQueue } from './cdp-command-queue'
import { CDPConnection, CDPListener } from './cdp-connection'
import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping'
import type { Protocol } from 'devtools-protocol'
import type WebSocket from 'ws'
import type { CypressError } from '@packages/errors'
import type { SendDebuggerCommand, OnFn, OffFn, CdpCommand, CdpEvent } from './cdp_automation'
import { CDPDisconnectedError } from './cri-errors'
import type { ProtocolManagerShape } from '@packages/types'

const debug = debugModule('cypress:server:browsers:cri-client')

type QueuedMessages = {
  enableCommands: EnableCommand[]
  enqueuedCommands: EnqueuedCommand[]
  subscriptions: Subscription[]
}

type EnqueuedCommand = {
  command: CdpCommand
  params?: object
  p: DeferredPromise
  sessionId?: string
}

type EnableCommand = {
  command: CdpCommand
  params?: object
  sessionId?: string
}

type Subscription = {
  eventName: CdpEvent
  cb: Function
}

type CmdParams<TCmd extends CdpCommand> = ProtocolMapping.Commands[TCmd]['paramsType'][0]

export const DEFAULT_NETWORK_ENABLE_OPTIONS = {
  maxTotalBufferSize: 0,
  maxResourceBufferSize: 0,
  maxPostDataSize: 0,
}

// How long a sent CDP command can go unresolved before we log it as
// potentially hung (debug logging only - the command is not aborted)
const SEND_HANG_DETECTION_MS = 10000

export interface ICriClient {
  /**
   * The target id attached to by this client
   */
  targetId: string
  /**
   * The underlying websocket connection
   */
  ws?: WebSocket
  /**
   * Sends a command to the Chrome remote interface.
   * @example client.send('Page.navigate', { url })
   */
  send: SendDebuggerCommand
  /**
   * Registers callback for particular event.
   * @see https://github.com/cyrus-and/chrome-remote-interface#class-cdp
   */
  on: OnFn
  /**
   * Calls underlying remote interface client close
   */
  close (): Promise<void>

  /**
   * The internal queue of replayable messages that run after a disconnect
   */
  queue: QueuedMessages
  /**
   * Whether this client has been closed
   */
  closed: boolean
  /**
   * Whether this client is currently connected
   */
  connected: boolean
  /**
   * Unregisters callback for particular event.
   */
  off: OffFn
  /**
   * When set, service worker targets attaching to this connection await this
   * callback before being released from their waiting-for-debugger pause.
   * The CDP Fetch runtime uses it to enable Fetch on the service worker's
   * session — a service worker's script fetch and fetch-handler requests run
   * on its own session, so without this they bypass interception entirely
   * when the proxy is disabled.
   */
  onChildTargetAttached?: (sessionId: string) => Promise<void>
  /**
   * Deterministically removes targetId from this connection's confirmed-handled
   * set without resolving or evicting any waiter registered for it - a
   * sibling connection (the browser-level connection, for a crash-reloaded
   * service worker) calls this before it holds, so it never reads a stale
   * "handled" entry this connection hasn't gotten around to evicting itself
   * (#34674 - the two connections' Inspector.targetReloadedAfterCrash
   * handlers race on independent websockets, so this cannot be left to that
   * race). See whenChildTargetHandled.
   */
  invalidateChildTargetHandled (targetId: string): void
}

type DeferredPromise = { resolve: Function, reject: Function }
type CreateParams = {
  target: string
  onAsynchronousError: (err: CypressError) => void
  host?: string
  port?: number
  onReconnect?: (client: CriClient) => void
  protocolManager?: ProtocolManagerShape
  fullyManageTabs?: boolean
  browserClient?: ICriClient
  onReconnectAttempt?: (retryIndex: number) => void
  onCriConnectionClosed?: () => void
}

export class CriClient implements ICriClient {
  // subscriptions are recorded, but this may no longer be necessary. cdp event listeners
  // need only be added to the connection instance, not the (ephemeral) underlying
  // CDP.Client instances
  private subscriptions: Subscription[] = []
  private enableCommands: EnableCommand[] = []

  private _commandQueue: CDPCommandQueue = new CDPCommandQueue()

  private _closed = false
  private _connected = false
  private _isChildTarget = false

  private _crashed = false
  private cdpConnection: CDPConnection

  public onChildTargetAttached?: (sessionId: string) => Promise<void>

  // Targets whose session-scoped interception this connection has confirmed
  // in place, via a fresh attach or a crash-reload re-arm - see
  // _commitChildTargetAttach.
  private _handledTargetIds: Set<string> = new Set()
  private _childTargetWaiters: Map<string, PromiseWithResolvers<void>> = new Map()

  // One token per in-flight attach, removed at commit or on detach. A stale
  // attach — one suspended at an await when its target detached — sees its
  // token gone on resume and skips marking the target handled. Tokens are
  // object identities, not counters: deletion keeps the map bounded to
  // in-flight attaches, and a fresh token can never collide with a stale one.
  private _inFlightAttaches: Map<string, object> = new Map()

  // sessionId -> the target that session belongs to, recorded in
  // _onAttachedToTarget and evicted alongside _inFlightAttaches /
  // _handledTargetIds. Inspector.targetReloadedAfterCrash carries only a
  // sessionId, not a TargetInfo, so this is how the crash-reload handler
  // finds the target (and its type, to gate on service_worker/iframe) to
  // re-run the commit-on-success flow for (#34674).
  private _sessionTargets: Map<string, { targetId: string, type: Protocol.Target.TargetInfo['type'] }> = new Map()

  private constructor (
    public targetId: string,
    private onAsynchronousError: (err: CypressError) => void,
    private host?: string,
    private port?: number,
    private onReconnect?: (client: CriClient) => void,
    private protocolManager?: ProtocolManagerShape,
    private fullyManageTabs?: boolean,
    private browserClient?: ICriClient,
    onReconnectAttempt?: (retryIndex: number) => void,
    onCriConnectionClosed?: () => void,
  ) {
    debug('creating cri client with', {
      host, port, targetId,
    })

    // refactor opportunity:
    // due to listeners passed in along with connection options, the fns that instantiate this
    // class should instantiate and listen to the connection directly rather than having this
    // constructor create them. The execution and/or definition of these callbacks is not this
    // class' business.
    this.cdpConnection = new CDPConnection({
      host: this.host,
      port: this.port,
      target: this.targetId,
      local: true,
      useHostName: true,
    }, {
      // Only automatically reconnect if: this is the root browser cri target (no host), or cy in cy
      automaticallyReconnect: !this.host && !process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF,
    })

    this.cdpConnection.addConnectionEventListener('cdp-connection-reconnect-error', onAsynchronousError)
    this.cdpConnection.addConnectionEventListener('cdp-connection-reconnect', this._onCdpConnectionReconnect)

    // 'cdp-connection-closed' means the connection is terminated for good, so this
    // permanently rejects the queue. 'cdp-connection-reconnect-error' only drains what's
    // already queued - exhausting retries does not mark the connection terminated, so a
    // send issued after this fires still enqueues and hangs (root browser client only;
    // the run is torn down by the fatal CDP_COULD_NOT_RECONNECT anyway). See #34581.
    this.cdpConnection.addConnectionEventListener('cdp-connection-closed', this._rejectEnqueuedCommands)
    this.cdpConnection.addConnectionEventListener('cdp-connection-reconnect-error', this._rejectEnqueuedCommands)

    // A terminal disconnect never routes through close(), so without these a
    // sibling connection's whenChildTargetHandled() waiter would hang on a
    // client that will never process another Target.attachedToTarget, and
    // this connection's own bookkeeping would go stale rather than empty.
    this.cdpConnection.addConnectionEventListener('cdp-connection-closed', this._resolveChildTargetWaiters)
    this.cdpConnection.addConnectionEventListener('cdp-connection-closed', this._clearChildTargetState)

    if (onCriConnectionClosed) {
      this.cdpConnection.addConnectionEventListener('cdp-connection-closed', onCriConnectionClosed)
    }

    if (onReconnectAttempt) {
      this.cdpConnection.addConnectionEventListener('cdp-connection-reconnect-attempt', onReconnectAttempt)
    }

    this._isChildTarget = !!this.host

    if (this._isChildTarget) {
      // If crash listeners are added at the browser level, tabs/page connections do not emit them.
      this.cdpConnection.on('Target.targetCrashed', async (event) => {
        debug('crash event detected', event)
        if (event.targetId !== this.targetId) {
          return
        }

        if (this._crashed) {
          debug('Target.targetCrashed received for target %s; _crashed was already true (set via markCrashed before this event was delivered on this connection)', this.targetId)
        } else {
          debug('crash detected for target %s', this.targetId)
        }

        this._crashed = true
      })

      if (fullyManageTabs) {
        this.cdpConnection.on('Target.attachedToTarget', this._onAttachedToTarget)

        // Without evicting here, _handledTargetIds would grow for the life
        // of this page client, keeping an entry for every target that ever
        // attached. It also guards against a target id being reused for a
        // restarted service worker: a stale entry from the old instance
        // would let whenChildTargetHandled() resolve immediately for the
        // new one before this connection has actually processed its attach,
        // reinstating the #34674 race. Both events registered since it's
        // not confirmed which of the two actually arrives here for a given
        // target; evicting an id that was never recorded is a no-op.
        this.cdpConnection.on('Target.detachedFromTarget', this._onChildTargetDetached)
        this.cdpConnection.on('Target.targetDestroyed', this._onChildTargetDetached)
        this.cdpConnection.on('Inspector.targetReloadedAfterCrash', this._onChildTargetReloadedAfterCrash)
      }
    }
  }

  static async create ({
    target,
    onAsynchronousError,
    host,
    port,
    onReconnect,
    protocolManager,
    fullyManageTabs,
    browserClient,
    onReconnectAttempt,
    onCriConnectionClosed,
  }: CreateParams): Promise<CriClient> {
    const newClient = new CriClient(target, onAsynchronousError, host, port, onReconnect, protocolManager, fullyManageTabs, browserClient, onReconnectAttempt, onCriConnectionClosed)

    await newClient.connect()

    return newClient
  }

  // this property is accessed in a couple different places, but should be refactored to be
  // private - queues are internal to this class, and should not be exposed
  get queue () {
    return {
      enableCommands: this.enableCommands,
      enqueuedCommands: this._commandQueue.entries.map((entry) => {
        return {
          ...entry,
          p: entry.deferred,
        }
      }),
      subscriptions: this.subscriptions,
    }
  }

  // this property is accessed by browser-cri-client, to event on websocket closed.
  get ws () {
    return this.cdpConnection.ws
  }

  get closed () {
    return this._closed
  }

  get connected () {
    return this._connected
  }

  get crashed () {
    return this._crashed
  }

  /**
   * Synchronously mark this CRI client as crashed. Used to propagate a crash
   * notification from a sibling client (e.g. the page client to the protocol,
   * cy-prompt, and studio clones) before any of them can race against the
   * separate `Target.targetCrashed` event delivery on their own connections.
   *
   * Without this, the sibling client may not yet have observed the crash event
   * on its own websocket and a subsequent `send()` will hang forever because
   * the renderer is dead and will never respond.
   */
  public markCrashed = () => {
    if (!this._crashed) {
      debug('markCrashed called for target %s; no Target.targetCrashed event had been received on this connection', this.targetId)
    }

    this._crashed = true
  }

  /**
   * Resolves once session-scoped interception is confirmed in place for
   * targetId on this connection - or was never needed for it (a non-SW/iframe
   * target, or no onChildTargetAttached hook registered) - whichever happens
   * first relative to this call. A failed interception hook leaves this
   * pending rather than resolving it: see _commitChildTargetAttach. Its
   * release paths are detach eviction, close(), a terminal disconnect, or the
   * caller's own timeout - not this promise resolving on a failure. A
   * crash-reloaded target re-arms this: see _onChildTargetReloadedAfterCrash.
   * A sibling connection that also auto-attaches the same targets (the
   * browser-level connection, for service workers) uses this to defer
   * releasing a paused target until confirmed (#34674).
   */
  public whenChildTargetHandled = (targetId: string): Promise<void> => {
    // A waiter registered against a closed client would never resolve: this
    // connection will never process another Target.attachedToTarget. Reachable
    // via resetBrowserTargets swapping in a new page client before
    // attachListeners re-points the caller at it.
    if (this._closed || this.cdpConnection.terminated || this._handledTargetIds.has(targetId)) {
      return Promise.resolve()
    }

    let deferred = this._childTargetWaiters.get(targetId)

    if (!deferred) {
      deferred = Promise.withResolvers<void>()
      this._childTargetWaiters.set(targetId, deferred)
    }

    return deferred.promise
  }

  // Only removes targetId from the handled set - does NOT touch
  // _childTargetWaiters or _inFlightAttaches. Resolving or evicting a waiter
  // here would be wrong: a waiter already registered when this is called
  // represents a caller that is still going to wait for an upcoming commit
  // (or the sibling's own timeout), and invalidating must not manufacture
  // either a false confirmation or a false detach for it. Deleting an
  // in-flight token would be wrong too, deliberately: when the page
  // connection's own handler runs first, this runs while the page-side
  // crash-reload re-arm (_onChildTargetReloadedAfterCrash) is already in
  // flight with a fresh token of its own - deleting it here would make that
  // re-arm's own commit look stale to itself, forcing every crash in that
  // ordering through the full hold timeout instead of the fast path it
  // re-arms for (see that handler's doc comment). See ICriClient's doc
  // comment.
  public invalidateChildTargetHandled = (targetId: string): void => {
    this._handledTargetIds.delete(targetId)
  }

  private _resolveChildTargetWaiters = (): void => {
    for (const deferred of this._childTargetWaiters.values()) {
      deferred.resolve()
    }

    this._childTargetWaiters.clear()
  }

  // This connection will never process another Target.attachedToTarget once
  // closed or terminated, so none of its in-flight/handled/session bookkeeping
  // can still become accurate - held onto, it would just be stale state a
  // future lookup could act on. Waiter resolution is handled separately by
  // _resolveChildTargetWaiters, called alongside this at both of its call sites.
  private _clearChildTargetState = (): void => {
    this._sessionTargets.clear()
    this._inFlightAttaches.clear()
    this._handledTargetIds.clear()
  }

  private _onChildTargetDetached = (event: { targetId?: string, sessionId?: string }): void => {
    // Target.detachedFromTarget always carries a sessionId (its targetId is
    // documented deprecated and can be absent); Target.targetDestroyed never
    // carries a sessionId. Evicted here, ahead of the targetId guard below,
    // so a detach that only identifies its session still evicts - a stale
    // entry surviving here would let a later crash-reload on the reused
    // session id re-invoke the hook for a target that already detached.
    if (event.sessionId) {
      this._sessionTargets.delete(event.sessionId)
    }

    if (!event.targetId) {
      return
    }

    // Deleted even if no attach is currently in flight for this id - it's
    // what the identity check in _onAttachedToTarget compares against, so an
    // attach that resumes stale (suspended before this detach) reliably sees
    // a mismatch (its captured token can never again equal what .get()
    // returns, whether that's undefined now or a different attach's token
    // later).
    this._inFlightAttaches.delete(event.targetId)

    this._handledTargetIds.delete(event.targetId)
    this._childTargetWaiters.get(event.targetId)?.resolve()
    this._childTargetWaiters.delete(event.targetId)

    // Target.targetDestroyed carries no sessionId, so sweep by targetId.
    for (const [sessionId, target] of this._sessionTargets) {
      if (target.targetId === event.targetId) {
        this._sessionTargets.delete(sessionId)
      }
    }
  }

  public connect = async () => {
    debug('connecting %o', { connected: this._connected, target: this.targetId })

    await this.cdpConnection.connect()

    this._connected = true

    if (this._isChildTarget) {
    // Ideally we could use filter rather than checking the type above, but that was added relatively recently
      await this.cdpConnection.send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: true, flatten: true })
      await this.cdpConnection.send('Target.setDiscoverTargets', { discover: true })
    }

    debug('connected %o', { connected: this._connected, target: this.targetId })
  }

  public send = async <TCmd extends CdpCommand> (
    command: TCmd,
    params?: CmdParams<TCmd>,
    sessionId?: string,
  ): Promise<ProtocolMapping.Commands[TCmd]['returnType']> => {
    if (this._crashed) {
      debug('not sending %s to target %s; _crashed is true', command, this.targetId)

      return Promise.reject(new Error(`${command} will not run as the target browser or tab CRI connection has crashed`))
    }

    // Keep track of '*.enable' commands so they can be resent when
    // reconnecting
    if (command.endsWith('.enable') || ['Runtime.addBinding', 'Target.setDiscoverTargets'].includes(command)) {
      debug('registering enable command', command)
      const obj: EnableCommand = {
        command,
      }

      if (params) {
        obj.params = params
      }

      if (sessionId) {
        obj.sessionId = sessionId
      }

      // Replace rather than duplicate an existing entry for the same
      // command + session + params - e.g. a crash-reload re-arm (#34674)
      // re-sending Fetch.enable for a session already enabled once. An
      // unbounded duplicate would be replayed again on every future
      // reconnect. Params must be part of the key: Runtime.addBinding is
      // legitimately sent multiple times with no sessionId but a different
      // `name` each time (utils.ts's 'cypressUtilityBinding',
      // cdp-socket.ts's per-namespace `cypressSendToServer-${namespace}`) -
      // keying on (command, sessionId) alone would collapse those into one
      // and silently drop the others on reconnect. Replay order doesn't
      // matter here: _restoreState fires every entry via Promise.all.
      // Sorted keys make the comparison insertion-order-proof: two calls
      // with the same params but keys built in a different order would
      // otherwise serialize differently and be (harmlessly) treated as
      // distinct, leaving a stale duplicate behind instead of replacing it.
      // Sorted at every nesting level, via a function replacer rather than
      // JSON.stringify's array-replacer form - an array replacer acts as a
      // key allowlist applied recursively at every level, not just the top
      // one, so it would silently strip a nested object's own keys (e.g.
      // Fetch.enable's `patterns[].requestStage`) and make different nested
      // values collide on the same key.
      const stringifyParams = (p?: object) => {
        return JSON.stringify(p ?? null, (_key, value) => {
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            return Object.keys(value).sort().reduce((sorted, k) => {
              sorted[k] = value[k]

              return sorted
            }, {})
          }

          return value
        })
      }
      const paramsKey = stringifyParams(params)
      const existingIndex = this.enableCommands.findIndex((entry) => {
        return entry.command === command && entry.sessionId === sessionId && stringifyParams(entry.params) === paramsKey
      })

      if (existingIndex === -1) {
        this.enableCommands.push(obj)
      } else {
        this.enableCommands[existingIndex] = obj
      }
    }

    if (command.endsWith('.disable')) {
      const enableCommand = `${command.slice(0, -'.disable'.length)}.enable`

      this.enableCommands = this.enableCommands.filter((entry) => {
        return !(entry.command === enableCommand && entry.sessionId === sessionId)
      })
    }

    if (this._connected && this.cdpConnection) {
      // a send to a renderer that crashed without this connection observing
      // Target.targetCrashed will never resolve. When debug logging is
      // enabled, surface commands that go unresolved so that hang can be
      // diagnosed (the command itself is not aborted)
      let hangDetectionTimer: NodeJS.Timeout | undefined

      if (debug.enabled) {
        hangDetectionTimer = setTimeout(() => {
          debug('command %s to target %s has not resolved after %dms (_crashed: %o)', command, this.targetId, SEND_HANG_DETECTION_MS, this._crashed)
        }, SEND_HANG_DETECTION_MS)

        hangDetectionTimer.unref?.()
      }

      try {
        return await this.cdpConnection.send(command, params, sessionId)
      } catch (err) {
        debug('Encountered error on send %o', { command, params, sessionId, err })

        // This error occurs when the browser has been left open for a long
        // time and/or the user's computer has been put to sleep. The
        // socket disconnects and we need to recreate the socket and
        // connection
        if (!CDPDisconnectedError.isCDPDisconnectedError(err)) {
          throw err
        }

        if (this.cdpConnection.terminated) {
          return this._rejectTerminated(command)
        }

        debug('error classified as WEBSOCKET_NOT_OPEN_RE; enqueuing and attempting to reconnect')

        return this._enqueueCommand(command, params, sessionId)
      } finally {
        if (hangDetectionTimer) {
          clearTimeout(hangDetectionTimer)
        }
      }
    }

    if (this.cdpConnection.terminated) {
      return this._rejectTerminated(command)
    }

    return this._enqueueCommand(command, params, sessionId)
  }

  public on = <T extends CdpEvent> (eventName: T, cb: CDPListener<T>) => {
    if (eventName === 'Target.targetCrashed') {
      debug('attaching crash listener')
    }

    this.cdpConnection?.on<T>(eventName, cb)

    this.subscriptions.push({ eventName, cb })
    debug('registering CDP on event %o', { eventName })

    if (eventName.startsWith('Network.')) {
      this.browserClient?.on(eventName, cb)
    }
  }

  public off = <T extends keyof ProtocolMapping.Events> (eventName: T, cb: (data: ProtocolMapping.Events[T][0], sessionId?: string) => void) => {
    this.subscriptions.splice(this.subscriptions.findIndex((sub) => {
      return sub.eventName === eventName && sub.cb === cb
    }), 1)

    this.cdpConnection!.off(eventName, cb)
    // This ensures that we are notified about the browser's network events that have been registered (e.g. service workers)
    // Long term we should use flat mode entirely across all of chrome remote interface
    if (eventName.startsWith('Network.')) {
      this.browserClient?.off(eventName, cb)
    }
  }

  public close = async () => {
    debug('closing')

    // Never leave a sibling connection's whenChildTargetHandled() waiting on
    // a client that is never going to finish attaching anything.
    this._resolveChildTargetWaiters()
    this._clearChildTargetState()

    if (this._closed || this.cdpConnection?.terminated) {
      debug('not closing, cri client is already closed %o', { closed: this._closed, target: this.targetId, connection: this.cdpConnection })

      // a terminal disconnect marks the connection terminated outside of close(), so
      // this branch is reachable with _closed still false - callers gate on .closed
      // (e.g. resetBrowserTargets), so it must reflect reality once terminated is true
      this._closed = true

      return
    }

    debug('closing cri client %o', { closed: this._closed, target: this.targetId })

    this._closed = true

    try {
      await this.cdpConnection?.disconnect()
      debug('closed cri client %o', { closed: this._closed, target: this.targetId })
    } catch (e) {
      debug('error closing cri client targeting %s: %o', this.targetId, e)
    }
  }

  async clone (): Promise<CriClient> {
    return CriClient.create({
      target: this.targetId,
      onAsynchronousError: this.onAsynchronousError,
      host: this.host,
      port: this.port,
      protocolManager: this.protocolManager,
      fullyManageTabs: this.fullyManageTabs,
      browserClient: this.browserClient,
    })
  }

  private _onAttachedToTarget = async (event: ProtocolMapping.Events['Target.attachedToTarget'][0]) => {
    // We're only interested in child target traffic. Browser cri traffic is
    // handled in browser-cri-client.ts. The basic approach here is we attach
    // to targets and enable network traffic. We must attach in a paused state
    // so that we can enable network traffic before the target starts running.
    if (!this.fullyManageTabs || !this.host) {
      return
    }

    // Set before the first await below, so a detach arriving while this
    // handler is suspended (at Network.enable or onChildTargetAttached) can
    // invalidate it - see the identity check before _handledTargetIds.add
    // further down, and _onChildTargetDetached.
    const targetId = event.targetInfo.targetId
    const token = {}

    this._inFlightAttaches.set(targetId, token)
    this._sessionTargets.set(event.sessionId, { targetId, type: event.targetInfo.type })

    try {
      // Service workers get attached at the page and browser level. We only want to handle them at the browser level
      // We don't track child tabs/page network traffic. 'other' targets can't have network enabled
      if (event.targetInfo.type !== 'service_worker' && event.targetInfo.type !== 'page' && event.targetInfo.type !== 'other') {
        await this.cdpConnection.send('Network.enable', this.protocolManager?.networkEnableOptions ?? DEFAULT_NETWORK_ENABLE_OPTIONS, event.sessionId)
      }
    } catch (error) {
      // it's possible that the target was closed before we could enable network, in that case, just ignore
      debug('error attaching to target cri: %o', { error, event })
    }

    // Chromium hosts a frame in its own renderer process when its site needs
    // one — a cross-site frame under site isolation, or an origin-keyed agent
    // cluster (e.g. https google origins). An out-of-process iframe's (OOPIF)
    // network runs on its own CDP session, exactly like a service worker's:
    // without enabling interception there, a cross-origin spec bridge's
    // runner-bundle fetch escapes to the real origin (real
    // accounts.google.com answers 404 and cy.origin waits forever on
    // bridge:ready).
    let childTargetInterceptionFailed = false

    if ((event.targetInfo.type === 'service_worker' || event.targetInfo.type === 'iframe') && this.onChildTargetAttached) {
      try {
        // Must complete while the target is still paused — releasing the
        // debugger first lets the target's first fetches escape
        // uninterceptable.
        await this.onChildTargetAttached(event.sessionId)
      } catch (error) {
        childTargetInterceptionFailed = true
        debug('error enabling child-session interception: %o', { error, event })
      }
    }

    // Marked here rather than after Runtime.runIfWaitingForDebugger below:
    // that command's own success or failure has no bearing on whether this
    // connection's side of attaching is done. See _commitChildTargetAttach
    // for what "handled" means and why a stale or failed attach skips it.
    this._commitChildTargetAttach(targetId, token, childTargetInterceptionFailed)

    if (event.waitingForDebugger) {
      try {
        await this.cdpConnection.send('Runtime.runIfWaitingForDebugger', undefined, event.sessionId)
      } catch (error) {
        // it's possible that the target was closed before we could tell it to run, in that case, just ignore
        debug('error running Runtime.runIfWaitingForDebugger: %o', { error, event })
      }
    }
  }

  // Marks targetId handled and resolves its waiter, unless this attach's
  // token is no longer the in-flight one for targetId (a detach, or a newer
  // attach for a reused id, invalidated it while the caller was suspended
  // awaiting the interception hook) or that hook failed. "Handled" means
  // interception is actually in place, not merely that the hook ran: a
  // target whose onChildTargetAttached rejected never got Fetch enabled on
  // its session, so marking it handled would report a false confirmation to
  // a sibling connection deciding whether to release it (#34674 hold). A
  // failed hook still clears the token (detach eviction has nothing else to
  // key off) but leaves the target unhandled - detach eviction, close(), or
  // the sibling's own timeout are what eventually release it. Shared by a
  // fresh attach (_onAttachedToTarget) and a crash-reload re-arm
  // (_onChildTargetReloadedAfterCrash) so both commit identically.
  private _commitChildTargetAttach (targetId: string, token: object, hookFailed: boolean): void {
    if (this._inFlightAttaches.get(targetId) !== token) {
      return
    }

    this._inFlightAttaches.delete(targetId)

    if (hookFailed) {
      return
    }

    this._handledTargetIds.add(targetId)
    this._childTargetWaiters.get(targetId)?.resolve()
    this._childTargetWaiters.delete(targetId)
  }

  // A crash-reloaded service worker is the same worker _onAttachedToTarget
  // originally paused, not a fresh attach, so no Target.attachedToTarget
  // fires here to re-run the interception hook. "Handled" is defined as
  // this session's interception being (re-)enabled after the most recent
  // start-or-reload, so a stale "handled" entry from the original attach is
  // evicted and the hook re-run before this session can be reported
  // confirmed again. Releasing the target (Runtime.runIfWaitingForDebugger)
  // stays the browser connection's job - see browser-cri-client.ts.
  //
  // This is a fast path, not the correctness guarantee: whether
  // Inspector.targetReloadedAfterCrash is delivered on this (page-level)
  // connection for a given crash is not something this code verifies. The
  // browser connection invalidates its view of this target as handled
  // before it holds (BrowserCriClient.invalidateChildTargetInterception),
  // so a miss here just means the hold fails open at its own timeout instead
  // of confirming early - it never causes an instant, uninstrumented release.
  //
  // One residual window remains, by design rather than oversight: if the
  // hook from a PRIOR attach is still stalled past the 4s fail-open (its
  // target already released, running, and now crashing again), that stalled
  // hook's commit can land after the browser-side invalidate, re-marking
  // the target handled just ahead of the new hold. This re-arm closes it
  // whenever its own event lands before the stalled hook resumes - the
  // fresh token set below invalidates the stalled attach's token, so its
  // late commit is recognized as stale and skipped (see
  // _commitChildTargetAttach). What's left needs this event to be missed
  // or to arrive after that stalled commit, AND a hook stalled past 4s -
  // the same fail-open class as the timeout itself, not a new failure mode.
  // Not eliminated by epoch-stamping invalidateChildTargetHandled, on
  // purpose: when the page connection's own handler runs first, invalidating
  // in-flight tokens there would wipe this very re-arm's own fresh token and
  // force every crash in that ordering through the full 4s hold instead of
  // the fast path.
  private _onChildTargetReloadedAfterCrash = async (_event: unknown, sessionId?: string) => {
    if (!sessionId || !this.onChildTargetAttached) {
      return
    }

    const target = this._sessionTargets.get(sessionId)

    if (!target || (target.type !== 'service_worker' && target.type !== 'iframe')) {
      return
    }

    const { targetId } = target
    const token = {}

    this._handledTargetIds.delete(targetId)
    this._inFlightAttaches.set(targetId, token)

    let childTargetInterceptionFailed = false

    try {
      await this.onChildTargetAttached(sessionId)
    } catch (error) {
      childTargetInterceptionFailed = true
      debug('error re-enabling child-session interception after crash reload: %o', { error, sessionId, targetId })
    }

    this._commitChildTargetAttach(targetId, token, childTargetInterceptionFailed)
  }

  private _enqueueCommand <TCmd extends CdpCommand> (
    command: TCmd,
    params: ProtocolMapping.Commands[TCmd]['paramsType'][0],
    sessionId?: string,
  ): Promise<ProtocolMapping.Commands[TCmd]['returnType']> {
    return this._commandQueue.add(command, params, sessionId)
  }

  // A terminated connection never reconnects, so a send against one is rejected outright
  // rather than enqueued to await a flush that will never come.
  private _rejectTerminated <TCmd extends CdpCommand> (command: TCmd): Promise<ProtocolMapping.Commands[TCmd]['returnType']> {
    debug('connection to target %s is terminated; rejecting %s instead of enqueuing', this.targetId, command)

    return Promise.reject(new CDPDisconnectedError(`${command} will not run as the CRI connection to Target ${this.targetId} has been closed`))
  }

  private _rejectEnqueuedCommands = () => {
    this._commandQueue.reject(new CDPDisconnectedError(`The CRI connection to Target ${this.targetId} has been closed; enqueued commands will never run`))
  }

  private _onCdpConnectionReconnect = async () => {
    debug('cdp connection reconnected')
    try {
      await this._restoreState()
      await this._drainCommandQueue()

      await this.protocolManager?.cdpReconnect()

      try {
        if (this.onReconnect) {
          await this.onReconnect(this)
        }
      } catch (e) {
        debug('uncaught error in CriClient reconnect callback: ', e)
      }
    } catch (e) {
      debug('error re-establishing state on reconnection to target %s; %d enablement(s) registered, %d command(s) still enqueued: ', this.targetId, this.enableCommands.length, this._commandQueue.entries.length, e)
    }
  }

  private async _restoreState () {
    // '*.enable' commands need to be resent on reconnect or any events in
    // that namespace will no longer be received
    debug('re-enabling %d enablements', this.enableCommands.length)
    await Promise.all(this.enableCommands.map(async ({ command, params, sessionId }) => {
      // these commands may have been enqueued, so we need to resolve those promises and remove
      // them from the queue when we send here
      const inFlightCommand = this._commandQueue.extract({ command, params, sessionId })

      try {
        const response = await this.cdpConnection.send(command, params, sessionId)

        inFlightCommand?.deferred.resolve(response)
      } catch (err) {
        debug('error re-enabling %s: ', command, err)
        if (CDPDisconnectedError.isCDPDisconnectedError(err)) {
          // this error is caught in _onCdpConnectionReconnect
          // because this is a connection error, the enablement will be re-attempted
          // when _onCdpConnectionReconnect is called again. We do need to ensure the
          // original in-flight command, if present, is re-enqueued.
          if (inFlightCommand) {
            this._commandQueue.unshift(inFlightCommand)
          }

          throw err
        } else {
          if (!inFlightCommand) {
            // with no in-flight command to receive the rejection, this failure is
            // otherwise invisible: events from this domain silently stop arriving
            // on this connection (e.g. a Network.enable failure means network
            // traffic used by cy.intercept is no longer observed)
            debug('re-enabling %s on target %s after reconnect failed with a non-connection error and no in-flight command was in the queue to receive the rejection: ', command, this.targetId, err)
          }

          // non-connection errors are appropriate for rejecting the original command promise
          inFlightCommand?.deferred.reject(err)
        }
      }
    }))
  }

  private async _drainCommandQueue () {
    debug('sending %d enqueued commands', this._commandQueue.entries.length)
    while (this._commandQueue.entries.length) {
      const enqueued = this._commandQueue.shift()

      if (!enqueued) {
        return
      }

      try {
        debug('sending enqueued command %s', enqueued.command)
        const response = await this.cdpConnection.send(enqueued.command, enqueued.params, enqueued.sessionId)

        debug('sent command, received ', { response })
        enqueued.deferred.resolve(response)
        debug('resolved enqueued promise')
      } catch (e) {
        debug('enqueued command %s failed:', enqueued.command, e)
        if (CDPDisconnectedError.isCDPDisconnectedError(e)) {
          debug('command failed due to disconnection; enqueuing for resending once reconnected')
          this._commandQueue.unshift(enqueued)
          throw e
        } else {
          enqueued.deferred.reject(e)
        }
      }
    }
  }
}
