import _ from 'lodash'
import type { Protocol } from 'devtools-protocol'
import type { HttpRequest, HttpResponse, ResourceType } from '@packages/network-interception'
import type { CriClient } from './cri-client'
import { normalizeResourceType } from './normalize-resource-type'

/** CDP returns no response body for redirects; skip the read and tolerate an empty body. */
const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308])

function headersToFetchEntries (
  headers: Record<string, string | string[]> | Protocol.Fetch.HeaderEntry[] | undefined,
): Protocol.Fetch.HeaderEntry[] {
  if (!headers) {
    return []
  }

  if (Array.isArray(headers)) {
    return headers
  }

  return _.flatMap(headers, (value, name) => {
    if (Array.isArray(value)) {
      return value.map((v) => ({ name, value: v }))
    }

    return [{ name, value: String(value) }]
  })
}

function fetchEntriesToHeaders (
  entries: Protocol.Fetch.HeaderEntry[] | undefined,
): Record<string, string | string[]> {
  const headers: Record<string, string | string[]> = {}

  if (!entries) {
    return headers
  }

  for (const { name, value } of entries) {
    const existing = headers[name]

    if (existing === undefined) {
      headers[name] = value
    } else if (Array.isArray(existing)) {
      existing.push(value)
    } else {
      headers[name] = [existing, value]
    }
  }

  return headers
}

function toHttpRequest (
  params: Protocol.Fetch.RequestPausedEvent,
  normalize: (resourceType: string | undefined) => ResourceType = normalizeResourceType,
): HttpRequest {
  return {
    inFlightInterceptId: _.uniqueId('inFlightIntercept'),
    browserRequestId: params.requestId,
    url: params.request.url,
    method: params.request.method,
    headers: params.request.headers as Record<string, string>,
    body: params.request.postData,
    resourceType: normalize(params.resourceType),
  }
}

function fromHttpRequest (request: HttpRequest): Protocol.Fetch.ContinueRequestRequest {
  if (!request.browserRequestId) {
    throw new Error('HttpRequest.browserRequestId is required for Fetch.continueRequest')
  }

  const details: Protocol.Fetch.ContinueRequestRequest = {
    requestId: request.browserRequestId,
    url: request.url,
    method: request.method,
  }

  const headerEntries = headersToFetchEntries(request.headers)

  if (headerEntries.length) {
    details.headers = headerEntries
  }

  if (request.body !== undefined) {
    details.postData = typeof request.body === 'string'
      ? request.body
      : request.body.toString('utf8')
  }

  return details
}

function fromHttpResponse (
  request: HttpRequest,
  response: HttpResponse,
): Protocol.Fetch.FulfillRequestRequest {
  if (!request.browserRequestId) {
    throw new Error('HttpRequest.browserRequestId is required for Fetch.fulfillRequest')
  }

  const body = response.body ?? ''
  const bodyBuffer = typeof body === 'string' ? Buffer.from(body) : body

  return {
    requestId: request.browserRequestId,
    responseCode: response.statusCode,
    responsePhrase: response.statusMessage,
    responseHeaders: headersToFetchEntries(response.headers),
    body: bodyBuffer.toString('base64'),
  }
}

/**
 * Map a response-stage `Fetch.requestPaused` event (plus its decoded body) to an
 * {@link HttpResponse} that core's response subscriptions can read and mutate.
 */
function toHttpResponse (
  params: Protocol.Fetch.RequestPausedEvent,
  body: string,
  base64Encoded: boolean,
): HttpResponse {
  return {
    statusCode: params.responseStatusCode ?? 200,
    statusMessage: params.responseStatusText,
    headers: fetchEntriesToHeaders(params.responseHeaders),
    body: base64Encoded ? Buffer.from(body, 'base64') : body,
  }
}

/**
 * Materialize the origin {@link HttpResponse} for a request paused at the response stage.
 *
 * Reads the body via `Fetch.getResponseBody` (valid only in the Response stage). Redirects and
 * other bodyless responses have no retrievable body, so those fall back to an empty body rather
 * than erroring.
 */
async function materializeResponse (
  client: CriClient,
  params: Protocol.Fetch.RequestPausedEvent,
): Promise<HttpResponse> {
  const statusCode = params.responseStatusCode ?? 200

  if (REDIRECT_STATUS_CODES.has(statusCode)) {
    return toHttpResponse(params, '', false)
  }

  try {
    const { body, base64Encoded } = await client.send('Fetch.getResponseBody', {
      requestId: params.requestId,
    })

    return toHttpResponse(params, body, base64Encoded)
  } catch {
    return toHttpResponse(params, '', false)
  }
}

/** CDP Fetch ↔ {@link HttpRequest} / {@link HttpResponse} codec. */
export const cdpFetch = {
  toHttpRequest,
  fromHttpRequest,
  fromHttpResponse,
  toHttpResponse,
  materializeResponse,
}
