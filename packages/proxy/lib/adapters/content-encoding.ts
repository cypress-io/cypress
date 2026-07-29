import zlib from 'zlib'
import { telemetry } from '@packages/telemetry'
import { getSupportedAcceptEncoding } from '@packages/network-tools'
import { isVerboseTelemetry as isVerbose } from '../http'
import type { ForContentEncoding } from '@packages/network-interception'
import type { RequestInterceptionMiddlewareCtx, ResponseInterceptionMiddlewareCtx } from './types'

const zlibGzipCompressOptions = {
  flush: zlib.constants.Z_SYNC_FLUSH,
  // Compression must use Z_FINISH so the gzip trailer (CRC + size) is written; otherwise
  // gunzip fails with "unexpected end of file" when decoding layered encoding (e.g. gzip, br).
  finishFlush: zlib.constants.Z_FINISH,
  level: zlib.constants.Z_BEST_SPEED,
}

const zlibBrotliCompressOptions = {
  flush: zlib.constants.BROTLI_OPERATION_FLUSH,
  finishFlush: zlib.constants.BROTLI_OPERATION_FINISH,
  params: {
    // Brotli default quality is 11 (slowest). Use quality 1 for fast re-compression in the proxy.
    [zlib.constants.BROTLI_PARAM_QUALITY]: 1,
  },
}

/**
 * {@link ForContentEncoding} adapter for pipelines where Node performs the
 * transfer: constrain what the origin may send to what Node can decode, and
 * re-encode the body for the socket.
 */
export class ProxyContentEncodingAdapter implements ForContentEncoding {
  constrainAcceptEncoding (context: unknown): void {
    const ctx = context as RequestInterceptionMiddlewareCtx
    const span = telemetry.startSpan({ name: 'strip:unsupported:accept:encoding', parentSpan: ctx.reqMiddlewareSpan, isVerbose })

    const acceptEncoding = ctx.req.headers['accept-encoding']

    if (acceptEncoding && !ctx.req.originalAcceptEncoding) {
      ctx.req.originalAcceptEncoding = acceptEncoding
    }

    const supported = getSupportedAcceptEncoding(acceptEncoding)

    span?.setAttributes({
      acceptEncodingHeaderPresent: !!acceptEncoding,
      doesAcceptHeadingIncludeGzip: !!acceptEncoding?.includes('gzip'),
      doesAcceptHeadingIncludeBr: !!acceptEncoding?.includes('br'),
    })

    ctx.req.headers['accept-encoding'] = supported
    ctx.debug(
      acceptEncoding ? 'accept-encoding header present, setting to %s' : 'no accept-encoding header, setting to %s',
      supported,
    )

    span?.end()
    ctx.next()
  }

  async compressBody (context: unknown): Promise<void> {
    const ctx = context as ResponseInterceptionMiddlewareCtx

    // Re-compress in the same order as the original content-encoding (innermost first).
    const order = ctx.contentEncodingOrder ?? []

    for (const enc of order) {
      if (enc === 'gzip' && ctx.isGunzipped) {
        ctx.debug('regzipping response body')

        const span = telemetry.startSpan({ name: 'gzip:body', parentSpan: ctx.resMiddlewareSpan, isVerbose })

        ctx.incomingResStream = ctx.incomingResStream
        .pipe(zlib.createGzip(zlibGzipCompressOptions))
        .on('error', ctx.onError)
        .once('close', () => {
          span?.end()
        })
      } else if (enc === 'br' && ctx.isBrotliDecompressed) {
        ctx.debug('re-compressing Brotli response body')

        const span = telemetry.startSpan({ name: 'brotli:body', parentSpan: ctx.resMiddlewareSpan, isVerbose })

        ctx.incomingResStream = ctx.incomingResStream
        .pipe(zlib.createBrotliCompress(zlibBrotliCompressOptions))
        .on('error', ctx.onError)
        .once('close', () => {
          span?.end()
        })
      }
    }

    ctx.next()
  }
}
