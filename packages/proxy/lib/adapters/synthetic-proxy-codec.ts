import type { HttpRequest, HttpResponse, TransportCodecPort } from '@packages/network-interception'
import type { HttpMiddlewareCtx } from '../http'
import { createProxyHttpCodec } from './http-codec'
import {
  createRequestBodyStream,
  createSyntheticExpressContext,
  createSyntheticIncomingResponse,
} from './synthetic-express-context'
import type { SyntheticCypressResponse } from './synthetic-express-context'

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
      return coreCodec.decodeRequest(ctx)
    },

    encodeResponse (response: HttpResponse): HttpMiddlewareCtx<any> {
      const ctx = coreCodec.encodeResponse(response)

      ctx.incomingRes = createSyntheticIncomingResponse(response)
      ctx.incomingResStream = response.bodyStream ?? createRequestBodyStream(response.body)

      return ctx
    },

    decodeResponse (ctx: HttpMiddlewareCtx<any>): HttpResponse {
      const response = coreCodec.decodeResponse(ctx)
      const res = ctx.res as SyntheticCypressResponse

      return {
        ...response,
        // Only attach a body when middleware actually rewrote it — an
        // unmodified body lets the CDP Fetch transport continueResponse
        // natively (downloads, native decoders) instead of fulfilling.
        ...(res.bodyModified ? { body: res.getCapturedBody() } : {}),
        headers: res.getCapturedHeaders(),
        statusCode: res.getCapturedStatusCode(),
      }
    },

    releaseRequest (id: string): void {
      coreCodec.releaseRequest?.(id)
    },
  }
}
