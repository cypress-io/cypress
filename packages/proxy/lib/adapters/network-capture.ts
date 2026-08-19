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

  // Capture implies skipped: a stream-classified response carries its bytes on
  // this side channel while mw.incomingResStream stays an empty stand-in (a
  // live never-ending stream there would wedge the body middleware). A skipped
  // body with NO capture stream was never read at all (capture off, arm
  // failure, no networkId) — notifying Replay would record a false zero-length
  // capture, so it stays unrecorded. A materialized response ignores any stray
  // capture stream: its real body wins.
  const captureStream = mw.resBodySkipped ? mw.resCaptureStream : undefined

  if (mw.resBodySkipped && !captureStream) {
    return mw.next()
  }

  const preRequest = mw.req.browserPreRequest
  const requestId = getOriginalRequestId(preRequest.requestId)
  const span = telemetry.startSpan({ name: 'gzip:body:protocol-notification', parentSpan: mw.resMiddlewareSpan, isVerbose })

  // Whichever close arrives first is the legitimate end; a second span.end()
  // would emit a misleading diag error under the OTel logger.
  let spanEnded = false
  const endSpan = () => {
    if (spanEnded) {
      return
    }

    spanEnded = true
    span?.end()
  }

  // The tee's own close may never fire when a capture source is destroyed at
  // spec reset; the source's close always fires, so it backstops the span.
  captureStream?.once('close', endSpan)

  const streamOptions: ResponseStreamOptions = {
    requestId,
    responseHeaders: mw.incomingRes.headers,
    // the pump carries decoded bytes (Network.dataReceived is post-decoding)
    isAlreadyGunzipped: captureStream ? true : mw.isGunzipped,
    isAlreadyBrotliDecompressed: captureStream ? true : mw.isBrotliDecompressed,
    responseStream: captureStream ?? mw.incomingResStream,
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

  if (!resultingStream) {
    // With no tee, nothing will read a capture stream; drain it so the pump's
    // bytes are discarded instead of buffering to the capture cap.
    captureStream?.resume()
    endSpan()

    return mw.next()
  }

  if (captureStream) {
    // Nothing else on this path consumes the tee; drain it so backpressure
    // can't stall Replay's writer. A failure only costs this capture — the
    // client response was already served from the stand-in body, so it must
    // never reach the error stage (below, the tee IS the client body, so an
    // error there must reset the client).
    resultingStream.on('error', (err) => {
      mw.debug('capture stream notification failed %o', err)
      endSpan()
    }).once('close', endSpan).resume()
  } else {
    mw.incomingResStream = resultingStream.on('error', mw.onError).once('close', endSpan)
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
