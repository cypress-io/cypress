import _ from 'lodash'
import type { IncomingMessage } from 'http'
import type { HttpHeaders, HttpRequest, HttpResponse, TransportCodecPort } from '@packages/network-interception'
import { getBodyStream } from '@packages/net-stubbing/lib/server/util'
import type { Readable } from 'stream'
import { sendRequestOutgoing } from '../http/send-request-outgoing'
import type { RequestInterceptionMiddlewareCtx } from './types'

type HttpInterceptCtx = RequestInterceptionMiddlewareCtx & {
  id?: string
  incomingRes?: IncomingMessage
  incomingResStream?: Readable
  httpInterceptIncomingRes?: IncomingMessage
  originBodyStream?: Readable
  httpInterceptStubBody?: string | Buffer
  httpInterceptDelay?: number
  httpInterceptThrottleKbps?: number
  onResponseWrittenToClient?: () => Promise<void>
}

function cleanHeaders (headers: HttpHeaders = {}): Record<string, string | string[]> {
  return Object.entries(headers).reduce<Record<string, string | string[]>>((memo, [key, value]) => {
    if (typeof value !== 'undefined') {
      memo[key] = value
    }

    return memo
  }, {})
}

function createProxyHttpCodec (): TransportCodecPort<HttpInterceptCtx, HttpInterceptCtx> {
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
      const id = _.uniqueId('httpIntercept')

      ctx.id = id
      inFlightRequests.set(id, ctx)

      return {
        id,
        url: ctx.req.proxiedUrl,
        method: ctx.req.method,
        headers: ctx.req.headers,
        body: ctx.req.body,
      }
    },

    encodeRequest (request: HttpRequest): HttpInterceptCtx {
      const ctx = requireCtx(request.id)

      ctx.req.proxiedUrl = request.url
      ctx.req.method = request.method ?? ctx.req.method
      ctx.req.headers = request.headers ?? ctx.req.headers
      ctx.req.body = request.body ?? ctx.req.body

      return ctx
    },

    getRequest (id: string): HttpInterceptCtx {
      return inFlightRequests.get(id)!
    },

    decodeResponse (ctx: HttpInterceptCtx): HttpResponse {
      return {
        id: ctx.id!,
        url: ctx.req.proxiedUrl,
      }
    },

    encodeResponse (response: HttpResponse): HttpInterceptCtx {
      const ctx = requireCtx(response.id)

      ctx.req.proxiedUrl = response.url

      if (typeof response.statusCode === 'number') {
        // Synthesized replies skip sendRequestOutgoing, which normally ends this span.
        ctx.reqMiddlewareSpan?.end()
        ctx.res.writeHead(response.statusCode, cleanHeaders(response.headers))
        ctx.res.end(response.body)
      }

      inFlightRequests.delete(response.id)

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

export async function resolveProxyResponseBodyStream (
  ctx: HttpInterceptCtx,
): Promise<Readable> {
  if (ctx.originBodyStream) {
    return ctx.originBodyStream
  }

  return getBodyStream(ctx.httpInterceptStubBody, {
    delay: ctx.httpInterceptDelay,
    throttleKbps: ctx.httpInterceptThrottleKbps,
  })
}
