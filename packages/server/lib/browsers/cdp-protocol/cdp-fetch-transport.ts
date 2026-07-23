import type { Protocol } from 'devtools-protocol'
import debugModule from 'debug'
import pDefer from 'p-defer'
import { Readable } from 'stream'
import { promisify } from 'util'
import zlib from 'zlib'
import type { ForHttpIntercept } from '@packages/network-interception'
import { HttpIntercept } from '@packages/network-interception'
import type { ICriClient } from './cri-client'
import { createCdpFetchCodec } from './cdp-fetch-codec'
import { AUT_FRAME_HEADER } from '../constants'

const debug = debugModule('cypress:server:browsers:cdp-fetch-transport')

type CdpFetchClient = Pick<ICriClient, 'send' | 'on' | 'off'>

type CdpFetchRequest = Protocol.Fetch.RequestPausedEvent['request']
const RESPONSE_PAUSE_TIMEOUT_MS = 30000
const brotliDecompress = promisify(zlib.brotliDecompress)
// Network.responseReceivedExtraInfo has no ordering guarantee relative to the
// Fetch response pause; bounded wait before giving up on cookie headers.
const RESPONSE_EXTRA_INFO_TIMEOUT_MS = 100

type CdpFetchTransportOptions = {
  isAUTFrame?: (frameId: string) => Promise<boolean>
}

export interface CdpFetchTransportRequest extends CdpFetchRequest {
  id: string
  requestId?: string
  sessionId?: string
}

export interface CdpFetchTransportResponse extends CdpFetchTransportRequest {
  body?: string
  bodyStream?: Readable
  fulfilled?: boolean
  requestId: string
  responseCode: number
  responseHeaders?: Protocol.Fetch.HeaderEntry[]
}

export class CdpFetchTransport {
  private readonly inFlightRequests = new Map<string, pDefer.DeferredPromise<CdpFetchTransportResponse>>()

  /**
   * The Set-Cookie merge: reordering an unordered CDP event stream.
   *
   * Set-Cookie only travels on Network.responseReceivedExtraInfo — never on
   * the Fetch response pause this transport must answer. Chromium gives no
   * ordering guarantee between that event, Network.responseReceived, and the
   * pause; extraInfo may arrive before the pause, after it, or never (cache
   * hits and service workers bypass the network stack entirely).
   *
   * Per flow, keyed by session + request id (`extraInfoKey`):
   *
   * - request time: Network.requestWillBeSentExtraInfo → `extraInfoExpected`.
   *   The only signal that reliably precedes the pause. Also absent for
   *   cache and service worker responses — which is exactly what lets them
   *   skip the hold.
   * - response time: Network.responseReceived → `hasExtraInfoByRequest`.
   *   Authoritative when present, but a paused response has not been
   *   delivered yet, so this often lands only after the pause is released.
   *   Network.responseReceivedExtraInfo → satisfies a parked waiter, else
   *   buffers in `responseExtraInfos`. Redirect hops and Early Hints reuse
   *   the request id, so the buffer is a list and entries are matched to a
   *   pause by status code.
   * - pause time (`responseExtraInfo`): buffered match → merge immediately.
   *   Otherwise gate on `hasExtraInfoByRequest ?? extraInfoExpected`:
   *   false → resolve with no hold; true → park a waiter for up to
   *   RESPONSE_EXTRA_INFO_TIMEOUT_MS, then resolve without the merge — a
   *   response can lose a cookie to the timeout, but can never hang on it.
   *
   * Tracking dies with its flow (`cleanup`, or at the pause site for
   * unmatched pauses) and reset()/stop() flush parked waiters immediately.
   */
  private readonly extraInfoExpected = new Set<string>()
  private readonly hasExtraInfoByRequest = new Map<string, boolean>()
  private readonly responseExtraInfos = new Map<string, Protocol.Network.ResponseReceivedExtraInfoEvent[]>()
  private readonly responseExtraInfoWaiters = new Map<string, { statusCode: number, resolve: (event?: Protocol.Network.ResponseReceivedExtraInfoEvent) => void }>()

  private isStarted = false

