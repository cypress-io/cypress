import _ from 'lodash'
import debugModule from 'debug'
import { blacklist, cors } from '@packages/network'
import { HttpMiddleware } from './'

export type RequestMiddleware = HttpMiddleware<{
  outgoingReq: any
}>

const debug = debugModule('cypress:proxy:http:request-middleware')

const LogRequest: RequestMiddleware = function () {
  debug('proxying request %o', {
    req: _.pick(this.req, 'method', 'proxiedUrl', 'headers'),
  })

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

// TODO: is this necessary? it seems to be for requesting Cypress w/o the proxy,
// which isn't currently supported
const RedirectToClientRouteIfNotProxied: RequestMiddleware = function () {
  // when you access cypress from a browser which has not had its proxy setup then
  // req.url will match req.proxiedUrl and we'll know to instantly redirect them
  // to the correct client route
  if (this.req.url === this.req.proxiedUrl && !this.getRemoteState().visiting) {
    // if we dont have a remoteState.origin that means we're initially requesting
    // the cypress app and we need to redirect to the root path that serves the app
    this.res.redirect(this.config.clientRoute)

    return this.end()
  }

  this.next()
}

const EndRequestsToBlacklistedHosts: RequestMiddleware = function () {
  const { blacklistHosts } = this.config

  if (blacklistHosts) {
    const matches = blacklist.matches(this.req.proxiedUrl, blacklistHosts)

    if (matches) {
      this.res.set('x-cypress-matched-blacklisted-host', matches)
      debug('blacklisting request %o', {
        url: this.req.proxiedUrl,
        matches,
      })

      this.res.status(503).end()

      return this.end()
    }
  }

  this.next()
}

const MaybeEndRequestWithBufferedResponse: RequestMiddleware = function () {
  const buffer = this.buffers.take(this.req.proxiedUrl)

  if (buffer) {
    debug('got a buffer %o', _.pick(buffer, 'url'))
    this.res.wantsInjection = 'full'

    return this.onResponse(buffer.response, buffer.stream)
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

function reqNeedsBasicAuthHeaders (req, { auth, origin }) {
  //if we have auth headers, this request matches our origin, protection space, and the user has not supplied auth headers
  return auth && !req.headers['authorization'] && cors.urlMatchesOriginProtectionSpace(req.proxiedUrl, origin)
}

const MaybeSetBasicAuthHeaders: RequestMiddleware = function () {
  const remoteState = this.getRemoteState()

  if (reqNeedsBasicAuthHeaders(this.req, remoteState)) {
    const { auth } = remoteState
    const base64 = Buffer.from(`${auth.username}:${auth.password}`).toString('base64')

    this.req.headers['authorization'] = `Basic ${base64}`
  }

  this.next()
}

const SendRequestOutgoing: RequestMiddleware = function () {
  const requestOptions = {
    strictSSL: false,
    followRedirect: false,
    retryIntervals: [0, 100, 200, 200],
    url: this.req.proxiedUrl,
  }

  const { strategy, origin, fileServer } = this.getRemoteState()

  if (strategy === 'file' && requestOptions.url.startsWith(origin)) {
    this.req.headers['x-cypress-authorization'] = this.getFileServerToken()

    requestOptions.url = requestOptions.url.replace(origin, fileServer)
  }

  const req = this.request.create(requestOptions)

  req.on('error', this.onError)
  req.on('response', (incomingRes) => this.onResponse(incomingRes, req))
  this.req.on('aborted', () => {
    debug('request aborted')
    req.abort()
  })

  // pipe incoming request body, headers to new request
  this.req.pipe(req)

  this.outgoingReq = req
}

export default {
  LogRequest,
  RedirectToClientRouteIfUnloaded,
  RedirectToClientRouteIfNotProxied,
  EndRequestsToBlacklistedHosts,
  MaybeEndRequestWithBufferedResponse,
  StripUnsupportedAcceptEncoding,
  MaybeSetBasicAuthHeaders,
  SendRequestOutgoing,
}
