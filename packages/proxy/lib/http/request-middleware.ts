import _ from 'lodash'
import { blocked } from '@packages/network'
import { InterceptRequest, SetMatchingRoutes } from '@packages/net-stubbing'
import { telemetry } from '@packages/telemetry'
import { isVerboseTelemetry as isVerbose } from '.'
import {
  addCookieJarCookiesToRequest, getSameSiteContext, shouldAttachAndSetCookies,
} from './util/cookies'
import { doesTopNeedToBeSimulated } from './util/top-simulation'
import { resourceTypeAndCredentialManager } from '../resourceTypeAndCredentialManager'
import type { HttpMiddleware } from './'
import type { CypressIncomingRequest } from '../types'
import { getSupportedAcceptEncoding, urlMatchesOriginProtectionSpace } from '@packages/network-tools'
import * as errors from '@packages/errors'

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
  this.req.isFromExtraTarget = !!this.req.headers['x-cypress-is-from-extra-target']
  this.req.isSyncRequest = !!this.req.headers['x-cypress-is-sync-request']

  if (this.req.headers['x-cypress-is-aut-frame']) {
    delete this.req.headers['x-cypress-is-aut-frame']
  }

  if (this.req.headers['x-cypress-is-sync-request']) {
    delete this.req.headers['x-cypress-is-sync-request']
  }

  span?.setAttributes({
    isAUTFrame: this.req.isAUTFrame,
    isFromExtraTarget: this.req.isFromExtraTarget,
  })

  // we only want to intercept requests from the main target and not ones from
  // extra tabs or windows, so run the bare minimum request/response middleware
  // to send the request/response directly through
  if (this.req.isFromExtraTarget) {
    this.debug('request for [%s %s] is from an extra target', this.req.method, this.req.proxiedUrl)

    delete this.req.headers['x-cypress-is-from-extra-target']

    this.onlyRunMiddleware([
      'MaybeSetBasicAuthHeaders',
      'SendRequestOutgoing',
    ])
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
  return this.networkInterceptionCore.correlateBrowserPreRequest(this)
}

const CalculateCredentialLevelIfApplicable: RequestMiddleware = function () {
  if (!doesTopNeedToBeSimulated(this) ||
    (this.req.resourceType !== undefined && this.req.resourceType !== 'xhr' && this.req.resourceType !== 'fetch')) {
    this.next()

    return
  }

  this.debug(`looking up credentials for ${this.req.proxiedUrl}`)
  const { credentialStatus, resourceType } = resourceTypeAndCredentialManager.get(this.req.proxiedUrl, this.req.resourceType)

  this.debug(`credentials calculated for ${resourceType}:${credentialStatus}`)

  // if for some reason the resourceType is not set by the prerequest, have a fallback in place
  this.req.resourceType = !this.req.resourceType ? resourceType : this.req.resourceType
  this.req.credentialsLevel = credentialStatus
  this.next()
}

const FormatCookiesIfApplicable: RequestMiddleware = function () {
  if (this.req.headers['x-cypress-is-webdriver-bidi'] && this.req.headers.cookie) {
    const cookies = this.req.headers.cookie
    // in the case of BiDi, cookies come in as foo=bar;bar=baz and not foo=bar; bar=baz,
    // i.e. they are delimited differently, which impacts some of our tests and our cookie splicing.
    // this regex is to help make sure the cookies are fed in consistently
    const bidiStyleCookie = /;\S/gm

    if (cookies.match(bidiStyleCookie)) {
      this.req.headers.cookie = cookies.replaceAll(';', '; ')
    }
  }

  delete this.req.headers['x-cypress-is-webdriver-bidi']

  return this.next()
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

  if (this.req.isSyncRequest) {
    errors.warning('SYNCHRONOUS_XHR_REQUEST_COOKIES_NOT_APPLIED', this.req.proxiedUrl)
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
    this.debug('ending request with buffered response', { policyMatch: buffer.urlDoesNotMatchPolicyBasedOnDomain })

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

  // if we have an unload header it means our parent app has been navigated away
  // directly and we need to automatically redirect to the clientRoute
  //
  // The `__cypress.unload` cookie is set (browser-side) when the primary app's
  // top window unloads and is only cleared on the corresponding
  // `unload`/`pagehide` event. That event is unreliable, so the cookie can
  // linger on a domain that was previously the primary after the runner has
  // navigated to a different super-domain. Only the primary app is meant to be
  // recovered via this redirect, so restrict it to requests that match the
  // current primary super-domain origin. A request to a non-primary origin is a
  // normal cross-origin navigation (handled by cy.origin) and must be served —
  // not redirected to the client route — even if a stale unload cookie is
  // present on that domain. Without this guard, e.g. visiting an IdP as the
  // primary origin and then redirecting back to the app origin to complete
  // login would be wrongly bounced to the Cypress specs UI.
  const isPrimarySuperDomainOrigin = this.remoteStates.isPrimarySuperDomainOrigin(this.req.proxiedUrl)

  span?.setAttributes({
    hasAppUnloaded,
    isPrimarySuperDomainOrigin,
  })

  // We do not redirect if we are in cypress in cypress since this can be caused by a reload of the internal Cypress app
  if (hasAppUnloaded && isPrimarySuperDomainOrigin && !process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF_PARENT_PROJECT) {
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
    const matches = blocked.matches(this.req.proxiedUrl, blockHosts as string[])

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

  const acceptEncoding = this.req.headers['accept-encoding']
  const supported = getSupportedAcceptEncoding(acceptEncoding)

  span?.setAttributes({
    acceptEncodingHeaderPresent: !!acceptEncoding,
    doesAcceptHeadingIncludeGzip: !!acceptEncoding?.includes('gzip'),
    doesAcceptHeadingIncludeBr: !!acceptEncoding?.includes('br'),
  })

  this.req.headers['accept-encoding'] = supported
  this.debug(
    acceptEncoding ? 'accept-encoding header present, setting to %s' : 'no accept-encoding header, setting to %s',
    supported,
  )

  span?.end()
  this.next()
}

function reqNeedsBasicAuthHeaders (req, { auth, origin }: Cypress.RemoteState) {
  //if we have auth headers, this request matches our origin, protection space, and the user has not supplied auth headers
  return auth && !req.headers['authorization'] && urlMatchesOriginProtectionSpace(req.proxiedUrl, origin)
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
  this.networkInterceptionCore.forwardToOrigin(this)
}

export default {
  LogRequest,
  ExtractCypressMetadataHeaders,
  MaybeSimulateSecHeaders,
  CorrelateBrowserPreRequest,
  CalculateCredentialLevelIfApplicable,
  FormatCookiesIfApplicable,
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
