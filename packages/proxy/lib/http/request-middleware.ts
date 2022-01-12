import _ from 'lodash'
import { blocked, cors } from '@packages/network'
import { InterceptRequest } from '@packages/net-stubbing'
import debugModule from 'debug'
import type { HttpMiddleware } from './'

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

const CorrelateBrowserPreRequest: RequestMiddleware = async function () {
  if (!this.shouldCorrelatePreRequests()) {
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

    return this.next()
  }

  this.debug('waiting for prerequest')
  this.getPreRequest(((browserPreRequest) => {
    this.req.browserPreRequest = browserPreRequest
    this.next()
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
    this.res.wantsInjection = 'full'

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
  const remoteState = this.getRemoteState()

  if (remoteState.auth && reqNeedsBasicAuthHeaders(this.req, remoteState)) {
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

  const { strategy, origin, fileServer } = this.getRemoteState()

  if (strategy === 'file' && requestOptions.url.startsWith(origin)) {
    this.req.headers['x-cypress-authorization'] = this.getFileServerToken()

    requestOptions.url = requestOptions.url.replace(origin, fileServer)
  }

  if (requestBodyBuffered) {
    _.assign(requestOptions, _.pick(this.req, 'method', 'body', 'headers'))
  }

  const req = this.request.create(requestOptions)

  req.on('error', this.onError)
  req.on('response', (incomingRes) => this.onResponse(incomingRes, req))
  this.req.socket.on('close', () => {
    this.debug('request aborted')
    req.abort()
  })

  if (!requestBodyBuffered) {
    // pipe incoming request body, headers to new request
    this.req.pipe(req)
  }

  this.outgoingReq = req
}

export default {
  LogRequest,
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
