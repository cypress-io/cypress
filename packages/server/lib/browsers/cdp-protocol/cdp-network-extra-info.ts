import type { Protocol } from 'devtools-protocol'
import type { ICriClient } from './cri-client'

type CDPNetworkExtraInfoClient = Pick<ICriClient, 'on' | 'off'>

// Network.responseReceivedExtraInfo has no ordering guarantee relative to the
// Fetch response pause; bounded wait before giving up on cookie headers.
const RESPONSE_EXTRA_INFO_TIMEOUT_MS = 100

/**
 * The Set-Cookie correlation: reordering an unordered CDP event stream.
 *
 * Set-Cookie only travels on Network.responseReceivedExtraInfo — never on
 * the Fetch response pause the transport must answer. Chromium gives no
 * ordering guarantee between that event, Network.responseReceived, and the
 * pause; extraInfo may arrive before the pause, after it, or never (cache
 * hits and service workers bypass the network stack entirely).
 *
 * Per flow, keyed by session + request id (`key`):
 *
 * - response time: Network.responseReceived → `hasExtraInfoByRequest`.
 *   Authoritative when present, but a paused response has not been
 *   delivered yet, so this often lands only after the pause is released.
 *   Network.responseReceivedExtraInfo → satisfies a parked waiter, else
 *   buffers in `responseExtraInfos`. Redirect hops and Early Hints reuse
 *   the request id, so the buffer is a list and entries are matched to a
 *   pause by status code.
 * - pause time (`responseExtraInfo`): buffered match → merge immediately.
 *   Otherwise gate on `hasExtraInfoByRequest ?? true`: false → resolve with
 *   no hold; anything else → park a waiter for up to
 *   RESPONSE_EXTRA_INFO_TIMEOUT_MS, then resolve without the merge — a
 *   response can lose a cookie to the timeout, but can never hang on it.
 *   The default is to hold: any request can come back with Set-Cookie, so
 *   only an authoritative "no extraInfo" skips the wait. Responses that
 *   never produce extraInfo (cache hits, service workers) pay the full
 *   bounded wait when responseReceived has not landed by pause time.
 *
 * Tracking dies with its flow (`clear`, driven by the transport's pause
 * handling) and `flush` releases parked waiters immediately on reset/stop.
 */
export class CDPNetworkExtraInfo {
  private readonly hasExtraInfoByRequest = new Map<string, boolean>()
  private readonly responseExtraInfos = new Map<string, Protocol.Network.ResponseReceivedExtraInfoEvent[]>()
  private readonly responseExtraInfoWaiters = new Map<string, { statusCode: number, resolve: (event?: Protocol.Network.ResponseReceivedExtraInfoEvent) => void }>()

  constructor (private readonly client: CDPNetworkExtraInfoClient) {}

  /**
   * Relies on the Network domain already being enabled on this client
   * (initializeCDP). responseReceived's hasExtraInfo is the authoritative
   * flag when it arrives in time.
   */
  start (): void {
    this.client.on('Network.responseReceived', this.onResponseReceived)
    this.client.on('Network.responseReceivedExtraInfo', this.onResponseReceivedExtraInfo)
  }

  stop (): void {
    this.client.off('Network.responseReceived', this.onResponseReceived)
    this.client.off('Network.responseReceivedExtraInfo', this.onResponseReceivedExtraInfo)
    this.flush()
  }

  flush (): void {
    this.hasExtraInfoByRequest.clear()
    this.responseExtraInfos.clear()

    for (const waiter of Array.from(this.responseExtraInfoWaiters.values())) {
      waiter.resolve(undefined)
    }
  }

  clear (requestId: string, sessionId?: string): void {
    const key = this.key(requestId, sessionId)

    this.hasExtraInfoByRequest.delete(key)
    this.responseExtraInfos.delete(key)
    // a parked waiter holds a live timeout whose deferred delete could remove
    // a newer waiter registered under a reused request id — release it too
    // (the waiter cancels its own timer and unregisters itself)
    this.responseExtraInfoWaiters.get(key)?.resolve(undefined)
  }

