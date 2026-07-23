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

  const requireResponse = (id: string): CdpFetchTransportResponse => {
    const response = inFlightResponses.get(id)

    if (!response) {
      throw new Error(`No CDP Fetch response pause found for ${id}. HttpIntercept middleware must call next() before returning a response.`)
    }

    return response
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
        headers: toHttpHeaders(transportResponse.responseHeaders),
        statusCode: transportResponse.responseCode,
      }
    },

    encodeResponse (httpResponse: HttpResponse): CdpFetchTransportResponse {
      const response = httpResponse as CdpFetchHttpResponse
      const pausedResponse = inFlightResponses.get(httpResponse.id)
      const transportResponse = pausedResponse ? {
        ...pausedResponse,
        fulfilled: response.body !== undefined,
        responseCode: response.statusCode ?? pausedResponse.responseCode,
        responseHeaders: toResponseHeaders(response.headers) ?? pausedResponse.responseHeaders,
        ...(response.body !== undefined ? { body: toResponseBody(response.body) } : {}),
      } : {
        ...requireRequestPause(httpResponse.id),
        fulfilled: true,
        responseCode: response.statusCode ?? 200,
        responseHeaders: toResponseHeaders(response.headers),
        body: toResponseBody(response.body),
      }

      transportResponse.url = httpResponse.url
      inFlightResponses.delete(httpResponse.id)

      return transportResponse
    },

    releaseRequest (id: string): void {
      inFlightRequests.delete(id)
      inFlightResponses.delete(id)
    },
  }
}
