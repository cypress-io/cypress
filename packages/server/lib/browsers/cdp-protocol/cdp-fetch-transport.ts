import type { Protocol } from 'devtools-protocol'
import debugModule from 'debug'
import { STATUS_CODES } from 'http'
import { Readable } from 'stream'
import type { ForHttpIntercept } from '@packages/network-interception'
import { HttpIntercept } from '@packages/network-interception'
import type { ResourceType } from '@packages/proxy'
import type { BodyDigest } from './body-digest'
import { digestBody } from './body-digest'
import type { ICriClient } from './cri-client'
import { createCdpFetchCodec } from './cdp-fetch-codec'
import { CDPNetworkExtraInfo } from './cdp-network-extra-info'
import { toNetworkError } from './cdp-network-error'
import { AUT_FRAME_HEADER, EXTRA_TARGET_HEADER } from '../constants'
import { normalizeResourceType } from './normalize-resource-type'
import { shouldSkipResponseBody } from './should-skip-response-body'

const debug = debugModule('cypress:server:browsers:cdp-fetch-transport')

type CdpFetchClient = Pick<ICriClient, 'send' | 'on' | 'off'>

type CdpFetchRequest = Protocol.Fetch.RequestPausedEvent['request']
const RESPONSE_PAUSE_TIMEOUT_MS = 30000
const REDIRECT_STATUS_CODES = [301, 302, 303, 307, 308]

// Shared by every session this transport enables so none of them can drift
// into pausing a different set of requests than the others.
const FETCH_PATTERNS: Protocol.Fetch.EnableRequest = {
  patterns: [{
    requestStage: 'Request',
  }, {
    requestStage: 'Response',
  }],
}

// CDP refuses Fetch.getResponseBody for a pause in the redirect-received state,
// and documents a redirect status plus a location header as the way to tell that
// state apart from response-received. Drift from MITM: redirect bodies are
// therefore empty to middleware under proxy-disabled mode — CDP cannot provide
// them — so 3xx handling differs from the MITM path, which may still surface
// whatever the origin sent. That empty buffer is also the origin digest source,
// so an untouched 3xx continues natively while a middleware that writes a body
// onto one falls back to fulfill.
const isRedirectPause = (event: Protocol.Fetch.RequestPausedEvent): boolean => {
  return REDIRECT_STATUS_CODES.includes(event.responseStatusCode as number)
    && !!event.responseHeaders?.some(({ name }) => name.toLowerCase() === 'location')
}

// Internal Cypress markers injected onto paused requests for the
// intercept/legacy pipeline. Must never be forwarded to the origin — parity
// with ExtractCypressMetadataHeaders on the MITM path.
const INTERNAL_MARKER_HEADERS = new Set([
  AUT_FRAME_HEADER.toLowerCase(),
  EXTRA_TARGET_HEADER.toLowerCase(),
])

// Splits internal Cypress markers out of a header set in a single pass,
// reporting whether any were present.
const partitionInternalMarkers = (headers: Protocol.Network.Headers) => {
  const kept: Protocol.Network.Headers = {}
  let hadMarker = false

  for (const [name, value] of Object.entries(headers)) {
    if (INTERNAL_MARKER_HEADERS.has(name.toLowerCase())) {
      hadMarker = true
    } else {
      kept[name] = value
    }
  }

  return { kept, hadMarker }
}

// Unique per transport instance in this process — only needs to disambiguate
// concurrent extra-target sessions sharing one HttpIntercept, not to be
// globally unpredictable.
let extraTargetTransportCount = 0

type CdpFetchTransportOptions = {
  isAUTFrame?: (frameId: string) => Promise<boolean>
  /**
   * When true, mark every paused request with X-Cypress-Is-From-Extra-Target
   * so ExtractCypressMetadataHeaders can restrict the legacy pipeline to the
   * minimal extra-target middleware (MaybeSetBasicAuthHeaders). Stripped
   * before Fetch.continueRequest, same as the AUT frame marker.
   */
  isFromExtraTarget?: boolean
  /**
   * Pre-register a URL that will never receive Network.requestWillBeSent
   * (download-manager pauses omit networkId). Mirrors the MITM download-click
   * path so CorrelateBrowserPreRequest resolves immediately instead of waiting
   * the full pre-request timeout.
   */
  addPendingUrlWithoutPreRequest?: (url: string) => void
  /**
   * When set for a URL, the transport releases the request pause with a
   * page-invisible `Fetch.continueRequest` url override (plus the returned
   * headers) and releases the response pause untouched. No middleware runs
   * on the CDP side. Used to send strategy:file requests to the Cypress
   * origin regardless of what origin the page believes it is on — the wire
   * request lands on our Express server (which runs the pipeline exactly
   * once) while the page keeps its impersonated URL.
   */
  resolveOriginRedirect?: (url: string) => { url: string, headers: Record<string, string> } | undefined
  /**
   * Called with the HttpIntercept request id when the browser cancels a
   * request that is still paused in the middleware onion, so the pipeline can
   * tear the flow down the way a closed proxy socket does on the MITM path.
   */
  onRequestCanceled?: (requestId: string) => void
}

