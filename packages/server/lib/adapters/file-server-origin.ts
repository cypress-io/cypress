import type { HttpHeaders, HttpRequest, InterceptMiddleware } from '@packages/network-interception'
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

function shouldSendBody (request: HttpRequest): boolean {
  return typeof request.body !== 'undefined' && !['GET', 'HEAD'].includes((request.method ?? 'GET').toUpperCase())
}

/**
 * CDP Fetch terminal is Fetch.continueRequest, so the browser fetches the origin
 * itself and never reaches sendRequestOutgoing's file-server rewrite. This
 * middleware sits after the legacy pipeline as the Node-side origin for
 * strategy: 'file' URLs — rewrite to the file server, authorize, and return a
 * synthesized HttpResponse for Fetch.fulfillRequest.
 */
export function createFileServerOriginMiddleware ({
  remoteStates,
  getFileServerToken,
  request: serverRequest,
}: CreateFileServerOriginMiddlewareOptions): InterceptMiddleware {
  return async (request, next) => {
    const remoteState = remoteStates.current()
    const fileServerUrl = toFileServerUrl(request.url, remoteState)

    if (!fileServerUrl) {
      return next(request)
    }

    const response = await serverRequest.create({
      url: fileServerUrl,
      method: request.method ?? 'GET',
      headers: {
        ...filterHeaders(request.headers),
        'x-cypress-authorization': getFileServerToken(),
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
      headers: response.headers,
      body: response.body,
    }
  }
}
