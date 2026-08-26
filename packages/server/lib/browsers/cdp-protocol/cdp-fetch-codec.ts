import debugModule from 'debug'
import type {
  HttpHeaders,
  HttpRequest,
  HttpResponse,
  TransportCodecPort,
} from '@packages/network-interception'
import type { Protocol } from 'devtools-protocol'
import { isOriginBody } from './body-digest'
import type {
  CdpFetchTransportRequest,
  CdpFetchTransportResponse,
} from './cdp-fetch-transport'

const debugVerbose = debugModule('cypress-verbose:server:browsers:cdp-fetch-codec')

type CdpFetchHttpResponse = HttpResponse & {
  body?: string | Buffer
  headers?: HttpHeaders
  statusCode?: number
}

function toResponseHeaders (headers?: HttpHeaders): CdpFetchTransportResponse['responseHeaders'] {
  if (!headers) {
    return undefined
  }

  return Object.entries(headers).flatMap(([name, value]) => {
    if (typeof value === 'undefined') {
      return []
    }

    return ([] as string[]).concat(value).map((headerValue) => {
      return {
        name,
        value: headerValue,
      }
    })
  })
}

function toHttpHeaders (headers?: CdpFetchTransportResponse['responseHeaders']): HttpHeaders | undefined {
  if (!headers) {
    return undefined
  }

  // Lowercase while merging so Set-Cookie entries that differ only by case
  // collapse into one array (Node IncomingMessage behavior).
  return headers.reduce<HttpHeaders>((memo, { name, value }) => {
    const key = name.toLowerCase()
    const existing = memo[key]

    if (existing) {
      memo[key] = ([] as string[]).concat(existing, value)
    } else {
      memo[key] = value
    }

    return memo
  }, {})
}

function toResponseBody (body?: string | Buffer): string | undefined {
  if (body === undefined) {
    return undefined
  }

  return Buffer.from(body).toString('base64')
}

// The transport delivers bodies to the middleware content-decoded, so wire
// headers describing the encoding must not reach the middleware view (it
// would decompress plaintext). Length headers never survive re-encoding.
const WIRE_LENGTH_HEADERS = new Set(['content-length', 'transfer-encoding'])
const WIRE_ENCODING_HEADERS = new Set(['content-encoding', ...WIRE_LENGTH_HEADERS])

function stripWireEncodingHeaders (headers?: HttpHeaders): HttpHeaders | undefined {
  if (!headers) {
    return undefined
  }

  return Object.entries(headers).reduce<HttpHeaders>((memo, [name, value]) => {
    if (!WIRE_ENCODING_HEADERS.has(name)) {
      memo[name] = value
    }

    return memo
  }, {})
}

function stripHeaderEntries (headers: Protocol.Fetch.HeaderEntry[], names: ReadonlySet<string>): Protocol.Fetch.HeaderEntry[] {
  return headers.filter(({ name }) => !names.has(name.toLowerCase()))
}

function pickHeaderEntries (headers: Protocol.Fetch.HeaderEntry[], names: ReadonlySet<string>): Protocol.Fetch.HeaderEntry[] {
  return headers.filter(({ name }) => names.has(name.toLowerCase()))
}

function headerEntriesChanged (left: Protocol.Fetch.HeaderEntry[], right: Protocol.Fetch.HeaderEntry[]): boolean {
  // Compare case-insensitively on name and order-insensitively overall — CDP
  // pause events and the middleware view can fold the same headers back in a
  // different order and casing without that being a meaningful change.
  const normalize = (entries: Protocol.Fetch.HeaderEntry[]) => {
    return entries.map(({ name, value }) => `${name.toLowerCase()}: ${value}`).sort()
  }

  const leftNorm = normalize(left)
  const rightNorm = normalize(right)

  if (leftNorm.length !== rightNorm.length) {
    return true
  }

  return leftNorm.some((entry, index) => entry !== rightNorm[index])
}

/**
 * Middleware headers describe the body the pipeline produced — including any
 * re-encoding by CompressBody — so keep their content-encoding and only drop
 * stale length headers. The pause-header fallback describes the wire body, not
 * the decoded body we fulfill with, so its encoding headers are stripped too.
 */