export interface CdpFetchTransportRequest extends CdpFetchRequest {
  id: string
  // Byte-accurate body for Fetch.continueRequest when middleware set a Buffer;
  // postData is its lossy utf8 string view, kept for pause comparison.
  postDataBuffer?: Buffer
  requestId?: string
  resourceType?: ResourceType
  sessionId?: string
}

export interface CdpFetchTransportResponse extends CdpFetchTransportRequest {
  body?: string
  bodySkipped?: boolean
  bodyStream?: Readable
  fulfilled?: boolean
  originalBodyDigest?: BodyDigest
  requestId: string
  responseCode: number
  responseHeaders?: Protocol.Fetch.HeaderEntry[]
}

/**
 * `headersReady` settles once the response pause has arrived and its headers
 * are resolved. RESPONSE_PAUSE_TIMEOUT_MS is bounded on that rather than on the
 * whole response so the body transfer, which can legitimately outlast the time
 * the browser took to respond, is not charged against a pause that arrived.
 */
type ResponsePauseDeferred = PromiseWithResolvers<CdpFetchTransportResponse> & {
  headersReady: PromiseWithResolvers<void>
  // key into inFlightByNetworkId; absent when the pause carried no networkId
  networkKey?: string
}

export class CdpFetchTransport {
  private readonly inFlightRequests = new Map<string, ResponsePauseDeferred>()
  /**
   * The same flows as `inFlightRequests`, keyed by session-scoped Network
   * request id. Cancellation only ever arrives on the Network domain
   * (`Network.loadingFailed`), which knows nothing about Fetch request ids.
   */
  private readonly inFlightByNetworkId = new Map<string, ResponsePauseDeferred>()
  /**
   * Prefix for HttpIntercept / synthetic-codec request ids when this transport
   * owns an extra-target session. CDP network/request ids are only unique per
   * session; without a prefix, concurrent extra targets (or an extra target
   * overlapping the main target) would collide in the shared intercept maps.
   */
  private readonly requestIdPrefix: string

  /**
   * Fetch.requestIds this transport redirected to the Cypress origin at the
   * request stage (see `options.resolveOriginRedirect`).
   *
   * Request and response pauses arrive as separate events, so the response
   * side needs this to recognize a redirected flow:
   *
   * - `interceptRequest` adds the id when a redirect resolves, then continues
   *   the request with the url override.
   * - `resolveResponse` deletes the id and releases that pause untouched.
   *   Express already ran the pipeline for these — running it again here
   *   would double-process the response.
   * - `reset` clears the rest: a flow aborted before its response pause
   *   arrives (navigation away) has nothing else to remove its entry.
   */
  private readonly originRedirectedRequests = new Set<string>()

  private isStarted = false

  constructor (
    private readonly client: CdpFetchClient,
    private readonly httpIntercept: ForHttpIntercept<CdpFetchTransportRequest, CdpFetchTransportResponse> = new HttpIntercept(createCdpFetchCodec()),
    private readonly options: CdpFetchTransportOptions = {},
    private readonly networkExtraInfo: CDPNetworkExtraInfo = new CDPNetworkExtraInfo(client),
  ) {
    this.requestIdPrefix = options.isFromExtraTarget
      ? `extra-${++extraTargetTransportCount}:`
      : ''
  }

