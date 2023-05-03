import _ from 'lodash'
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

const ExtractCypressMetadataHeaders: RequestMiddleware = (ctx) => {
  ctx.req.isAUTFrame = !!ctx.req.headers['x-cypress-is-aut-frame']
  const requestIsXhrOrFetch = ctx.req.headers['x-cypress-is-xhr-or-fetch']

  if (ctx.req.headers['x-cypress-is-aut-frame']) {
    delete ctx.req.headers['x-cypress-is-aut-frame']
  }

  if (ctx.req.headers['x-cypress-is-xhr-or-fetch']) {
    ctx.debug(`found x-cypress-is-xhr-or-fetch header. Deleting x-cypress-is-xhr-or-fetch header.`)
    delete ctx.req.headers['x-cypress-is-xhr-or-fetch']
  }

  if (!doesTopNeedToBeSimulated(ctx) ||
    // this should be unreachable, as the x-cypress-is-xhr-or-fetch header is only attached if
    // the resource type is 'xhr' or 'fetch or 'true' (in the case of electron|extension).
    // This is only needed for defensive purposes.
    (requestIsXhrOrFetch !== 'true' && requestIsXhrOrFetch !== 'xhr' && requestIsXhrOrFetch !== 'fetch')) {
    ctx.next()

    return
  }

  ctx.debug(`looking up credentials for ${ctx.req.proxiedUrl}`)
  const { requestedWith, credentialStatus } = ctx.requestedWithAndCredentialManager.get(ctx.req.proxiedUrl, requestIsXhrOrFetch !== 'true' ? requestIsXhrOrFetch : undefined)

  ctx.debug(`credentials calculated for ${requestedWith}:${credentialStatus}`)

  ctx.req.requestedWith = requestedWith
  ctx.req.credentialsLevel = credentialStatus
  ctx.next()
}

const MaybeSimulateSecHeaders: RequestMiddleware = (ctx) => {
  if (!ctx.config.experimentalModifyObstructiveThirdPartyCode) {
    ctx.next()

    return
  }

  // Do NOT disclose destination to an iframe and simulate if iframe was top
  if (ctx.req.isAUTFrame && ctx.req.headers['sec-fetch-dest'] === 'iframe') {
    ctx.req.headers['sec-fetch-dest'] = 'document'
  }

  ctx.next()
}

const MaybeAttachCrossOriginCookies: RequestMiddleware = (ctx) => {
  if (!doesTopNeedToBeSimulated(ctx)) {
    return ctx.next()
  }

  // Top needs to be simulated since the AUT is in a cross origin state. Get the "requested with" and credentials and see what cookies need to be attached
  const currentAUTUrl = ctx.getAUTUrl()
  const shouldCookiesBeAttachedToRequest = shouldAttachAndSetCookies(ctx.req.proxiedUrl, currentAUTUrl, ctx.req.requestedWith, ctx.req.credentialsLevel, ctx.req.isAUTFrame)

  ctx.debug(`should cookies be attached to request?: ${shouldCookiesBeAttachedToRequest}`)
  if (!shouldCookiesBeAttachedToRequest) {
    return ctx.next()
  }

  const sameSiteContext = getSameSiteContext(
    currentAUTUrl,
    ctx.req.proxiedUrl,
    ctx.req.isAUTFrame,
  )

  const applicableCookiesInCookieJar = ctx.getCookieJar().getCookies(ctx.req.proxiedUrl, sameSiteContext)
  const cookiesOnRequest = (ctx.req.headers['cookie'] || '').split('; ')

  ctx.debug('existing cookies on request from cookie jar: %s', applicableCookiesInCookieJar.join('; '))
  ctx.debug('add cookies to request from header: %s', cookiesOnRequest.join('; '))

  // if the cookie header is empty (i.e. ''), set it to undefined for expected behavior
  ctx.req.headers['cookie'] = addCookieJarCookiesToRequest(applicableCookiesInCookieJar, cookiesOnRequest) || undefined

  ctx.debug('cookies being sent with request: %s', ctx.req.headers['cookie'])
  ctx.next()
}

