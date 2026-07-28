import zlib from 'zlib'
import type {
  HttpHeaders,
  HttpRequest,
  HttpResponse,
  TransportCodecPort,
} from '@packages/network-interception'
import type { Protocol } from 'devtools-protocol'
import type {
  CdpFetchTransportRequest,
  CdpFetchTransportResponse,
} from './cdp-fetch-transport'

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

const CONTENT_DECODERS: Record<string, (body: Buffer) => Buffer> = {
  gzip: (body) => zlib.gunzipSync(body),
  'x-gzip': (body) => zlib.gunzipSync(body),
  br: (body) => zlib.brotliDecompressSync(body),
  deflate: (body) => zlib.inflateSync(body),
}

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

function stripHeaderEntries (headers: CdpFetchTransportResponse['responseHeaders'], names: ReadonlySet<string>): CdpFetchTransportResponse['responseHeaders'] {
  return headers?.filter(({ name }) => !names.has(name.toLowerCase()))
}

// Fetch.fulfillRequest hands the body to the renderer as-is — content
// decoders do not run for fulfilled responses. The pipeline may emit encoded
// bodies (CompressBody re-encodes rewritten documents), so decode fulfilled
// bodies back to identity and drop the encoding headers. If an encoding
// cannot be decoded, keep the body/header pair intact rather than shipping a
// body that lies about its encoding.
function toIdentityResponse (transportResponse: CdpFetchTransportResponse): CdpFetchTransportResponse {
  const headers = transportResponse.responseHeaders
  const contentEncoding = headers?.find(({ name }) => name.toLowerCase() === 'content-encoding')?.value
  const encodings = (contentEncoding ?? '')
  .split(',')
  .map((token) => token.trim().toLowerCase())
  .filter((token) => token && token !== 'identity')

  if (!transportResponse.body || !encodings.length) {
    return {
      ...transportResponse,
      responseHeaders: stripHeaderEntries(headers, WIRE_ENCODING_HEADERS),
    }
  }

  let body = Buffer.from(transportResponse.body, 'base64')

  try {
    // encodings are listed in the order applied — decode outermost first
    for (let i = encodings.length - 1; i >= 0; i--) {
      const decode = CONTENT_DECODERS[encodings[i]]

      if (!decode) {
        throw new Error(`no decoder for content-encoding ${encodings[i]}`)
      }

      body = decode(body)
    }
  } catch (err) {
    return transportResponse
  }

  return {
    ...transportResponse,
    body: body.toString('base64'),
    responseHeaders: stripHeaderEntries(headers, WIRE_ENCODING_HEADERS),
  }
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

      return {
        id: transportRequest.id,
        url: transportRequest.url,
        method: transportRequest.method,
        headers: transportRequest.headers,
        body: transportRequest.postData,
      }
    },

    encodeRequest (httpRequest: HttpRequest): CdpFetchTransportRequest {
      const transportRequest = requireRequest(httpRequest.id)

      transportRequest.url = httpRequest.url

      if (httpRequest.method !== undefined) {
        transportRequest.method = httpRequest.method
      }

      if (httpRequest.headers !== undefined) {
        transportRequest.headers = toNetworkHeaders(httpRequest.headers)
      }

      if (httpRequest.body !== undefined) {
        transportRequest.postData = toRequestPostData(httpRequest.body)
      }

      return transportRequest
    },

    decodeResponse (transportResponse: CdpFetchTransportResponse): HttpResponse {
      inFlightResponses.set(transportResponse.id, transportResponse)

      return {
        id: transportResponse.id,
        url: transportResponse.url,
        bodyStream: transportResponse.bodyStream,
        headers: stripWireEncodingHeaders(toHttpHeaders(transportResponse.responseHeaders)),
        statusCode: transportResponse.responseCode,
      }
    },

    encodeResponse (httpResponse: HttpResponse): CdpFetchTransportResponse {
      const response = httpResponse as CdpFetchHttpResponse
      const pausedResponse = inFlightResponses.get(httpResponse.id)
      const fulfilled = response.body !== undefined
      // Middleware headers describe the body the pipeline produced — including
      // any re-encoding by CompressBody — so keep their content-encoding and
      // only drop stale length headers. The pause-header fallback describes
      // the wire body, not the decoded body we fulfill with, so its encoding
      // headers are stripped too.
      const fulfilledHeaders = (headers?: HttpHeaders, pauseHeaders?: CdpFetchTransportResponse['responseHeaders']) => {
        const middlewareHeaders = toResponseHeaders(headers)

        return middlewareHeaders
          ? stripHeaderEntries(middlewareHeaders, WIRE_LENGTH_HEADERS)
          : stripHeaderEntries(pauseHeaders, WIRE_ENCODING_HEADERS)
      }
      // continueResponse delivers the origin's untouched wire bytes, so any
      // header edits the middleware made (CSP/cookie/cache-control, etc.) must
      // ride alongside the original wire framing headers — middleware never
      // sees those, since they're stripped when the pause is decoded.
      const continueHeaders = (headers?: HttpHeaders, pauseHeaders?: CdpFetchTransportResponse['responseHeaders']) => {
        const middlewareHeaders = toResponseHeaders(headers)

        if (!middlewareHeaders) {
          return pauseHeaders
        }

        const wireHeaders = pauseHeaders?.filter(({ name }) => WIRE_ENCODING_HEADERS.has(name.toLowerCase()))

        return [...middlewareHeaders, ...(wireHeaders ?? [])]
      }
      const transportResponse = pausedResponse ? {
        ...pausedResponse,
        fulfilled,
        responseCode: response.statusCode ?? pausedResponse.responseCode,
        responseHeaders: fulfilled
          ? fulfilledHeaders(response.headers, pausedResponse.responseHeaders)
          : continueHeaders(response.headers, pausedResponse.responseHeaders),
        ...(fulfilled ? { body: toResponseBody(response.body) } : {}),
      } : {
        ...requireRequestPause(httpResponse.id),
        fulfilled: true,
        responseCode: response.statusCode ?? 200,
        responseHeaders: fulfilledHeaders(response.headers),
        body: toResponseBody(response.body),
      }

      transportResponse.url = httpResponse.url
      inFlightResponses.delete(httpResponse.id)

      return transportResponse.fulfilled ? toIdentityResponse(transportResponse) : transportResponse
    },

    releaseRequest (id: string): void {
      inFlightRequests.delete(id)
      inFlightResponses.delete(id)
    },
  }
}
