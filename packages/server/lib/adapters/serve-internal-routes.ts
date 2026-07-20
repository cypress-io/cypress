import type { HttpHeaders, HttpRequest, InterceptMiddleware } from '@packages/network-interception'
import type { Request as ServerRequest } from '../request'
import { CYPRESS_INTERNAL_LOOPBACK_HEADER, CYPRESS_INTERNAL_LOOPBACK_TOKEN_HEADER, cypressInternalLoopbackToken, isInternalCypressRoute, resolveProxyUrlBase } from './internal-routes'
import type { InternalRouteConfig } from './internal-routes'

export type ServeInternalRoutesConfig = InternalRouteConfig

type CreateServeInternalRoutesMiddlewareOptions = {
  config: ServeInternalRoutesConfig
  request: ServerRequest
}

const HOP_BY_HOP_HEADERS = new Set([
  'accept-encoding',
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  CYPRESS_INTERNAL_LOOPBACK_HEADER,
  CYPRESS_INTERNAL_LOOPBACK_TOKEN_HEADER,
])

function filterHeaders (headers: HttpHeaders = {}): HttpHeaders {
  return Object.entries(headers).reduce<HttpHeaders>((memo, [key, value]) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      memo[key] = value
    }

    return memo
  }, {})
}

function hasLoopbackHeader (headers: HttpHeaders = {}): boolean {
  return Object.keys(headers).some((key) => key.toLowerCase() === CYPRESS_INTERNAL_LOOPBACK_HEADER)
}

function toLoopbackUrl (requestUrl: string, config: ServeInternalRoutesConfig): string {
  if (!config.port) {
    throw new Error('Cannot serve internal Cypress routes before the server port is assigned')
  }

  // Hit Express route handlers on the local server directly. Using the Cypress
  // server as an HTTP proxy would re-enter HttpIntercept / this middleware and
  // recurse forever when no earlier Express route owns the path.
  const url = new URL(requestUrl, resolveProxyUrlBase(config))

  return `http://127.0.0.1:${config.port}${url.pathname}${url.search}`
}

function shouldSendBody (request: HttpRequest): boolean {
  return typeof request.body !== 'undefined' && !['GET', 'HEAD'].includes((request.method ?? 'GET').toUpperCase())
}

function parseRequestUrl (requestUrl: string, config: ServeInternalRoutesConfig): URL {
  if (/^https?:\/\//i.test(requestUrl)) {
    return new URL(requestUrl)
  }

  return new URL(requestUrl, resolveProxyUrlBase(config))
}

export function createServeInternalRoutesMiddleware ({
  config,
  request: serverRequest,
}: CreateServeInternalRoutesMiddlewareOptions): InterceptMiddleware {
  return async (request, next) => {
    const url = parseRequestUrl(request.url, config)

    if (!isInternalCypressRoute(url.pathname, config)) {
      return next(request)
    }

    // Re-entry after our own Express loopback: no route handler owned this path,
    // so the catch-all proxy saw it again. Stop instead of looping forever.
    if (hasLoopbackHeader(request.headers)) {
      return {
        id: request.id,
        url: request.url,
        statusCode: 404,
        headers: { 'content-type': 'text/plain' },
        body: 'Not Found',
      }
    }

    // Fulfill via Express for both same-origin and cross-origin internals.
    // sendRequestOutgoing would hit Express as a path-only request and get
    // forceProxy-redirected without the loopback header. CDP Fetch also needs
    // a synthesized response for fulfillRequest. This skips later intercept
    // layers (including CorrelateBrowserPreRequest in MITM mode); pending
    // pre-requests for these internals are swept by the normal timeout path.
    // The loopback request line is path-only, but Express consumers (e.g. the
    // spec-bridge iframe controller) derive the request origin from
    // req.proxiedUrl, so carry the browser's original absolute URL in the
    // loopback header for setProxiedUrl to restore.
    const response = await serverRequest.create({
      url: toLoopbackUrl(request.url, config),
      method: request.method ?? 'GET',
      headers: {
        ...filterHeaders(request.headers),
        [CYPRESS_INTERNAL_LOOPBACK_HEADER]: url.href,
        [CYPRESS_INTERNAL_LOOPBACK_TOKEN_HEADER]: cypressInternalLoopbackToken,
      },
      ...(shouldSendBody(request) ? { body: request.body } : {}),
      encoding: null,
      followRedirect: false,
      gzip: false,
      resolveWithFullResponse: true,
      simple: false,
    }, true)

    return {
      id: request.id,
      url: request.url,
      statusCode: response.statusCode,
      headers: filterHeaders(response.headers),
      body: response.body,
    }
  }
}
