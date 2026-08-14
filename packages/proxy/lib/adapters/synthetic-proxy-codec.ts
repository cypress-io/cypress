import zlib from 'zlib'
import type { HttpRequest, HttpResponse, TransportCodecPort } from '@packages/network-interception'
import type { HttpMiddlewareCtx } from '../http'
import { createProxyHttpCodec } from './http-codec'
import {
  abortSyntheticExpressContext,
  createRequestBodyStream,
  createSyntheticExpressContext,
  createSyntheticIncomingResponse,
} from './synthetic-express-context'
import type { SyntheticCypressResponse, SyntheticExpressContext } from './synthetic-express-context'
import type { ResponseInterceptionMiddlewareCtx } from './types'

const WIRE_ENCODING_HEADERS = new Set(['content-encoding', 'content-length', 'transfer-encoding'])

const CONTENT_DECODERS: Record<string, (body: Buffer) => Buffer> = {
  gzip: (body) => zlib.gunzipSync(body),
  'x-gzip': (body) => zlib.gunzipSync(body),
  br: (body) => zlib.brotliDecompressSync(body),
  deflate: (body) => zlib.inflateSync(body),
}

/**
 * Normalizes a response the legacy middleware produced back to an identity
 * body, dropping the wire encoding headers that described it.
 *
 * The legacy middleware is built for the MITM path, where Node performs the
 * request/response transfer. This means `accept-encoding` is narrowed to what
 * Node can decode (`getSupportedAcceptEncoding` — `br`, `gzip`, `identity`),
 * so origin responses can arrive encoded.
 *
 * `makeResStreamPlainText` decodes them outermost-first — for
 * `content-encoding: gzip, br` that is un-`br`, then un-`gzip` to get
 * plaintext. These need to be decoded to plaintext because the following
 * stages that read the body need plaintext:
 *
 * - injection
 * - security rewriting
 * - `cy.intercept()` response handlers
 *
 * On the way back out, `CompressBody` re-applies those same layers in their
 * original order. That decode/re-encode round trip is highly sensitive, so
 * we intentionally leave it alone.
 *
 * On this transport, the browser negotiated its own `accept-encoding` and has
 * already decoded what the origin sent. Fulfillment runs no decoders, so the
 * body has to go back as identity. Undo whatever encoding the legacy
 * middleware left behind, which encompasses:
 *
 * - whatever `CompressBody` re-encoded
 * - whatever a `cy.intercept()` stub may have declared
 *
 * These scenarios are decoded back to plaintext. An encoding we cannot undo —
 * `zstd`, or bytes that fail to decode — is left exactly as it arrived, body
 * and `content-encoding` header together. The page cannot render it either
 * way, so we keep the response self-describing instead of stripping the header
 * and claiming plaintext bytes that are not.
 */
export function toIdentityResponse (response: HttpResponse): HttpResponse {
  const headers = response.headers ?? {}
  const contentEncoding = Object.entries(headers).find(([name]) => name.toLowerCase() === 'content-encoding')?.[1]
  const encodings = String(contentEncoding ?? '')
  .split(',')
  .map((token) => token.trim().toLowerCase())
  .filter((token) => token && token !== 'identity')

  let body = response.body

  if (body?.length && encodings.length) {
    try {
      // content-encoding lists tokens in the order applied — decode outermost first
      body = encodings.reduceRight((decoded, encoding) => {
        const decode = CONTENT_DECODERS[encoding]

        if (!decode) {
          throw new Error(`no decoder for content-encoding ${encoding}`)
        }

        return decode(decoded)
      }, Buffer.from(body))
    } catch {
      return response
    }
  }

  return {
    ...response,
    body,
    headers: Object.fromEntries(
      Object.entries(headers).filter(([name]) => !WIRE_ENCODING_HEADERS.has(name.toLowerCase())),
    ),
  }
}

type SyntheticProxyCodecOptions = {
  createMiddlewareContext: (
    request: ReturnType<typeof createSyntheticExpressContext>['req'],
    response: ReturnType<typeof createSyntheticExpressContext>['res'],
  ) => HttpMiddlewareCtx<any>
}

export type SyntheticProxyCodec = TransportCodecPort<HttpMiddlewareCtx<any>, HttpMiddlewareCtx<any>> & {
  /**
   * Tears down the synthetic exchange for an in-flight request the browser
   * canceled. A transport whose cancellation signal is out of band (CDP
   * Network.loadingFailed) has no other way to reach the exchange, and without
   * it the flow sits in pre-request correlation until that timer expires.
   */
  abortRequest (id: string): void
}

/**
 * Proxy codec variant for transports that start from a neutral HttpRequest
 * (e.g. CDP Fetch) instead of a real Express req/res. Synthesizes the middleware
 * ctx the legacy pipeline expects, then captures the written response for the
 * transport to fulfill.
 */
export function createSyntheticProxyCodec (
  options: SyntheticProxyCodecOptions,
): SyntheticProxyCodec {
  const coreCodec = createProxyHttpCodec()
  const inFlightExchanges = new Map<string, SyntheticExpressContext>()

  return {
    encodeRequest (request: HttpRequest): HttpMiddlewareCtx<any> {
      const exchange = createSyntheticExpressContext(request)
      const ctx = options.createMiddlewareContext(exchange.req, exchange.res)

      ctx.id = request.id
      coreCodec.decodeRequest(ctx)
      inFlightExchanges.set(request.id, exchange)

      return ctx
    },

    abortRequest (id: string): void {
      const exchange = inFlightExchanges.get(id)

      if (exchange) {
        abortSyntheticExpressContext(exchange)
      }
    },

    decodeRequest (ctx: HttpMiddlewareCtx<any>): HttpRequest {
      const request = coreCodec.decodeRequest(ctx)

      // The browser owns accept-encoding on this transport.
      //
      // The legacy request middleware sets it in
      // StripUnsupportedAcceptEncoding, which is undesired behavior when we
      // continue the request in the browser: a value set in the Node context
      // overrides what the browser would send, leaving us with encoded or
      // garbled output (br origins fail outright with
      // net::ERR_CONTENT_DECODING_FAILED).
      //
      // Get out of the browser's way — drop whatever the middleware set and
      // Chrome re-attaches its own. Copy rather than mutate: the headers
      // object belongs to the middleware.
      const { 'accept-encoding': _acceptEncoding, ...headers } = request.headers ?? {}

      return {
        ...request,
        headers,
      }
    },

    encodeResponse (response: HttpResponse): HttpMiddlewareCtx<any> {
      const ctx = coreCodec.encodeResponse(response)

      ctx.incomingRes = createSyntheticIncomingResponse(response)
      ctx.incomingResStream = response.bodyStream ?? createRequestBodyStream(response.body)

      if (response.bodySkipped) {
        (ctx as unknown as ResponseInterceptionMiddlewareCtx).resBodySkipped = true
      }

      return ctx
    },

    decodeResponse (ctx: HttpMiddlewareCtx<any>): HttpResponse {
      const response = coreCodec.decodeResponse(ctx)
      const res = ctx.res as SyntheticCypressResponse

      return toIdentityResponse({
        ...response,
        body: res.getCapturedBody(),
        headers: res.getCapturedHeaders() ?? {},
        statusCode: res.getCapturedStatusCode(),
      })
    },

    releaseRequest (id: string): void {
      inFlightExchanges.delete(id)
      coreCodec.releaseRequest?.(id)
    },
  }
}
