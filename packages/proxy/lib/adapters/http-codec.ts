import _ from 'lodash'
import type { IncomingMessage } from 'http'
import type { HttpRequest, HttpResponse, TransportCodecPort, TransportNext } from '@packages/network-interception'
import type { Readable } from 'stream'
import { sendRequestOutgoing } from '../http/send-request-outgoing'
import type { RequestInterceptionMiddlewareCtx } from './types'

type HttpInterceptCtx = RequestInterceptionMiddlewareCtx & {
  id?: string
  incomingRes?: IncomingMessage
  incomingResStream?: Readable
  httpInterceptIncomingRes?: IncomingMessage
  originBodyStream?: Readable
}

// Retains the middleware ctx across createLegacyProxyPipeline's releaseRequest
// so HttpIntercept.encodeResponse can still recover it on the MITM path.
const PROXY_RESPONSE_CTX = Symbol('proxyResponseCtx')

type HttpResponseWithCtx = HttpResponse & {
  [PROXY_RESPONSE_CTX]?: HttpInterceptCtx
}

// Writes a response synthesized by a short-circuiting middleware (one that
// answered without calling next()) straight to the Express client. The
// response middleware stage, which normally pipes the origin response to
// ctx.res, never runs for these — on the CDP transport the caller applies the
// returned response itself, but the Express transport would otherwise drop it
// and leave the request unanswered (#34810).
//
// Only the transport-level Express codec opts into this. The synthetic (CDP)
// codec's encodeResponse is a priming call: the legacy pipeline hands it the
// origin response so it can populate ctx.incomingRes, then the pipeline's
// response stages write the client response themselves.
function writeSynthesizedResponse (ctx: HttpInterceptCtx, response: HttpResponse): void {
  const { res } = ctx

  // A ctx without a client response has nowhere to write to; the Express
  // pipeline that needs this write always provides one.
  if (!res) {
    return
  }

  // The pipeline already wrote (or is writing) the client response.
  if (res.headersSent || res.writableFinished) {
    return
  }

  if (response.statusCode !== undefined) {
    res.status(response.statusCode)
  }

  if (response.statusMessage) {
    res.statusMessage = response.statusMessage
  }

  for (const [name, value] of Object.entries(response.headers ?? {})) {
    if (value !== undefined) {
      res.set(name, value)
    }
  }

  if (response.bodyStream) {
    response.bodyStream.pipe(res)
  } else {
    res.end(response.body)
  }
}

type ProxyHttpCodecOptions = {
  /**
   * Write responses synthesized by a short-circuiting middleware straight to
   * ctx.res (see writeSynthesizedResponse). Only the transport-level Express
   * codec opts in; the synthetic (CDP) codec must not write synthesized
   * responses itself.
   */
  writeSynthesizedResponses?: boolean
}

export function createProxyHttpCodec (options: ProxyHttpCodecOptions = {}): TransportCodecPort<HttpInterceptCtx, HttpInterceptCtx> {
  const { writeSynthesizedResponses = false } = options
  const inFlightRequests = new Map<string, HttpInterceptCtx>()
  const requireCtx = (id: string): HttpInterceptCtx => {
    const ctx = inFlightRequests.get(id)

    if (!ctx) {
      throw new Error(`No in-flight proxy request found for ${id}. HttpIntercept middleware must call next() before returning a response.`)
    }

    return ctx
  }

  return {
    decodeRequest (ctx: HttpInterceptCtx): HttpRequest {
      const id = ctx.id ?? _.uniqueId('httpIntercept')

      ctx.id = id
      inFlightRequests.set(id, ctx)

      return {
        id,
        url: ctx.req.proxiedUrl,
        method: ctx.req.method,
        headers: ctx.req.headers as HttpRequest['headers'],
        body: ctx.req.body,
        resourceType: ctx.req.resourceType,
      }
    },

    encodeRequest (request: HttpRequest): HttpInterceptCtx {
      const ctx = requireCtx(request.id)

      ctx.req.proxiedUrl = request.url

      if (request.method !== undefined) {
        ctx.req.method = request.method
      }

      if (request.headers !== undefined) {
        ctx.req.headers = request.headers
      }

      if (request.body !== undefined) {
        ctx.req.body = request.body
      }

      return ctx
    },

    decodeResponse (ctx: HttpInterceptCtx): HttpResponse {
      const incomingRes = ctx.incomingRes ?? ctx.httpInterceptIncomingRes
      const response: HttpResponseWithCtx = {
        id: ctx.id!,
        url: ctx.req.proxiedUrl,
        bodyStream: ctx.incomingResStream ?? ctx.originBodyStream,
        headers: incomingRes?.headers as HttpResponse['headers'],
        statusCode: incomingRes?.statusCode,
      }

      response[PROXY_RESPONSE_CTX] = ctx

      return response
    },

    encodeResponse (response: HttpResponse): HttpInterceptCtx {
      const producingCtx = (response as HttpResponseWithCtx)[PROXY_RESPONSE_CTX]
      const ctx = producingCtx ?? requireCtx(response.id)

      // No producing ctx means the response was synthesized by a short-circuiting
      // middleware; only the Express transport writes those itself.
      if (!producingCtx && writeSynthesizedResponses) {
        writeSynthesizedResponse(ctx, response)
      }

      ctx.req.proxiedUrl = response.url

      if (ctx.httpInterceptIncomingRes) {
        ctx.incomingRes = ctx.httpInterceptIncomingRes
      }

      if (response.bodyStream) {
        ctx.incomingResStream = response.bodyStream
      } else if (ctx.originBodyStream) {
        ctx.incomingResStream = ctx.originBodyStream
      }

      return ctx
    },

    releaseRequest (id: string): void {
      inFlightRequests.delete(id)
    },
  }
}

export const proxyHttpCodec = createProxyHttpCodec({ writeSynthesizedResponses: true })

/**
 * MITM transport: send the request to the origin and settle once its response
 * lands on the ctx, restoring the ctx callbacks either way.
 */
export const fetchOrigin: TransportNext<HttpInterceptCtx, HttpInterceptCtx> = (outbound) => {
  return new Promise((resolve, reject) => {
    const originalOnResponse = outbound.onResponse
    const originalOnError = outbound.onError
    const callbacks = outbound as HttpInterceptCtx & {
      onError: (error: Error) => void
      onResponse: (incomingRes: IncomingMessage, incomingResStream: Readable) => void
    }

    callbacks.onError = (error: Error) => {
      callbacks.onError = originalOnError
      callbacks.onResponse = originalOnResponse
      reject(error)
    }

    callbacks.onResponse = (incomingRes, incomingResStream) => {
      callbacks.onError = originalOnError
      callbacks.onResponse = originalOnResponse

      outbound.httpInterceptIncomingRes = incomingRes
      outbound.originBodyStream = incomingResStream

      resolve(outbound)
    }

    sendRequestOutgoing(outbound)
  })
}
