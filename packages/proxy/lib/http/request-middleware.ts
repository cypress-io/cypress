import _ from 'lodash'
import { performance } from 'perf_hooks'
import { InterceptRequest, SetMatchingRoutes } from '@packages/net-stubbing'
import { blocked, cors } from '@packages/network'
import { telemetry } from '@packages/telemetry'
import {
  addCookieJarCookiesToRequest, getSameSiteContext, shouldAttachAndSetCookies,
} from './util/cookies'
import { doesTopNeedToBeSimulated } from './util/top-simulation'

import type { HttpMiddleware } from './'
import type { CypressIncomingRequest } from '../types'
// do not use a debug namespace in this file - use the per-request `this.debug` instead
// available as cypress-verbose:proxy:http
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const debug = null

export type RequestMiddleware = HttpMiddleware<{
  outgoingReq: any
}>

const LogRequest: RequestMiddleware = (ctx) => {
  if (ctx.req.url.includes('delay?&ms=2000')) {
    // eslint-disable-next-line
    debugger
  }

  ctx.debug('proxying request %o', {
    req: _.pick(ctx.req, 'method', 'proxiedUrl', 'headers'),
  })

  ctx.next()
}

const CorrelateBrowserPreRequest: RequestMiddleware = async (ctx) => {
  const span = telemetry.startSpan({ name: 'correlate:prerequest', parentSpan: ctx.reqMiddlewareSpan })

  const shouldCorrelatePreRequests = ctx.shouldCorrelatePreRequests()

  span?.setAttributes({
    shouldCorrelatePreRequest: shouldCorrelatePreRequests,
  })

  if (!ctx.shouldCorrelatePreRequests()) {
    span?.end()

    return ctx.next()
  }

  const copyResourceTypeAndNext = () => {
    ctx.req.resourceType = ctx.req.browserPreRequest?.resourceType

    span?.setAttributes({
      resourceType: ctx.req.resourceType,
    })

    span?.end()

    return ctx.next()
  }

  if (ctx.req.headers['x-cypress-resolving-url']) {
    ctx.debug('skipping prerequest for resolve:url')
    delete ctx.req.headers['x-cypress-resolving-url']
    const requestId = `cy.visit-${Date.now()}`

    ctx.req.browserPreRequest = {
      requestId,
      method: ctx.req.method,
      url: ctx.req.proxiedUrl,
      // @ts-ignore
      headers: ctx.req.headers,
      resourceType: 'document',
      originalResourceType: 'document',
    }

    ctx.res.on('close', () => {
      ctx.socket.toDriver('request:event', 'response:received', {
        requestId,
        headers: ctx.res.getHeaders(),
        status: ctx.res.statusCode,
      })
    })

    return copyResourceTypeAndNext()
  }

  ctx.debug('waiting for prerequest')
  if (ctx.req.url === '/delay?&ms=2000') {
    // eslint-disable-next-line
    debugger
  }

  ctx.getPreRequest(((browserPreRequest) => {
    ctx.req.browserPreRequest = browserPreRequest
    copyResourceTypeAndNext()
  }))
}

const ExtractCypressMetadataHeaders: RequestMiddleware = (ctx) => {
  const span = telemetry.startSpan({ name: 'extract:cypress:metadata:headers', parentSpan: ctx.reqMiddlewareSpan })

  ctx.req.isAUTFrame = !!ctx.req.headers['x-cypress-is-aut-frame']

  span?.setAttributes({
    isAUTFrame: ctx.req.isAUTFrame,
  })

  if (ctx.req.headers['x-cypress-is-aut-frame']) {
    delete ctx.req.headers['x-cypress-is-aut-frame']
  }

  span?.end()

  ctx.next()
}

const CalculateCredentialLevelIfApplicable: RequestMiddleware = (ctx) => {
  const span = telemetry.startSpan({ name: 'calculate:credential:level:if:applicable', parentSpan: ctx.reqMiddlewareSpan })

  const doesTopNeedSimulation = doesTopNeedToBeSimulated(ctx)

  span?.setAttributes({
    doesTopNeedToBeSimulated: doesTopNeedSimulation,
    resourceType: ctx.req.resourceType,
  })

  if (!doesTopNeedSimulation ||
    (ctx.req.resourceType !== undefined && ctx.req.resourceType !== 'xhr' && ctx.req.resourceType !== 'fetch')) {
    span?.end()
    ctx.next()

    return
  }

  ctx.debug(`looking up credentials for ${ctx.req.proxiedUrl}`)
  const { credentialStatus, resourceType } = ctx.resourceTypeAndCredentialManager.get(ctx.req.proxiedUrl, ctx.req.resourceType)

  ctx.debug(`credentials calculated for ${resourceType}:${credentialStatus}`)

  // if for some reason the resourceType is not set, have a fallback in place
  ctx.req.resourceType = !ctx.req.resourceType ? resourceType : ctx.req.resourceType
  ctx.req.credentialsLevel = credentialStatus

  span?.setAttributes({
    calculatedResourceType: ctx.req.resourceType,
    credentialsLevel: credentialStatus,
  })

  span?.end()
  ctx.next()
}