  /**
   * Enables the Fetch domain on a single CDP session.
   *
   * `Fetch.enable` is scoped to the session it is sent on. Omitting
   * `sessionId` enables the connection's own session — the target this
   * transport was constructed for, plus its subframes — and reaches nothing
   * else. Sibling sessions on the same connection keep their own Fetch state,
   * so each one whose traffic must run the middleware onion needs its own
   * call; without it, that session's requests never pause and go straight to
   * the network.
   *
   * Only the enable is per-session. Pauses from every enabled session arrive
   * on the shared connection carrying their own `sessionId`, which
   * `interceptRequest`/`resolveResponse` thread back through each reply, so
   * one pair of handlers serves all of them.
   *
   * Within a session, enabling is not additive: the last call replaces the
   * pattern list (while `Fetch.requestPaused` handlers stack). This transport
   * must therefore be the sole owner of the Fetch domain on every session it
   * enables. Enabling alongside `cdp_automation._handlePausedRequests` on one
   * session clobbers patterns and races `continueRequest` calls, which can
   * drop the `X-Cypress-Is-AUT-Frame` header or hang document requests until
   * the response-pause timeout. Coordinating two owners is out of scope; do
   * not enable both on one session.
   */
  private async enableFetch (sessionId?: string): Promise<void> {
    debug('enabling CDP Fetch on session %s', sessionId ?? '<own>')

    await this.client.send('Fetch.enable', FETCH_PATTERNS, sessionId)
  }

  /**
   * Attaches the Fetch handlers and enables interception on this transport's
   * own session. Child sessions that attach later (service workers,
   * origin-isolated iframes) come through `attachChildSession`.
   */
  async start (): Promise<void> {
    if (this.isStarted) {
      debug('start skipped (already started)')

      return
    }

    debug('starting CDP Fetch transport')
    this.client.on('Fetch.requestPaused', this.interceptRequest)
    this.client.on('Fetch.requestPaused', this.resolveResponse)
    // The Fetch domain reports nothing when a paused request is canceled, so
    // the Network domain is the only signal that a flow is never coming back.
    this.client.on('Network.loadingFailed', this.onLoadingFailed)
    // Set-Cookie never appears on Fetch response pauses — the raw cookie
    // headers only arrive on the Network extraInfo events tracked here.
    this.networkExtraInfo.start()
    this.isStarted = true

    try {
      await this.enableFetch()

      debug('CDP Fetch transport started')
    } catch (err) {
      this.client.off('Fetch.requestPaused', this.interceptRequest)
      this.client.off('Fetch.requestPaused', this.resolveResponse)
      this.client.off('Network.loadingFailed', this.onLoadingFailed)
      this.networkExtraInfo.stop()
      this.isStarted = false

      throw err
    }
  }

  /**
   * Enables interception on a child session attached to this transport's
   * connection. Those targets run their network on their own session rather
   * than the page's — a service worker's script fetch and fetch handlers, an
   * out-of-process iframe's (OOPIF) subresources — so without this their
   * requests bypass the middleware onion (and `cy.intercept`) entirely and
   * escape to the real origin.
   *
   * Must run while the target is still waiting for the debugger; the caller
   * (CriClient._onAttachedToTarget) sequences this before
   * Runtime.runIfWaitingForDebugger.
   */
  async attachChildSession (sessionId: string): Promise<void> {
    if (!this.isStarted) {
      debug('attachChildSession skipped (transport not started)')

      return
    }

    await this.enableFetch(sessionId)
  }

  /**
   * Clears in-flight request correlation without disabling CDP Fetch.
   * Used between tests so the next test still receives paused traffic.
   */
  reset (): void {
    debug('resetting CDP Fetch transport (%d in-flight request(s))', this.inFlightRequests.size)
    this.rejectAll(new Error('CDP Fetch transport reset'))
    // Redirected flows aborted mid-request (navigation away) never reach a
    // response pause, so nothing else would clear them.
    this.originRedirectedRequests.clear()
    this.networkExtraInfo.flush()
  }

  async stop (): Promise<void> {
    if (!this.isStarted) {
      debug('stop skipped (not started)')

      return
    }

    debug('stopping CDP Fetch transport (%d in-flight request(s))', this.inFlightRequests.size)

    try {
      await this.client.send('Fetch.disable')
    } finally {
      this.client.off('Fetch.requestPaused', this.interceptRequest)
      this.client.off('Fetch.requestPaused', this.resolveResponse)
      this.client.off('Network.loadingFailed', this.onLoadingFailed)
      this.rejectAll(new Error('CDP Fetch transport stopped'))
      this.networkExtraInfo.stop()
      this.isStarted = false
      debug('CDP Fetch transport stopped')
    }
  }

