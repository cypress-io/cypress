import _ from 'lodash'
import { concatStream } from '@packages/network'
import type { IncomingMessage } from 'http'
import type { Readable } from 'stream'
import type { CyHttpMessages, HttpRequest, HttpTransportCodec } from '@packages/network-interception'
import { getBodyEncoding } from '@packages/net-stubbing/lib/server/util'
import { HttpResponseCodec, ProxyResponsePair } from './http-response-codec'
import { sendRequestOutgoing } from './send-request-outgoing'
import type { RequestInterceptionMiddlewareCtx } from './types'

function normalizeTextRequestBody (
  body: unknown,
  headers: Record<string, string | string[] | undefined>,
): string | Buffer | undefined {
  const bodyEncoding = getBodyEncoding({
    body: body ?? '',
    headers,
  } as CyHttpMessages.IncomingRequest)

  if (bodyEncoding !== 'binary' && body && Buffer.isBuffer(body)) {
    return body.toString('utf8')
  }

  if (body === undefined) {
    return undefined
  }

  return body as string | Buffer
}

export function applyOutboundToProxiedRequest (
  proxiedReq: RequestInterceptionMiddlewareCtx['req'],
  outbound: HttpRequest,
): void {
  proxiedReq.proxiedUrl = outbound.url
  proxiedReq.method = outbound.method
  proxiedReq.headers = outbound.headers as typeof proxiedReq.headers
  proxiedReq.responseTimeout = outbound.responseTimeout
  proxiedReq.followRedirect = outbound.followRedirect

  if (outbound.requestBodyMaterialized) {
    proxiedReq.requestBodyMaterialized = true
  }

  if (outbound.body !== undefined) {
    proxiedReq.body = outbound.body as string
  }
}

export async function ensureRequestBody (
  mw: RequestInterceptionMiddlewareCtx,
): Promise<void> {
  if (mw.req.requestBodyMaterialized) {
    return
  }

  return new Promise<void>((resolve) => {
    const onClose = (): void => {
      mw.req.body = ''
      mw.req.requestBodyMaterialized = true

      resolve()
    }

    if (mw.res.destroyed) {
      onClose()

      return
    }

    mw.res.once('close', onClose)

    mw.req.pipe(concatStream((reqBody) => {
      mw.req.body = reqBody
      mw.req.requestBodyMaterialized = true
      mw.res.off('close', onClose)
      resolve()
    }))
  })
}

export function toHttpRequest (mw: RequestInterceptionMiddlewareCtx): HttpRequest {
  const browserAcceptEncoding = mw.req.originalAcceptEncoding
    ?? mw.req.browserPreRequest?.headers?.['accept-encoding']

  return {
    inFlightInterceptId: _.uniqueId('inFlightIntercept'),
    browserRequestId: mw.req.browserPreRequest?.requestId,
    url: mw.req.proxiedUrl,
    method: mw.req.method,
    headers: mw.req.headers as Record<string, string | string[]>,
    browserAcceptEncoding: typeof browserAcceptEncoding === 'string' ? browserAcceptEncoding : undefined,
    resourceType: mw.req.resourceType,
    isSyncRequest: mw.req.isSyncRequest,
    responseTimeout: mw.req.responseTimeout,
    followRedirect: mw.req.followRedirect,
    materializeRequestBody: () => {
      return ensureRequestBody(mw).then(() => mw.req.body)
    },
  }
}

export function createFetchOrigin (mw: RequestInterceptionMiddlewareCtx) {
  return (outbound: RequestInterceptionMiddlewareCtx): Promise<ProxyResponsePair> => {
    return new Promise((resolve, reject) => {
      const originalOnResponse = mw.onResponse
      const originalOnError = mw.onError
      const callbacks = mw as RequestInterceptionMiddlewareCtx & {
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

        resolve({ incomingRes, bodyStream: incomingResStream })
      }

      sendRequestOutgoing(outbound)
    })
  }
}

export const proxyHttpCodec: HttpTransportCodec<RequestInterceptionMiddlewareCtx, ProxyResponsePair> = {
  decodeRequest: toHttpRequest,

  applyRequest (transportRequest, request): void {
    applyOutboundToProxiedRequest(transportRequest.req, request)

    if (request.body !== undefined) {
      transportRequest.req.body = normalizeTextRequestBody(transportRequest.req.body, transportRequest.req.headers)
    }
  },

  decodeResponse (response) {
    return HttpResponseCodec.fromOrigin(response.incomingRes, response.bodyStream)
  },

  encodeResponse (response) {
    return HttpResponseCodec.toProxyResponse(response)
  },
}
