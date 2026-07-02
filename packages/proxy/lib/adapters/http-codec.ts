import _ from 'lodash'
import type { IncomingMessage } from 'http'
import type { HttpRequest, HttpResponse, TransportCodecPort } from '@packages/network-interception'
import { getBodyStream } from '@packages/net-stubbing/lib/server/util'
import type { Readable } from 'stream'
import { sendRequestOutgoing } from '../http/send-request-outgoing'
import type { RequestInterceptionMiddlewareCtx } from './types'

type HttpInterceptCtx = RequestInterceptionMiddlewareCtx & {
  id?: string
  httpInterceptIncomingRes?: IncomingMessage
  originBodyStream?: Readable
  httpInterceptStubBody?: string | Buffer
  httpInterceptDelay?: number
  httpInterceptThrottleKbps?: number
  onResponseWrittenToClient?: () => Promise<void>
}

function createProxyHttpCodec (): TransportCodecPort<HttpInterceptCtx, HttpInterceptCtx> {
  const inFlightRequests = new Map<string, HttpInterceptCtx>()

  return {
    decodeRequest (ctx: HttpInterceptCtx): HttpRequest {
      const id = _.uniqueId('httpIntercept')

      ctx.id = id
      inFlightRequests.set(id, ctx)

      return {
        id,
        url: ctx.req.proxiedUrl,
      }
    },

    encodeRequest (request: HttpRequest): HttpInterceptCtx {
      const ctx = inFlightRequests.get(request.id)!

      ctx.req.proxiedUrl = request.url

      return ctx
    },

    decodeResponse (ctx: HttpInterceptCtx): HttpResponse {
      return {
        id: ctx.id!,
        url: ctx.req.proxiedUrl,
      }
    },

    encodeResponse (response: HttpResponse): HttpInterceptCtx {
      const ctx = inFlightRequests.get(response.id)!

      ctx.req.proxiedUrl = response.url
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
