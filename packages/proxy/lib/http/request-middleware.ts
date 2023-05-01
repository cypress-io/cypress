import _ from 'lodash'
import { performance } from 'perf_hooks'
import { blocked, cors } from '@packages/network'
import { InterceptRequest, SetMatchingRoutes } from '@packages/net-stubbing'
import type { HttpMiddleware } from './'
import { getSameSiteContext, addCookieJarCookiesToRequest, shouldAttachAndSetCookies } from './util/cookies'
import { doesTopNeedToBeSimulated } from './util/top-simulation'
import type { CypressIncomingRequest } from '../types'

// do not use a debug namespace in this file - use the per-request `this.debug` instead
// available as cypress-verbose:proxy:http
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const debug = null

export type RequestMiddleware = HttpMiddleware<{
  outgoingReq: any
}>

const LogRequest: RequestMiddleware = function () {
  performance.mark(`${this.req.proxiedUrl}-RequestMiddleware-start`)
  this.debug('proxying request %o', {
    req: _.pick(this.req, 'method', 'proxiedUrl', 'headers'),
  })

  this.next()
}

const CorrelateBrowserPreRequest: RequestMiddleware = async function () {
  if (!this.shouldCorrelatePreRequests()) {
    performance.mark(`${this.req.proxiedUrl}-RequestMiddleware-CorrelateBrowserPreRequest-finish`)

    return this.next()
  }

  const copyResourceTypeAndNext = () => {
    this.req.resourceType = this.req.browserPreRequest?.resourceType

    performance.mark(`${this.req.proxiedUrl}-RequestMiddleware-CorrelateBrowserPreRequest-finish`)
    this.next()
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

const ExtractCypressMetadataHeaders: RequestMiddleware = function () {
  this.req.isAUTFrame = !!this.req.headers['x-cypress-is-aut-frame']

  if (this.req.headers['x-cypress-is-aut-frame']) {
    delete this.req.headers['x-cypress-is-aut-frame']
  }

  performance.mark(`${this.req.proxiedUrl}-RequestMiddleware-ExtractCypressMetadataHeaders-finish`)
  this.next()
}

const CalculateCredentialLevelIfApplicable: RequestMiddleware = function () {
  if (!doesTopNeedToBeSimulated(this) ||
    (this.req.resourceType !== undefined && this.req.resourceType !== 'xhr' && this.req.resourceType !== 'fetch')) {
    performance.mark(`${this.req.proxiedUrl}-RequestMiddleware-CalculateCredentialLevelIfApplicable-finish`)
    this.next()

    return
  }

  this.debug(`looking up credentials for ${this.req.proxiedUrl}`)
  const { credentialStatus, resourceType } = this.resourceTypeAndCredentialManager.get(this.req.proxiedUrl, this.req.resourceType)

  this.debug(`credentials calculated for ${resourceType}:${credentialStatus}`)

  // if for some reason the resourceType is not set, have a fallback in place
  this.req.resourceType = !this.req.resourceType ? resourceType : this.req.resourceType
  this.req.credentialsLevel = credentialStatus
  performance.mark(`${this.req.proxiedUrl}-RequestMiddleware-CalculateCredentialLevelIfApplicable-finish`)
  this.next()
}

const MaybeSimulateSecHeaders: RequestMiddleware = function () {
  if (!this.config.experimentalModifyObstructiveThirdPartyCode) {
    performance.mark(`${this.req.proxiedUrl}-RequestMiddleware-MaybeSimulateSecHeaders-finish`)
    this.next()

    return
  }

  // Do NOT disclose destination to an iframe and simulate if iframe was top
  if (this.req.isAUTFrame && this.req.headers['sec-fetch-dest'] === 'iframe') {
    this.req.headers['sec-fetch-dest'] = 'document'
  }

  performance.mark(`${this.req.proxiedUrl}-RequestMiddleware-MaybeSimulateSecHeaders-finish`)
  this.next()
}

const MaybeAttachCrossOriginCookies: RequestMiddleware = function () {
  if (!doesTopNeedToBeSimulated(this)) {
    performance.mark(`${this.req.proxiedUrl}-RequestMiddleware-MaybeAttachCrossOriginCookies-finish`)

    return this.next()
  }

  // Top needs to be simulated since the AUT is in a cross origin state. Get the resourceType and credentials and see what cookies need to be attached
  const currentAUTUrl = this.getAUTUrl()
  const shouldCookiesBeAttachedToRequest = shouldAttachAndSetCookies(this.req.proxiedUrl, currentAUTUrl, this.req.resourceType, this.req.credentialsLevel, this.req.isAUTFrame)

  this.debug(`should cookies be attached to request?: ${shouldCookiesBeAttachedToRequest}`)
  if (!shouldCookiesBeAttachedToRequest) {
    performance.mark(`${this.req.proxiedUrl}-RequestMiddleware-MaybeAttachCrossOriginCookies-finish`)

    return this.next()
  }

  const sameSiteContext = getSameSiteContext(
    currentAUTUrl,
    this.req.proxiedUrl,
    this.req.isAUTFrame,
  )

  const applicableCookiesInCookieJar = this.getCookieJar().getCookies(this.req.proxiedUrl, sameSiteContext)
  const cookiesOnRequest = (this.req.headers['cookie'] || '').split('; ')

  this.debug('existing cookies on request from cookie jar: %s', applicableCookiesInCookieJar.join('; '))
  this.debug('add cookies to request from header: %s', cookiesOnRequest.join('; '))

  // if the cookie header is empty (i.e. ''), set it to undefined for expected behavior
  this.req.headers['cookie'] = addCookieJarCookiesToRequest(applicableCookiesInCookieJar, cookiesOnRequest) || undefined

  this.debug('cookies being sent with request: %s', this.req.headers['cookie'])

  performance.mark(`${this.req.proxiedUrl}-RequestMiddleware-MaybeAttachCrossOriginCookies-finish`)
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
  if (shouldLog(this.req) && this.req.browserPreRequest) {
    this.socket.toDriver('request:event', 'incoming:request', this.req.browserPreRequest)
  }

  performance.mark(`${this.req.proxiedUrl}-RequestMiddleware-SendToDriver-finish`)
  this.next()
}

const MaybeEndRequestWithBufferedResponse: RequestMiddleware = function () {
  const buffer = this.buffers.take(this.req.proxiedUrl)

  if (buffer) {
    this.debug('ending request with buffered response')

    // NOTE: Only inject fullCrossOrigin here if the super domain origins do not match in order to keep parity with cypress application reloads
    this.res.wantsInjection = buffer.urlDoesNotMatchPolicyBasedOnDomain ? 'fullCrossOrigin' : 'full'

    return this.onResponse(buffer.response, buffer.stream)
  }

  performance.mark(`${this.req.proxiedUrl}-RequestMiddleware-MaybeEndRequestWithBufferedResponse-finish`)
  this.next()
}

const RedirectToClientRouteIfUnloaded: RequestMiddleware = function () {
  // if we have an unload header it means our parent app has been navigated away
  // directly and we need to automatically redirect to the clientRoute
  if (this.req.cookies['__cypress.unload']) {
    this.res.redirect(this.config.clientRoute)
    performance.mark(`${this.req.proxiedUrl}-RequestMiddleware-RedirectToClientRouteIfUnloaded-finish`)

    return this.end()
  }

  performance.mark(`${this.req.proxiedUrl}-RequestMiddleware-RedirectToClientRouteIfUnloaded-finish`)
  this.next()
}

const EndRequestsToBlockedHosts: RequestMiddleware = function () {
  const { blockHosts } = this.config

  if (blockHosts) {
    const matches = blocked.matches(this.req.proxiedUrl, blockHosts)

    if (matches) {
      this.res.set('x-cypress-matched-blocked-host', matches)
      this.debug('blocking request %o', { matches })

      this.res.status(503).end()

      performance.mark(`${this.req.proxiedUrl}-RequestMiddleware-EndRequestsToBlockedHosts-finish`)

      return this.end()
    }
  }

  performance.mark(`${this.req.proxiedUrl}-RequestMiddleware-EndRequestsToBlockedHosts-finish`)
  this.next()
}

const StripUnsupportedAcceptEncoding: RequestMiddleware = function () {
  // Cypress can only support plaintext or gzip, so make sure we don't request anything else
  const acceptEncoding = this.req.headers['accept-encoding']

  if (acceptEncoding) {
    if (acceptEncoding.includes('gzip')) {
      this.req.headers['accept-encoding'] = 'gzip'
    } else {
      delete this.req.headers['accept-encoding']
    }
  }

  performance.mark(`${this.req.proxiedUrl}-RequestMiddleware-StripUnsupportedAcceptEncoding-finish`)
  this.next()
}

function reqNeedsBasicAuthHeaders (req, { auth, origin }: Cypress.RemoteState) {
  //if we have auth headers, this request matches our origin, protection space, and the user has not supplied auth headers
  return auth && !req.headers['authorization'] && cors.urlMatchesOriginProtectionSpace(req.proxiedUrl, origin)
}

const MaybeSetBasicAuthHeaders: RequestMiddleware = function () {
  // get the remote state for the proxied url
  const remoteState = this.remoteStates.get(this.req.proxiedUrl)

  if (remoteState?.auth && reqNeedsBasicAuthHeaders(this.req, remoteState)) {
    const { auth } = remoteState
    const base64 = Buffer.from(`${auth.username}:${auth.password}`).toString('base64')

    this.req.headers['authorization'] = `Basic ${base64}`
  }

  performance.mark(`${this.req.proxiedUrl}-RequestMiddleware-MaybeSetBasicAuthHeaders-finish`)
  this.next()
}

const SendRequestOutgoing: RequestMiddleware = function () {
  const requestOptions = {
    timeout: this.req.responseTimeout,
    strictSSL: false,
    followRedirect: this.req.followRedirect || false,
    retryIntervals: [],
    url: this.req.proxiedUrl,
  }

  const requestBodyBuffered = !!this.req.body

  const { strategy, origin, fileServer } = this.remoteStates.current()

  if (strategy === 'file' && requestOptions.url.startsWith(origin)) {
    this.req.headers['x-cypress-authorization'] = this.getFileServerToken()

    requestOptions.url = requestOptions.url.replace(origin, fileServer as string)
  }

  if (requestBodyBuffered) {
    _.assign(requestOptions, _.pick(this.req, 'method', 'body', 'headers'))
  }

  performance.mark(`${this.req.proxiedUrl}-Response-start`)
  const req = this.request.create(requestOptions)
  const socket = this.req.socket

  const onSocketClose = () => {
    this.debug('request aborted')
    req.abort()
  }

  req.on('error', this.onError)
  req.on('response', (incomingRes) => this.onResponse(incomingRes, req))

  this.req.res?.on('finish', () => {
    performance.mark(`${this.req.proxiedUrl}-Response-finish`)
    // the actual req/resp time outbound from the proxy server
    performance.measure(`${this.req.proxiedUrl}-Response`, `${this.req.proxiedUrl}-Response-start`, `${this.req.proxiedUrl}-Response-finish`)
    socket.removeListener('close', onSocketClose)
  })

  this.req.socket.on('close', onSocketClose)

  if (!requestBodyBuffered) {
    // pipe incoming request body, headers to new request
    this.req.pipe(req)
  }

  this.outgoingReq = req
  performance.mark(`${this.req.proxiedUrl}-RequestMiddleware-SendRequestOutgoing-finish`)
  performance.mark(`${this.req.proxiedUrl}-RequestMiddleware-finish`)

  // instrumented request middleware

  performance.measure(`${this.req.proxiedUrl}-RequestMiddleware-Total`, `${this.req.proxiedUrl}-RequestMiddleware-start`, `${this.req.proxiedUrl}-RequestMiddleware-finish`)

  performance.measure(`${this.req.proxiedUrl}-RequestMiddleware-CorrelateBrowserPreRequest`, `${this.req.proxiedUrl}-RequestMiddleware-start`, `${this.req.proxiedUrl}-RequestMiddleware-CorrelateBrowserPreRequest-finish`)

  performance.measure(`${this.req.proxiedUrl}-RequestMiddleware-ExtractCypressMetadataHeaders`, `${this.req.proxiedUrl}-RequestMiddleware-CorrelateBrowserPreRequest-finish`, `${this.req.proxiedUrl}-RequestMiddleware-ExtractCypressMetadataHeaders-finish`)
  performance.measure(`${this.req.proxiedUrl}-RequestMiddleware-CalculateCredentialLevelIfApplicable`, `${this.req.proxiedUrl}-RequestMiddleware-CorrelateBrowserPreRequest-finish`, `${this.req.proxiedUrl}-RequestMiddleware-CalculateCredentialLevelIfApplicable-finish`)
  performance.measure(`${this.req.proxiedUrl}-RequestMiddleware-MaybeSimulateSecHeaders`, `${this.req.proxiedUrl}-RequestMiddleware-CalculateCredentialLevelIfApplicable-finish`, `${this.req.proxiedUrl}-RequestMiddleware-MaybeSimulateSecHeaders-finish`)
  performance.measure(`${this.req.proxiedUrl}-RequestMiddleware-MaybeAttachCrossOriginCookies`, `${this.req.proxiedUrl}-RequestMiddleware-MaybeSimulateSecHeaders-finish`, `${this.req.proxiedUrl}-RequestMiddleware-MaybeAttachCrossOriginCookies-finish`)
  performance.measure(`${this.req.proxiedUrl}-RequestMiddleware-MaybeEndRequestWithBufferedResponse`, `${this.req.proxiedUrl}-RequestMiddleware-MaybeAttachCrossOriginCookies-finish`, `${this.req.proxiedUrl}-RequestMiddleware-MaybeEndRequestWithBufferedResponse-finish`)
  performance.measure(`${this.req.proxiedUrl}-RequestMiddleware-SetMatchingRoutes`, `${this.req.proxiedUrl}-RequestMiddleware-MaybeEndRequestWithBufferedResponse-finish`, `${this.req.proxiedUrl}-RequestMiddleware-SetMatchingRoutes-finish`)
  performance.measure(`${this.req.proxiedUrl}-RequestMiddleware-SendToDriver`, `${this.req.proxiedUrl}-RequestMiddleware-SetMatchingRoutes-finish`, `${this.req.proxiedUrl}-RequestMiddleware-SendToDriver-finish`)
  performance.measure(`${this.req.proxiedUrl}-RequestMiddleware-InterceptRequest`, `${this.req.proxiedUrl}-RequestMiddleware-SendToDriver-finish`, `${this.req.proxiedUrl}-RequestMiddleware-InterceptRequest-finish`)
  performance.measure(`${this.req.proxiedUrl}-RequestMiddleware-RedirectToClientRouteIfUnloaded`, `${this.req.proxiedUrl}-RequestMiddleware-InterceptRequest-finish`, `${this.req.proxiedUrl}-RequestMiddleware-RedirectToClientRouteIfUnloaded-finish`)
  performance.measure(`${this.req.proxiedUrl}-RequestMiddleware-EndRequestsToBlockedHosts`, `${this.req.proxiedUrl}-RequestMiddleware-RedirectToClientRouteIfUnloaded-finish`, `${this.req.proxiedUrl}-RequestMiddleware-EndRequestsToBlockedHosts-finish`)
  performance.measure(`${this.req.proxiedUrl}-RequestMiddleware-StripUnsupportedAcceptEncoding`, `${this.req.proxiedUrl}-RequestMiddleware-EndRequestsToBlockedHosts-finish`, `${this.req.proxiedUrl}-RequestMiddleware-StripUnsupportedAcceptEncoding-finish`)
  performance.measure(`${this.req.proxiedUrl}-RequestMiddleware-MaybeSetBasicAuthHeaders`, `${this.req.proxiedUrl}-RequestMiddleware-StripUnsupportedAcceptEncoding-finish`, `${this.req.proxiedUrl}-RequestMiddleware-MaybeSetBasicAuthHeaders-finish`)
  performance.measure(`${this.req.proxiedUrl}-RequestMiddleware-SendRequestOutgoing`, `${this.req.proxiedUrl}-RequestMiddleware-MaybeSetBasicAuthHeaders-finish`, `${this.req.proxiedUrl}-RequestMiddleware-SendRequestOutgoing-finish`)
}

export default {
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
}
