import _ from 'lodash'
import { blocked, cors } from '@packages/network'
import { InterceptRequest } from '@packages/net-stubbing'
import type { HttpMiddleware } from './'
import { getSameSiteContext, addCookieJarCookiesToRequest, shouldAttachAndSetCookies } from './util/cookies'
import { doesTopNeedToBeSimulated } from './util/top-simulation'

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
  this.req.isAUTFrame = !!this.req.headers['x-cypress-is-aut-frame']
  const requestIsXhrOrFetch = this.req.headers['x-cypress-is-xhr-or-fetch']

  if (this.req.headers['x-cypress-is-aut-frame']) {
    delete this.req.headers['x-cypress-is-aut-frame']
  }

  if (this.req.headers['x-cypress-is-xhr-or-fetch']) {
    this.debug(`found x-cypress-is-xhr-or-fetch header. Deleting x-cypress-is-xhr-or-fetch header.`)
    delete this.req.headers['x-cypress-is-xhr-or-fetch']
  }

  if (!doesTopNeedToBeSimulated(this) ||
    // this should be unreachable, as the x-cypress-is-xhr-or-fetch header is only attached if
    // the resource type is 'xhr' or 'fetch or 'true' (in the case of electron|extension).
    // This is only needed for defensive purposes.
    (requestIsXhrOrFetch !== 'true' && requestIsXhrOrFetch !== 'xhr' && requestIsXhrOrFetch !== 'fetch')) {
    this.next()

    return
  }

  this.debug(`looking up credentials for ${this.req.proxiedUrl}`)
  const { requestedWith, credentialStatus } = this.requestedWithAndCredentialManager.get(this.req.proxiedUrl, requestIsXhrOrFetch !== 'true' ? requestIsXhrOrFetch : undefined)

  this.debug(`credentials calculated for ${requestedWith}:${credentialStatus}`)

  this.req.requestedWith = requestedWith
  this.req.credentialsLevel = credentialStatus
  this.next()
}

const MaybeSimulateSecHeaders: RequestMiddleware = function () {
  if (!this.config.experimentalModifyObstructiveThirdPartyCode) {
    this.next()

    return
  }

  // Do NOT disclose destination to an iframe and simulate if iframe was top
  if (this.req.isAUTFrame && this.req.headers['sec-fetch-dest'] === 'iframe') {
    this.req.headers['sec-fetch-dest'] = 'document'
  }

  this.next()
}

const MaybeAttachCrossOriginCookies: RequestMiddleware = function () {
  if (!doesTopNeedToBeSimulated(this)) {
    return this.next()
  }

  // Top needs to be simulated since the AUT is in a cross origin state. Get the "requested with" and credentials and see what cookies need to be attached
  const currentAUTUrl = this.getAUTUrl()
  const shouldCookiesBeAttachedToRequest = shouldAttachAndSetCookies(this.req.proxiedUrl, currentAUTUrl, this.req.requestedWith, this.req.credentialsLevel, this.req.isAUTFrame)

  this.debug(`should cookies be attached to request?: ${shouldCookiesBeAttachedToRequest}`)
  if (!shouldCookiesBeAttachedToRequest) {
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
  this.next()
}

const CorrelateBrowserPreRequest: RequestMiddleware = async function () {
  if (!this.shouldCorrelatePreRequests()) {
    return this.next()
  }

  const copyResourceTypeAndNext = () => {
    this.req.resourceType = this.req.browserPreRequest?.resourceType

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

const SendToDriver: RequestMiddleware = function () {
  const { browserPreRequest } = this.req

  if (browserPreRequest) {
    this.socket.toDriver('request:event', 'incoming:request', browserPreRequest)
  }

  this.next()
}

const MaybeEndRequestWithBufferedResponse: RequestMiddleware = function () {
  const buffer = this.buffers.take(this.req.proxiedUrl)

  if (buffer) {
    this.debug('ending request with buffered response')
    // NOTE: Only inject fullCrossOrigin here if experimental is on and
    // the super domain origins do not match in order to keep parity with cypress application reloads
    this.res.wantsInjection = buffer.urlDoesNotMatchPolicyBasedOnDomain ? 'fullCrossOrigin' : 'full'

    return this.onResponse(buffer.response, buffer.stream)
  }

  this.next()
}

const RedirectToClientRouteIfUnloaded: RequestMiddleware = function () {
  // if we have an unload header it means our parent app has been navigated away
  // directly and we need to automatically redirect to the clientRoute
  if (this.req.cookies['__cypress.unload']) {
    this.res.redirect(this.config.clientRoute)

    return this.end()
  }

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

      return this.end()
    }
  }

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

  const req = this.request.create(requestOptions)
  const socket = this.req.socket

  const onSocketClose = () => {
    this.debug('request aborted')
    req.abort()
  }

  req.on('error', this.onError)
  req.on('response', (incomingRes) => this.onResponse(incomingRes, req))

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
  MaybeAttachCrossOriginCookies,
  MaybeEndRequestWithBufferedResponse,
  CorrelateBrowserPreRequest,
  SendToDriver,
  InterceptRequest,
  RedirectToClientRouteIfUnloaded,
  EndRequestsToBlockedHosts,
  StripUnsupportedAcceptEncoding,
  MaybeSetBasicAuthHeaders,
  SendRequestOutgoing,
}
