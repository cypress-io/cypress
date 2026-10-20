import _ from 'lodash'
import Bluebird from 'bluebird'
import CRI from 'chrome-remote-interface'
import Debug from 'debug'
import type { Protocol } from 'devtools-protocol'
import { _connectAsync, _getDelayMsForRetry } from './protocol'
import * as errors from '../errors'
import type { CypressError } from '@packages/errors'
import { CriClient, DEFAULT_NETWORK_ENABLE_OPTIONS } from './cdp-protocol/cri-client'
import { cypressSessions } from '../cypress-sessions'
import { serviceWorkerClientEventHandler, serviceWorkerClientEventHandlerName } from '@packages/proxy/lib/http/util/service-worker-manager'
import type { CyPromptManagerShape, ProtocolManagerShape, CdpClientShape, OnExtraTargetCriClientReady, ExtraTargetDetach } from '@packages/types'
import type { ServiceWorkerEventHandler } from '@packages/proxy/lib/http/util/service-worker-manager'
import { EXTRA_TARGET_HEADER } from './constants'

const debug = Debug('cypress:server:browsers:browser-cri-client')

type BrowserCriClientOptions = {
  browserClient: CriClient
  versionInfo: CRI.VersionResult
  host: string
  port: number
  browserName: string
  onAsynchronousError: (err: CypressError) => void
  protocolManager?: ProtocolManagerShape
  fullyManageTabs?: boolean
  onServiceWorkerClientEvent: ServiceWorkerEventHandler
  onExtraTargetCriClientReady?: OnExtraTargetCriClientReady
}

type BrowserCriClientCreateOptions = {
  browserName: string
  fullyManageTabs?: boolean
  hosts: string[]
  onAsynchronousError: (err: CypressError) => void
  onReconnect?: (client: CriClient) => void
  port: number
  protocolManager?: ProtocolManagerShape
  cyPromptManager?: CyPromptManagerShape
  onServiceWorkerClientEvent: ServiceWorkerEventHandler
  onExtraTargetCriClientReady?: OnExtraTargetCriClientReady
}

interface ManageTabsOptions {
  browserClient: CriClient
  browserCriClient: BrowserCriClient
  browserName
  host: string
  onAsynchronousError: Function
  port: number
  protocolManager?: ProtocolManagerShape
  // Overrides CHILD_TARGET_INTERCEPTION_TIMEOUT_MS. Exposed for tests only.
  childTargetInterceptionTimeoutMs?: number
}

interface AttachedToTargetOptions {
  browserClient: CriClient
  browserCriClient: BrowserCriClient
  CriConstructor?: typeof CRI
  event: Protocol.Target.AttachedToTargetEvent
  host: string
  port: number
  protocolManager?: ProtocolManagerShape
  // Overrides CHILD_TARGET_INTERCEPTION_TIMEOUT_MS. Exposed for tests only.
  childTargetInterceptionTimeoutMs?: number
}

interface TargetDestroyedOptions {
  browserName: string
  browserClient: CriClient
  browserCriClient: BrowserCriClient
  event: Protocol.Target.TargetDestroyedEvent
  onAsynchronousError: Function
}

// How long to wait for the page connection to confirm session-scoped Fetch
// interception on a paused service worker before releasing it anyway
// (#34674). CI containers have observed the page connection's own attach
// handling land up to ~2s after the browser connection's; this leaves
// headroom without wedging a worker indefinitely if that never arrives.
const CHILD_TARGET_INTERCEPTION_TIMEOUT_MS = 4000

const ensureLiveBrowser = async (hosts: string[], port: number, browserName: string): Promise<string> => {
  // since we may be attempting to connect to multiple hosts, 'connected'
  // is set to true once one of the connections succeeds so the others
  // can be cancelled
  let connected = false

  const tryBrowserConnection = async (host: string, port: number, browserName: string): Promise<string> => {
    const connectOpts = {
      host,
      port,
      getDelayMsForRetry: (i) => {
        // if we successfully connected to a different host, cancel any remaining connection attempts
        if (connected) {
          debug('cancelling any additional retries %o', { host, port })

          return
        }

        return _getDelayMsForRetry(i, browserName)
      },
    }

    await _connectAsync(connectOpts)
    connected = true

    return host
  }

  const connections = hosts.map((host) => {
    return tryBrowserConnection(host, port, browserName)
    .catch((err) => {
      // don't throw an error if we've already connected
      if (!connected) {
        const e = errors.get('CDP_COULD_NOT_CONNECT', browserName, port, err)

        e.cause = {
          err,
          host,
          port,
        }

        throw e
      }

      return ''
    })
  })

  // go through all of the hosts and attempt to make a connection
  return Promise.any(connections)
  // this only fires if ALL of the connections fail
  // otherwise if 1 succeeds and 1+ fails it won't log anything
  .catch((aggErr: AggregateError) => {
    aggErr.errors.forEach((e) => {
      const { host, port, err } = e.cause

      debug('failed to connect to CDP %o', { host, port, err })
    })

    // throw the first error we received from the aggregate
    throw aggErr.errors[0]
  })
}

