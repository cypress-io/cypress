import type { ResponseStreamOptions } from '@packages/types'
import { telemetry } from '@packages/telemetry'
import { isVerboseTelemetry as isVerbose } from '../http'
import { getOriginalRequestId } from '../http/util/protocol-capture'
import type { ResponseInterceptionMiddlewareCtx } from './types'

/**
 * Notify the protocol manager that a response stream is available for capture.
 */
export async function notifyResponseStreamReceived (mw: ResponseInterceptionMiddlewareCtx): Promise<void> {
  if (!mw.protocolManager || !mw.req.browserPreRequest?.requestId) {
    return mw.next()
  }

  const preRequest = mw.req.browserPreRequest
  const requestId = getOriginalRequestId(preRequest.requestId)

  // A stream-classified response carries its captured bytes on a side channel
  // instead of mw.incomingResStream (which stays an empty stand-in so the
  // middleware body path doesn't wedge on a never-ending stream). Notify
  // Replay from that side channel without touching the body path. Gated on
  // both flags: capture implies skipped, and if a materialized response ever
  // carried a capture stream, its real body must win via the normal path.
  if (mw.resCaptureStream && mw.resBodySkipped) {
    const captureSpan = telemetry.startSpan({ name: 'gzip:body:protocol-notification', parentSpan: mw.resMiddlewareSpan, isVerbose })

    // Whichever close arrives first is the legitimate end — the source usually
    // closes before the tee flushes, and a second span.end() would emit a
    // misleading diag error for anyone troubleshooting with the OTel logger on.
    let captureSpanEnded = false
    const endCaptureSpan = () => {
      if (captureSpanEnded) {
        return
      }

      captureSpanEnded = true
      captureSpan?.end()
    }

    // The tee's own close may never fire when the source is destroyed at spec
    // reset (a bare destroy emits no error for a plain pipe to propagate);
    // the source's close always fires, so it ends the span as a backstop.
    mw.resCaptureStream.once('close', endCaptureSpan)

    const resultingStream = mw.protocolManager.responseStreamReceived({
      requestId,
      responseHeaders: mw.incomingRes.headers,
      isAlreadyGunzipped: true,
      isAlreadyBrotliDecompressed: true,
      responseStream: mw.resCaptureStream,
      res: mw.res,
      timings: {
        cdpRequestWillBeSentTimestamp: preRequest.cdpRequestWillBeSentTimestamp,
        cdpRequestWillBeSentReceivedTimestamp: preRequest.cdpRequestWillBeSentReceivedTimestamp,
        proxyRequestReceivedTimestamp: preRequest.proxyRequestReceivedTimestamp,
        cdpLagDuration: preRequest.cdpLagDuration,
        proxyRequestCorrelationDuration: preRequest.proxyRequestCorrelationDuration,
      },
    })

    if (resultingStream) {
      // Nothing else on this path consumes the tee; draining it here keeps
      // backpressure from stalling Replay's writer. A failure only costs this
      // capture — the client response was already served from the stand-in
      // body, so it must never reach the error stage (unlike the normal path,
      // where the tee IS the client body and an error must reset the client).
      resultingStream.on('error', (err) => {
        mw.debug('capture stream notification failed %o', err)
        endCaptureSpan()
      }).once('close', endCaptureSpan).resume()
    } else {
      // No tee means nothing will read the capture; drain it so the pump's
      // bytes are discarded instead of buffering to the capture cap.
      mw.resCaptureStream.resume()
      endCaptureSpan()
    }

    return mw.next()
  }

  // A skipped body without a capture stream means the transport never read it
  // (capture off, arm failure, no networkId) — notifying Replay here would
  // record a false zero-length capture, so these stay deliberately unrecorded.
  if (mw.resBodySkipped) {
    return mw.next()
  }

  const span = telemetry.startSpan({ name: 'gzip:body:protocol-notification', parentSpan: mw.resMiddlewareSpan, isVerbose })

  const streamOptions: ResponseStreamOptions = {
    requestId,
    responseHeaders: mw.incomingRes.headers,
    isAlreadyGunzipped: mw.isGunzipped,
    isAlreadyBrotliDecompressed: mw.isBrotliDecompressed,
    responseStream: mw.incomingResStream,
    res: mw.res,
    timings: {
      cdpRequestWillBeSentTimestamp: preRequest.cdpRequestWillBeSentTimestamp,
      cdpRequestWillBeSentReceivedTimestamp: preRequest.cdpRequestWillBeSentReceivedTimestamp,
      proxyRequestReceivedTimestamp: preRequest.proxyRequestReceivedTimestamp,
      cdpLagDuration: preRequest.cdpLagDuration,
      proxyRequestCorrelationDuration: preRequest.proxyRequestCorrelationDuration,
    },
  }

  const resultingStream = mw.protocolManager.responseStreamReceived(streamOptions)

  if (resultingStream) {
    mw.incomingResStream = resultingStream.on('error', mw.onError).once('close', () => {
      span?.end()
    })
  } else {
    span?.end()
  }

  mw.next()
}

/**
 * Notify the protocol manager that a response ended with an empty body.
 */
export function notifyResponseEndedWithEmptyBody (
  mw: ResponseInterceptionMiddlewareCtx,
  options: { isCached: boolean },
): void {
  if (!mw.protocolManager || !mw.req.browserPreRequest?.requestId) {
    return
  }

  const requestId = getOriginalRequestId(mw.req.browserPreRequest.requestId)

  mw.protocolManager.responseEndedWithEmptyBody({
    requestId,
    isCached: options.isCached,
    timings: {
      cdpRequestWillBeSentTimestamp: mw.req.browserPreRequest.cdpRequestWillBeSentTimestamp,
      cdpRequestWillBeSentReceivedTimestamp: mw.req.browserPreRequest.cdpRequestWillBeSentReceivedTimestamp,
      proxyRequestReceivedTimestamp: mw.req.browserPreRequest.proxyRequestReceivedTimestamp,
      cdpLagDuration: mw.req.browserPreRequest.cdpLagDuration,
      proxyRequestCorrelationDuration: mw.req.browserPreRequest.proxyRequestCorrelationDuration,
    },
  })
}
