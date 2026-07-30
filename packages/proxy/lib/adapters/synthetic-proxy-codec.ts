import zlib from 'zlib'
import type { HttpRequest, HttpResponse, TransportCodecPort } from '@packages/network-interception'
import type { HttpMiddlewareCtx } from '../http'
import { createProxyHttpCodec } from './http-codec'
import {
  createRequestBodyStream,
  createSyntheticExpressContext,
  createSyntheticIncomingResponse,
} from './synthetic-express-context'
import type { SyntheticCypressResponse } from './synthetic-express-context'

const WIRE_ENCODING_HEADERS = new Set(['content-encoding', 'content-length', 'transfer-encoding'])

const CONTENT_DECODERS: Record<string, (body: Buffer) => Buffer> = {
  gzip: (body) => zlib.gunzipSync(body),
  'x-gzip': (body) => zlib.gunzipSync(body),
  br: (body) => zlib.brotliDecompressSync(body),
  deflate: (body) => zlib.inflateSync(body),
}

type SyntheticProxyCodecOptions = {
  createMiddlewareContext: (
    request: ReturnType<typeof createSyntheticExpressContext>['req'],
    response: ReturnType<typeof createSyntheticExpressContext>['res'],
  ) => HttpMiddlewareCtx<any>
}

/**
 * Proxy codec variant for transports that start from a neutral HttpRequest
 * (e.g. CDP Fetch) instead of a real Express req/res. Synthesizes the middleware
 * ctx the legacy pipeline expects, then captures the written response for the
 * transport to fulfill.
 */
export function createSyntheticProxyCodec (
  options: SyntheticProxyCodecOptions,
): TransportCodecPort<HttpMiddlewareCtx<any>, HttpMiddlewareCtx<any>> {
  const coreCodec = createProxyHttpCodec()

  return {
    encodeRequest (request: HttpRequest): HttpMiddlewareCtx<any> {
      const { req, res } = createSyntheticExpressContext(request)
      const ctx = options.createMiddlewareContext(req, res)

      ctx.id = request.id
      coreCodec.decodeRequest(ctx)

      return ctx
    },

    decodeRequest (ctx: HttpMiddlewareCtx<any>): HttpRequest {
      const request = coreCodec.decodeRequest(ctx)

      // The browser owns accept-encoding on this transport: a continueRequest
      // override narrows its netstack's decoder set (br origins then die with
      // net::ERR_CONTENT_DECODING_FAILED), so drop whatever middleware set —
      // Chrome re-attaches its own. Copy: the headers object is the middleware's.
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

      return ctx
    },

    decodeResponse (ctx: HttpMiddlewareCtx<any>): HttpResponse {
      const res = ctx.res as SyntheticCypressResponse
      const response = {
        ...coreCodec.decodeResponse(ctx),
        body: res.getCapturedBody(),
        headers: res.getCapturedHeaders() ?? {},
        statusCode: res.getCapturedStatusCode(),
      }

      // The browser runs no decoders on bodies delivered over this transport,
      // so a body the pipeline emitted encoded (CompressBody re-encode,
      // stub-declared encoding) must go out as identity. An encoding we
      // cannot undo ships as the pair it arrived as.
      const contentEncoding = Object.entries(response.headers).find(([name]) => name.toLowerCase() === 'content-encoding')?.[1]
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
          Object.entries(response.headers).filter(([name]) => !WIRE_ENCODING_HEADERS.has(name.toLowerCase())),
        ),
      }
    },

    releaseRequest (id: string): void {
      coreCodec.releaseRequest?.(id)
    },
  }
}
