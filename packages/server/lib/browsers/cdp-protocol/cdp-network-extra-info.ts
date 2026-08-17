import type { Protocol } from 'devtools-protocol'
import debugModule from 'debug'
import type { ICriClient } from './cri-client'

const debug = debugModule('cypress:server:browsers:cdp-network-extra-info')

type CDPNetworkExtraInfoClient = Pick<ICriClient, 'on' | 'off'>

type ExtraInfoDeferred = {
  deferred: PromiseWithResolvers<Protocol.Network.ResponseReceivedExtraInfoEvent | undefined>
  // requestWillBeSentExtraInfo arrived: this transaction is on the
  // instrumented wire path, so a response extraInfo will follow — hold for it
  expectsExtraInfo: boolean
  // the deferred has been resolved (extraInfo event, or authoritative none)
  settled: boolean
  // the pause consumed this entry; dropped when responseReceived sweeps it,
  // or replaced by the next response's events under a reused request id
  consumed: boolean
  // responseReceived arrived — the sweep signal, which for a paused request
  // can only follow the consume
  responseReceived: boolean
}

// A failure backstop (e.g. a connection dying mid-response), not a
// load-bearing wait: an expected extraInfo resolves the hold itself — it
// arrives with the pause in practice — and pauses expecting none skip the
// hold entirely.
const RESPONSE_EXTRA_INFO_TIMEOUT_MS = 100

/**
 * Correlates Network.responseReceivedExtraInfo with Fetch response pauses.
 *
 * Set-Cookie only travels on Network.responseReceivedExtraInfo — never on
 * the Fetch response pause the transport must answer. The raw headers feed
 * cookie simulation: the AUT runs in an iframe, so the middleware applies
 * Set-Cookie as if the AUT were top.
 *
 * One deferred promise per session-scoped request.
 * These are correlated via the Network event's requestId (Network.RequestId)
 * and the Fetch requestPaused event's networkId (Fetch.requestPaused.networkId).
 *
 * The load-bearing invariant: requestWillBeSentExtraInfo and
 * responseReceivedExtraInfo are emitted as a pair, by the same network
 * service observer, for every transaction that reaches the wire. A request
 * twin therefore guarantees a response extraInfo follows, and a
 * transaction that never emitted the twin (cache hits, service worker
 * responses) never produces a response extraInfo either. Validated
 * empirically across cold loads, disk cache, 304 revalidation, redirect
 * chains, and cross-origin requests (#34327). The one exception is a
 * request that dies on the wire after sending — twin without response
 * extraInfo — which is exactly what RESPONSE_EXTRA_INFO_TIMEOUT_MS
 * backstops.
 *
 * The Network events act on the entry:
 *
 * - Network.requestWillBeSentExtraInfo → the wait decision. Emitted at
 *   wire-send time, it is the only signal that precedes the response pause,
 *   so it alone decides whether a pause holds: present means a response
 *   extraInfo is coming (per the invariant above), absent means the pause
 *   can be answered immediately.
 * - Network.responseReceivedExtraInfo → the payload. Resolves the deferred
 *   with the event, which in practice lands within a millisecond of the
 *   pause, so the entry is usually already resolved when the pause asks.
 * - Network.responseReceived → the prompt sweeper. It fires when the response
 *   is delivered to the renderer, and delivery is exactly what a held pause
 *   blocks, so for any request the transport pauses it arrives only after
 *   that pause has been answered — it can never gate a hold. Its job is
 *   dropping the consumed entry. It never opens one: a request that never
 *   paused has nothing to correlate. Its hasExtraInfo branches are kept
 *   because hasExtraInfo is the only documented authority (the pairing
 *   invariant is empirical), and apply only to an entry already open.
 * - Network.loadingFinished / loadingFailed → the terminal sweep, covering
 *   what responseReceived cannot: requests that never produce a response at
 *   all (aborted, connection failure), whose entry its request twin already
 *   opened. Neither sweep subsumes the other — a streaming response
 *   (SSE, long poll) reports responseReceived immediately but has no
 *   terminal event until the stream closes.
 *
 * `responseExtraInfo` answers the pause immediately when the entry is
 * unsettled and nothing promised an extraInfo — that transaction never hit
 * the instrumented wire path. Otherwise it awaits the entry, backstopped by
 * RESPONSE_EXTRA_INFO_TIMEOUT_MS. A held pause blocks the browser from
 * advancing only that request, so later events for the same request id
 * (e.g. the next response in its redirect chain) cannot arrive while an
 * earlier response is parked. Unrelated requests flow through concurrently.
 *
 * An entry is dropped once the pause consumed it and its responseReceived
 * arrived — in that order, for anything the transport pauses. Only the
 * consume sets `consumed`; the extraInfo event just resolves the deferred.
 * The paths:
 *
 * - twin → extraInfo → consume (network-served, the common case): the
 *   consume returns an already-resolved event, marks `consumed`, and the
 *   post-release responseReceived sweeps the entry.
 * - twin → consume → extraInfo: the consume holds, the event resolves it,
 *   and the post-release responseReceived sweeps.
 * - consume with no twin (cache / service worker): returns empty with no
 *   hold, and the post-release responseReceived sweeps.
 * - twin → consume → no extraInfo (the request died on the wire): the
 *   timeout answers the pause, then the terminal sweep drops the entry.
 * - twin → no pause at all (aborted, or a session without Fetch enabled):
 *   nothing consumes the entry, and loadingFinished / loadingFailed drops it.
 *
 * The next response under a reused request id replaces a consumed entry, so
 * a redirect's intermediate responses — which never get their own
 * responseReceived — cannot strand one. `clear` (errored flows) and `flush`
 * (reset/stop) are the backstops for anything the sweeps never reach.
 */
