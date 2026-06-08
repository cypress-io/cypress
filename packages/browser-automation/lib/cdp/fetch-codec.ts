import _ from 'lodash'
import type { Protocol } from 'devtools-protocol'
import type { HttpRequest, HttpResponse } from '@packages/network-interception'
import { normalizeResourceType } from './normalize-resource-type'

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

function toHttpRequest (params: Protocol.Fetch.RequestPausedEvent): HttpRequest {
  return {
    inFlightInterceptId: _.uniqueId('inFlightIntercept'),
    browserRequestId: params.requestId,
    url: params.request.url,
    method: params.request.method,
    headers: params.request.headers as Record<string, string>,
    body: params.request.postData,
    resourceType: normalizeResourceType(params.resourceType),
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

/** CDP Fetch ↔ {@link HttpRequest} / {@link HttpResponse} codec. */
export const cdpFetch = {
  toHttpRequest,
  fromHttpRequest,
  fromHttpResponse,
}