  /**
   * The browser canceling a paused request — test isolation navigating to
   * about:blank is the common case — leaves its flow with nothing to wait for:
   * CDP emits no Fetch event for an abandoned pause, and the request never
   * reaches the network, so no pre-request or response pause is ever coming.
   *
   * Propagating the cancellation lets the pipeline's existing teardown run,
   * which on the MITM path is driven by the dying proxy socket. Both halves
   * are needed and neither is a no-op for the other's case: the abort covers a
   * flow still in request middleware (typically parked in pre-request
   * correlation, whose 2s timer would otherwise expire and log a warning), the
   * rejection covers one already continued and waiting on a response pause.
   */
  private onLoadingFailed = (event: Protocol.Network.LoadingFailedEvent, sessionId?: string): void => {
    // A request that failed on the wire still gets a Fetch response pause
    // carrying its error reason — resolveResponse owns those, and treating
    // them as cancellations here would silence a real failure.
    if (!event.canceled) {
      return
    }

    const networkKey = this.getNetworkKey(event.requestId, sessionId)
    const deferred = this.inFlightByNetworkId.get(networkKey)

    if (!deferred) {
      return
    }

    debug('browser canceled in-flight request %s', networkKey)

    this.inFlightByNetworkId.delete(networkKey)
    this.options.onRequestCanceled?.(`${this.requestIdPrefix}${event.requestId}`)
    deferred.reject(new Error(`CDP Fetch request canceled by the browser: ${networkKey}`))
  }

  private getNetworkKey (networkRequestId: string, sessionId?: string): string {
    return `${sessionId ?? 'root'}:${networkRequestId}`
  }

