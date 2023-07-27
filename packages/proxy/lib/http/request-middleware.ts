import _ from 'lodash'
import { blocked, cors } from '@packages/network'
import { InterceptRequest, SetMatchingRoutes } from '@packages/net-stubbing'
import { telemetry } from '@packages/telemetry'
import { isVerboseTelemetry as isVerbose } from '.'
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

const LogRequest: RequestMiddleware = function () {
  this.debug('proxying request %o', {
    req: _.pick(this.req, 'method', 'proxiedUrl', 'headers'),
  })

  this.next()
}

const ExtractCypressMetadataHeaders: RequestMiddleware = function () {
  const span = telemetry.startSpan({ name: 'extract:cypress:metadata:headers', parentSpan: this.reqMiddlewareSpan, isVerbose })

  this.req.isAUTFrame = !!this.req.headers['x-cypress-is-aut-frame']

  span?.setAttributes({
    isAUTFrame: this.req.isAUTFrame,
  })

  if (this.req.headers['x-cypress-is-aut-frame']) {
    delete this.req.headers['x-cypress-is-aut-frame']
  }

  span?.end()
  this.next()
}

const MaybeSimulateSecHeaders: RequestMiddleware = function () {
  const span = telemetry.startSpan({ name: 'maybe:simulate:sec:headers', parentSpan: this.reqMiddlewareSpan, isVerbose })

  span?.setAttributes({
    experimentalModifyObstructiveThirdPartyCode: this.config.experimentalModifyObstructiveThirdPartyCode,
  })

  if (!this.config.experimentalModifyObstructiveThirdPartyCode) {
    span?.end()
    this.next()

    return
  }

  // Do NOT disclose destination to an iframe and simulate if iframe was top
  if (this.req.isAUTFrame && this.req.headers['sec-fetch-dest'] === 'iframe') {
    const secFetchDestModifiedTo = 'document'

    span?.setAttributes({
      secFetchDestModifiedFrom: this.req.headers['sec-fetch-dest'],
      secFetchDestModifiedTo,
    })

    this.req.headers['sec-fetch-dest'] = secFetchDestModifiedTo
  }

  span?.end()
  this.next()
}

const CorrelateBrowserPreRequest: RequestMiddleware = async function () {
  const span = telemetry.startSpan({ name: 'correlate:prerequest', parentSpan: this.reqMiddlewareSpan, isVerbose })

  const shouldCorrelatePreRequests = this.shouldCorrelatePreRequests()

  span?.setAttributes({
    shouldCorrelatePreRequest: shouldCorrelatePreRequests,
  })

  if (!this.shouldCorrelatePreRequests()) {
    span?.end()

    return this.next()
  }

  const copyResourceTypeAndNext = () => {
    this.req.resourceType = this.req.browserPreRequest?.resourceType

    span?.setAttributes({
      resourceType: this.req.resourceType,
    })

    span?.end()

    return this.next()
  }

  if (this.req.headers['x-cypress-resolving-url']) {
    this.debug('skipping prerequest for resolve:url')
    delete this.req.headers['x-cypress-resolving-url']
    const requestId = `cy.visit-${Date.now()}`

    this.req.browserPreRequest = {
      requestId,
      method: this.req.method,
      url: this.req.proxiedUrl,
      // @ts-ignore
      headers: this.req.headers,
      resourceType: 'document',
      originalResourceType: 'document',
    }

    this.res.on('close', () => {
      this.socket.toDriver('request:event', 'response:received', {
        requestId,
        headers: this.res.getHeaders(),
        status: this.res.statusCode,
      })
    })

    return copyResourceTypeAndNext()
  }

  this.debug('waiting for prerequest')
  this.getPreRequest(((browserPreRequest) => {
    this.req.browserPreRequest = browserPreRequest
    copyResourceTypeAndNext()
  }))
}

const CalculateCredentialLevelIfApplicable: RequestMiddleware = function () {
  if (!doesTopNeedToBeSimulated(this) ||
    (this.req.resourceType !== undefined && this.req.resourceType !== 'xhr' && this.req.resourceType !== 'fetch')) {
    this.next()

    return
  }

  this.debug(`looking up credentials for ${this.req.proxiedUrl}`)
  const { credentialStatus, resourceType } = this.resourceTypeAndCredentialManager.get(this.req.proxiedUrl, this.req.resourceType)

  this.debug(`credentials calculated for ${resourceType}:${credentialStatus}`)

  // if for some reason the resourceType is not set by the prerequest, have a fallback in place
  this.req.resourceType = !this.req.resourceType ? resourceType : this.req.resourceType
  this.req.credentialsLevel = credentialStatus
  this.next()
}

