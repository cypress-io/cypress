import _ from 'lodash'
import { getEncoding } from 'istextorbinary'
import type { HttpRequest, HttpResponse } from '@packages/network-interception'

type HandlerMessage = {
  body?: string | Buffer
  headers: Record<string, string | string[]>
}

function mergeDeletedHeaders (before: HandlerMessage, after: HandlerMessage) {
  for (const k in before.headers) {
    // a header was deleted from `after` but was present in `before`, delete it in `before` too.
    // only treat `undefined` (deleted via `delete` or explicitly set to `undefined`) as removal -
    // an empty string is a valid header value and must be preserved (#25767)
    after.headers[k] === undefined && delete before.headers[k]
  }
}

function mergeWithPreservedBuffers (before: HandlerMessage, after: Partial<HandlerMessage>) {
  _.mergeWith(before, after, (_a, b) => {
    if (b instanceof Buffer) {
      return b
    }

    return undefined
  })
}

type MergeIncomingRequestChangesOptions = {
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

type MergeIncomingResponseChangesOptions = {
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
  const headers = { ...request.headers }

  if (request.browserAcceptEncoding !== undefined) {
    headers['accept-encoding'] = request.browserAcceptEncoding
  }

  return {
    inFlightInterceptId: request.inFlightInterceptId,
    browserRequestId: request.browserRequestId,
    url: request.url,
    method: request.method,
    headers,
    body: request.body,
    requestBodyMaterialized: request.requestBodyMaterialized,
    materializeRequestBody: request.materializeRequestBody,
    resourceType: request.resourceType,
    isSyncRequest: request.isSyncRequest,
    responseTimeout: request.responseTimeout,
    followRedirect: request.followRedirect,
    browserAcceptEncoding: request.browserAcceptEncoding,
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
    stream: response.stream,
    url: requestUrl,
  }
}

/**
 * Buffer `response.stream()` onto `response.body` when the origin forwarder returned
 * a passthrough stream (e.g. proxy before materializeOriginResponse was honored).
 */
export async function materializeResponseBody (response: HttpResponse): Promise<void> {
  if (response.body !== undefined || !response.stream) {
    return
  }

  const stream = await response.stream()
  const chunks: Buffer[] = []

  await new Promise<void>((resolve, reject) => {
    stream.on('data', (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    })

    stream.on('end', () => resolve())
    stream.on('error', reject)
  })

  const buf = Buffer.concat(chunks)

  response.body = getEncoding(buf) !== 'binary' ? buf.toString('utf8') : buf
}
