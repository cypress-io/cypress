import { telemetry } from '@packages/telemetry'
import { isVerboseTelemetry as isVerbose } from '../http'
import type { RequestInterceptionMiddlewareCtx } from './types'

/**
 * Correlate CDP/browser pre-requests with proxied HTTP requests.
 */
export async function correlateBrowserPreRequest (mw: RequestInterceptionMiddlewareCtx): Promise<void> {
  const span = telemetry.startSpan({ name: 'correlate:prerequest', parentSpan: mw.reqMiddlewareSpan, isVerbose })

  const shouldCorrelatePreRequests = mw.shouldCorrelatePreRequests()

  span?.setAttributes({
    shouldCorrelatePreRequest: shouldCorrelatePreRequests,
  })

  if (!shouldCorrelatePreRequests) {
    span?.end()

    return mw.next()
  }

  const onClose = () => {
    if (mw.req.destroyed) {
      span?.end()
      mw.reqMiddlewareSpan?.end()

      mw.onError(new Error('request destroyed before browser pre-request was received'))
    }
  }

  const copyResourceTypeAndNext = () => {
    mw.res.off('close', onClose)

    mw.req.resourceType = mw.req.browserPreRequest?.resourceType

    span?.setAttributes({
      resourceType: mw.req.resourceType,
    })

    span?.end()

    return mw.next()
  }

  if (mw.req.headers['x-cypress-resolving-url']) {
    mw.debug('skipping prerequest for resolve:url')
    delete mw.req.headers['x-cypress-resolving-url']
    const requestId = `cy.visit-${Date.now()}`

    mw.req.browserPreRequest = {
      requestId,
      method: mw.req.method,
      url: mw.req.proxiedUrl,
      // @ts-ignore
      headers: mw.req.headers,
      resourceType: 'document',
      originalResourceType: 'document',
    }

    mw.res.on('close', () => {
      mw.socket.toDriver('request:event', 'response:received', {
        requestId,
        headers: mw.res.getHeaders(),
        status: mw.res.statusCode,
      })
    })

    return copyResourceTypeAndNext()
  }

  mw.res.once('close', onClose)

  mw.debug('waiting for prerequest')
  mw.pendingRequest = mw.getPreRequest((({ browserPreRequest, noPreRequestExpected }) => {
    mw.req.browserPreRequest = browserPreRequest
    mw.req.noPreRequestExpected = noPreRequestExpected
    copyResourceTypeAndNext()
  }))
}