  private interceptRequest = async (event: Protocol.Fetch.RequestPausedEvent, sessionId?: string): Promise<void> => {
    if (event.responseErrorReason || typeof event.responseStatusCode === 'number') {
      return
    }

    let originRedirect: { url: string, headers: Record<string, string> } | undefined

    try {
      originRedirect = this.options.resolveOriginRedirect?.(event.request.url)
    } catch (err) {
      // A resolver failure must not strand the pause — fall through to the
      // normal interception flow.
      debug('resolveOriginRedirect failed for %s: %s', event.request.url, (err as Error).message)
    }

    if (originRedirect) {
      debug('redirecting %s to the Cypress origin (%s) — page keeps its URL', event.request.url, originRedirect.url)

      // The Express-side pipeline still runs pre-request correlation for the
      // direct request, so pauses without networkId (download-manager) must be
      // pre-registered here just like intercepted ones. Correlation keys on
      // the page URL — Network events report it, not the override.
      if (!event.networkId) {
        this.options.addPendingUrlWithoutPreRequest?.(event.request.url)
      }

      this.originRedirectedRequests.add(event.requestId)

      try {
        await this.client.send('Fetch.continueRequest', {
          requestId: event.requestId,
          // The url override is not observable by the page: location, history,
          // Network events, and the HTTP cache all keep the impersonated URL.
          url: originRedirect.url,
          headers: [
            ...Object.entries(event.request.headers).map(([name, value]) => ({ name, value: String(value) })),
            ...Object.entries(originRedirect.headers).map(([name, value]) => ({ name, value })),
          ],
        }, sessionId)
      } catch (err) {
        debug('origin-redirect continueRequest failed for %s, releasing untouched: %s', event.request.url, (err as Error).message)

        // If CDP rejected the override params, a bare release still frees the
        // pause. The set entry stays valid: the un-overridden request reaches
        // the same origin (the override is identity today), and its response
        // pause must still be released untouched.
        await this.safeSend('Fetch.continueRequest', {
          requestId: event.requestId,
        }, sessionId)
      }

      return
    }

    // Fetch.requestId is unique per redirect hop and stable across that hop's
    // request-stage and response-stage pauses — it keys pause pairing only.
    // networkId (Network.requestWillBeSent id) is optional and shared across
    // hops; it joins Network-domain state (pre-requests, extraInfo), not the
    // in-flight Fetch map. Pre-request correlation is handled separately by the
    // addPendingUrlWithoutPreRequest registration below when networkId is absent.
    const fetchRequestId = event.requestId
    const networkRequestId = event.networkId ?? event.requestId
    let requestContinued = false
    let response: CdpFetchTransportResponse | undefined
    let responseRequestId: string | undefined
    let responseSessionId: string | undefined
    let deferred: ResponsePauseDeferred | undefined

    try {
      debug('intercepting request pause %s %s (fetchRequestId=%s, networkRequestId=%s, resourceType=%s)',
        event.request.method,
        event.request.url,
        fetchRequestId,
        networkRequestId,
        event.resourceType)

      // Without networkId there will never be a matching browser pre-request.
      // Register the URL so CorrelateBrowserPreRequest does not burn ~2s waiting.
      if (!event.networkId) {
        this.options.addPendingUrlWithoutPreRequest?.(event.request.url)
      }

      const request: CdpFetchTransportRequest = {
        ...event.request,
        headers: {
          ...event.request.headers,
        },
        id: `${this.requestIdPrefix}${networkRequestId}`,
        requestId: event.requestId,
        resourceType: normalizeResourceType(event.resourceType),
        sessionId,
      }

      // Mark AUT documents for the intercept/legacy pipeline the same way the
      // MITM path does (header in, stripped before upstream). Never send this
      // internal marker to the origin on Fetch.continueRequest.
      const markAsAUTFrame = event.resourceType === 'Document' && event.frameId && this.options.isAUTFrame
        ? await this.options.isAUTFrame(event.frameId)
        : false

      if (markAsAUTFrame) {
        debug('marking AUT frame document %s', event.request.url)
        // Node's IncomingMessage lowercases headers on the MITM path; the
        // synthetic CDP codec does not. Use the lowercase form ExtractCypressMetadataHeaders reads.
        request.headers[AUT_FRAME_HEADER.toLowerCase()] = 'true'
      }

      // Extra-target sessions (popups / _blank) share this transport with
      // isFromExtraTarget so MaybeSetBasicAuthHeaders still runs under
      // CYPRESS_INTERNAL_DISABLE_PROXY=1 (MITM never sees those requests).
      if (this.options.isFromExtraTarget) {
        debug('marking extra-target request %s', event.request.url)
        request.headers[EXTRA_TARGET_HEADER.toLowerCase()] = 'true'
      }

      const responseDeferred: ResponsePauseDeferred = {
        ...Promise.withResolvers<CdpFetchTransportResponse>(),
        headersReady: Promise.withResolvers<void>(),
        ...(event.networkId ? { networkKey: this.getNetworkKey(event.networkId, sessionId) } : {}),
      }

      // reset()/stop() may reject this before the continue callback races on
      // it (e.g. a between-tests reset while request middleware is still
      // running); observe it so that never becomes an unhandled rejection.
      // Releasing headersReady also ends a wait no pause will ever arrive for.
      responseDeferred.promise.catch((err: Error) => {
        debug('in-flight response deferred rejected for %s: %s', event.request.url, err.message)
        responseDeferred.headersReady.resolve()
      })

      deferred = responseDeferred

      this.inFlightRequests.set(fetchRequestId, deferred)

      if (deferred.networkKey) {
        this.inFlightByNetworkId.set(deferred.networkKey, deferred)
      }

      response = await this.httpIntercept.handle(request, async (outbound) => {
        const headers = await this.continueRequestHeaders(event, outbound)

        debug('continuing request %s %s %o',
          outbound.method ?? event.request.method,
          outbound.url,
          {
            urlChanged: outbound.url !== event.request.url,
            methodChanged: outbound.method !== event.request.method,
            postDataChanged: outbound.postData !== event.request.postData,
            headersChanged: !!headers,
          })

        await this.client.send('Fetch.continueRequest', {
          requestId: event.requestId,
          ...(outbound.url !== event.request.url ? { url: outbound.url } : {}),
          ...(outbound.method !== event.request.method ? { method: outbound.method } : {}),
          // Fetch.continueRequest's postData is a CDP binary param (base64
          // over JSON); the pause's event.request.postData is plaintext, so
          // only the outgoing value is encoded. Sending plaintext makes CDP
          // reject the continue ("invalid base64 string") — or worse, accept
          // base64-shaped plaintext and hand the origin corrupted bytes.
          ...(outbound.postDataBuffer || outbound.postData !== event.request.postData
            ? { postData: (outbound.postDataBuffer ?? Buffer.from(outbound.postData ?? '', 'utf8')).toString('base64') }
            : {}),
          ...(headers ? { headers } : {}),
        }, outbound.sessionId)

        requestContinued = true

        let timeout: NodeJS.Timeout | undefined

        try {
          await Promise.race([
            responseDeferred.headersReady.promise,
            new Promise<never>((_resolve, reject) => {
              timeout = setTimeout(() => {
                reject(new Error(`Timed out waiting for CDP Fetch response pause for ${event.request.url}`))
              }, RESPONSE_PAUSE_TIMEOUT_MS)
            }),
          ])

          const pausedResponse = await responseDeferred.promise

          responseRequestId = pausedResponse.requestId
          responseSessionId = pausedResponse.sessionId

          return pausedResponse
        } finally {
          if (timeout) {
            clearTimeout(timeout)
          }
        }
      })

      if (response.fulfilled) {
        // base64 of the gzip magic bytes starts with 'H4sI' — an encoded body
        // here with no content-encoding header means mangled rendering
        debug('fulfilling %s: status %s, content-encoding %s, body prefix %s', event.request.url, response.responseCode, response.responseHeaders?.find(({ name }) => name.toLowerCase() === 'content-encoding')?.value, response.body?.slice(0, 8))

        await this.client.send('Fetch.fulfillRequest', {
          requestId: response.requestId,
          responseCode: response.responseCode,
          // CDP rejects a status code it has no built-in reason phrase for
          // ("Invalid http status code or phrase"), which turns req.reply(777)
          // into a silently released pause. Node's MITM path serves unknown
          // codes with the phrase "unknown"; mirror that.
          responsePhrase: STATUS_CODES[response.responseCode] ?? 'unknown',
          ...(response.responseHeaders ? { responseHeaders: response.responseHeaders } : {}),
          ...(response.body !== undefined ? { body: response.body } : {}),
        }, response.sessionId)
      } else {
        debug('continuing response %s: status %s', event.request.url, response.responseCode)

        await this.client.send('Fetch.continueResponse', {
          requestId: response.requestId,
          responseCode: response.responseCode,
          // Chrome rejects a code it has no built-in phrase for; for every
          // known code, omit the phrase so the origin's own phrase survives
          // the pass-through untouched.
          ...(STATUS_CODES[response.responseCode] ? {} : { responsePhrase: 'unknown' }),
          ...(response.responseHeaders ? { responseHeaders: response.responseHeaders } : {}),
        }, response.sessionId)
      }

      this.cleanup(fetchRequestId, deferred)
    } catch (err) {
      if (requestContinued) {
        deferred?.reject(err as Error)
      }

      this.cleanup(fetchRequestId, deferred)

      if (event.networkId) {
        // an errored flow gets no more pauses, so nothing will consume its
        // extraInfo tracking — clear it here
        this.networkExtraInfo.clear(event.networkId, sessionId)
      }

      if (!requestContinued) {
        // A requested network error (cy.intercept forceNetworkError) must
        // reach the page as one — MITM resets the connection; here the pause
        // is failed. Everything else releases untouched as before.
        if ((err as Error & { isForceNetworkError?: boolean })?.isForceNetworkError) {
          await this.safeSend('Fetch.failRequest', {
            requestId: event.requestId,
            errorReason: 'Failed',
          }, sessionId)
        } else {
          await this.safeSend('Fetch.continueRequest', {
            requestId: event.requestId,
          }, sessionId)
        }
      } else if ((err as Error & { isForceNetworkError?: boolean })?.isForceNetworkError) {
        // A network error requested from a response handler
        // (res.send({ forceNetworkError: true })) must reach the page as one
        // too. The request stage already continued, so the pause in hand is the
        // response — fail it rather than releasing the origin's response.
        await this.safeSend('Fetch.failRequest', {
          requestId: response?.requestId ?? responseRequestId ?? event.requestId,
          errorReason: 'Failed',
        }, response?.sessionId ?? responseSessionId ?? sessionId)
      } else {
        const continueRequestId = response?.requestId ?? responseRequestId

        if (continueRequestId) {
          await this.safeSend('Fetch.continueResponse', {
            requestId: continueRequestId,
          }, response?.sessionId ?? responseSessionId ?? sessionId)
        }
      }

      debug('CDP Fetch transport error: %s', (err as Error).stack || (err as Error).message)
    }
  }

