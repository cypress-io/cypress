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
import { CDPNetworkExtraInfo } from './cdp-network-extra-info'
import { AUT_FRAME_HEADER } from '../constants'

const debug = debugModule('cypress:server:browsers:cdp-fetch-transport')

type CdpFetchClient = Pick<ICriClient, 'send' | 'on' | 'off'>

type CdpFetchRequest = Protocol.Fetch.RequestPausedEvent['request']
const RESPONSE_PAUSE_TIMEOUT_MS = 30000
const brotliDecompress = promisify(zlib.brotliDecompress)

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

  private isStarted = false

  constructor (
    private readonly client: CdpFetchClient,
    private readonly httpIntercept: ForHttpIntercept<CdpFetchTransportRequest, CdpFetchTransportResponse> = new HttpIntercept(createCdpFetchCodec()),
    private readonly options: CdpFetchTransportOptions = {},
    private readonly networkExtraInfo: CDPNetworkExtraInfo = new CDPNetworkExtraInfo(client),
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
      debug('start skipped (already started)')

      return
    }

    debug('starting CDP Fetch transport')
    this.client.on('Fetch.requestPaused', this.interceptRequest)
    this.client.on('Fetch.requestPaused', this.resolveResponse)
    // Set-Cookie never appears on Fetch response pauses — the raw cookie
    // headers only arrive on the Network extraInfo events tracked here.
    this.networkExtraInfo.start()
    this.isStarted = true

    try {
      await this.client.send('Fetch.enable', {
        patterns: [{
          requestStage: 'Request',
        }, {
          requestStage: 'Response',
        }],
      })

      debug('CDP Fetch transport started')
    } catch (err) {
      this.client.off('Fetch.requestPaused', this.interceptRequest)
      this.client.off('Fetch.requestPaused', this.resolveResponse)
      this.networkExtraInfo.stop()
      this.isStarted = false

      throw err
    }
  }

  /**
   * Clears in-flight request correlation without disabling CDP Fetch.
   * Used between tests so the next test still receives paused traffic.
   */
  reset (): void {
    const inFlightCount = this.inFlightRequests.size

    debug('resetting CDP Fetch transport (%d in-flight request(s))', inFlightCount)
    this.rejectAll(new Error('CDP Fetch transport reset'))
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
      this.rejectAll(new Error('CDP Fetch transport stopped'))
      this.networkExtraInfo.stop()
      this.isStarted = false
      debug('CDP Fetch transport stopped')
    }
  }

  private interceptRequest = async (event: Protocol.Fetch.RequestPausedEvent, sessionId?: string): Promise<void> => {
    if (event.responseErrorReason || typeof event.responseStatusCode === 'number') {
      return
    }

    // Downloads pause without a networkId — the browser's download manager owns
    // them, so no Network.requestWillBeSent is emitted to correlate against. The
    // Fetch requestId is stable across a request pause and its response pause,
    // so it keys the flow when networkId is absent.
    const correlationId = event.networkId ?? event.requestId
    let requestContinued = false
    let response: CdpFetchTransportResponse | undefined
    let responseRequestId: string | undefined
    let responseSessionId: string | undefined
    let deferred: pDefer.DeferredPromise<CdpFetchTransportResponse> | undefined

    try {
      debug('intercepting request pause %s %s (correlationId=%s, resourceType=%s)',
        event.request.method,
        event.request.url,
        correlationId,
        event.resourceType)

      const request: CdpFetchTransportRequest = {
        ...event.request,
        headers: {
          ...event.request.headers,
        },
        id: correlationId,
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
        debug('marking AUT frame document %s', event.request.url)
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

      this.inFlightRequests.set(correlationId, deferred)

      response = await this.httpIntercept.handle(request, async (outbound) => {
        const headers = await this.continueRequestHeaders(event, outbound)
        const continueRequest: Protocol.Fetch.ContinueRequestRequest = {
          requestId: event.requestId,
          ...(outbound.url !== event.request.url ? { url: outbound.url } : {}),
          ...(outbound.method !== event.request.method ? { method: outbound.method } : {}),
          ...(outbound.postData !== event.request.postData ? { postData: outbound.postData } : {}),
          ...(headers ? { headers } : {}),
        }

        if (continueRequest.url || continueRequest.method || continueRequest.postData || continueRequest.headers) {
          debug('continuing request with mutations %s %s %o',
            outbound.method ?? event.request.method,
            outbound.url,
            {
              urlChanged: outbound.url !== event.request.url,
              methodChanged: outbound.method !== event.request.method,
              postDataChanged: outbound.postData !== event.request.postData,
              headersChanged: !!headers,
            })
        } else {
          debug('continuing request unchanged %s %s', event.request.method, event.request.url)
        }

        await this.client.send('Fetch.continueRequest', continueRequest, outbound.sessionId)

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
        debug('continuing response %s: status %s', event.request.url, response.responseCode)

        await this.client.send('Fetch.continueResponse', {
          requestId: response.requestId,
          responseCode: response.responseCode,
          ...(response.responseHeaders ? { responseHeaders: response.responseHeaders } : {}),
        }, response.sessionId)
      }

      this.cleanup(correlationId, deferred)
    } catch (err) {
      if (requestContinued) {
        deferred?.reject(err as Error)
      }

      this.cleanup(correlationId, deferred)

      if (event.networkId) {
        // an errored flow gets no more pauses, so nothing will consume its
        // extraInfo tracking — clear it here
        this.networkExtraInfo.clear(event.networkId, sessionId)
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

    const correlationId = event.networkId ?? event.requestId
    const deferred = this.inFlightRequests.get(correlationId)

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
      deferred.reject(new Error(`CDP Fetch response failed for ${event.request.url}: ${event.responseErrorReason}`))

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

    // reset() may have rejected this flow while the merge awaited extraInfo.
    // The resolve below would be a no-op and nothing else owns this pause —
    // release it, or the browser stays paused (reset keeps Fetch enabled).
    if (this.inFlightRequests.get(correlationId) !== deferred) {
      debug('releasing response pause rejected during set-cookie merge: %s', event.request.url)
      await this.safeSend('Fetch.continueResponse', {
        requestId: event.requestId,
      }, sessionId)

      return
    }

    const bodyStream = this.createResponseBodyStream(event.requestId, event.responseHeaders, sessionId)

    debug('resolved response pause for %s: status %s, set-cookie count %d',
      event.request.url,
      event.responseStatusCode,
      responseHeaders?.filter(({ name }) => name.toLowerCase() === 'set-cookie').length ?? 0)

    deferred.resolve({
      ...event.request,
      id: correlationId,
      requestId: event.requestId,
      responseCode: event.responseStatusCode,
      responseHeaders,
      bodyStream,
      sessionId,
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

  // Must NOT clear extraInfo tracking on success — the next response under a
  // reused network id may already be tracked, and CDPNetworkExtraInfo manages
  // its own lifecycle. Errored and unmatched flows clear at their own sites.
  private cleanup (correlationId: string, deferred?: pDefer.DeferredPromise<CdpFetchTransportResponse>): void {
    if (deferred && this.inFlightRequests.get(correlationId) !== deferred) {
      return
    }

    this.inFlightRequests.delete(correlationId)
  }

  private rejectAll (err: Error): void {
    if (!this.inFlightRequests.size) {
      return
    }

    debug('rejecting %d in-flight request(s): %s', this.inFlightRequests.size, err.message)

    for (const [correlationId, deferred] of this.inFlightRequests) {
      deferred.reject(err)
      this.cleanup(correlationId, deferred)
    }
  }
}