function toFulfilledHeaders (headers?: HttpHeaders, pauseHeaders?: Protocol.Fetch.HeaderEntry[]): Protocol.Fetch.HeaderEntry[] | undefined {
  const middlewareHeaders = toResponseHeaders(headers)

  if (middlewareHeaders) {
    return stripHeaderEntries(middlewareHeaders, WIRE_LENGTH_HEADERS)
  }

  return pauseHeaders ? stripHeaderEntries(pauseHeaders, WIRE_ENCODING_HEADERS) : undefined
}

/**
 * The browser replays the origin's own wire body on continueResponse, so the
 * pause's wire encoding headers still describe it and are carried over the
 * middleware view, which only ever saw the decoded body. An unchanged set is
 * omitted entirely so CDP keeps the browser's original headers rather than a
 * lowercased, re-folded reconstruction — the same "don't override what you
 * didn't touch" rule continueRequestHeaders applies at the request stage.
 */
function toContinuedHeaders (headers?: HttpHeaders, pauseHeaders?: Protocol.Fetch.HeaderEntry[]): Protocol.Fetch.HeaderEntry[] | undefined {
  const middlewareHeaders = toResponseHeaders(headers)

  if (!middlewareHeaders) {
    return undefined
  }

  const continuedHeaders = [
    ...stripHeaderEntries(middlewareHeaders, WIRE_ENCODING_HEADERS),
    ...pickHeaderEntries(pauseHeaders ?? [], WIRE_ENCODING_HEADERS),
  ]

  if (!headerEntriesChanged(continuedHeaders, pauseHeaders ?? [])) {
    return undefined
  }

  return continuedHeaders
}

function toNetworkHeaders (headers?: HttpHeaders): Protocol.Network.Headers {
  if (!headers) {
    return {}
  }

  return Object.entries(headers).reduce<Protocol.Network.Headers>((memo, [name, value]) => {
    if (typeof value === 'undefined') {
      return memo
    }

    memo[name] = ([] as string[]).concat(value).map(String).join(', ')

    return memo
  }, {})
}

function toRequestPostData (body?: string | Buffer): string | undefined {
  if (body === undefined) {
    return undefined
  }

  return typeof body === 'string' ? body : body.toString('utf8')
}

// `postData` is a utf8 string, so it mangles a binary body; the entries carry
// that same body as base64. An entry with no `bytes` means the browser has no
// copy of the body to hand over — it never buffered a streamed upload — which
// is not the same as an empty body, so report no body rather than invent one.
function toPausePostData (entries?: Protocol.Network.PostDataEntry[]): Buffer | undefined {
  if (!entries?.length || entries.some(({ bytes }) => bytes === undefined)) {
    return undefined
  }

  if (entries.length === 1) {
    return Buffer.from(entries[0].bytes!, 'base64')
  }

  return Buffer.concat(entries.map(({ bytes }) => Buffer.from(bytes!, 'base64')))
}

function contentTypeOf (entries?: Protocol.Fetch.HeaderEntry[]): string | undefined {
  const values = entries
  ?.filter(({ name }) => name.toLowerCase() === 'content-type')
  .map(({ value }) => value)

  return values?.length ? values.join(', ') : undefined
}

/**
 * Fulfill only when continueResponse would leave the Network record out of
 * sync with what the page received; continue everything else, since
 * continueResponse preserves the wire semantics (extraInfo events, streaming,
 * HTTP caching).
 *
 * continueResponse applies overrides to the renderer and records status and
 * header overrides truthfully in Network.responseReceived — with one gap:
 * mimeType and charset are derived from the WIRE content-type and are not
 * recomputed for an override. Consumers of the record (e.g. Test Replay
 * stylesheet handling keys off mimeType) would see the stale value. So when
 * cy.intercept mutates either of these, the response takes
 * Fetch.fulfillRequest:
 *   - the body, which no longer matches the origin bytes
 *   - the content-type, which mimeType and charset are derived from
 * Spy-only, status, and other header intercepts stay on continueResponse.
 * If Chrome ever derives another Network.responseReceived field from a header
 * without recomputing it for overrides, that header joins the fulfill list.
 *
 * The intercept pipeline always materializes a body on the response path, so
 * the presence of a body cannot decide fulfill vs continue on its own.
 */
