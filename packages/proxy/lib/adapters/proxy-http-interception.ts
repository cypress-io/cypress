import _ from 'lodash'
import { concatStream, httpUtils } from '@packages/network'
import { getEncoding } from 'istextorbinary'
import type { IncomingMessage } from 'http'
import type { HttpRequest, HttpResponse } from '@packages/network-interception'
import { sendRequestOutgoing } from './send-request-outgoing'
import type { RequestInterceptionMiddlewareCtx } from './types'

/**
 * Apply outbound intercept mutations onto the live proxied request.
 */
export function applyOutboundToProxiedRequest (
  proxiedReq: RequestInterceptionMiddlewareCtx['req'],
  outbound: HttpRequest,
): void {
  proxiedReq.proxiedUrl = outbound.url
  proxiedReq.method = outbound.method
  proxiedReq.headers = outbound.headers as typeof proxiedReq.headers
  proxiedReq.body = outbound.body as string | undefined
  proxiedReq.responseTimeout = outbound.responseTimeout
  proxiedReq.followRedirect = outbound.followRedirect
}

export function toHttpRequest (mw: RequestInterceptionMiddlewareCtx): HttpRequest {
  return {
    inFlightInterceptId: _.uniqueId('inFlightIntercept'),
    browserRequestId: mw.req.browserPreRequest?.requestId,
    url: mw.req.proxiedUrl,
    method: mw.req.method,
    headers: mw.req.headers as Record<string, string | string[]>,
    body: mw.req.body,
    resourceType: mw.req.resourceType,
    isSyncRequest: mw.req.isSyncRequest,
    responseTimeout: mw.req.responseTimeout,
    followRedirect: mw.req.followRedirect,
  }
}

function materializeResponseBody (
  req: RequestInterceptionMiddlewareCtx['req'],
  incomingRes: IncomingMessage,
  incomingResStream: NodeJS.ReadableStream,
): Promise<Buffer | string> {
  return new Promise<Buffer>((resolve, reject) => {
    if (httpUtils.responseMustHaveEmptyBody(req, incomingRes)) {
      resolve(Buffer.from(''))

      return
    }

    incomingResStream.pipe(concatStream(resolve))
    incomingResStream.on('error', reject)
  }).then((buf) => {
    return getEncoding(buf) !== 'binary' ? buf.toString('utf8') : buf
  })
}

/**
 * Fetch the origin via Node HTTP and return a materialized {@link HttpResponse}.
 */
export function fetchOriginAsHttpResponse (mw: RequestInterceptionMiddlewareCtx): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    sendRequestOutgoing(mw, {
      onError: reject,
      onResponse: async (incomingRes, incomingResStream) => {
        try {
          const body = await materializeResponseBody(mw.req, incomingRes, incomingResStream)

          resolve({
            statusCode: incomingRes.statusCode || 200,
            statusMessage: incomingRes.statusMessage,
            headers: incomingRes.headers as Record<string, string | string[]>,
            body,
          })
        } catch (err) {
          reject(err)
        }
      },
    })
  })
}
