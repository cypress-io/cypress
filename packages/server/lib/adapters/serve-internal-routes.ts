import type { HttpHeaders, HttpRequest, InterceptMiddleware } from '@packages/network-interception'
import type CyServer from '../../index.d.ts'
import type { Request as ServerRequest } from '../request'
import { isCypressServerOrigin, isInternalCypressRoute } from './internal-routes'

type ServeInternalRoutesConfig = Pick<
  CyServer.Config & Cypress.Config,
  'clientRoute' | 'namespace' | 'port' | 'proxyUrl' | 'socketIoRoute'
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

function toLoopbackProxy (config: ServeInternalRoutesConfig): string {
  if (!config.port) {
    throw new Error('Cannot serve internal Cypress routes before the server port is assigned')
  }

  return `http://127.0.0.1:${config.port}`
}

function shouldSendBody (request: HttpRequest): boolean {
  return typeof request.body !== 'undefined' && !['GET', 'HEAD'].includes((request.method ?? 'GET').toUpperCase())
}

export function createServeInternalRoutesMiddleware ({
  config,
  request: serverRequest,
}: CreateServeInternalRoutesMiddlewareOptions): InterceptMiddleware {
  return async (request, next, terminal) => {
    const url = new URL(request.url, config.proxyUrl)

    if (!isInternalCypressRoute(url.pathname, config)) {
      return next(request)
    }

    if (isCypressServerOrigin(request.url, config)) {
      return terminal(request)
    }

    const response = await serverRequest.create({
      url: request.url,
      proxy: toLoopbackProxy(config),
      method: request.method ?? 'GET',
      headers: filterHeaders(request.headers),
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