function encodePausedResponse (
  { originalBodyDigest, ...pausedResponse }: CdpFetchTransportResponse,
  response: CdpFetchHttpResponse,
): CdpFetchTransportResponse {
  const bodyModified = response.body !== undefined && !isOriginBody(response.body, originalBodyDigest)
  const middlewareContentType = contentTypeOf(toResponseHeaders(response.headers))
  const contentTypeModified = middlewareContentType !== undefined
    && middlewareContentType !== contentTypeOf(pausedResponse.responseHeaders)

  const fulfilled = bodyModified || (contentTypeModified && response.body !== undefined)

  return {
    ...pausedResponse,
    fulfilled,
    responseCode: response.statusCode ?? pausedResponse.responseCode,
    responseHeaders: fulfilled
      ? toFulfilledHeaders(response.headers, pausedResponse.responseHeaders)
      : toContinuedHeaders(response.headers, pausedResponse.responseHeaders),
    ...(fulfilled ? { body: toResponseBody(response.body) } : {}),
  }
}

export function createCdpFetchCodec (): TransportCodecPort<CdpFetchTransportRequest, CdpFetchTransportResponse> {
  const inFlightRequests = new Map<string, CdpFetchTransportRequest>()
  const inFlightResponses = new Map<string, CdpFetchTransportResponse>()
  const requireRequest = (id: string): CdpFetchTransportRequest => {
    const request = inFlightRequests.get(id)

    if (!request) {
      throw new Error(`No in-flight CDP Fetch request found for ${id}`)
    }

    return request
  }

  const requireRequestPause = (id: string): CdpFetchTransportRequest & { requestId: string } => {
    const request = requireRequest(id)

    if (!request.requestId) {
      throw new Error(`No CDP Fetch request pause found for ${id}. Stubbed responses require the original request pause id.`)
    }

    return request as CdpFetchTransportRequest & { requestId: string }
  }

  return {
    decodeRequest (transportRequest: CdpFetchTransportRequest): HttpRequest {
      inFlightRequests.set(transportRequest.id, transportRequest)

      transportRequest.pausePostDataBuffer = toPausePostData(transportRequest.postDataEntries)

      debugVerbose('decodeRequest %s %s %o', transportRequest.method, transportRequest.url, {
        id: transportRequest.id,
        requestId: transportRequest.requestId,
        headerNames: Object.keys(transportRequest.headers ?? {}),
        hasPostData: transportRequest.hasPostData,
        postDataChars: transportRequest.postData?.length,
        postDataBytes: transportRequest.pausePostDataBuffer?.length,
      })

      return {
        id: transportRequest.id,
        url: transportRequest.url,
        method: transportRequest.method,
        headers: transportRequest.headers,
        body: transportRequest.pausePostDataBuffer ?? transportRequest.postData,
        resourceType: transportRequest.resourceType,
      }
    },

    encodeRequest (httpRequest: HttpRequest): CdpFetchTransportRequest {
      const transportRequest = requireRequest(httpRequest.id)

      debugVerbose('encodeRequest %s %s %o', httpRequest.method, httpRequest.url, {
        id: httpRequest.id,
        urlChanged: httpRequest.url !== transportRequest.url,
        methodChanged: httpRequest.method !== undefined && httpRequest.method !== transportRequest.method,
        headersChanged: httpRequest.headers !== undefined,
        bodyChanged: httpRequest.body !== undefined,
      })

      transportRequest.url = httpRequest.url

      if (httpRequest.method !== undefined) {
        transportRequest.method = httpRequest.method
      }

      if (httpRequest.headers !== undefined) {
        transportRequest.headers = toNetworkHeaders(httpRequest.headers)
      }

      // An untouched body returns either as the Buffer decodeRequest handed out
      // or as net-stubbing's utf8 view of it, and the transport's string
      // comparison recognizes neither, so writing either field below would
      // upload a mangled re-encode in place of the body the browser holds.
      // A lossy view re-encodes wider than the bytes it came from, so its
      // length is no shortcut for this comparison.
      const pauseBody = transportRequest.pausePostDataBuffer
      const bodyUnchanged = pauseBody !== undefined && (Buffer.isBuffer(httpRequest.body)
        ? httpRequest.body.equals(pauseBody)
        : httpRequest.body === pauseBody.toString('utf8'))

      // postData is omitted for a payload too long to inline, so either field
      // alone is proof the pause carried a body.
      const pauseCarriedBody = transportRequest.postData !== undefined || pauseBody !== undefined

      // The net-stubbing pipeline normalizes every intercepted request to a
      // string body, so a request the browser paused without one arrives back
      // here as `''` — indistinguishable from a body a handler emptied. Sending
      // that as postData makes Chrome attach `Content-Length: 0` to requests
      // that never had a body (#24407). Only an empty body the pause itself
      // carried is a real change worth forwarding.
      if (!bodyUnchanged && httpRequest.body !== undefined && (httpRequest.body.length > 0 || pauseCarriedBody)) {
        transportRequest.postData = toRequestPostData(httpRequest.body)

        // A Buffer body must reach the transport as bytes: the utf8 string
        // view above is lossy for binary payloads, and Fetch.continueRequest
        // transmits base64-encoded bytes.
        if (Buffer.isBuffer(httpRequest.body)) {
          transportRequest.postDataBuffer = httpRequest.body
        }
      }

      // Carries the request-stage route-match result to the transport, which
      // stashes it on the response-pause deferred for shouldStreamBody.
      if (httpRequest.hadMatchingRoutes !== undefined) {
        transportRequest.hadMatchingRoutes = httpRequest.hadMatchingRoutes
      }

      return transportRequest
    },

    decodeResponse (transportResponse: CdpFetchTransportResponse): HttpResponse {
      inFlightResponses.set(transportResponse.id, transportResponse)

      debugVerbose('decodeResponse %s status=%s %o', transportResponse.url, transportResponse.responseCode, {
        id: transportResponse.id,
        requestId: transportResponse.requestId,
        headerNames: transportResponse.responseHeaders?.map(({ name }) => name),
        hasBodyStream: !!transportResponse.bodyStream,
      })

      return {
        id: transportResponse.id,
        url: transportResponse.url,
        bodyStream: transportResponse.bodyStream,
        headers: stripWireEncodingHeaders(toHttpHeaders(transportResponse.responseHeaders)),
        statusCode: transportResponse.responseCode,
        statusMessage: transportResponse.responseStatusText,
        ...(transportResponse.bodySkipped ? { bodySkipped: true } : {}),
        ...(transportResponse.captureStream ? { captureStream: transportResponse.captureStream } : {}),
      }
    },

    encodeResponse (httpResponse: HttpResponse): CdpFetchTransportResponse {
      const response = httpResponse as CdpFetchHttpResponse
      const pausedResponse = inFlightResponses.get(httpResponse.id)
      const transportResponse = pausedResponse ? encodePausedResponse(pausedResponse, response) : {
        // Middleware answered at the request stage, so no response pause exists —
        // rebuild the fulfill params (requestId/sessionId) from the stashed request pause.
        ...requireRequestPause(httpResponse.id),
        fulfilled: true,
        responseCode: response.statusCode ?? 200,
        responseHeaders: toFulfilledHeaders(response.headers),
        body: toResponseBody(response.body),
      }

      transportResponse.url = httpResponse.url
      inFlightResponses.delete(httpResponse.id)

      if (debugVerbose.enabled) {
        debugVerbose('encodeResponse %s %o', httpResponse.url, {
          id: httpResponse.id,
          fulfilled: transportResponse.fulfilled,
          statusCode: transportResponse.responseCode,
          bodyBytes: transportResponse.body ? Buffer.from(transportResponse.body, 'base64').length : undefined,
          headerNames: transportResponse.responseHeaders?.map(({ name }) => name),
          usedPausedResponse: !!pausedResponse,
        })
      }

      return transportResponse
    },

    releaseRequest (id: string): void {
      debugVerbose('releaseRequest %s', id)
      inFlightRequests.delete(id)
      inFlightResponses.delete(id)
    },
  }
}
