import type { HttpHeaders, InterceptMiddleware } from '@packages/network-interception'
import type { RemoteStates } from '@packages/network-tools'
import { toFileServerUrl } from '@packages/network-tools'
import type { Request as ServerRequest } from '../request'

type CreateFileServerOriginMiddlewareOptions = {
  remoteStates: RemoteStates
  getFileServerToken: () => string | undefined
  request: ServerRequest
}

// Headers we do not forward to the file server. accept-encoding is load-bearing:
// stripping it (together with gzip: false) keeps the file server's response
// identity-encoded, which Fetch.fulfillRequest requires.
const UNFORWARDED_HEADERS = new Set([
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
    if (!UNFORWARDED_HEADERS.has(key.toLowerCase())) {
      memo[key] = value
    }

    return memo
  }, {})
}

/**
 * strategy:'file' URLs only resolve on the token-guarded file server. The CDP
 * Fetch terminal is continueRequest, meaning the browser would fetch from the
 * AUT origin itself and download Express's 500 error page.
 *
 * To avoid this, we request the file from the file server here in Node and
 * return the response without calling next(). A middleware-produced body
 * encodes as fulfilled: true, which the transport answers with
 * Fetch.fulfillRequest.
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