  private resolveResponse = async (event: Protocol.Fetch.RequestPausedEvent, sessionId?: string): Promise<void> => {
    if (!event.responseErrorReason && typeof event.responseStatusCode !== 'number') {
      return
    }

    if (this.originRedirectedRequests.delete(event.requestId)) {
      debug('releasing redirected response pause for %s', event.request.url)

      // Nothing consumes extraInfo tracking for a redirected flow.
      if (event.networkId) {
        this.networkExtraInfo.clear(event.networkId, sessionId)
      }

      if (event.responseErrorReason) {
        await this.safeSend('Fetch.failRequest', {
          requestId: event.requestId,
          errorReason: event.responseErrorReason,
        }, sessionId)
      } else {
        await this.safeSend('Fetch.continueResponse', {
          requestId: event.requestId,
        }, sessionId)
      }

      return
    }

    // Same Fetch.requestId as the request-stage pause for this hop.
    const fetchRequestId = event.requestId
    const networkRequestId = event.networkId ?? event.requestId
    const deferred = this.inFlightRequests.get(fetchRequestId)

    if (!deferred) {
      // No flow ever consumes extraInfo tracking for an unmatched pause —
      // drop it here or it lingers until the next reset/stop.
      if (event.networkId) {
        this.networkExtraInfo.clear(event.networkId, sessionId)
      }

      if (event.responseErrorReason) {
        debug('failing unmatched response error pause: %s', event.request.url)
        await this.safeSend('Fetch.failRequest', {
          requestId: event.requestId,
          errorReason: event.responseErrorReason,
        }, sessionId)
      } else {
        debug('continuing unmatched response pause: %O', event)
        await this.safeSend('Fetch.continueResponse', {
          requestId: event.requestId,
        }, sessionId)
      }

      return
    }

    if (event.responseErrorReason) {
      debug('response error pause for matched request %s: %s', event.request.url, event.responseErrorReason)
      deferred.reject(toNetworkError(event.request.url, event.responseErrorReason))

      await this.safeSend('Fetch.failRequest', {
        requestId: event.requestId,
        errorReason: event.responseErrorReason,
      }, sessionId)

      return
    }

    if (typeof event.responseStatusCode !== 'number') {
      debug('response pause missing status code for matched request %s', event.request.url)
      deferred.reject(new Error(`CDP Fetch response did not include a status code for ${event.request.url}`))

      await this.safeSend('Fetch.continueResponse', {
        requestId: event.requestId,
      }, sessionId)

      return
    }

    debug('response pause for %s: status %s, header names %o', event.request.url, event.responseStatusCode, event.responseHeaders?.map(({ name }) => name))

    const responseHeaders = await this.withSetCookieHeaders(event, sessionId)

    deferred.headersReady.resolve()

    const bodySkipped = shouldSkipResponseBody(event)
    let originalBody: Buffer

    if (bodySkipped) {
      debug('skipping eager body fetch for stream-shaped response %s (resourceType=%s)', event.request.url, event.resourceType)

      // Stand in an empty body: its digest matches the empty body the
      // middleware materializes, so an untouched response takes
      // continueResponse and the browser reads the origin stream directly.
      // Middleware that sets a body still diffs against this digest and
      // fulfills.
      originalBody = Buffer.alloc(0)
    } else {
      try {
        originalBody = await this.fetchResponseBody(event, sessionId)
      } catch (err) {
        deferred.reject(new Error(`CDP Fetch response body unavailable for ${event.request.url}: ${(err as Error).message}`))

        await this.safeSend('Fetch.continueResponse', {
          requestId: event.requestId,
        }, sessionId)

        return
      }
    }

    // reset() may have rejected this flow while the merge/fetch awaited CDP.
    // The resolve below would be a no-op and nothing else owns this pause —
    // release it, or the browser stays paused (reset keeps Fetch enabled).
    if (this.inFlightRequests.get(fetchRequestId) !== deferred) {
      debug('releasing response pause rejected while awaiting CDP: %s', event.request.url)
      await this.safeSend('Fetch.continueResponse', {
        requestId: event.requestId,
      }, sessionId)

      return
    }

    debug('resolved response pause for %s: status %s, set-cookie count %d',
      event.request.url,
      event.responseStatusCode,
      responseHeaders?.filter(({ name }) => name.toLowerCase() === 'set-cookie').length ?? 0)

    deferred.resolve({
      ...event.request,
      id: `${this.requestIdPrefix}${networkRequestId}`,
      requestId: event.requestId,
      responseCode: event.responseStatusCode,
      responseHeaders,
      bodyStream: Readable.from(originalBody.length ? [originalBody] : []),
      originalBodyDigest: digestBody(originalBody),
      sessionId,
      ...(bodySkipped ? { bodySkipped: true } : {}),
    })
  }

