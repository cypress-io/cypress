import { shouldLogRequest } from '@packages/network-interception'
import { telemetry } from '@packages/telemetry'
import { isVerboseTelemetry as isVerbose } from '../http'
import type { RequestInterceptionMiddlewareCtx } from './types'

/**
 * Emit incoming request events to the driver for proxy command logging.
 */
export function sendToDriver (mw: RequestInterceptionMiddlewareCtx): void {
  const span = telemetry.startSpan({ name: 'send:to:driver', parentSpan: mw.reqMiddlewareSpan, isVerbose })

  const shouldLogReq = shouldLogRequest({
    matchingRoutes: mw.req.matchingRoutes,
    resourceType: mw.req.resourceType,
  })

  if (shouldLogReq && mw.req.browserPreRequest) {
    mw.socket.toDriver('request:event', 'incoming:request', mw.req.browserPreRequest)
  }

  span?.setAttributes({
    shouldLogReq,
    hasBrowserPreRequest: !!mw.req.browserPreRequest,
  })

  span?.end()
  mw.next()
}
