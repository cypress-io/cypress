import type { HttpHeaders, InterceptMiddleware } from '@packages/network-interception'
import type { RemoteStates } from '@packages/network-tools'
import { toFileServerUrl } from '@packages/network-tools'
import type { Request as ServerRequest } from '../request'

type CreateFileServerOriginMiddlewareOptions = {
  remoteStates: RemoteStates
  getFileServerToken: () => string | undefined
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

/**
 * Node-side origin for strategy: 'file' URLs on the CDP Fetch path. The Fetch
 * terminal is continueRequest, so the browser never hits sendRequestOutgoing's
 * file-server rewrite — fulfill those URLs here instead.
 */
export function createFileServerOriginMiddleware ({
  remoteStates,
  getFileServerToken,
  request: serverRequest,
}: CreateFileServerOriginMiddlewareOptions): InterceptMiddleware {
  return async (request, next) => {
    const fileServerUrl = toFileServerUrl(request.url, remoteStates.current())

    if (!fileServerUrl) {
      return next(request)
    }

    const method = (request.method ?? 'GET').toUpperCase()
    const response = await serverRequest.create({
      url: fileServerUrl,
      method: request.method ?? 'GET',
      headers: {
        ...filterHeaders(request.headers),
        'x-cypress-authorization': getFileServerToken(),
      },
      ...(request.body !== undefined && method !== 'GET' && method !== 'HEAD' ? { body: request.body } : {}),
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
      headers: response.headers,
      body: response.body,
    }
  }
}