const retryWithIncreasingDelay = async <T>(retryable: () => Promise<T>, browserName: string, port: number): Promise<T> => {
  let retryIndex = 0

  const retry = async () => {
    try {
      return await retryable()
    } catch (err) {
      retryIndex++
      const delay = _getDelayMsForRetry(retryIndex, browserName)

      debug('error finding browser target, maybe retrying %o', { delay, err })

      if (typeof delay === 'undefined') {
        debug('failed to connect to CDP %o', { err })
        errors.throwErr('CDP_COULD_NOT_CONNECT', browserName, port, err)
      }

      await new Promise((resolve) => setTimeout(resolve, delay))

      return retry()
    }
  }

  return retry()
}

type TargetId = string
type SessionId = string

interface ExtraTarget {
  client: CRI.Client
  targetInfo: Protocol.Target.TargetInfo
  detach?: ExtraTargetDetach
}

type ServiceWorkerBindingListener = (event: Protocol.Runtime.BindingCalledEvent) => void

// CDPConnection rebroadcasts every event under `${method}.${sessionId}` as well
// as its bare name, and the per-session form is not in ProtocolMapping.
const serviceWorkerBindingEvent = (sessionId: SessionId) => {
  return `Runtime.bindingCalled.${sessionId}` as 'Runtime.bindingCalled'
}

export class BrowserCriClient {
  private browserClient: CriClient
  private versionInfo: CRI.VersionResult
  private host: string
  private port: number
  private browserName: string
  private onAsynchronousError: (err: CypressError) => void
  private protocolManager?: ProtocolManagerShape
  private cyPromptManager?: CyPromptManagerShape
  private fullyManageTabs?: boolean
  onServiceWorkerClientEvent: ServiceWorkerEventHandler
  onExtraTargetCriClientReady?: OnExtraTargetCriClientReady
  currentlyAttachedTarget: CriClient | undefined
  currentlyAttachedProtocolTarget: CriClient | undefined
  currentlyAttachedCyPromptTarget: CriClient | undefined
  currentlyAttachedStudioTarget: CriClient | undefined
  // whenever we instantiate the instance we're already connected bc
  // we receive an underlying CRI connection
  // TODO: remove "connected" in favor of closing/closed or disconnected
  connected = true
  closing = false
  closed = false
  resettingBrowserTargets = false
  gracefulShutdown?: Boolean
  extraTargetClients: Map<TargetId, ExtraTarget> = new Map()
  serviceWorkerBindings: Map<SessionId, ServiceWorkerBindingListener> = new Map()
  onClose: Function | null = null
  /**
   * Cross-connection hold closing #34674's interception gap:
   *
   *   1. SW target spawns, debugger-paused (waitForDebuggerOnStart)
   *   2. It attaches on BOTH connections:
   *      - browser connection (this class) → must not release it yet
   *      - page connection → runs Fetch.enable on the worker's session
   *   3. This connection holds Runtime.runIfWaitingForDebugger until the page
   *      connection confirms step 2 (whenChildTargetHandled), or 4s passes
   *   4. Worker runs; its fetch(e.request) passthroughs now pause and get the
   *      synthetic proxy treatment (headers stripped, injection applied)
   *
   * Without the hold, step 4 can start before step 2 finishes: a cold-started
   * worker serves its first navigations straight to the origin (#34674).
   * Fail-open on purpose — an uninstrumented worker is a flaky test, a worker
   * held forever is a hung browser. Unset outside the browser network path.
   */
  waitForChildTargetInterception?: (targetId: string) => Promise<void>
  /**
   * Set alongside waitForChildTargetInterception, on the same launch path -
   * used for the crash-reload hold instead of it. A fresh attach's hold can
   * simply wait on the page connection's existing confirmation
   * (waitForChildTargetInterception), because nothing has invalidated it
   * yet. A crash-reload hold cannot: there is no way to tell, from a stale
   * "confirmed" flag alone, whether it predates the crash or already
   * accounts for it - the two connections' Inspector.targetReloadedAfterCrash
   * handlers arrive on independent websockets, with no ordering between
   * them and no shared counter that can't itself skew. So the crash-reload
   * hold asks the page connection to re-enable interception outright and
   * waits on THAT call instead: the returned promise can only settle from a
   * re-run that starts after this is invoked, so it can never be satisfied
   * by a confirmation - fresh or stale - that predates the crash. Race
   * against a timeout either way; a rejection (unknown target, or the hook
   * itself failing) releases immediately, same as a wait that never
   * resolves eventually does (#34674).
   */
  reenableChildTargetInterception?: (targetId: string) => Promise<void>
  /**
   * sessionId -> the target's full TargetInfo, captured in _onAttachToTarget
   * (the only place a TargetInfo is available) and evicted on
   * Target.detachedFromTarget / Target.targetDestroyed. The crash handler
   * only gets a sessionId, not a type or url, so this is how it tells a
   * service worker's session apart from anything else that can crash (#34674).
   */
  sessionTargetInfo: Map<string, Protocol.Target.TargetInfo> = new Map()

  private constructor (options: BrowserCriClientOptions) {
    this.browserClient = options.browserClient
    this.versionInfo = options.versionInfo
    this.host = options.host
    this.port = options.port
    this.browserName = options.browserName
    this.onAsynchronousError = options.onAsynchronousError
    this.protocolManager = options.protocolManager
    this.fullyManageTabs = options.fullyManageTabs
    this.onServiceWorkerClientEvent = options.onServiceWorkerClientEvent
    this.onExtraTargetCriClientReady = options.onExtraTargetCriClientReady
  }