  constructor (
    private readonly client: CdpFetchClient,
    private readonly httpIntercept: ForHttpIntercept<CdpFetchTransportRequest, CdpFetchTransportResponse> = new HttpIntercept(createCdpFetchCodec()),
    private readonly options: CdpFetchTransportOptions = {},
  ) {}

  /**
   * Enables the CDP Fetch domain and starts intercepting requests.
   *
   * This transport must be the sole owner of the Fetch domain on its CDP
   * session. `Fetch.enable` is not additive: the last call on a session
   * replaces the pattern list, while `Fetch.requestPaused` handlers stack.
   * Enabling this alongside `cdp_automation._handlePausedRequests` on the
   * same session clobbers patterns and races `continueRequest` calls, which
   * can drop the `X-Cypress-Is-AUT-Frame` header or hang document requests
   * until the response-pause timeout. Coordinating the two owners is out of
   * scope; do not enable both on one session.
   */
  async start (): Promise<void> {
    if (this.isStarted) {
      return
    }

    this.client.on('Fetch.requestPaused', this.interceptRequest)
    this.client.on('Fetch.requestPaused', this.resolveResponse)
    // Set-Cookie never appears on Fetch response pauses — the raw cookie
    // headers only arrive on this separate Network event. Relies on the
    // Network domain already being enabled on this client (initializeCDP).
    // The request-side twin marks which requests will produce a response
    // extraInfo, so pauses without one never wait for it. responseReceived's
    // hasExtraInfo is the authoritative flag when it arrives in time.
    this.client.on('Network.requestWillBeSentExtraInfo', this.onRequestWillBeSentExtraInfo)
    this.client.on('Network.responseReceived', this.onResponseReceived)
    this.client.on('Network.responseReceivedExtraInfo', this.onResponseReceivedExtraInfo)
    this.isStarted = true

    try {
      await this.client.send('Fetch.enable', {
        patterns: [{
          requestStage: 'Request',
        }, {
          requestStage: 'Response',
        }],
      })
    } catch (err) {
      this.client.off('Fetch.requestPaused', this.interceptRequest)
      this.client.off('Fetch.requestPaused', this.resolveResponse)
      this.client.off('Network.requestWillBeSentExtraInfo', this.onRequestWillBeSentExtraInfo)
      this.client.off('Network.responseReceived', this.onResponseReceived)
      this.client.off('Network.responseReceivedExtraInfo', this.onResponseReceivedExtraInfo)
      this.isStarted = false

      throw err
    }
  }

  /**
   * Clears in-flight request correlation without disabling CDP Fetch.
   * Used between tests so the next test still receives paused traffic.
   */
  reset (): void {
    this.rejectAll(new Error('CDP Fetch transport reset'))
    this.flushResponseExtraInfos()
  }

  async stop (): Promise<void> {
    if (!this.isStarted) {
      return
    }

    try {
      await this.client.send('Fetch.disable')
    } finally {
      this.client.off('Fetch.requestPaused', this.interceptRequest)
      this.client.off('Fetch.requestPaused', this.resolveResponse)
      this.client.off('Network.requestWillBeSentExtraInfo', this.onRequestWillBeSentExtraInfo)
      this.client.off('Network.responseReceived', this.onResponseReceived)
      this.client.off('Network.responseReceivedExtraInfo', this.onResponseReceivedExtraInfo)
      this.rejectAll(new Error('CDP Fetch transport stopped'))
      this.flushResponseExtraInfos()
      this.isStarted = false
    }
  }

