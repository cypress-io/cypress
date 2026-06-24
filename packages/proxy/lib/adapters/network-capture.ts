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
    return
  }

  const preRequest = mw.req.browserPreRequest
  const requestId = getOriginalRequestId(preRequest.requestId)

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