  responseExtraInfo (requestId: string, statusCode: number, sessionId?: string): Promise<Protocol.Network.ResponseReceivedExtraInfoEvent | undefined> {
    const key = this.key(requestId, sessionId)
    // extraInfo already arrived ahead of the pause — nothing to wait for.
    // Consume only this hop's entry so redirect siblings buffered under the
    // same request id stay available for their own pauses.
    const buffered = this.takeBuffered(key, statusCode)

    if (buffered) {
      this.hasExtraInfoByRequest.delete(key)

      return Promise.resolve(buffered)
    }

    // responseReceived.hasExtraInfo is authoritative when it has arrived by
    // pause time. Absent that, hold: any request can come back with a
    // Set-Cookie, so nothing short of an authoritative "no extraInfo" can
    // safely skip the bounded wait.
    const hasExtraInfo = this.hasExtraInfoByRequest.get(key) ?? true

    this.hasExtraInfoByRequest.delete(key)

    if (!hasExtraInfo) {
      // no raw headers are coming — there is no Set-Cookie to merge, so
      // waiting would only delay the response.
      return Promise.resolve(undefined)
    }

    // extraInfo is expected but hasn't arrived yet — park a waiter: resolve
    // with the matching hop's event when it lands, or resolve empty at the
    // timeout and let the response go out without the merge.
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.responseExtraInfoWaiters.delete(key)
        // a status-skewed event may have buffered while we held — a lone
        // candidate beats dropping its Set-Cookie on the floor
        resolve(this.takeBuffered(key, statusCode))
      }, RESPONSE_EXTRA_INFO_TIMEOUT_MS)

      this.responseExtraInfoWaiters.set(key, {
        statusCode,
        resolve: (event) => {
          clearTimeout(timeout)
          this.responseExtraInfoWaiters.delete(key)
          resolve(event)
        },
      })
    })
  }

  // Network events arrive for every session the CriClient forwards (service
  // workers, other targets), and CDP request ids are only unique per session —
  // scope all extraInfo tracking to the session the event arrived on.
  private key (requestId: string, sessionId?: string): string {
    return `${sessionId ?? 'root'}:${requestId}`
  }

  // Redirect hops and Early Hints (103) reuse the request id, so extraInfo
  // events are matched to their pause by status code. Older protocol
  // payloads without a statusCode match any pause.
  private matchesStatus (event: Protocol.Network.ResponseReceivedExtraInfoEvent, statusCode: number): boolean {
    return event.statusCode == null || event.statusCode === statusCode
  }

  private onResponseReceived = (event: Protocol.Network.ResponseReceivedEvent, sessionId?: string): void => {
    this.hasExtraInfoByRequest.set(this.key(event.requestId, sessionId), event.hasExtraInfo)
  }

  private onResponseReceivedExtraInfo = (event: Protocol.Network.ResponseReceivedExtraInfoEvent, sessionId?: string): void => {
    const key = this.key(event.requestId, sessionId)
    const waiter = this.responseExtraInfoWaiters.get(key)

    // the response pause got here first and is holding for this event
    if (waiter && this.matchesStatus(event, waiter.statusCode)) {
      waiter.resolve(event)

      return
    }

    // this event got here first (or belongs to a different hop) — buffer it
    // for the matching pause to consume
    this.responseExtraInfos.set(key, [...this.responseExtraInfos.get(key) ?? [], event])
  }

  private takeBuffered (key: string, statusCode: number): Protocol.Network.ResponseReceivedExtraInfoEvent | undefined {
    // extraInfo events that arrived before their response pause buffer here
    const buffered = this.responseExtraInfos.get(key)

    if (!buffered) {
      return undefined
    }

    // find the entry belonging to this pause's hop by status code
    let index = buffered.findIndex((event) => this.matchesStatus(event, statusCode))

    // Status matching only disambiguates between multiple hops. With a single
    // candidate a mismatch is status skew (e.g. a revalidated pause reporting
    // 200 while the wire said 304), and dropping it would drop its Set-Cookie.
    if (index === -1 && buffered.length === 1) {
      index = 0
    }

    if (index === -1) {
      return undefined
    }

    // consume only the matched entry — sibling hops keep theirs — and drop
    // the key once the buffer empties
    const [event] = buffered.splice(index, 1)

    if (!buffered.length) {
      this.responseExtraInfos.delete(key)
    }

    return event
  }
}