const MaybeSimulateSecHeaders: RequestMiddleware = (ctx) => {
  const span = telemetry.startSpan({ name: 'maybe:simulate:sec:headers', parentSpan: ctx.reqMiddlewareSpan })

  span?.setAttributes({
    experimentalModifyObstructiveThirdPartyCode: ctx.config.experimentalModifyObstructiveThirdPartyCode,
  })

  if (!ctx.config.experimentalModifyObstructiveThirdPartyCode) {
    span?.end()
    ctx.next()

    return
  }

  // Do NOT disclose destination to an iframe and simulate if iframe was top
  if (ctx.req.isAUTFrame && ctx.req.headers['sec-fetch-dest'] === 'iframe') {
    const secFetchDestModifiedTo = 'document'

    span?.setAttributes({
      secFetchDestModifiedFrom: ctx.req.headers['sec-fetch-dest'],
      secFetchDestModifiedTo,
    })

    ctx.req.headers['sec-fetch-dest'] = secFetchDestModifiedTo
  }

  span?.end()
  ctx.next()
}

const MaybeAttachCrossOriginCookies: RequestMiddleware = (ctx) => {
  const span = telemetry.startSpan({ name: 'maybe:attach:cross:origin:cookies', parentSpan: ctx.reqMiddlewareSpan })

  const doesTopNeedSimulation = doesTopNeedToBeSimulated(ctx)

  // TODO: might not need these on the span as they are declared above and might trickle down
  span?.setAttributes({
    doesTopNeedToBeSimulated: doesTopNeedSimulation,
    resourceType: ctx.req.resourceType,
  })

  if (!doesTopNeedSimulation) {
    span?.end()

    return ctx.next()
  }

  // Top needs to be simulated since the AUT is in a cross origin state. Get the resourceType and credentials and see what cookies need to be attached
  const currentAUTUrl = ctx.getAUTUrl()
  const shouldCookiesBeAttachedToRequest = shouldAttachAndSetCookies(ctx.req.proxiedUrl, currentAUTUrl, ctx.req.resourceType, ctx.req.credentialsLevel, ctx.req.isAUTFrame)

  span?.setAttributes({
    currentAUTUrl,
    shouldCookiesBeAttachedToRequest,
  })

  ctx.debug(`should cookies be attached to request?: ${shouldCookiesBeAttachedToRequest}`)
  if (!shouldCookiesBeAttachedToRequest) {
    span?.end()

    return ctx.next()
  }

  const sameSiteContext = getSameSiteContext(
    currentAUTUrl,
    ctx.req.proxiedUrl,
    ctx.req.isAUTFrame,
  )

  span?.setAttributes({
    sameSiteContext,
    proxiedUrl: ctx.req.proxiedUrl,
    currentAUTUrl,
    isAUTFrame: ctx.req.isAUTFrame,
  })

  const applicableCookiesInCookieJar = ctx.getCookieJar().getCookies(ctx.req.proxiedUrl, sameSiteContext)
  const cookiesOnRequest = (ctx.req.headers['cookie'] || '').split('; ')

  const existingCookiesInJar = applicableCookiesInCookieJar.join('; ')
  const addedCookiesFromHeader = cookiesOnRequest.join('; ')

  ctx.debug('existing cookies on request from cookie jar: %s', existingCookiesInJar)
  ctx.debug('add cookies to request from header: %s', addedCookiesFromHeader)

  // if the cookie header is empty (i.e. ''), set it to undefined for expected behavior
  ctx.req.headers['cookie'] = addCookieJarCookiesToRequest(applicableCookiesInCookieJar, cookiesOnRequest) || undefined

  span?.setAttributes({
    existingCookiesInJar,
    addedCookiesFromHeader,
    cookieHeader: ctx.req.headers['cookie'],
  })

  ctx.debug('cookies being sent with request: %s', ctx.req.headers['cookie'])

  span?.end()
  ctx.next()
}