const MaybeAttachCrossOriginCookies: RequestMiddleware = function () {
  const span = telemetry.startSpan({ name: 'maybe:attach:cross:origin:cookies', parentSpan: this.reqMiddlewareSpan, isVerbose })

  const doesTopNeedSimulation = doesTopNeedToBeSimulated(this)

  span?.setAttributes({
    doesTopNeedToBeSimulated: doesTopNeedSimulation,
    resourceType: this.req.resourceType,
  })

  if (!doesTopNeedSimulation) {
    span?.end()

    return this.next()
  }

  // Top needs to be simulated since the AUT is in a cross origin state. Get the "requested with" and credentials and see what cookies need to be attached
  const currentAUTUrl = this.getAUTUrl()
  const shouldCookiesBeAttachedToRequest = shouldAttachAndSetCookies(this.req.proxiedUrl, currentAUTUrl, this.req.resourceType, this.req.credentialsLevel, this.req.isAUTFrame)

  span?.setAttributes({
    currentAUTUrl,
    shouldCookiesBeAttachedToRequest,
  })

  this.debug(`should cookies be attached to request?: ${shouldCookiesBeAttachedToRequest}`)
  if (!shouldCookiesBeAttachedToRequest) {
    span?.end()

    return this.next()
  }

  const sameSiteContext = getSameSiteContext(
    currentAUTUrl,
    this.req.proxiedUrl,
    this.req.isAUTFrame,
  )

  span?.setAttributes({
    sameSiteContext,
    currentAUTUrl,
    isAUTFrame: this.req.isAUTFrame,
  })

  const applicableCookiesInCookieJar = this.getCookieJar().getCookies(this.req.proxiedUrl, sameSiteContext)
  const cookiesOnRequest = (this.req.headers['cookie'] || '').split('; ')

  const existingCookiesInJar = applicableCookiesInCookieJar.join('; ')
  const addedCookiesFromHeader = cookiesOnRequest.join('; ')

  this.debug('existing cookies on request from cookie jar: %s', existingCookiesInJar)
  this.debug('add cookies to request from header: %s', addedCookiesFromHeader)

  // if the cookie header is empty (i.e. ''), set it to undefined for expected behavior
  this.req.headers['cookie'] = addCookieJarCookiesToRequest(applicableCookiesInCookieJar, cookiesOnRequest) || undefined

  span?.setAttributes({
    existingCookiesInJar,
    addedCookiesFromHeader,
    cookieHeader: this.req.headers['cookie'],
  })

  this.debug('cookies being sent with request: %s', this.req.headers['cookie'])

  span?.end()
  this.next()
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

const SendToDriver: RequestMiddleware = function () {
  const span = telemetry.startSpan({ name: 'send:to:driver', parentSpan: this.reqMiddlewareSpan, isVerbose })

  const shouldLogReq = shouldLog(this.req)

  if (shouldLogReq && this.req.browserPreRequest) {
    this.socket.toDriver('request:event', 'incoming:request', this.req.browserPreRequest)
  }

  span?.setAttributes({
    shouldLogReq,
    hasBrowserPreRequest: !!this.req.browserPreRequest,
  })

  span?.end()
  this.next()
}

const MaybeEndRequestWithBufferedResponse: RequestMiddleware = function () {
  const span = telemetry.startSpan({ name: 'maybe:end:with:buffered:response', parentSpan: this.reqMiddlewareSpan, isVerbose })

  const buffer = this.buffers.take(this.req.proxiedUrl)

  span?.setAttributes({
    hasBuffer: !!buffer,
  })

  if (buffer) {
    this.debug('ending request with buffered response')

    // NOTE: Only inject fullCrossOrigin here if the super domain origins do not match in order to keep parity with cypress application reloads
    this.res.wantsInjection = buffer.urlDoesNotMatchPolicyBasedOnDomain ? 'fullCrossOrigin' : 'full'

    span?.setAttributes({
      wantsInjection: this.res.wantsInjection,
    })

    span?.end()
    this.reqMiddlewareSpan?.end()

    return this.onResponse(buffer.response, buffer.stream)
  }

  span?.end()
  this.next()
}

const RedirectToClientRouteIfUnloaded: RequestMiddleware = function () {
  const span = telemetry.startSpan({ name: 'redirect:to:client:route:if:unloaded', parentSpan: this.reqMiddlewareSpan, isVerbose })

  const hasAppUnloaded = this.req.cookies['__cypress.unload']

  span?.setAttributes({
    hasAppUnloaded,
  })

  // if we have an unload header it means our parent app has been navigated away
  // directly and we need to automatically redirect to the clientRoute
  if (hasAppUnloaded) {
    span?.setAttributes({
      redirectedTo: this.config.clientRoute,
    })

    this.res.redirect(this.config.clientRoute)

    span?.end()

    return this.end()
  }

  span?.end()
  this.next()
}

const EndRequestsToBlockedHosts: RequestMiddleware = function () {
  const span = telemetry.startSpan({ name: 'end:requests:to:block:hosts', parentSpan: this.reqMiddlewareSpan, isVerbose })

  const { blockHosts } = this.config

  span?.setAttributes({
    areBlockHostsConfigured: !!blockHosts,
  })

  if (blockHosts) {
    const matches = blocked.matches(this.req.proxiedUrl, blockHosts)

    span?.setAttributes({
      didUrlMatchBlockedHosts: !!matches,
    })

    if (matches) {
      this.res.set('x-cypress-matched-blocked-host', matches)
      this.debug('blocking request %o', { matches })

      this.res.status(503).end()

      span?.end()

      return this.end()
    }
  }

  this.next()
}

const StripUnsupportedAcceptEncoding: RequestMiddleware = function () {
  const span = telemetry.startSpan({ name: 'strip:unsupported:accept:encoding', parentSpan: this.reqMiddlewareSpan, isVerbose })

  // Cypress can only support plaintext or gzip, so make sure we don't request anything else
  const acceptEncoding = this.req.headers['accept-encoding']

  span?.setAttributes({
    acceptEncodingHeaderPresent: !!acceptEncoding,
  })

  if (acceptEncoding) {
    const doesAcceptHeadingIncludeGzip = acceptEncoding.includes('gzip')

    span?.setAttributes({
      doesAcceptHeadingIncludeGzip,
    })

    if (doesAcceptHeadingIncludeGzip) {
      this.req.headers['accept-encoding'] = 'gzip'
    } else {
      delete this.req.headers['accept-encoding']
    }
  }

  span?.end()
  this.next()
}

function reqNeedsBasicAuthHeaders (req, { auth, origin }: Cypress.RemoteState) {
  //if we have auth headers, this request matches our origin, protection space, and the user has not supplied auth headers
  return auth && !req.headers['authorization'] && cors.urlMatchesOriginProtectionSpace(req.proxiedUrl, origin)
}

const MaybeSetBasicAuthHeaders: RequestMiddleware = function () {
  const span = telemetry.startSpan({ name: 'maybe:set:basic:auth:headers', parentSpan: this.reqMiddlewareSpan, isVerbose })

  // get the remote state for the proxied url
  const remoteState = this.remoteStates.get(this.req.proxiedUrl)

  const doesReqNeedBasicAuthHeaders = remoteState?.auth && reqNeedsBasicAuthHeaders(this.req, remoteState)

  span?.setAttributes({
    doesReqNeedBasicAuthHeaders,
  })

  if (remoteState?.auth && doesReqNeedBasicAuthHeaders) {
    const { auth } = remoteState
    const base64 = Buffer.from(`${auth.username}:${auth.password}`).toString('base64')

    this.req.headers['authorization'] = `Basic ${base64}`
  }

  span?.end()
  this.next()
}

const SendRequestOutgoing: RequestMiddleware = function () {
  // end the request middleware span here before we make
  // our outbound request so we can see that outside
  // of the internal cypress middleware handlers
  this.reqMiddlewareSpan?.end()

  // the actual req/resp time outbound from the proxy server
  const span = telemetry.startSpan({
    name: 'outgoing:request:ttfb',
    parentSpan: this.handleHttpRequestSpan,
    isVerbose,
  })

  const requestOptions = {
    browserPreRequest: this.req.browserPreRequest,
    timeout: this.req.responseTimeout,
    strictSSL: false,
    followRedirect: this.req.followRedirect || false,
    retryIntervals: [],
    url: this.req.proxiedUrl,
    time: !!span, // include timingPhases
  }

  const requestBodyBuffered = !!this.req.body

  const { strategy, origin, fileServer } = this.remoteStates.current()

  span?.setAttributes({
    requestBodyBuffered,
    strategy,
  })

  if (strategy === 'file' && requestOptions.url.startsWith(origin)) {
    this.req.headers['x-cypress-authorization'] = this.getFileServerToken()

    requestOptions.url = requestOptions.url.replace(origin, fileServer as string)
  }

  if (requestBodyBuffered) {
    _.assign(requestOptions, _.pick(this.req, 'method', 'body', 'headers'))
  }

  const req = this.request.create(requestOptions)
  const socket = this.req.socket

  const onSocketClose = () => {
    this.debug('request aborted')
    // if the request is aborted, close out the middleware span and http span. the response middleware did not run

    this.reqMiddlewareSpan?.setAttributes({
      requestAborted: true,
    })

    this.reqMiddlewareSpan?.end()
    this.handleHttpRequestSpan?.end()

    req.abort()
  }

  req.on('error', this.onError)
  req.on('response', (incomingRes) => {
    if (span) {
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

      span.setAttributes({
        'request.timing.socket': timings.socket,
        'request.timing.dns': timings.lookup - timings.socket,
        'request.timing.tcp': timings.connect - timings.lookup,
        'request.timing.firstByte': timings.response - timings.connect,
        'request.timing.totalUntilFirstByte': timings.response,
      // download and total are not available yet
      })

      span.end()
    }

    this.onResponse(incomingRes, req)
  })

  // NOTE: this is an odd place to remove this listener
  this.req.res?.on('finish', () => {
    socket.removeListener('close', onSocketClose)
  })

  this.req.socket.on('close', onSocketClose)

  if (!requestBodyBuffered) {
    // pipe incoming request body, headers to new request
    this.req.pipe(req)
  }

  this.outgoingReq = req
}

export default {
  LogRequest,
  ExtractCypressMetadataHeaders,
  MaybeSimulateSecHeaders,
  CorrelateBrowserPreRequest,
  CalculateCredentialLevelIfApplicable,
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
}
