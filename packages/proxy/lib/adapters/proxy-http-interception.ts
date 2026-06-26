import _ from 'lodash'
import { concatStream, httpUtils } from '@packages/network'
import { getEncoding } from 'istextorbinary'
import type { IncomingMessage } from 'http'
import type { Readable } from 'stream'
import zlib from 'zlib'
import type { ForOriginForwarding, HttpRequest, HttpResponse } from '@packages/network-interception'
import { normalizeTextRequestBody } from '@packages/net-stubbing/lib/server/util'
import { HttpResponseCodec } from './http-response-codec'
import { sendRequestOutgoing } from './send-request-outgoing'
import type { RequestInterceptionMiddlewareCtx } from './types'

const SUPPORTED_CONTENT_ENCODINGS = ['gzip', 'br'] as const

type SupportedContentEncoding = typeof SUPPORTED_CONTENT_ENCODINGS[number]

type MaterializeResponseCtx = RequestInterceptionMiddlewareCtx & {
  isGunzipped?: boolean
  isBrotliDecompressed?: boolean
  contentEncodingOrder?: SupportedContentEncoding[]
}

// Match response-middleware flush options for layered encoding edge cases (#1756).
const zlibGzipDecompressOptions = {
  flush: zlib.constants.Z_SYNC_FLUSH,
  finishFlush: zlib.constants.Z_SYNC_FLUSH,
}

const zlibBrotliDecompressOptions = {
  flush: zlib.constants.BROTLI_OPERATION_FLUSH,
  finishFlush: zlib.constants.BROTLI_OPERATION_FLUSH,
}

function getOrderedContentEncodings (res: IncomingMessage): SupportedContentEncoding[] {
  const raw = (res.headers['content-encoding'] || '').toLowerCase()

  if (!raw) {
    return []
  }

  const order: SupportedContentEncoding[] = []

  for (const part of raw.split(',')) {
    const enc = part.trim()

    if ((enc === 'gzip' || enc === 'br') && !order.includes(enc)) {
      order.push(enc)
    }
  }

  return order
}

function decompressResponseStreamForMaterialization (
  mw: MaterializeResponseCtx,
  incomingRes: IncomingMessage,
  incomingResStream: NodeJS.ReadableStream,
): NodeJS.ReadableStream {
  const order = getOrderedContentEncodings(incomingRes)

  if (!order.length) {
    return incomingResStream
  }

  mw.contentEncodingOrder = order

  let stream = incomingResStream as Readable

  // Decompress outermost first: reverse order (e.g. "gzip, br" → un-br then un-gzip).
  for (let i = order.length - 1; i >= 0; i--) {
    const enc = order[i]

    if (enc === 'gzip' && !mw.isGunzipped) {
      const gunzip = zlib.createGunzip(zlibGzipDecompressOptions)

      stream = stream.pipe(gunzip).on('error', mw.onError) as Readable
      mw.isGunzipped = true
    } else if (enc === 'br' && !mw.isBrotliDecompressed) {
      const brotliDecompress = zlib.createBrotliDecompress(zlibBrotliDecompressOptions)

      stream = stream.pipe(brotliDecompress).on('error', mw.onError) as Readable
      mw.isBrotliDecompressed = true
    }
  }

  return stream
}

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
  return {
    inFlightInterceptId: _.uniqueId('inFlightIntercept'),
    browserRequestId: mw.req.browserPreRequest?.requestId,
    url: mw.req.proxiedUrl,
    method: mw.req.method,
    headers: mw.req.headers as Record<string, string | string[]>,
    resourceType: mw.req.resourceType,
    isSyncRequest: mw.req.isSyncRequest,
    responseTimeout: mw.req.responseTimeout,
    followRedirect: mw.req.followRedirect,
    materializeRequestBody: () => {
      return ensureRequestBody(mw).then(() => mw.req.body)
    },
  }
}

function readResponseBody (
  mw: MaterializeResponseCtx,
  req: RequestInterceptionMiddlewareCtx['req'],
  incomingRes: IncomingMessage,
  incomingResStream: NodeJS.ReadableStream,
): Promise<Buffer | string> {
  const plainStream = decompressResponseStreamForMaterialization(mw, incomingRes, incomingResStream)

  return new Promise<Buffer>((resolve, reject) => {
    if (httpUtils.responseMustHaveEmptyBody(req, incomingRes)) {
      resolve(Buffer.from(''))

      return
    }

    plainStream.pipe(concatStream(resolve))
    plainStream.on('error', reject)
  }).then((buf) => {
    return getEncoding(buf) !== 'binary' ? buf.toString('utf8') : buf
  })
}

/**
 * Proxy-side implementation of {@link ForOriginForwarding}.
 * Returns a closure that applies outbound intercept mutations onto the live request,
 * sends it to the origin via Node HTTP, and resolves with a transport-neutral
 * {@link HttpResponse}. When `outbound.materializeOriginResponse` is set the body is
 * buffered onto `response.body`; otherwise `response.stream()` returns the live origin stream.
 */
export function createFetchOrigin (mw: RequestInterceptionMiddlewareCtx): ForOriginForwarding {
  return (outbound: HttpRequest): Promise<HttpResponse> => {
    applyOutboundToProxiedRequest(mw.req, outbound)

    if (outbound.body !== undefined) {
      mw.req.body = normalizeTextRequestBody(mw.req.body, mw.req.headers)
    }

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

        const httpResponse = HttpResponseCodec.fromOrigin(incomingRes, incomingResStream as Readable)

        if (!outbound.materializeOriginResponse) {
          resolve(httpResponse)

          return
        }

        readResponseBody(mw, mw.req, incomingRes, incomingResStream)
        .then((body) => {
          httpResponse.body = body
          resolve(httpResponse)
        })
        .catch(reject)
      }

      sendRequestOutgoing(mw)
    })
  }
}
