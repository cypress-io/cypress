import type { Protocol } from 'devtools-protocol'
import debugModule from 'debug'
import type { ICriClient } from './cri-client'

const debug = debugModule('cypress:server:browsers:interception-escape-detector')

type DetectorClient = Pick<ICriClient, 'on' | 'off'>

export type InterceptionEscape = {
  url: string
  method: string
}

// Both ledgers are advisory (they only gate a warning), so they are bounded
// and evicted oldest-first rather than being allowed to grow with a
// long-running test. Sizes are generous for one test between resets.
const MAX_PAUSED_KEYS = 8192
const MAX_DOCUMENT_REQUESTS = 512

const requestKey = (method: string, url: string) => `${method} ${url}`

const networkKey = (requestId: string, sessionId?: string) => `${sessionId ?? 'root'}:${requestId}`

const addBounded = <T>(set: Set<T>, value: T, max: number) => {
  if (set.size >= max) {
    set.delete(set.values().next().value as T)
  }

  set.add(value)
}

/**
 * Observe-only tripwire for the browser network path: reports when a
 * service-worker-served document reached the renderer without passing through
 * CDP Fetch interception (#34674).
 *
 * The gap it watches for: Chrome can cold-start a service worker and let it
 * serve navigations seconds before Target.attachedToTarget is delivered on any
 * CDP connection. There is no session to enable Fetch on in that window, so
 * the worker's passthrough fetches reach the origin raw — no header stripping,
 * no injection, invisible to cy.intercept and Test Replay. Interception cannot
 * be restored after the fact (the Network domain is a read-only tap), so this
 * detector's job is to make the escape loud instead of letting it surface as
 * an unexplained visit timeout.
 *
 * Detection: a page-session `Network.responseReceived` for a Document with
 * `fromServiceWorker: true` is an escape when
 *
 * - no `Fetch.requestPaused` with the same method+URL was seen — a covered
 *   worker's passthrough `fetch(e.request)` pauses under the document's own
 *   method and URL (its networkId differs from the document's, so ids cannot
 *   be joined), and
 * - no service worker target is attached on this connection — while one is,
 *   a document with no pause is the healthy cache-served case
 *   (`caches.match()` never makes a network request), not an escape.
 *
 * Worker attach state comes from this connection's Target events. An attach
 * with `waitingForDebugger: false` means the worker was already running
 * uncovered — logged as corroboration, since the escapes it explains were
 * reported seconds earlier.
 *
 * Scope: documents on this connection only. Extra targets (popups) run their
 * network on their own connections and are not watched; subresource escapes
 * are deliberately out of scope (unmodified responses, page still works).
 */
export class InterceptionEscapeDetector {
  private readonly pausedKeys = new Set<string>()
  private readonly documentRequests = new Map<string, { method: string, url: string }>()
  private readonly workerTargets = new Map<string, string>()
  private isStarted = false

  constructor (
    private readonly client: DetectorClient,
    private readonly onEscape: (escape: InterceptionEscape) => void,
  ) {}

  start (): void {
    if (this.isStarted) {
      return
    }

    this.client.on('Fetch.requestPaused', this.onRequestPaused)
    this.client.on('Network.requestWillBeSent', this.onRequestWillBeSent)
    this.client.on('Network.responseReceived', this.onResponseReceived)
    this.client.on('Network.loadingFinished', this.onLoadingSettled)
    this.client.on('Network.loadingFailed', this.onLoadingSettled)
    this.client.on('Target.attachedToTarget', this.onAttachedToTarget)
    this.client.on('Target.detachedFromTarget', this.onDetachedFromTarget)
    this.isStarted = true
  }

  /**
   * Clears the per-test ledgers. Worker attach state deliberately survives:
   * an attached worker session stays attached (and Fetch-covered) across
   * tests, and forgetting it would misreport its cache-served documents.
   */
  reset (): void {
    this.pausedKeys.clear()
    this.documentRequests.clear()
  }

  stop (): void {
    if (!this.isStarted) {
      return
    }

    this.client.off('Fetch.requestPaused', this.onRequestPaused)
    this.client.off('Network.requestWillBeSent', this.onRequestWillBeSent)
    this.client.off('Network.responseReceived', this.onResponseReceived)
    this.client.off('Network.loadingFinished', this.onLoadingSettled)
    this.client.off('Network.loadingFailed', this.onLoadingSettled)
    this.client.off('Target.attachedToTarget', this.onAttachedToTarget)
    this.client.off('Target.detachedFromTarget', this.onDetachedFromTarget)
    this.reset()
    this.workerTargets.clear()
    this.isStarted = false
  }

  private onRequestPaused = (event: Protocol.Fetch.RequestPausedEvent): void => {
    addBounded(this.pausedKeys, requestKey(event.request.method, event.request.url), MAX_PAUSED_KEYS)
  }

  private onRequestWillBeSent = (event: Protocol.Network.RequestWillBeSentEvent, sessionId?: string): void => {
    if (event.type !== 'Document') {
      return
    }

    // Redirect hops re-emit under the same requestId; the overwrite keeps the
    // entry pointed at the URL the response will actually arrive under.
    if (this.documentRequests.size >= MAX_DOCUMENT_REQUESTS && !this.documentRequests.has(networkKey(event.requestId, sessionId))) {
      this.documentRequests.delete(this.documentRequests.keys().next().value as string)
    }

    this.documentRequests.set(networkKey(event.requestId, sessionId), {
      method: event.request.method,
      url: event.request.url,
    })
  }

  private onResponseReceived = (event: Protocol.Network.ResponseReceivedEvent, sessionId?: string): void => {
    if (event.type !== 'Document') {
      return
    }

    const request = this.documentRequests.get(networkKey(event.requestId, sessionId))

    this.documentRequests.delete(networkKey(event.requestId, sessionId))

    if (!event.response.fromServiceWorker) {
      return
    }

    const method = request?.method ?? 'GET'
    const url = request?.url ?? event.response.url

    if (this.pausedKeys.has(requestKey(method, url))) {
      return
    }

    if (this.workerTargets.size > 0) {
      debug('service-worker-served document with no Fetch pause while a worker session is attached (cache-served): %s %s', method, url)

      return
    }

    debug('interception escape: service-worker-served document with no Fetch pause and no attached worker session (#34674): %s %s', method, url)

    this.onEscape({ url, method })
  }

  private onLoadingSettled = (event: Protocol.Network.LoadingFinishedEvent | Protocol.Network.LoadingFailedEvent, sessionId?: string): void => {
    this.documentRequests.delete(networkKey(event.requestId, sessionId))
  }

  private onAttachedToTarget = (event: Protocol.Target.AttachedToTargetEvent): void => {
    if (event.targetInfo.type !== 'service_worker') {
      return
    }

    if (!event.waitingForDebugger) {
      debug('worker target %s attached already running — service-worker-served documents before this attach escaped interception (#34674)', event.targetInfo.targetId)
    }

    this.workerTargets.set(event.targetInfo.targetId, event.sessionId)
  }

  private onDetachedFromTarget = (event: Protocol.Target.DetachedFromTargetEvent): void => {
    if (event.targetId && this.workerTargets.delete(event.targetId)) {
      debug('worker target %s detached; its next start is the escape window until it re-attaches', event.targetId)
    }
  }
}