export class CDPNetworkExtraInfo {
  private readonly extraInfo = new Map<string, ExtraInfoDeferred>()

  constructor (private readonly client: CDPNetworkExtraInfoClient) {}

  /**
   * Relies on the Network domain already being enabled on this client
   * (initializeCDP).
   */
  start (): void {
    this.client.on('Network.requestWillBeSentExtraInfo', this.onRequestWillBeSentExtraInfo)
    this.client.on('Network.responseReceived', this.onResponseReceived)
    this.client.on('Network.responseReceivedExtraInfo', this.onResponseReceivedExtraInfo)
    this.client.on('Network.loadingFinished', this.onLoadingEnded)
    this.client.on('Network.loadingFailed', this.onLoadingEnded)
  }

  stop (): void {
    this.client.off('Network.requestWillBeSentExtraInfo', this.onRequestWillBeSentExtraInfo)
    this.client.off('Network.responseReceived', this.onResponseReceived)
    this.client.off('Network.responseReceivedExtraInfo', this.onResponseReceivedExtraInfo)
    this.client.off('Network.loadingFinished', this.onLoadingEnded)
    this.client.off('Network.loadingFailed', this.onLoadingEnded)
    this.flush()
  }

  flush (): void {
    debug('flushing %d extraInfo entries', this.extraInfo.size)

    for (const entry of this.extraInfo.values()) {
      entry.deferred.resolve(undefined)
    }

    this.extraInfo.clear()
  }

  clear (requestId: string, sessionId?: string): void {
    const key = this.getExtraInfoDeferredKey(requestId, sessionId)

    debug('clearing extraInfo entry: %s', key)
    this.extraInfo.get(key)?.deferred.resolve(undefined)
    this.extraInfo.delete(key)
  }

  async responseExtraInfo (requestId: string, sessionId?: string): Promise<Protocol.Network.ResponseReceivedExtraInfoEvent | undefined> {
    const key = this.getExtraInfoDeferredKey(requestId, sessionId)
    const entry = this.ensureExtraInfoDeferred(key)

    let timeout: NodeJS.Timeout | undefined

    try {
      // unsettled with no extraInfo promised — this transaction never hit
      // the instrumented wire path (cache / service worker), so holding
      // would be pure latency
      if (!entry.settled && !entry.expectsExtraInfo && !entry.responseReceived) {
        debug('no extraInfo promised — skipping the hold: %s', key)

        return undefined
      }

      if (!entry.settled) {
        debug('holding for response extraInfo: %s', key)
      }

      const event = await Promise.race([
        entry.deferred.promise,
        new Promise<undefined>((resolve) => {
          timeout = setTimeout(() => {
            debug('timed out after %dms holding for response extraInfo: %s', RESPONSE_EXTRA_INFO_TIMEOUT_MS, key)
            resolve(undefined)
          }, RESPONSE_EXTRA_INFO_TIMEOUT_MS)
        }),
      ])

      debug('extraInfo consume resolved %s: %s', event ? 'with the event' : 'empty', key)

      return event
    } finally {
      if (timeout) {
        clearTimeout(timeout)
      }

      entry.consumed = true

      // drop only once responseReceived has also arrived — it fires after
      // this pause is answered, and deleting here would let it recreate a
      // stray entry. The identity check keeps a replacement entry (a later
      // response under a reused request id) intact.
      if (entry.responseReceived && this.extraInfo.get(key) === entry) {
        this.extraInfo.delete(key)
      }
    }
  }

