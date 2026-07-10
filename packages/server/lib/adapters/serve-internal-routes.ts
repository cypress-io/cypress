import type { HttpHeaders, HttpRequest, InterceptMiddleware } from '@packages/network-interception'
import type CyServer from '../../index.d.ts'
import type { Request as ServerRequest } from '../request'
import { CYPRESS_INTERNAL_LOOPBACK_HEADER, isCypressServerOrigin, isInternalCypressRoute } from './internal-routes'

type ServeInternalRoutesConfig = Pick<
  CyServer.Config & Cypress.Config,
  'clientRoute' | 'devServerPublicPathRoute' | 'namespace' | 'port' | 'proxyUrl' | 'socketIoRoute'
>

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
])

function filterHeaders (headers: HttpHeaders = {}): HttpHeaders {
  return Object.entries(headers).reduce<HttpHeaders>((memo, [key, value]) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      memo[key] = value
    }

    return memo
  }, {})
}

function toLoopbackUrl (requestUrl: string, config: ServeInternalRoutesConfig): string {
  if (!config.port) {
    throw new Error('Cannot serve internal Cypress routes before the server port is assigned')
  }

  // Hit Express route handlers on the local server directly. Using the Cypress
  // server as an HTTP proxy would re-enter HttpIntercept / this middleware and
  // recurse forever when no earlier Express route owns the path.
  const url = new URL(requestUrl, config.proxyUrl)

  return `http://127.0.0.1:${config.port}${url.pathname}${url.search}`
}

function shouldSendBody (request: HttpRequest): boolean {
  return typeof request.body !== 'undefined' && !['GET', 'HEAD'].includes((request.method ?? 'GET').toUpperCase())
}

export function createServeInternalRoutesMiddleware ({
  config,
  request: serverRequest,
}: CreateServeInternalRoutesMiddlewareOptions): InterceptMiddleware {
  return async (request, next) => {
    const url = new URL(request.url, config.proxyUrl)

    if (!isInternalCypressRoute(url.pathname, config)) {
      return next(request)
    }

    if (isCypressServerOrigin(request.url, config)) {
      return next(request)
    }

    // Fulfill here instead of calling next()/terminal: CDP Fetch needs a
    // synthesized response for fulfillRequest, and this hop must hit Express
    // route handlers directly. That skips later intercept layers (including
    // CorrelateBrowserPreRequest in MITM mode); pending pre-requests for these
    // cross-origin internals are swept by the normal timeout path.
    const response = await serverRequest.create({
      url: toLoopbackUrl(request.url, config),
      method: request.method ?? 'GET',
      headers: {
        ...filterHeaders(request.headers),
        [CYPRESS_INTERNAL_LOOPBACK_HEADER]: '1',
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