function shouldLog (req: CypressIncomingRequest) {
  // 1. Any matching `cy.intercept()` should cause `req` to be logged by default, unless `log: false` is passed explicitly.
  if (req.matchingRoutes?.length) {
    const lastMatchingRoute = req.matchingRoutes[0]

    if (!lastMatchingRoute.staticResponse) {
      // No StaticResponse is set, therefore the request must be logged.
      return true
    }

    if (lastMatchingRoute.staticResponse.log !== undefined) {
      return Boolean(lastMatchingRoute.staticResponse.log)
    }
  }

  // 2. Otherwise, only log if it is an XHR or fetch.
  return req.resourceType === 'fetch' || req.resourceType === 'xhr'
}

const SendToDriver: RequestMiddleware = (ctx) => {
  const span = telemetry.startSpan({ name: 'send:to:driver', parentSpan: ctx.reqMiddlewareSpan })

  const shouldLogReq = shouldLog(ctx.req)

  if (shouldLogReq && ctx.req.browserPreRequest) {
    ctx.socket.toDriver('request:event', 'incoming:request', ctx.req.browserPreRequest)
  }

  span?.setAttributes({
    shouldLogReq,
    hasBrowserPreRequest: !!ctx.req.browserPreRequest,
  })

  span?.end()
  ctx.next()
}

const MaybeEndRequestWithBufferedResponse: RequestMiddleware = (ctx) => {
  const span = telemetry.startSpan({ name: 'maybe:end:with:buffered:response', parentSpan: ctx.reqMiddlewareSpan })

  const buffer = ctx.buffers.take(ctx.req.proxiedUrl)

  span?.setAttributes({
    hasBuffer: !!buffer,
  })

  if (buffer) {
    ctx.debug('ending request with buffered response')

    // NOTE: Only inject fullCrossOrigin here if the super domain origins do not match in order to keep parity with cypress application reloads
    ctx.res.wantsInjection = buffer.urlDoesNotMatchPolicyBasedOnDomain ? 'fullCrossOrigin' : 'full'

    span?.setAttributes({
      wantsInjection: ctx.res.wantsInjection,
    })

    return ctx.onResponse(buffer.response, buffer.stream, span)
  }

  span?.end()
  ctx.next()
}

const RedirectToClientRouteIfUnloaded: RequestMiddleware = (ctx) => {
  const span = telemetry.startSpan({ name: 'redirect:to:client:route:if:unloaded', parentSpan: ctx.reqMiddlewareSpan })

  const hasAppUnloaded = ctx.req.cookies['__cypress.unload']

  span?.setAttributes({
    hasAppUnloaded,
  })

  // if we have an unload header it means our parent app has been navigated away
  // directly and we need to automatically redirect to the clientRoute
  if (hasAppUnloaded) {
    span?.setAttributes({
      redirectedTo: ctx.config.clientRoute,
    })

    ctx.res.redirect(ctx.config.clientRoute)

    span?.end()

    // TODO: where is ctx? Do we need to pass the span in here?
    return ctx.end()
  }

  span?.end()
  ctx.next()
}

const EndRequestsToBlockedHosts: RequestMiddleware = (ctx) => {
  const span = telemetry.startSpan({ name: 'end:requests:to:block:hosts', parentSpan: ctx.reqMiddlewareSpan })

  const { blockHosts } = ctx.config

  span?.setAttributes({
    areBlockHostsConfigured: !!blockHosts,
  })

  if (blockHosts) {
    const matches = blocked.matches(ctx.req.proxiedUrl, blockHosts)

    span?.setAttributes({
      didUrlMatchBlockedHosts: !!matches,
    })

    if (matches) {
      ctx.res.set('x-cypress-matched-blocked-host', matches)
      ctx.debug('blocking request %o', { matches })

      ctx.res.status(503).end()

      span?.end()

      // TODO: where is this? Do we need to pass the span in here?
      return ctx.end()
    }
  }

  ctx.next()
}

const StripUnsupportedAcceptEncoding: RequestMiddleware = (ctx) => {
  const span = telemetry.startSpan({ name: 'strip:unsupported:accept:encoding', parentSpan: ctx.reqMiddlewareSpan })

  // Cypress can only support plaintext or gzip, so make sure we don't request anything else
  const acceptEncoding = ctx.req.headers['accept-encoding']

  span?.setAttributes({
    acceptEncodingHeaderPresent: !!acceptEncoding,
  })

  if (acceptEncoding) {
    const doesAcceptHeadingIncludeGzip = acceptEncoding.includes('gzip')

    span?.setAttributes({
      doesAcceptHeadingIncludeGzip,
    })

    if (doesAcceptHeadingIncludeGzip) {
      ctx.req.headers['accept-encoding'] = 'gzip'
    } else {
      delete ctx.req.headers['accept-encoding']
    }
  }

  span?.end()
  ctx.next()
}