  /**
   * Factory method for the browser cri client. Connects to the browser and then returns a chrome remote interface wrapper around the
   * browser target
   *
   * @param {BrowserCriClientCreateOptions} options the options for creating the browser cri client
   * @param options.browserName the display name of the browser being launched
   * @param options.fullyManageTabs whether or not to fully manage tabs. This is useful for firefox where some work is done with GeckoDriver and some with CDP. We don't want to handle disconnections in this class in those scenarios
   * @param options.hosts the hosts to which to attempt to connect
   * @param options.onAsynchronousError callback for any cdp fatal errors
   * @param options.onReconnect callback for when the browser cri client reconnects to the browser
   * @param options.port the port to which to connect
   * @param options.protocolManager the protocol manager to use with the browser cri client
   * @param options.onServiceWorkerClientEvent callback for when a service worker fetch event is received
   * @returns a wrapper around the chrome remote interface that is connected to the browser target
   */
  static async create (options: BrowserCriClientCreateOptions): Promise<BrowserCriClient> {
    const {
      browserName,
      fullyManageTabs,
      hosts,
      onAsynchronousError,
      onReconnect,
      port,
      protocolManager,
      onServiceWorkerClientEvent,
      onExtraTargetCriClientReady,
    } = options

    const host = await ensureLiveBrowser(hosts, port, browserName)

    return retryWithIncreasingDelay(async () => {
      const versionInfo = await CRI.Version({ host, port, useHostName: true })

      const clearSessionCdpUrl = () => cypressSessions.setCdpBrowserWsUrl(null)

      const browserClient = await CriClient.create({
        target: versionInfo.webSocketDebuggerUrl,
        onAsynchronousError: (err) => {
          clearSessionCdpUrl()
          onAsynchronousError(err)
        },
        onReconnect,
        protocolManager,
        fullyManageTabs,
        onCriConnectionClosed: clearSessionCdpUrl,
      })

      const browserCriClient = new BrowserCriClient({
        browserClient,
        versionInfo,
        host,
        port,
        browserName,
        onAsynchronousError,
        protocolManager,
        fullyManageTabs,
        onServiceWorkerClientEvent,
        onExtraTargetCriClientReady,
      })

      cypressSessions.setCdpBrowserWsUrl(versionInfo.webSocketDebuggerUrl)

      if (fullyManageTabs) {
        await this._manageTabs({ browserClient, browserCriClient, browserName, host, onAsynchronousError, port, protocolManager })
      }

      return browserCriClient
    }, browserName, port)
  }