const CorrelateBrowserPreRequest: RequestMiddleware = async (ctx) => {
  if (!ctx.shouldCorrelatePreRequests()) {
    return ctx.next()
  }

  const copyResourceTypeAndNext = () => {
    ctx.req.resourceType = ctx.req.browserPreRequest?.resourceType

    ctx.next()
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
  if (shouldLog(ctx.req) && ctx.req.browserPreRequest) {
    ctx.socket.toDriver('request:event', 'incoming:request', ctx.req.browserPreRequest)
  }

  ctx.next()
}

const MaybeEndRequestWithBufferedResponse: RequestMiddleware = (ctx) => {
  const buffer = ctx.buffers.take(ctx.req.proxiedUrl)

  if (buffer) {
    ctx.debug('ending request with buffered response')

    // NOTE: Only inject fullCrossOrigin here if the super domain origins do not match in order to keep parity with cypress application reloads
    ctx.res.wantsInjection = buffer.urlDoesNotMatchPolicyBasedOnDomain ? 'fullCrossOrigin' : 'full'

    return ctx.onResponse(buffer.response, buffer.stream)
  }

  ctx.next()
}

const RedirectToClientRouteIfUnloaded: RequestMiddleware = (ctx) => {
  // if we have an unload header it means our parent app has been navigated away
  // directly and we need to automatically redirect to the clientRoute
  if (ctx.req.cookies['__cypress.unload']) {
    ctx.res.redirect(ctx.config.clientRoute)

    return ctx.end()
  }

  ctx.next()
}

const EndRequestsToBlockedHosts: RequestMiddleware = (ctx) => {
  const { blockHosts } = ctx.config

  if (blockHosts) {
    const matches = blocked.matches(ctx.req.proxiedUrl, blockHosts)

    if (matches) {
      ctx.res.set('x-cypress-matched-blocked-host', matches)
      ctx.debug('blocking request %o', { matches })

      ctx.res.status(503).end()

      return ctx.end()
    }
  }

  ctx.next()
}

const StripUnsupportedAcceptEncoding: RequestMiddleware = (ctx) => {
  // Cypress can only support plaintext or gzip, so make sure we don't request anything else
  const acceptEncoding = ctx.req.headers['accept-encoding']

  if (acceptEncoding) {
    if (acceptEncoding.includes('gzip')) {
      ctx.req.headers['accept-encoding'] = 'gzip'
    } else {
      delete ctx.req.headers['accept-encoding']
    }
  }

  ctx.next()
}

function reqNeedsBasicAuthHeaders (req, { auth, origin }: Cypress.RemoteState) {
  //if we have auth headers, this request matches our origin, protection space, and the user has not supplied auth headers
  return auth && !req.headers['authorization'] && cors.urlMatchesOriginProtectionSpace(req.proxiedUrl, origin)
}

const MaybeSetBasicAuthHeaders: RequestMiddleware = (ctx) => {
  // get the remote state for the proxied url
  const remoteState = ctx.remoteStates.get(ctx.req.proxiedUrl)

  if (remoteState?.auth && reqNeedsBasicAuthHeaders(ctx.req, remoteState)) {
    const { auth } = remoteState
    const base64 = Buffer.from(`${auth.username}:${auth.password}`).toString('base64')

    ctx.req.headers['authorization'] = `Basic ${base64}`
  }

  ctx.next()
}

const SendRequestOutgoing: RequestMiddleware = (ctx) => {
  const socket = ctx.req.socket

  const requestOptions = {
    browserPreRequest: ctx.req.browserPreRequest,
    timeout: ctx.req.responseTimeout,
    strictSSL: false,
    followRedirect: ctx.req.followRedirect || false,
    retryIntervals: [],
    url: ctx.req.proxiedUrl,
  }

  const requestBodyBuffered = !!ctx.req.body

  const { strategy, origin, fileServer } = ctx.remoteStates.current()

  if (strategy === 'file' && requestOptions.url.startsWith(origin)) {
    ctx.req.headers['x-cypress-authorization'] = ctx.getFileServerToken()

    requestOptions.url = requestOptions.url.replace(origin, fileServer as string)
  }

  if (requestBodyBuffered) {
    _.assign(requestOptions, _.pick(ctx.req, 'method', 'body', 'headers'))
  }

  const req = ctx.request.create(requestOptions)

  const onSocketClose = () => {
    ctx.debug('request aborted')
    req.abort()
  }

  req.on('error', ctx.onError)
  req.on('response', (incomingRes) => ctx.onResponse(incomingRes, req))

  ctx.req.res?.on('finish', () => {
    socket.removeListener('close', onSocketClose)
  })

  ctx.req.socket.on('close', onSocketClose)

  if (!requestBodyBuffered) {
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
  ExtractCypressMetadataHeaders,
  MaybeSimulateSecHeaders,
  MaybeAttachCrossOriginCookies,
  MaybeEndRequestWithBufferedResponse,
  CorrelateBrowserPreRequest,
  SetMatchingRoutes,
  SendToDriver,
  InterceptRequest,
  RedirectToClientRouteIfUnloaded,
  EndRequestsToBlockedHosts,
  StripUnsupportedAcceptEncoding,
  MaybeSetBasicAuthHeaders,
  SendRequestOutgoing,
})