  private interceptRequest = async (event: Protocol.Fetch.RequestPausedEvent, sessionId?: string): Promise<void> => {
    if (event.responseErrorReason || typeof event.responseStatusCode === 'number') {
      return
    }

    let networkId: string | undefined
    let requestContinued = false
    let response: CdpFetchTransportResponse | undefined
    let responseRequestId: string | undefined
    let responseSessionId: string | undefined
    let deferred: pDefer.DeferredPromise<CdpFetchTransportResponse> | undefined

    try {
      if (!event.networkId) {
        debug('continuing request pause without network id: %s', event.request.url)
        await this.safeSend('Fetch.continueRequest', {
          requestId: event.requestId,
          ...(await this.autFrameHeader(event)),
        }, sessionId)

        return
      }

      networkId = event.networkId
      const request: CdpFetchTransportRequest = {
        ...event.request,
        headers: {
          ...event.request.headers,
        },
        id: networkId,
        requestId: event.requestId,
        sessionId,
      }

      // Mark AUT documents for the intercept/legacy pipeline the same way the
      // MITM path does (header in, stripped before upstream). Never send this
      // internal marker to the origin on Fetch.continueRequest.
      const markAsAUTFrame = event.resourceType === 'Document' && event.frameId && this.options.isAUTFrame
        ? await this.options.isAUTFrame(event.frameId)
        : false

      if (markAsAUTFrame) {
        // Node's IncomingMessage lowercases headers on the MITM path; the
        // synthetic CDP codec does not. Use the lowercase form ExtractCypressMetadataHeaders reads.
        request.headers[AUT_FRAME_HEADER.toLowerCase()] = 'true'
      }

      const responseDeferred = pDefer<CdpFetchTransportResponse>()

      // reset()/stop() may reject this before the continue callback races on
      // it (e.g. a between-tests reset while request middleware is still
      // running); observe it so that never becomes an unhandled rejection.
      responseDeferred.promise.catch((err: Error) => {
        debug('in-flight response deferred rejected for %s: %s', event.request.url, err.message)
      })

      deferred = responseDeferred

      this.inFlightRequests.set(networkId, deferred)

      response = await this.httpIntercept.handle(request, async (outbound) => {
        const headers = await this.continueRequestHeaders(event, outbound)

        await this.client.send('Fetch.continueRequest', {
          requestId: event.requestId,
          ...(outbound.url !== event.request.url ? { url: outbound.url } : {}),
          ...(outbound.method !== event.request.method ? { method: outbound.method } : {}),
          ...(outbound.postData !== event.request.postData ? { postData: outbound.postData } : {}),
          ...(headers ? { headers } : {}),
        }, outbound.sessionId)

        requestContinued = true

        let timeout: NodeJS.Timeout | undefined

        try {
          const pausedResponse = await Promise.race([
            responseDeferred.promise,
            new Promise<never>((_resolve, reject) => {
              timeout = setTimeout(() => {
                reject(new Error(`Timed out waiting for CDP Fetch response pause for ${event.request.url}`))
              }, RESPONSE_PAUSE_TIMEOUT_MS)
            }),
          ])

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
          ...(response.responseHeaders ? { responseHeaders: response.responseHeaders } : {}),
          ...(response.body !== undefined ? { body: response.body } : {}),
        }, response.sessionId)
      } else {
        await this.client.send('Fetch.continueResponse', {
          requestId: response.requestId,
          responseCode: response.responseCode,
          ...(response.responseHeaders ? { responseHeaders: response.responseHeaders } : {}),
        }, response.sessionId)
      }

      this.cleanup(networkId, deferred)
    } catch (err) {
      if (networkId) {
        if (requestContinued) {
          deferred?.reject(err as Error)
        }

        this.cleanup(networkId, deferred)
        // an errored flow gets no more pauses, so nothing will consume its
        // extraInfo tracking — clear it here
        this.clearExtraInfoTracking(networkId, sessionId)
      }

      if (!requestContinued) {
        await this.safeSend('Fetch.continueRequest', {
          requestId: event.requestId,
        }, sessionId)
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

    const deferred = event.networkId ? this.inFlightRequests.get(event.networkId) : undefined

    if (!deferred) {
      // No flow ever consumes extraInfo tracking for an unmatched pause —
      // drop it here or it lingers until the next reset/stop.
      if (event.networkId) {
        this.clearExtraInfoTracking(event.networkId, sessionId)
      }

      if (event.responseErrorReason) {
        debug('failing unmatched response error pause: %s', event.request.url)
        await this.safeSend('Fetch.failRequest', {
          requestId: event.requestId,
          errorReason: event.responseErrorReason,
        }, sessionId)
      } else {
        debug('continuing unmatched response pause: %s', event.request.url)
        await this.safeSend('Fetch.continueResponse', {
          requestId: event.requestId,
        }, sessionId)
      }

      return
    }

    if (event.responseErrorReason) {
      deferred.reject(new Error(`CDP Fetch response failed for ${event.request.url}: ${event.responseErrorReason}`))

      await this.safeSend('Fetch.failRequest', {
        requestId: event.requestId,
        errorReason: event.responseErrorReason,
      }, sessionId)

      return
    }

    if (typeof event.responseStatusCode !== 'number') {
      deferred.reject(new Error(`CDP Fetch response did not include a status code for ${event.request.url}`))

      await this.safeSend('Fetch.continueResponse', {
        requestId: event.requestId,
      }, sessionId)

      return
    }

    debug('response pause for %s: status %s, header names %o', event.request.url, event.responseStatusCode, event.responseHeaders?.map(({ name }) => name))

    const responseHeaders = await this.withSetCookieHeaders(event, sessionId)

    // reset() may have rejected this flow while the merge awaited extraInfo.
    // The resolve below would be a no-op and nothing else owns this pause —
    // release it, or the browser stays paused (reset keeps Fetch enabled).
    if (this.inFlightRequests.get(event.networkId!) !== deferred) {
      debug('releasing response pause rejected during set-cookie merge: %s', event.request.url)
      await this.safeSend('Fetch.continueResponse', {
        requestId: event.requestId,
      }, sessionId)

      return
    }

    const bodyStream = this.createResponseBodyStream(event.requestId, event.responseHeaders, sessionId)

    deferred.resolve({
      ...event.request,
      id: event.networkId!,
      requestId: event.requestId,
      responseCode: event.responseStatusCode,
      responseHeaders,
      bodyStream,
      sessionId,
    })
  }

  // Network events arrive for every session the CriClient forwards (service
  // workers, other targets), and CDP request ids are only unique per session —
  // scope all extraInfo tracking to the session the event arrived on.
  private extraInfoKey (requestId: string, sessionId?: string): string {
    return `${sessionId ?? 'root'}:${requestId}`
  }

  private clearExtraInfoTracking (requestId: string, sessionId?: string): void {
    const key = this.extraInfoKey(requestId, sessionId)

    this.extraInfoExpected.delete(key)
    this.hasExtraInfoByRequest.delete(key)
    this.responseExtraInfos.delete(key)
    // a parked waiter holds a live timeout whose deferred delete could remove
    // a newer waiter registered under a reused request id — release it too
    // (the waiter cancels its own timer and unregisters itself)
    this.responseExtraInfoWaiters.get(key)?.resolve(undefined)
  }

  // Redirect hops and Early Hints (103) reuse the request id, so extraInfo
  // events are matched to their pause by status code. Older protocol
  // payloads without a statusCode match any pause.
  private extraInfoMatchesStatus (event: Protocol.Network.ResponseReceivedExtraInfoEvent, statusCode: number): boolean {
    return event.statusCode == null || event.statusCode === statusCode
  }

  private onRequestWillBeSentExtraInfo = (event: Protocol.Network.RequestWillBeSentExtraInfoEvent, sessionId?: string): void => {
    this.extraInfoExpected.add(this.extraInfoKey(event.requestId, sessionId))
  }

  private onResponseReceived = (event: Protocol.Network.ResponseReceivedEvent, sessionId?: string): void => {
    this.hasExtraInfoByRequest.set(this.extraInfoKey(event.requestId, sessionId), event.hasExtraInfo)
  }

  private onResponseReceivedExtraInfo = (event: Protocol.Network.ResponseReceivedExtraInfoEvent, sessionId?: string): void => {
    const key = this.extraInfoKey(event.requestId, sessionId)
    const waiter = this.responseExtraInfoWaiters.get(key)

    // the response pause got here first and is holding for this event
    if (waiter && this.extraInfoMatchesStatus(event, waiter.statusCode)) {
      waiter.resolve(event)

      return
    }

    // this event got here first (or belongs to a different hop) — buffer it
    // for the matching pause to consume
    this.responseExtraInfos.set(key, [...this.responseExtraInfos.get(key) ?? [], event])
  }

  private takeBufferedExtraInfo (key: string, statusCode: number): Protocol.Network.ResponseReceivedExtraInfoEvent | undefined {
    // extraInfo events that arrived before their response pause buffer here
    const buffered = this.responseExtraInfos.get(key)

    if (!buffered) {
      return undefined
    }

    // find the entry belonging to this pause's hop by status code
    let index = buffered.findIndex((event) => this.extraInfoMatchesStatus(event, statusCode))

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

  private responseExtraInfo (networkId: string, statusCode: number, sessionId?: string): Promise<Protocol.Network.ResponseReceivedExtraInfoEvent | undefined> {
    const key = this.extraInfoKey(networkId, sessionId)
    // extraInfo already arrived ahead of the pause — nothing to wait for.
    // Consume only this hop's entry so redirect siblings buffered under the
    // same request id stay available for their own pauses.
    const buffered = this.takeBufferedExtraInfo(key, statusCode)

    if (buffered) {
      this.extraInfoExpected.delete(key)
      this.hasExtraInfoByRequest.delete(key)

      return Promise.resolve(buffered)
    }

    // responseReceived.hasExtraInfo is authoritative when it has arrived by
    // pause time; otherwise infer from the request-side extraInfo (no
    // request-side event → response-side never comes: cached / service
    // worker / no network hop) — don't hold the response.
    const hasExtraInfo = this.hasExtraInfoByRequest.get(key) ?? this.extraInfoExpected.has(key)

    this.extraInfoExpected.delete(key)
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
        resolve(this.takeBufferedExtraInfo(key, statusCode))
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

  private withSetCookieHeaders = async (event: Protocol.Fetch.RequestPausedEvent, sessionId?: string): Promise<Protocol.Fetch.HeaderEntry[] | undefined> => {
    const extraInfo = event.networkId && typeof event.responseStatusCode === 'number'
      ? await this.responseExtraInfo(event.networkId, event.responseStatusCode, sessionId)
      : undefined
    const setCookieValues = Object.entries(extraInfo?.headers ?? {})
    .filter(([name]) => name.toLowerCase() === 'set-cookie')
    // devtools folds multiple Set-Cookie values into one newline-separated string
    .flatMap(([, value]) => value.split('\n'))

    if (!setCookieValues.length) {
      return event.responseHeaders
    }

    return [
      ...(event.responseHeaders ?? []).filter(({ name }) => name.toLowerCase() !== 'set-cookie'),
      ...setCookieValues.map((value) => ({ name: 'set-cookie', value })),
    ]
  }

  private flushResponseExtraInfos (): void {
    this.extraInfoExpected.clear()
    this.hasExtraInfoByRequest.clear()
    this.responseExtraInfos.clear()

    for (const waiter of Array.from(this.responseExtraInfoWaiters.values())) {
      waiter.resolve(undefined)
    }
  }

  private createResponseBodyStream = (requestId: string, responseHeaders?: Protocol.Fetch.HeaderEntry[], sessionId?: string): Readable => {
    let reading = false
    let bodyStream: Readable

    bodyStream = new Readable({
      read: () => {
        if (reading) {
          return
        }

        reading = true

        void (async () => {
          try {
            const response = await this.client.send('Fetch.getResponseBody', {
              requestId,
            }, sessionId) as Protocol.Fetch.GetResponseBodyResponse

            const raw = Buffer.from(response.body, response.base64Encoded ? 'base64' : 'utf8')
            const body = await this.decodeUndeliveredEncodings(raw, responseHeaders)

            if (body.length) {
              bodyStream.push(body)
            }

            bodyStream.push(null)
          } catch (err) {
            bodyStream.destroy(err as Error)
          }
        })()
      },
    })

    return bodyStream
  }

  /**
   * Fetch.getResponseBody delivers gzip/deflate content-decoded, but brotli
   * arrives still encoded (and continueRequest cannot constrain
   * accept-encoding — the network stack owns that header). Decode br here so
   * the middleware's decoded-body premise holds. Falls back to the raw bytes
   * if decompression fails, in case a newer CDP starts decoding br itself.
   */
  private decodeUndeliveredEncodings = async (body: Buffer, responseHeaders?: Protocol.Fetch.HeaderEntry[]): Promise<Buffer> => {
    const contentEncoding = responseHeaders?.find(({ name }) => name.toLowerCase() === 'content-encoding')?.value

    if (!contentEncoding || !body.length) {
      return body
    }

    // encodings are listed in the order applied, so decode in reverse;
    // gzip/deflate layers were already decoded by CDP
    const encodings = contentEncoding.split(',').map((token) => token.trim().toLowerCase()).reverse()
    let decoded = body

    for (const encoding of encodings) {
      if (encoding !== 'br') {
        continue
      }

      try {
        decoded = await brotliDecompress(decoded)
      } catch (err) {
        debug('brotli decompression failed, using body as delivered: %s', (err as Error).message)

        return body
      }
    }

    return decoded
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

  private autFrameHeader = async (
    event: Protocol.Fetch.RequestPausedEvent,
    outbound: CdpFetchTransportRequest = {
      ...event.request,
      id: event.networkId ?? event.requestId,
      requestId: event.requestId,
    },
  ): Promise<Pick<Protocol.Fetch.ContinueRequestRequest, 'headers'>> => {
    // Requests without a networkId skip the intercept pipeline, so there is no
    // middleware to consume/strip the AUT marker. Never send it upstream.
    const headers = await this.continueRequestHeaders(event, outbound)

    return headers ? { headers } : {}
  }

  /**
   * Builds continueRequest headers when outbound headers differ from the pause
   * (excluding X-Cypress-Is-AUT-Frame). That marker is injected onto the paused
   * request for the intercept/legacy pipeline and must never be forwarded to
   * the origin — parity with ExtractCypressMetadataHeaders on the MITM path.
   */
  private continueRequestHeaders = async (
    event: Protocol.Fetch.RequestPausedEvent,
    outbound: CdpFetchTransportRequest,
  ): Promise<Protocol.Fetch.HeaderEntry[] | undefined> => {
    const stripAut = (headers: Protocol.Network.Headers) => {
      return Object.fromEntries(
        Object.entries(headers).filter(([name]) => {
          return name.toLowerCase() !== AUT_FRAME_HEADER.toLowerCase()
        }),
      )
    }

    const outboundWithoutAut = stripAut(outbound.headers ?? {})
    const originalWithoutAut = stripAut(event.request.headers)
    const originalHadAut = Object.keys(event.request.headers).some((name) => {
      return name.toLowerCase() === AUT_FRAME_HEADER.toLowerCase()
    })
    const outboundHadAut = Object.keys(outbound.headers ?? {}).some((name) => {
      return name.toLowerCase() === AUT_FRAME_HEADER.toLowerCase()
    })

    // No meaningful header mutations and nothing to strip — omit headers from
    // continueRequest so CDP keeps the browser's original set.
    if (!this.headersChanged(outboundWithoutAut, originalWithoutAut) && !originalHadAut && !outboundHadAut) {
      return
    }

    return this.toContinueRequestHeaders(outboundWithoutAut)
  }

  // Successful completion must NOT clear extraInfo tracking: redirect hops
  // share the network id, and the next hop's Network events can arrive
  // between this flow's continueResponse and its cleanup — wiping here would
  // drop that hop's Set-Cookie. The consume path already removed what this
  // flow used; errored flows clear their tracking at the catch site, and
  // unmatched pauses clear their own at the pause site.
  private cleanup (networkId: string, deferred?: pDefer.DeferredPromise<CdpFetchTransportResponse>): void {
    if (deferred && this.inFlightRequests.get(networkId) !== deferred) {
      return
    }

    this.inFlightRequests.delete(networkId)
  }

  private rejectAll (err: Error): void {
    for (const [networkId, deferred] of this.inFlightRequests) {
      deferred.reject(err)
      this.cleanup(networkId, deferred)
    }
  }
}
