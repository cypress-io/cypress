import _ from 'lodash'
import type { HttpRequest, HttpResponse } from '../ports/http-interception'

type HandlerMessage = {
  body?: string | Buffer
  headers: Record<string, string | string[]>
}

export function mergeDeletedHeaders (before: HandlerMessage, after: HandlerMessage) {
  for (const k in before.headers) {
    // a header was deleted from `after` but was present in `before`, delete it in `before` too.
    // only treat `undefined` (deleted via `delete` or explicitly set to `undefined`) as removal -
    // an empty string is a valid header value and must be preserved (#25767)
    after.headers[k] === undefined && delete before.headers[k]
  }
}

export function mergeWithPreservedBuffers (before: HandlerMessage, after: Partial<HandlerMessage>) {
  _.mergeWith(before, after, (_a, b) => {
    if (b instanceof Buffer) {
      return b
    }

    return undefined
  })
}

export type MergeIncomingRequestChangesOptions = {
  baseUrl: string
  resolveUrl: (baseUrl: string, relativeUrl: string) => string
}

/**
 * Apply driver handler changes from `after` onto `before` for a `before:request` round-trip.
 * Returns the resolved request URL.
 */
export function mergeIncomingRequestChanges (
  before: HttpRequest,
  after: HttpRequest,
  options: MergeIncomingRequestChangesOptions,
): string {
  if ('content-length' in before.headers && before.headers['content-length'] === after.headers['content-length']) {
    after.headers['content-length'] = String(Buffer.from(after.body ?? '').byteLength)
  }

  const resolvedUrl = options.resolveUrl(options.baseUrl, after.url)

  after.url = resolvedUrl

  mergeWithPreservedBuffers(before, _.pick(after, [
    'headers',
    'body',
    'url',
    'method',
    'responseTimeout',
    'followRedirect',
    'resourceType',
  ]))

  mergeDeletedHeaders(before, after)

  return resolvedUrl
}

export type MergeIncomingResponseChangesOptions = {
  serializableProps: readonly string[]
}

/**
 * Apply driver handler changes from `after` onto `before` for response round-trips.
 */
export function mergeIncomingResponseChanges (
  before: HttpResponse,
  after: HttpResponse,
  options: MergeIncomingResponseChangesOptions,
): void {
  mergeWithPreservedBuffers(before, _.pick(after, options.serializableProps) as Partial<HttpResponse>)

  mergeDeletedHeaders(before, after)
}

export function applyHandlerRequestToRequest (
  target: HttpRequest,
  source: HttpRequest,
  resolvedUrl: string,
): void {
  target.url = resolvedUrl
  target.method = source.method
  target.headers = source.headers
  target.body = source.body
  target.responseTimeout = source.responseTimeout
  target.followRedirect = source.followRedirect
}

export function cloneHandlerRequest (request: HttpRequest): HttpRequest {
  return {
    inFlightInterceptId: request.inFlightInterceptId,
    browserRequestId: request.browserRequestId,
    url: request.url,
    method: request.method,
    headers: { ...request.headers },
    body: request.body ?? '',
    resourceType: request.resourceType,
    isSyncRequest: request.isSyncRequest,
    responseTimeout: request.responseTimeout,
    followRedirect: request.followRedirect,
  }
}

export function cloneHandlerResponse (response: HttpResponse, requestUrl: string): HttpResponse & { url: string } {
  return {
    statusCode: response.statusCode,
    statusMessage: response.statusMessage,
    headers: { ...response.headers },
    body: response.body,
    delay: response.delay,
    throttleKbps: response.throttleKbps,
    url: requestUrl,
  }
}
