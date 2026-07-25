import type { Protocol } from 'devtools-protocol'
import pDefer from 'p-defer'
import type { ICriClient } from './cri-client'

type CDPNetworkExtraInfoClient = Pick<ICriClient, 'on' | 'off'>

type ExtraInfoDeferred = {
  deferred: pDefer.DeferredPromise<Protocol.Network.ResponseReceivedExtraInfoEvent | undefined>
  // the pause consumed this entry; dropped when responseReceived arrives,
  // or replaced by the next response's events under a reused request id
  consumed: boolean
  // responseReceived arrived; dropped when the pause consumes the entry
  responseReceived: boolean
}

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
 * The two Network events act on the entry:
 *
 * - Network.responseReceivedExtraInfo → resolves the deferred with the
 *   event. When it beats everything else, the entry starts life already
 *   resolved.
 * - Network.responseReceived → hasExtraInfo is the source of truth: true
 *   guarantees an extraInfo event is coming (the deferred stays pending
 *   for it), false guarantees it is not (resolve empty so the pause never
 *   holds). For an entry the pause already consumed, this is the flow's
 *   last signal — it deletes the entry instead.
 *
 * `responseExtraInfo` awaits the entry (bounded by
 * RESPONSE_EXTRA_INFO_TIMEOUT_MS). A held pause blocks the browser from
 * advancing only that request, so later events for the same request id
 * (e.g. the next response in its redirect chain) cannot arrive while an
 * earlier response is parked. Unrelated requests flow through concurrently.
 *
 * An entry is dropped once both signals land: the pause consumed it and
 * its responseReceived arrived (usually only after the pause is released).
 * Only the consume sets `consumed` — the extraInfo event just resolves the
 * deferred. By arrival order:
 *
 * - extraInfo first: created already resolved; the consume returns the
 *   event and marks `consumed`; the post-release responseReceived carries
 *   nothing new and deletes the entry.
 * - responseReceived first, hasExtraInfo true: marks `responseReceived`
 *   and waits; extraInfo resolves the deferred; the consume deletes with
 *   both signals present.
 * - responseReceived first, hasExtraInfo false: marks `responseReceived`
 *   and resolves empty; the consume returns without holding and deletes.
 * - consume first, no signals: the bounded timeout releases the pause and
 *   marks `consumed`; the post-release responseReceived sweeps the entry.
 *
 * The next response under a reused request id replaces a consumed entry,
 * so a redirect's intermediate responses — which never get their own
 * responseReceived — cannot strand one. `clear` (errored flows) and
 * `flush` (reset/stop) drop whatever remains.
 */
export class CDPNetworkExtraInfo {
  private readonly extraInfo = new Map<string, ExtraInfoDeferred>()

  constructor (private readonly client: CDPNetworkExtraInfoClient) {}

  /**
   * Relies on the Network domain already being enabled on this client
   * (initializeCDP).
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
    for (const entry of this.extraInfo.values()) {
      entry.deferred.resolve(undefined)
    }

    this.extraInfo.clear()
  }

  clear (requestId: string, sessionId?: string): void {
    const key = this.getExtraInfoDeferredKey(requestId, sessionId)

    this.extraInfo.get(key)?.deferred.resolve(undefined)
    this.extraInfo.delete(key)
  }

  async responseExtraInfo (requestId: string, sessionId?: string): Promise<Protocol.Network.ResponseReceivedExtraInfoEvent | undefined> {
    const key = this.getExtraInfoDeferredKey(requestId, sessionId)
    const entry = this.ensureExtraInfoDeferred(key)

    let timeout: NodeJS.Timeout | undefined

    try {
      return await Promise.race([
        entry.deferred.promise,
        new Promise<undefined>((resolve) => {
          timeout = setTimeout(() => resolve(undefined), RESPONSE_EXTRA_INFO_TIMEOUT_MS)
        }),
      ])
    } finally {
      if (timeout) {
        clearTimeout(timeout)
      }

      entry.consumed = true

      // drop only once responseReceived has also arrived — it usually fires
      // after the pause is released, and deleting here would let it recreate
      // a stray entry. The identity check keeps a replacement entry (a later
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
        deferred: pDefer<Protocol.Network.ResponseReceivedExtraInfoEvent | undefined>(),
        consumed: false,
        responseReceived: false,
      }

      this.extraInfo.set(key, entry)
    }

    return entry
  }

  private onResponseReceived = (event: Protocol.Network.ResponseReceivedEvent, sessionId?: string): void => {
    const key = this.getExtraInfoDeferredKey(event.requestId, sessionId)
    const existing = this.extraInfo.get(key)

    // the pause already consumed this response's entry — responseReceived is
    // the flow's last signal, so drop the entry instead of recreating one
    if (existing?.consumed) {
      this.extraInfo.delete(key)

      return
    }

    const entry = this.ensureExtraInfoDeferred(key)

    entry.responseReceived = true

    if (!event.hasExtraInfo) {
      entry.deferred.resolve(undefined)
    }
  }

  private onResponseReceivedExtraInfo = (event: Protocol.Network.ResponseReceivedExtraInfoEvent, sessionId?: string): void => {
    this.ensureExtraInfoDeferred(this.getExtraInfoDeferredKey(event.requestId, sessionId)).deferred.resolve(event)
  }
}
