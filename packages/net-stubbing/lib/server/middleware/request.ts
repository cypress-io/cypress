import type {
  RequestMiddleware,
} from '@packages/proxy'
import {
  sendStaticResponse,
} from '../util'
import { handleInterceptRequest } from '../handle-intercept-request'
import { telemetry } from '@packages/telemetry'

// do not use a debug namespace in this file - use the per-request `this.debug` instead
// available as cypress-verbose:proxy:http
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const debug = null

export const SetMatchingRoutes: RequestMiddleware = async function () {
  const span = telemetry.startSpan({ name: 'set:matching:routes', parentSpan: this.reqMiddlewareSpan, isVerbose: true })

  const devServerUrl = new URL(this.req.proxiedUrl)

  // if this is a request to the dev server, do not match any routes as
  // we do not want to allow the user to intercept requests to the dev server
  if (devServerUrl.pathname.startsWith(this.config.devServerPublicPathRoute)) {
    span?.end()

    return this.next()
  }

  if (this.networkInterceptionCore.matchesRoutePreflight(this.netStubbingState.routes, this.req)) {
    // send positive CORS preflight response
    return sendStaticResponse(this, {
      statusCode: 204,
      headers: {
        'access-control-max-age': '-1',
        'access-control-allow-credentials': 'true',
        'access-control-allow-origin': this.req.headers.origin || '*',
        'access-control-allow-methods': this.req.headers['access-control-request-method'] || '*',
        'access-control-allow-headers': this.req.headers['access-control-request-headers'] || '*',
      },
    })
  }

  this.req.matchingRoutes = this.networkInterceptionCore.matchRoutes(this.netStubbingState.routes, this.req)

  span?.end()
  this.next()
}

/**
 * Called when a new request is received in the proxy layer.
 */
export const InterceptRequest: RequestMiddleware = async function () {
  return this.networkInterceptionCore.handleRequest((core) => handleInterceptRequest(this, core))
}
