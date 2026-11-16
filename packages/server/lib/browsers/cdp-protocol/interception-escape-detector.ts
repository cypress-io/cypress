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
 * - no unconsumed `Fetch.requestPaused` with the same method+URL exists — a
 *   covered worker's passthrough `fetch(e.request)` pauses under the
 *   document's own method and URL (its networkId differs from the document's,
 *   so ids cannot be joined). Only request-stage pauses are counted (the
 *   response-stage pause re-announces the same hop), and every document
 *   response consumes one credit for its key, service-worker-served or not —
 *   otherwise a pause from an earlier visit of the same URL (the pre-worker
 *   page-session document, or a previous intercepted passthrough) would
 *   vouch for a later escaped one, and
 *
 * - no service worker session is attached on this connection — while one is,
 *   a document with no pause is the healthy cache-served case
 *   (`caches.match()` never makes a network request), not an escape.
 *
 * Worker attach state comes from this connection's Target events, keyed by
 * sessionId — `Target.detachedFromTarget` always carries one, while its
 * targetId is deprecated; `Target.targetDestroyed` covers a destroy delivered
 * without a detach. An attach with `waitingForDebugger: false` means the
 * worker was already running uncovered — logged as corroboration, since the
 * escapes it explains were reported seconds earlier.
 *
 * Scope: documents on this connection only. Extra targets (popups) run their
 * network on their own connections and are not watched; subresource escapes
 * are deliberately out of scope (unmodified responses, page still works).
 */
export class InterceptionEscapeDetector {
  private readonly pauseCredits = new Map<string, number>()
  private readonly documentRequests = new Map<string, { method: string, url: string }>()
  private readonly workerSessions = new Map<string, string>()
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
    this.client.on('Target.targetDestroyed', this.onTargetDestroyed)
    this.isStarted = true
  }

  /**
   * Clears the per-test ledgers. Worker attach state deliberately survives:
   * an attached worker session stays attached (and Fetch-covered) across
   * tests, and forgetting it would misreport its cache-served documents.
   */
  reset (): void {
    this.pauseCredits.clear()
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
    this.client.off('Target.targetDestroyed', this.onTargetDestroyed)
    this.reset()
    this.workerSessions.clear()
    this.isStarted = false
  }

  private onRequestPaused = (event: Protocol.Fetch.RequestPausedEvent): void => {
    // The response-stage pause re-announces the same hop; counting it would
    // credit one interception twice. Same stage test as the transport's.
    if (event.responseErrorReason || typeof event.responseStatusCode === 'number') {
      return
    }

    const key = requestKey(event.request.method, event.request.url)

    if (this.pauseCredits.size >= MAX_PAUSED_KEYS && !this.pauseCredits.has(key)) {
      this.pauseCredits.delete(this.pauseCredits.keys().next().value as string)
    }

    this.pauseCredits.set(key, (this.pauseCredits.get(key) ?? 0) + 1)
  }

  // One credit per document response, whether or not it was worker-served:
  // a credit left behind by an earlier visit of the same URL must not vouch
  // for a later escaped one.
  private consumePauseCredit (key: string): boolean {
    const credits = this.pauseCredits.get(key)

    if (!credits) {
      return false
    }

    if (credits === 1) {
      this.pauseCredits.delete(key)
    } else {
      this.pauseCredits.set(key, credits - 1)
    }

    return true
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

    const method = request?.method ?? 'GET'
    const url = request?.url ?? event.response.url
    const hadPause = this.consumePauseCredit(requestKey(method, url))

    if (!event.response.fromServiceWorker || hadPause) {
      return
    }

    if (this.workerSessions.size > 0) {
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

    this.workerSessions.set(event.sessionId, event.targetInfo.targetId)
  }

  private onDetachedFromTarget = (event: Protocol.Target.DetachedFromTargetEvent): void => {
    const targetId = this.workerSessions.get(event.sessionId)

    if (this.workerSessions.delete(event.sessionId)) {
      debug('worker target %s detached; its next start is the escape window until it re-attaches', targetId)
    }
  }

  private onTargetDestroyed = (event: Protocol.Target.TargetDestroyedEvent): void => {
    for (const [sessionId, targetId] of this.workerSessions) {
      if (targetId === event.targetId) {
        this.workerSessions.delete(sessionId)
        debug('worker target %s destroyed; its next start is the escape window until it re-attaches', targetId)
      }
    }
  }
}