function reqNeedsBasicAuthHeaders (req, { auth, origin }: Cypress.RemoteState) {
  //if we have auth headers, this request matches our origin, protection space, and the user has not supplied auth headers
  return auth && !req.headers['authorization'] && cors.urlMatchesOriginProtectionSpace(req.proxiedUrl, origin)
}

const MaybeSetBasicAuthHeaders: RequestMiddleware = (ctx) => {
  const span = telemetry.startSpan({ name: 'maybe:set:basic:auth:headers', parentSpan: ctx.reqMiddlewareSpan })

  // get the remote state for the proxied url
  const remoteState = ctx.remoteStates.get(ctx.req.proxiedUrl)

  const doesReqNeedBasicAuthHeaders = remoteState?.auth && reqNeedsBasicAuthHeaders(ctx.req, remoteState)

  span?.setAttributes({
    doesReqNeedBasicAuthHeaders,
  })

  if (remoteState?.auth && doesReqNeedBasicAuthHeaders) {
    const { auth } = remoteState
    const base64 = Buffer.from(`${auth.username}:${auth.password}`).toString('base64')

    ctx.req.headers['authorization'] = `Basic ${base64}`
  }

  ctx.next()
}

const SendRequestOutgoing: RequestMiddleware = (ctx) => {
  // end the request middleware here before we make
  // our outbound request so we can see that outside
  // of the internal cypress middleware handlers
  ctx.reqMiddlewareSpan?.end()

  // the actual req/resp time outbound from the proxy server
  const span = telemetry.startSpan({
    name: 'outgoing:request:ttfb',
    parentSpan: ctx.handleHttpRequestSpan,
  })

  const requestOptions = {
    browserPreRequest: ctx.req.browserPreRequest,
    timeout: ctx.req.responseTimeout,
    strictSSL: false,
    followRedirect: ctx.req.followRedirect || false,
    retryIntervals: [],
    url: ctx.req.proxiedUrl,
    time: true, // include timingPhases
  }

  const requestBodyBuffered = !!ctx.req.body

  const { strategy, origin, fileServer } = ctx.remoteStates.current()

  span?.setAttributes({
    requestBodyBuffered,
    strategy,
  })

  if (strategy === 'file' && requestOptions.url.startsWith(origin)) {
    ctx.req.headers['x-cypress-authorization'] = ctx.getFileServerToken()

    requestOptions.url = requestOptions.url.replace(origin, fileServer as string)
  }

  if (requestBodyBuffered) {
    _.assign(requestOptions, _.pick(ctx.req, 'method', 'body', 'headers'))
  }

  span?.setAttributes({
    url: requestOptions.url,
  })

  const req = ctx.request.create(requestOptions)
  const socket = ctx.req.socket

  const onSocketClose = () => {
    ctx.debug('request aborted')

    req.abort()
  }

  req.on('error', ctx.onError)
  req.on('response', (incomingRes) => {
    const { timings } = incomingRes.request

    if (!timings.socket) {
      timings.socket = 0
    }

    if (!timings.lookup) {
      timings.lookup = timings.socket
    }

    if (!timings.connect) {
      timings.connect = timings.lookup
    }

    if (!timings.response) {
      timings.response = timings.connect
    }

    span?.setAttributes({
      'request.timing.socket': timings.socket,
      'request.timing.dns': timings.lookup - timings.socket,
      'request.timing.tcp': timings.connect - timings.lookup,
      'request.timing.firstByte': timings.response - timings.connect,
      'request.timing.totalUntilFirstByte': timings.response,
      // download and total are not available yet
    })

    ctx.onResponse(incomingRes, req, span)
  })

  // TODO: this is an odd place to remove this listener
  ctx.req.res?.on('finish', () => {
    socket.removeListener('close', onSocketClose)
  })

  ctx.req.socket.on('close', onSocketClose)

  if (!requestBodyBuffered) {
    // TODO: how do we measure this?
    // pipe incoming request body, headers to new request
    ctx.req.pipe(req)
  }

  ctx.outgoingReq = req
}

function timerify<T extends Record<string, RequestMiddleware>> (obj: T) {
  return _.mapValues(obj, (fn, key) => {
    return performance.timerify(fn)
  }) as T
}

export default timerify({
  LogRequest,
  CorrelateBrowserPreRequest,
  ExtractCypressMetadataHeaders,
  CalculateCredentialLevelIfApplicable,
  MaybeSimulateSecHeaders,
  MaybeAttachCrossOriginCookies,
  MaybeEndRequestWithBufferedResponse,
  SetMatchingRoutes,
  SendToDriver,
  InterceptRequest,
  RedirectToClientRouteIfUnloaded,
  EndRequestsToBlockedHosts,
  StripUnsupportedAcceptEncoding,
  MaybeSetBasicAuthHeaders,
  SendRequestOutgoing,
})