  private withSetCookieHeaders = async (event: Protocol.Fetch.RequestPausedEvent, sessionId?: string): Promise<Protocol.Fetch.HeaderEntry[] | undefined> => {
    const extraInfo = event.networkId
      ? await this.networkExtraInfo.responseExtraInfo(event.networkId, sessionId)
      : undefined
    const setCookieValues = Object.entries(extraInfo?.headers ?? {})
    .filter(([name]) => name.toLowerCase() === 'set-cookie')
    // devtools folds multiple Set-Cookie values into one newline-separated string
    .flatMap(([, value]) => value.split('\n'))

    if (!setCookieValues.length) {
      return event.responseHeaders
    }

    debug('merged %d set-cookie header(s) from Network extraInfo for %s', setCookieValues.length, event.request.url)

    return [
      ...(event.responseHeaders ?? []).filter(({ name }) => name.toLowerCase() !== 'set-cookie'),
      ...setCookieValues.map((value) => ({ name: 'set-cookie', value })),
    ]
  }

  private fetchResponseBody = async (event: Protocol.Fetch.RequestPausedEvent, sessionId?: string): Promise<Buffer> => {
    if (isRedirectPause(event)) {
      return Buffer.alloc(0)
    }

    const response = await this.client.send('Fetch.getResponseBody', {
      requestId: event.requestId,
    }, sessionId) as Protocol.Fetch.GetResponseBodyResponse

    return Buffer.from(response.body, response.base64Encoded ? 'base64' : 'utf8')
  }