  // Network events arrive for every session the CriClient forwards (service
  // workers, other targets), and CDP request ids are only unique per session —
  // scope all entries to the session the event arrived on.
  private getExtraInfoDeferredKey (requestId: string, sessionId?: string): string {
    return `${sessionId ?? 'root'}:${requestId}`
  }

  private ensureExtraInfoDeferred (key: string): ExtraInfoDeferred {
    let entry = this.extraInfo.get(key)

    // a consumed entry is a finished response — resolving into its spent
    // deferred would drop the Set-Cookie of the next response in a redirect
    // chain (same request id), so replace it
    if (!entry || entry.consumed) {
      entry = {
        deferred: Promise.withResolvers<Protocol.Network.ResponseReceivedExtraInfoEvent | undefined>(),
        expectsExtraInfo: false,
        settled: false,
        consumed: false,
        responseReceived: false,
      }

      this.extraInfo.set(key, entry)
    }

    return entry
  }

  private onRequestWillBeSentExtraInfo = (event: Protocol.Network.RequestWillBeSentExtraInfoEvent, sessionId?: string): void => {
    const key = this.getExtraInfoDeferredKey(event.requestId, sessionId)

    debug('request extraInfo twin arrived — response extraInfo expected: %s', key)

    // Every hop of a redirect chain emits its own twin, so this marks a new
    // response cycle for the request id. A settled entry here holds a previous
    // hop's payload — one whose extraInfo landed after its pause gave up —
    // and adopting it would make this hop's own extraInfo a no-op on a spent
    // deferred, merging the wrong hop's Set-Cookie.
    if (this.extraInfo.get(key)?.settled) {
      debug('replacing a settled entry from a previous response: %s', key)
      this.extraInfo.delete(key)
    }

    this.ensureExtraInfoDeferred(key).expectsExtraInfo = true
  }

  /**
   * A sweeper: this fires after the response is released, so the only thing
   * to do is clean up an entry still sitting in the map.
   */
  private onResponseReceived = (event: Protocol.Network.ResponseReceivedEvent, sessionId?: string): void => {
    const key = this.getExtraInfoDeferredKey(event.requestId, sessionId)
    const entry = this.extraInfo.get(key)

    // Never open an entry here: a request that never paused (memory cache) has
    // nothing to correlate, and an entry nothing consumes would leak.
    if (!entry) {
      return
    }

    if (entry.consumed) {
      debug('responseReceived swept the consumed entry: %s', key)
      this.extraInfo.delete(key)

      return
    }

    debug('responseReceived (hasExtraInfo: %s): %s', event.hasExtraInfo, key)

    entry.responseReceived = true

    if (!event.hasExtraInfo) {
      entry.settled = true
      entry.deferred.resolve(undefined)
    }
  }

  /**
   * Network.loadingFinished / loadingFailed are a request's terminal signals.
   * They fire after delivery — so after any pause the transport held has been
   * answered — and, unlike responseReceived, they also fire for requests that
   * never produce a response pause (an aborted request, or traffic on a
   * session where Fetch is not enabled). Dropping here keeps an entry opened
   * by a request twin from surviving to the next flush.
   */
  private onLoadingEnded = (event: Protocol.Network.LoadingFinishedEvent | Protocol.Network.LoadingFailedEvent, sessionId?: string): void => {
    const key = this.getExtraInfoDeferredKey(event.requestId, sessionId)
    const entry = this.extraInfo.get(key)

    if (!entry) {
      return
    }

    debug('loading ended — dropping the extraInfo entry: %s', key)
    entry.deferred.resolve(undefined)
    this.extraInfo.delete(key)
  }

  private onResponseReceivedExtraInfo = (event: Protocol.Network.ResponseReceivedExtraInfoEvent, sessionId?: string): void => {
    const key = this.getExtraInfoDeferredKey(event.requestId, sessionId)

    debug('response extraInfo arrived — settling the entry: %s', key)

    const entry = this.ensureExtraInfoDeferred(key)

    entry.settled = true
    entry.deferred.resolve(event)
  }
}
