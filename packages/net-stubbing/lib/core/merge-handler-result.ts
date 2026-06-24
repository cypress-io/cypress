import _ from 'lodash'
import type { HttpRequest, HttpResponse } from '@packages/network-interception'

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

  const requestPick: (keyof HttpRequest)[] = [
    'headers',
    'url',
    'method',
    'responseTimeout',
    'followRedirect',
    'resourceType',
  ]

  if (after.body !== undefined) {
    requestPick.push('body')
  }

  if (after.requestBodyMaterialized) {
    requestPick.push('requestBodyMaterialized')
  }

  mergeWithPreservedBuffers(before, _.pick(after, requestPick))

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
  const props = options.serializableProps.filter((prop) => {
    return prop !== 'body' || after.body !== undefined
  })

  mergeWithPreservedBuffers(before, _.pick(after, props) as Partial<HttpResponse>)

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

  if (source.body !== undefined) {
    target.body = source.body
  }

  if (source.requestBodyMaterialized) {
    target.requestBodyMaterialized = true
  }

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
    body: request.body,
    requestBodyMaterialized: request.requestBodyMaterialized,
    materializeRequestBody: request.materializeRequestBody,
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
    materializeResponseBody: response.materializeResponseBody,
    consumePassthroughResponse: response.consumePassthroughResponse,
    url: requestUrl,
  }
}
