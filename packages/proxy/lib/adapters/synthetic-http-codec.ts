import { Readable } from 'stream'
import type { HttpRequest, HttpResponse, TransportCodecPort } from '@packages/network-interception'
import type { HttpMiddlewareCtx } from '../http'
import { createProxyHttpCodec } from './http-codec'
import {
  createSyntheticExpressContext,
  createSyntheticIncomingResponse,

} from './synthetic-express-context'
import type { SyntheticCypressResponse } from './synthetic-express-context'

type SyntheticHttpCodecOptions = {
  createMiddlewareContext: (
    request: ReturnType<typeof createSyntheticExpressContext>['req'],
    response: ReturnType<typeof createSyntheticExpressContext>['res'],
  ) => HttpMiddlewareCtx<any>
}

function createBodyStream (body?: string | Buffer): Readable {
  if (typeof body === 'undefined') {
    return Readable.from([])
  }

  return Readable.from([body])
}

export function createSyntheticHttpCodec (
  options: SyntheticHttpCodecOptions,
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
      ctx.incomingResStream = response.bodyStream ?? createBodyStream(response.body)

      return ctx
    },

    decodeResponse (ctx: HttpMiddlewareCtx<any>): HttpResponse {
      const response = coreCodec.decodeResponse(ctx)
      const res = ctx.res as SyntheticCypressResponse

      return {
        ...response,
        body: res.getCapturedBody(),
        headers: res.getCapturedHeaders(),
        statusCode: res.getCapturedStatusCode(),
      }
    },

    releaseRequest (id: string): void {
      coreCodec.releaseRequest?.(id)
    },
  }
}