  static async _manageTabs (options: ManageTabsOptions) {
    const { browserClient, browserCriClient, browserName, host, onAsynchronousError, port, protocolManager, childTargetInterceptionTimeoutMs = CHILD_TARGET_INTERCEPTION_TIMEOUT_MS } = options
    const promises = [
      browserClient.send('Target.setDiscoverTargets', { discover: true }),
      browserClient.send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: true, flatten: true }),
    ]

    browserClient.on('Target.attachedToTarget', async (event: Protocol.Target.AttachedToTargetEvent) => {
      await this._onAttachToTarget({ browserClient, browserCriClient, event, host, port, protocolManager, childTargetInterceptionTimeoutMs })
    })

    browserClient.on('Target.targetDestroyed', (event: Protocol.Target.TargetDestroyedEvent) => {
      this._onTargetDestroyed({ browserClient, browserCriClient, browserName, event, onAsynchronousError })
    })

    // Keeps the per-session state on this long-lived client bounded to
    // sessions that are actually still attached (#34674) - detachedFromTarget
    // carries a sessionId directly.
    browserClient.on('Target.detachedFromTarget', (event: Protocol.Target.DetachedFromTargetEvent) => {
      browserCriClient.sessionTargetInfo.delete(event.sessionId)
      browserCriClient.removeServiceWorkerBinding(event.sessionId)
      browserClient.removeSessionEnablements(event.sessionId)
    })

    browserClient.on('Inspector.targetReloadedAfterCrash', async (event, sessionId) => {
      // Things like service workers will effectively crash in terms of CDP when the page is reloaded in the middle of things
      // We will still auto attach in this case, but we need to runIfWaitingForDebugger to get the page back to a running state
      //
      // A crashed-and-reloaded service worker is the same worker
      // _onAttachToTarget originally paused, not a fresh attach - so this
      // is the other release path for the exact race #34674 guards
      // against. This event carries only a sessionId, not a TargetInfo;
      // sessionTargetInfo (populated in _onAttachToTarget) is how this
      // path tells a service worker's session apart from anything else
      // that can crash.
      //
      // Kept in its own try/catch, separate from the release below: even a
      // hypothetical throw while deciding whether to hold must never skip
      // the release itself.
      try {
        const targetInfo = sessionId ? browserCriClient.sessionTargetInfo.get(sessionId) : undefined

        if (!targetInfo) {
          debug('crash-release-unknown-session: no TargetInfo recorded for session %s, releasing immediately', sessionId)
        } else if (targetInfo.type !== 'service_worker') {
          debug('crash-release-skipped: session %s is a %s target (not a service worker), releasing immediately', sessionId, targetInfo.type)
        } else if (targetInfo.url.includes('chrome-extension://')) {
          debug('crash-release-skipped-extension: session %s is the extension service worker %s, releasing immediately', sessionId, targetInfo.targetId)
        } else if (!browserCriClient.reenableChildTargetInterception) {
          debug('crash-release-no-reenable: session %s is service worker %s but no re-enable hook is registered, releasing immediately', sessionId, targetInfo.targetId)
        } else {
          debug('crash-release-held: session %s (service worker %s) holding for re-enabled interception before release', sessionId, targetInfo.targetId)

          // See reenableChildTargetInterception's doc comment for why this
          // is asked to re-run interception rather than merely awaited for
          // a confirmation that may already be stale, or already fresh, by
          // the time this runs (#34674).
          const targetId = targetInfo.targetId

          await this._holdForChildTargetInterception(targetId, childTargetInterceptionTimeoutMs, () => browserCriClient.reenableChildTargetInterception!(targetId))
        }
      } catch (error) {
        debug('error deciding whether to hold session %s for interception coverage: %s', sessionId, error)
      }

      try {
        await browserClient.send('Runtime.runIfWaitingForDebugger', undefined, sessionId)
      } catch (error) {
        // it's possible that the target was closed before we can run. If so, just ignore
        debug('error running Runtime.runIfWaitingForDebugger:', error)
      }
    })

    await Promise.all(promises)
  }

  // Races getOutcome() against timeoutMs and returns either way; the caller
  // is what actually releases the target. Shared by both hold sites - a
  // fresh attach races waitForChildTargetInterception (waiting on a
  // confirmation nothing has had reason to invalidate yet), a crash-reload
  // races reenableChildTargetInterception (asking for a fresh one outright,
  // since a stale confirmation can't be told apart from a current one - see
  // that field's doc comment). Callers check their respective field is set
  // before calling; this only knows how to race and log, not what it's
  // racing.
  private static async _holdForChildTargetInterception (targetId: string, timeoutMs: number, getOutcome: () => Promise<unknown>): Promise<void> {
    const timedOut = Symbol('childTargetInterceptionTimedOut')
    let timeoutHandle: NodeJS.Timeout | undefined
    const startedAt = Date.now()

    try {
      const outcome = await Promise.race([
        getOutcome(),
        new Promise((resolve) => {
          timeoutHandle = setTimeout(() => resolve(timedOut), timeoutMs)
        }),
      ])

      if (outcome === timedOut) {
        debug('released-after-timeout: service worker %s released without interception coverage after %dms', targetId, timeoutMs)
      } else {
        debug('held-until-covered: service worker %s released after interception coverage (%dms elapsed)', targetId, Date.now() - startedAt)
      }
    } catch (error) {
      debug('service worker %s released without interception coverage: hold rejected: %s', targetId, error)
    } finally {
      // The winning side of the race leaves the other timer/promise
      // outstanding - clear it so a won-by-coverage race doesn't leave a
      // live timer for the full timeout duration.
      if (timeoutHandle) {
        clearTimeout(timeoutHandle)
      }
    }
  }

  static async _onAttachToTarget (options: AttachedToTargetOptions) {
    const { browserClient, browserCriClient, CriConstructor, event, host, port, protocolManager, childTargetInterceptionTimeoutMs = CHILD_TARGET_INTERCEPTION_TIMEOUT_MS } = options
    const CreateCRI = CriConstructor || CRI
    const { sessionId, targetInfo, waitingForDebugger } = event
    let { targetId, url } = targetInfo

    debug('Target.attachedToTarget %o', targetInfo)

    // Recorded for every target, not just service workers - see
    // sessionTargetInfo's own doc comment for why (#34674).
    browserCriClient.sessionTargetInfo.set(sessionId, targetInfo)

    // Registered synchronously, for the same reason sessionTargetInfo is:
    // Target.detachedFromTarget can land while an await below is pending, and
    // it only releases bindings already tracked.
    if (targetInfo.type === 'service_worker') {
      browserCriClient.addServiceWorkerBinding(sessionId)
    }

    try {
      // The basic approach here is we attach to targets and enable network traffic
      // We must attach in a paused state so that we can enable network traffic before the target starts running.
      // We don't track child tabs/page network traffic. 'other' targets can't have network enabled
      if (event.targetInfo.type !== 'page' && event.targetInfo.type !== 'other') {
        await browserClient.send('Network.enable', protocolManager?.networkEnableOptions ?? DEFAULT_NETWORK_ENABLE_OPTIONS, event.sessionId)
      }
    } catch (error) {
      // it's possible that the target was closed before we could enable
      // network and continue, in that case, just ignore
      debug('error running Network.enable:', error)
    }

    try {
      // attach a binding to the runtime so that the worker's client events
      // reach the listener registered above
      if (event.targetInfo.type === 'service_worker') {
        await browserClient.send('Runtime.addBinding', { name: serviceWorkerClientEventHandlerName }, event.sessionId)
      }
    } catch (error) {
      debug('error adding service worker binding:', error)
    }

    // the url often isn't specified with this event, so we get it from
    // Target.getTargets. Done ahead of the !waitingForDebugger return below
    // (rather than only for extra-target classification further down) so a
    // target that attaches already running still gets sessionTargetInfo
    // backfilled - it's not a fresh attach again, so this is its only chance
    // (#34674: the crash-reload path otherwise stays stuck classifying it
    // off the attach event's empty url forever).
    if (!url) {
      try {
        const { targetInfos } = await browserClient.send('Target.getTargets')

        const thisTarget = targetInfos.find((target) => target.targetId === targetId)

        if (thisTarget) {
          url = thisTarget.url

          // The early set above (recorded so it's visible to a crash-reload
          // racing this handler) captured the event's TargetInfo, which
          // still has the pre-backfill empty url - update it so a later
          // crash-reload classifies this target off the same url this
          // handler just used.
          browserCriClient.sessionTargetInfo.set(sessionId, { ...targetInfo, url })
        }
      } catch (error) {
        // it's possible that the target was closed before we could look it
        // up, in that case, just ignore - this listener has no catch of its
        // own, so an uncaught rejection here would surface as an unhandled
        // rejection and crash the run (unhandled_exceptions.ts). Falling
        // through leaves url as '' here, so this target can't be classified
        // as DevTools/Launchpad/extension below - it falls through as
        // unclassified, which in practice means the connection is dying and
        // the extra-target connect attempt just below fails too; a service
        // worker that can't be recognized as the extension's own takes the
        // full hold instead of the immediate release.
        debug('error backfilling target url from Target.getTargets:', error)
      }
    }

    if (!waitingForDebugger) {
      debug('Not waiting for debugger (id: %s)', targetId)

      // a target created before we started listening won't be waiting
      // for the debugger and is therefore not an extra target
      return
    }

    async function run () {
      try {
        await browserClient.send('Runtime.runIfWaitingForDebugger', undefined, sessionId)
      } catch (error) {
        // it's possible that the target was closed before we could tell it to run, in that case, just ignore
        debug('error running Runtime.runIfWaitingForDebugger: %o', error)
      }
    }

    if (
      // if resetting browser targets, the first target attached to is the
      // main Cypress tab, but hasn't been set as
      // browserCriClient.currentlyAttachedTarget yet
      browserCriClient.resettingBrowserTargets
      // is the main Cypress tab
      || targetId === browserCriClient.currentlyAttachedTarget?.targetId
      // is not a tab/window, such as a service worker
      || targetInfo.type !== 'page'
      // is DevTools
      || url.includes('devtools://')
      // is the Launchpad
      || url.includes('__launchpad')
      // is chrome extension service worker
      || url.includes('chrome-extension://')
    ) {
      debug('Not an extra target (id: %s)', targetId)

      // See waitForChildTargetInterception's doc comment for the full
      // timeline this hold closes (#34674).
      if (targetInfo.type === 'service_worker' && url.includes('chrome-extension://')) {
        // The page connection never attaches the Cypress extension's own
        // service worker, so holding here would burn the full timeout on
        // every attach and on every MV3 idle-restart, stalling the
        // extension's own automation.
        debug('skipped-extension: service worker %s is the extension service worker, releasing without a hold', targetId)
      } else if (targetInfo.type === 'service_worker' && browserCriClient.waitForChildTargetInterception) {
        await this._holdForChildTargetInterception(targetId, childTargetInterceptionTimeoutMs, () => browserCriClient.waitForChildTargetInterception!(targetId))
      }

      // in these cases, we don't want to track the targets as extras.
      // we're only interested in extra tabs or windows
      return await run()
    }

    debug('Connect as extra target (id: %s)', targetId)

    let extraTargetCriClient

    try {
      extraTargetCriClient = await CreateCRI({
        host,
        port,
        target: targetId,
        local: true,
        useHostName: true,
      })
    } catch (err: any) {
      debug('Errored connecting to target (id: %s): %s', targetId, err?.stack || err)

      return await run()
    }

    browserCriClient.addExtraTargetClient(targetInfo, extraTargetCriClient)

    // Fetch.enable + continue must stay paired — enabling without a continue
    // handler pauses every popup request forever. Used whenever
    // onExtraTargetCriClientReady is absent, returns no CDP Fetch runtime, or
    // fails: mark extra targets with this header so the MITM proxy can
    // recognize where they came from and run only the minimal middleware
    // necessary.
    const fallbackToHeaderOnlyContinue = async () => {
      try {
        await extraTargetCriClient.send('Fetch.enable')
      } catch (enableErr) {
        // swallow this error so it doesn't crash Cypress
        debug('Fetch.enable failed on extra target#%s: %s', targetId, enableErr)
      }

      extraTargetCriClient.on('Fetch.requestPaused', async (params: Protocol.Fetch.RequestPausedEvent) => {
        // headers are received as an object but need to be an array to modify them
        const headers = _.map(params.request.headers, (value, name) => ({ name, value }))

        const details: Protocol.Fetch.ContinueRequestRequest = {
          requestId: params.requestId,
          headers: [
            ...headers,
            { name: EXTRA_TARGET_HEADER, value: 'true' },
          ],
        }

        extraTargetCriClient.send('Fetch.continueRequest', details).catch((err) => {
          // swallow this error so it doesn't crash Cypress
          debug('continueRequest failed, url: %s, error: %s', params.request.url, err?.stack || err)
        })
      })
    }

    let detach: ExtraTargetDetach | undefined

    try {
      detach = await browserCriClient.onExtraTargetCriClientReady?.(extraTargetCriClient as CdpClientShape)
    } catch (err) {
      debug('onExtraTargetCriClientReady failed on extra target#%s: %s', targetId, err)
    }

    if (detach) {
      const tracked = browserCriClient.getExtraTargetClient(targetId)

      if (tracked) {
        tracked.detach = detach
      } else {
        // Target was destroyed while attaching, so _onTargetDestroyed could
        // not call detach (it was not stored yet). Not awaited: a raw
        // extra-target CRI client has no crash guard, so Fetch.disable to a
        // dead renderer may never answer and would suspend this handler
        // frame forever. Matches _onTargetDestroyed's own detach call.
        Promise.resolve(detach()).catch((err) => {
          debug('error detaching orphaned extra target Fetch transport %s: %o', targetId, err)
        })
      }
    } else {
      // No hook, hook returned no CDP Fetch runtime, or the hook failed —
      // keep requests flowing without shared middleware.
      await fallbackToHeaderOnlyContinue()
    }

    await run()
  }

  static _onTargetDestroyed ({ browserClient, browserCriClient, browserName, event, onAsynchronousError }: TargetDestroyedOptions) {
    debug('Target.targetDestroyed %o', {
      event,
      closing: browserCriClient.closing,
      closed: browserCriClient.closed,
      resettingBrowserTargets: browserCriClient.resettingBrowserTargets,
    })

    const { targetId } = event

    // Target.targetDestroyed carries no sessionId, unlike detachedFromTarget
    // - sweep for any session(s) recorded against this targetId instead
    // (there's normally exactly one, but nothing guarantees that) so no
    // per-session state is retained for a target that's gone (#34674).
    // Deleting mid-iteration is safe here: the loop only ever deletes the entry
    // it's currently positioned on, which Map iterators tolerate.
    for (const [sessionId, targetInfo] of browserCriClient.sessionTargetInfo) {
      if (targetInfo.targetId === targetId) {
        browserCriClient.sessionTargetInfo.delete(sessionId)
        browserCriClient.removeServiceWorkerBinding(sessionId)
        browserClient.removeSessionEnablements(sessionId)
      }
    }

    if (targetId !== browserCriClient.currentlyAttachedTarget?.targetId) {
      if (browserCriClient.hasExtraTargetClient(targetId)) {
        debug('Close extra target client (id: %s)')
        const extra = browserCriClient.getExtraTargetClient(targetId)!

        Promise.resolve(extra.detach?.()).catch((err) => {
          debug('error detaching extra target Fetch transport %s: %o', targetId, err)
        })

        extra.client.close().catch((err) => {
          debug('error closing extra target client %s: %o', targetId, err)
        })

        browserCriClient.removeExtraTargetClient(targetId)
      }

      // we may have gotten a delayed "Target.targetDestroyed" event for a page that we
      // have already closed/disposed, so unless this matches our current target then bail
      return
    }

    // otherwise...
    // the page or browser closed in an unexpected manner and we need to bubble up this error
    // by calling onError() with either browser or page was closed
    //
    // we detect this by waiting up to 500ms for either the browser's websocket connection to be closed
    // OR from process.exit(...) firing
    // if the browser's websocket connection has been closed then that means the page was closed
    //
    // otherwise it means the the browser itself was closed

    const debugCloseError = (targetName: string) => {
      return (err: Error) => {
        debug('error closing %s target client after Target.targetDestroyed for %s: %o', targetName, targetId, err)
      }
    }

    // always close the connection to the page targets because it was destroyed
    browserCriClient.currentlyAttachedTarget.close().catch(debugCloseError('page'))
    browserCriClient.currentlyAttachedProtocolTarget?.close().catch(debugCloseError('protocol'))
    browserCriClient.currentlyAttachedCyPromptTarget?.close().catch(debugCloseError('cy-prompt'))
    browserCriClient.currentlyAttachedStudioTarget?.close().catch(debugCloseError('studio'))

    const targetDestroyedAt = Date.now()

    new Bluebird((resolve) => {
      // this event could fire either expectedly or unexpectedly
      // it's not a problem if we're expected to be closing the browser naturally
      // and not as a result of an unexpected page or browser closure
      if (browserCriClient.resettingBrowserTargets) {
        debug('Target.targetDestroyed received for %s while resettingBrowserTargets is true', targetId)

        // do nothing, we're good
        return resolve(true)
      }

      if (typeof browserCriClient.gracefulShutdown !== 'undefined') {
        debug('Target.targetDestroyed received for %s while gracefulShutdown is %o', targetId, browserCriClient.gracefulShutdown)

        return resolve(browserCriClient.gracefulShutdown)
      }

      // when process.on('exit') is called, we call onClose
      browserCriClient.onClose = (gracefulShutdown) => {
        debug('onClose called with %o %dms after Target.targetDestroyed for %s', gracefulShutdown, Date.now() - targetDestroyedAt, targetId)

        resolve(gracefulShutdown)
      }

      // or when the browser's CDP ws connection is closed
      browserClient.ws?.once('close', () => {
        debug('browser websocket closed %dms after Target.targetDestroyed for %s', Date.now() - targetDestroyedAt, targetId)

        resolve(false)
      })
    })
    .timeout(500)
    .then((expectedDestroyedEvent) => {
      if (expectedDestroyedEvent === true) {
        return
      }

      // browserClient websocket was disconnected
      // or we've been closed due to process.on('exit')
      // meaning the browser was closed and not just the page
      errors.throwErr('BROWSER_PROCESS_CLOSED_UNEXPECTEDLY', browserName)
    })
    .catch(Bluebird.TimeoutError, () => {
      debug('neither a browser websocket close nor onClose was observed within 500ms of Target.targetDestroyed for %s', targetId)
      // the browser websocket didn't close meaning
      // only the page was closed, not the browser
      errors.throwErr('BROWSER_PAGE_CLOSED_UNEXPECTEDLY', browserName)
    })
    .catch((err) => {
      // stop the run instead of moving to the next spec
      err.isFatalApiErr = true

      onAsynchronousError(err)
    })
  }

  /**
   * Attaches to a target with the given url
   *
   * @param url the url to attach to
   * @returns the chrome remote interface wrapper for the target
   */
  attachToTargetUrl = async (url: string): Promise<CriClient> => {
    // Continue trying to re-attach until successful.
    // If the browser opens slowly, this will fail until
    // The browser and automation API is ready, so we try a few
    // times until eventually timing out.
    return retryWithIncreasingDelay(async () => {
      debug('Attaching to target url %s', url)
      const { targetInfos: targets } = await this.browserClient.send('Target.getTargets')

      const target = targets.find((target) => target.url === url)

      if (!target) {
        throw new Error(`Could not find url target in browser ${url}. Targets were ${JSON.stringify(targets)}`)
      }

      this.currentlyAttachedTarget = await CriClient.create({
        target: target.targetId,
        onAsynchronousError: this.onAsynchronousError,
        host: this.host,
        port: this.port,
        protocolManager: this.protocolManager,
        fullyManageTabs: this.fullyManageTabs,
        browserClient: this.browserClient,
      })

      // Clone the target here so that we separate the protocol client and the main client.
      // This allows us to close the protocol client independently of the main client
      // which we do when we exit out of studio in open mode.
      this.currentlyAttachedProtocolTarget = await this.currentlyAttachedTarget.clone()
      await this.protocolManager?.connectToBrowser(this.currentlyAttachedProtocolTarget)

      return this.currentlyAttachedTarget
    }, this.browserName, this.port)
  }

  /**
   * Resets the browser's targets optionally keeping a tab open
   *
   * @param shouldKeepTabOpen whether or not to keep the tab open
   */
  resetBrowserTargets = async (shouldKeepTabOpen: boolean): Promise<void> => {
    if (this.closed) {
      debug('browser cri client is closed, not resetting browser targets')

      return
    }

    // If the browser process crashed, the underlying connection is dead and any
    // `Target.*` command we send here will never resolve (hanging the run) or
    // reject (throwing out of post-spec teardown). There are no targets left to
    // reset, so skip it entirely. @see https://github.com/cypress-io/cypress/issues/24338
    if (this.browserClient.crashed) {
      debug('browser cri client is crashed, not resetting browser targets')

      return
    }

    this.resettingBrowserTargets = true

    if (!this.currentlyAttachedTarget) {
      throw new Error('Cannot close target because no target is currently attached')
    }

    let target

    // If we are keeping a tab open, we need to first launch a new default tab prior to closing the existing one
    if (shouldKeepTabOpen) {
      target = await this.browserClient.send('Target.createTarget', { url: 'about:blank' })
    }

    debug('currently attached targets', this.currentlyAttachedTarget.targetId, this.currentlyAttachedTarget.closed)

    if (!this.currentlyAttachedTarget.closed) {
      debug('closing current target %s', this.currentlyAttachedTarget.targetId)

      await this.browserClient.send('Target.closeTarget', { targetId: this.currentlyAttachedTarget.targetId })

      debug('target closed', this.currentlyAttachedTarget.targetId)

      const debugResetCloseError = (targetName: string) => {
        return (err: Error) => {
          debug('error closing %s target client while resetting browser targets: %o', targetName, err)
        }
      }

      await Promise.all([
        this.currentlyAttachedTarget.close().catch(debugResetCloseError('page')),
        this.currentlyAttachedProtocolTarget?.close().catch(debugResetCloseError('protocol')),
        this.currentlyAttachedCyPromptTarget?.close().catch(debugResetCloseError('cy-prompt')),
        this.currentlyAttachedStudioTarget?.close().catch(debugResetCloseError('studio')),
      ])

      debug('target client closed', this.currentlyAttachedTarget.targetId)
    }

    this.currentlyAttachedTarget.queue.subscriptions.forEach((subscription) => {
      this.browserClient.off(subscription.eventName, subscription.cb as any)
    })

    this.currentlyAttachedProtocolTarget?.queue.subscriptions.forEach((subscription) => {
      this.browserClient.off(subscription.eventName, subscription.cb as any)
    })

    this.currentlyAttachedCyPromptTarget?.queue.subscriptions.forEach((subscription) => {
      this.browserClient.off(subscription.eventName, subscription.cb as any)
    })

    this.currentlyAttachedStudioTarget?.queue.subscriptions.forEach((subscription) => {
      this.browserClient.off(subscription.eventName, subscription.cb as any)
    })

    if (target) {
      this.currentlyAttachedTarget = await CriClient.create({
        target: target.targetId,
        onAsynchronousError: this.onAsynchronousError,
        host: this.host,
        port: this.port,
        protocolManager: this.protocolManager,
        fullyManageTabs: this.fullyManageTabs,
        browserClient: this.browserClient,
      })

      const currentTarget = this.currentlyAttachedTarget

      const createProtocolTarget = async () => {
        this.currentlyAttachedProtocolTarget = await currentTarget.clone()
      }

      const createCyPromptTarget = async () => {
        this.currentlyAttachedCyPromptTarget = await currentTarget.clone()
      }

      const createStudioTarget = async () => {
        this.currentlyAttachedStudioTarget = await currentTarget.clone()
      }

      await Promise.all([
        createProtocolTarget(),
        createCyPromptTarget(),
        createStudioTarget(),
      ])
    } else {
      this.currentlyAttachedTarget = undefined
      this.currentlyAttachedProtocolTarget = undefined
      this.currentlyAttachedCyPromptTarget = undefined
      this.currentlyAttachedStudioTarget = undefined
    }

    this.resettingBrowserTargets = false
  }

  addExtraTargetClient (targetInfo: Protocol.Target.TargetInfo, client: CRI.Client) {
    this.extraTargetClients.set(targetInfo.targetId, { client, targetInfo })
  }

  hasExtraTargetClient (targetId: TargetId) {
    return this.extraTargetClients.has(targetId)
  }

  getExtraTargetClient (targetId: TargetId) {
    return this.extraTargetClients.get(targetId)
  }

  removeExtraTargetClient (targetId: TargetId) {
    this.extraTargetClients.delete(targetId)
  }

  // The browser client outlives every spec in the run, so each binding is keyed
  // by session for `Target.detachedFromTarget` to remove.
  addServiceWorkerBinding (sessionId: SessionId) {
    // replacing the map entry alone would strand the listener it displaced
    this.removeServiceWorkerBinding(sessionId)

    const listener = serviceWorkerClientEventHandler(this.onServiceWorkerClientEvent)

    this.serviceWorkerBindings.set(sessionId, listener)
    this.browserClient.on(serviceWorkerBindingEvent(sessionId), listener)
  }

  removeServiceWorkerBinding (sessionId: SessionId) {
    const listener = this.serviceWorkerBindings.get(sessionId)

    if (!listener) {
      return
    }

    debug('Remove service worker binding (session: %s)', sessionId)

    this.serviceWorkerBindings.delete(sessionId)
    this.browserClient.off(serviceWorkerBindingEvent(sessionId), listener)
  }

  // Detaching the Fetch transport is left to `Target.targetDestroyed`, which
  // already does it. Extra-target clients are raw chrome-remote-interface
  // handles with no crashed state, so a `Fetch.disable` sent to an already-dead
  // renderer can go unanswered. This runs before every test, so waiting on
  // detach here would risk hanging teardown on a dead popup.
  async closeExtraTargets () {
    await Promise.all(Array.from(this.extraTargetClients).map(async ([targetId]) => {
      debug('Close extra target (id: %s)', targetId)

      try {
        await this.browserClient.send('Target.closeTarget', { targetId })
      } catch (err: any) {
        debug('Closing extra target errored: %s', err?.stack || err)
      }
    }))
  }

  /**
   * @returns the websocket debugger URL for the currently connected browser
   */
  getWebSocketDebuggerUrl () {
    return this.versionInfo.webSocketDebuggerUrl
  }

  /**
   * Synchronously mark the root browser client and every attached target client
   * as crashed. Used when the browser *process* crashes (e.g. it exits with
   * SIGTRAP): unlike a renderer/tab crash, a process crash never emits
   * `Target.targetCrashed`, so nothing else flips these clients into the crashed
   * state. Without this, post-spec teardown (`resetBrowserTargets` via
   * `reset:browser:tabs:for:next:spec`, `afterSpec`, etc.) can issue CDP commands
   * on the dead connection that never resolve and hang the run.
   */
  markCrashed = () => {
    this.browserClient?.markCrashed()
    this.currentlyAttachedTarget?.markCrashed()
    this.currentlyAttachedProtocolTarget?.markCrashed()
    this.currentlyAttachedCyPromptTarget?.markCrashed()
    this.currentlyAttachedStudioTarget?.markCrashed()
  }

  /**
   * Closes the browser client socket as well as the socket for the currently attached page target
   */
  close = async (gracefulShutdown) => {
    this.gracefulShutdown = gracefulShutdown

    this.onClose && this.onClose(gracefulShutdown)

    cypressSessions.setCdpBrowserWsUrl(null)

    if (this.connected === false) {
      debug('browser cri client is already closed')

      return
    }

    this.closing = true
    this.connected = false

    if (this.currentlyAttachedTarget) {
      await Promise.all([
        this.currentlyAttachedTarget.close(),
        this.currentlyAttachedProtocolTarget?.close(),
        this.currentlyAttachedCyPromptTarget?.close(),
        this.currentlyAttachedStudioTarget?.close(),
      ])
    }

    await this.browserClient.close()

    this.closed = true
  }
}