  private toContinueRequestHeaders (headers: Protocol.Network.Headers): Protocol.Fetch.HeaderEntry[] {
    return Object.entries(headers).map(([name, value]) => {
      return {
        name,
        value,
      }
    })
  }

  private headersChanged (left: Protocol.Network.Headers, right: Protocol.Network.Headers): boolean {
    // Compare case-insensitively — the synthetic Express path lowercases keys
    // like Node IncomingMessage, while CDP pause events keep browser casing.
    const normalize = (headers: Protocol.Network.Headers) => {
      return Object.fromEntries(
        Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value]),
      )
    }

    const leftNorm = normalize(left)
    const rightNorm = normalize(right)
    const leftKeys = Object.keys(leftNorm)
    const rightKeys = Object.keys(rightNorm)

    if (leftKeys.length !== rightKeys.length) {
      return true
    }

    return leftKeys.some((key) => leftNorm[key] !== rightNorm[key])
  }

  private safeSend = async (...args: Parameters<CdpFetchClient['send']>): Promise<void> => {
    try {
      await this.client.send(...args)
    } catch (err) {
      debug('CDP Fetch send failed: %s', (err as Error).message)
    }
  }

  /**
   * Builds continueRequest headers when outbound headers differ from the pause,
   * excluding internal Cypress markers (see partitionInternalMarkers).
   */
  private continueRequestHeaders = async (
    event: Protocol.Fetch.RequestPausedEvent,
    outbound: CdpFetchTransportRequest,
  ): Promise<Protocol.Fetch.HeaderEntry[] | undefined> => {
    const original = partitionInternalMarkers(event.request.headers)
    const withoutMarkers = partitionInternalMarkers(outbound.headers ?? {})

    // No meaningful header mutations and nothing to strip — omit headers from
    // continueRequest so CDP keeps the browser's original set.
    if (!this.headersChanged(withoutMarkers.kept, original.kept) && !original.hadMarker && !withoutMarkers.hadMarker) {
      return
    }

    return this.toContinueRequestHeaders(withoutMarkers.kept)
  }

  // Must NOT clear extraInfo tracking on success — the next response under a
  // reused network id may already be tracked, and CDPNetworkExtraInfo manages
  // its own lifecycle. Errored and unmatched flows clear at their own sites.
  private cleanup (fetchRequestId: string, deferred?: ResponsePauseDeferred): void {
    if (deferred && this.inFlightRequests.get(fetchRequestId) !== deferred) {
      return
    }

    this.inFlightRequests.delete(fetchRequestId)

    if (deferred?.networkKey && this.inFlightByNetworkId.get(deferred.networkKey) === deferred) {
      this.inFlightByNetworkId.delete(deferred.networkKey)
    }
  }

  private rejectAll (err: Error): void {
    if (!this.inFlightRequests.size) {
      return
    }

    debug('rejecting %d in-flight request(s): %s', this.inFlightRequests.size, err.message)

    for (const [fetchRequestId, deferred] of this.inFlightRequests) {
      deferred.reject(err)
      this.cleanup(fetchRequestId, deferred)
    }
  }
}
