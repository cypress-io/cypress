import _ from 'lodash'
import type { IncomingMessage } from 'http'
import type { HttpRequest, HttpResponse, TransportCodecPort } from '@packages/network-interception'
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

export function createProxyHttpCodec (): TransportCodecPort<HttpInterceptCtx, HttpInterceptCtx> {
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
      const ctx = (response as HttpResponseWithCtx)[PROXY_RESPONSE_CTX] ?? requireCtx(response.id)

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

export const proxyHttpCodec = createProxyHttpCodec()

export function createFetchOrigin (_mw: HttpInterceptCtx) {
  return (outbound: HttpInterceptCtx): Promise<HttpInterceptCtx> => {
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
}
