import type {
  HttpHeaders,
  HttpRequest,
  HttpResponse,
  TransportCodecPort,
} from '@packages/network-interception'
import type {
  CdpFetchTransportRequest,
  CdpFetchTransportResponse,
} from './cdp-fetch-transport'

type CdpFetchHttpResponse = HttpResponse & {
  body?: string | Buffer
  headers?: HttpHeaders
  statusCode?: number
}

function toCdpRequestHeaders (headers: HttpHeaders = {}): Record<string, string> {
  return Object.entries(headers).reduce<Record<string, string>>((memo, [name, value]) => {
    if (Array.isArray(value)) {
      memo[name] = value.join(', ')
    } else if (typeof value !== 'undefined') {
      memo[name] = value
    }

    return memo
  }, {})
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

function toResponseBody (body?: string | Buffer): string | undefined {
  if (body === undefined) {
    return undefined
  }

  return Buffer.from(body).toString('base64')
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
      transportRequest.method = httpRequest.method ?? transportRequest.method
      transportRequest.headers = httpRequest.headers ? toCdpRequestHeaders(httpRequest.headers) : transportRequest.headers
      transportRequest.postData = typeof httpRequest.body === 'undefined' ? transportRequest.postData : httpRequest.body.toString()

      return transportRequest
    },

    getRequest (id: string): CdpFetchTransportRequest {
      return requireRequest(id)
    },

    decodeResponse (transportResponse: CdpFetchTransportResponse): HttpResponse {
      inFlightResponses.set(transportResponse.id, transportResponse)

      return {
        id: transportResponse.id,
        url: transportResponse.url,
      }
    },

    encodeResponse (httpResponse: HttpResponse): CdpFetchTransportResponse {
      const response = httpResponse as CdpFetchHttpResponse
      const transportResponse = inFlightResponses.get(httpResponse.id) ?? {
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
