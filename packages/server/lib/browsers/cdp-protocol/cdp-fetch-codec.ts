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

function toHeaderEntries (headers: HttpHeaders = {}): { name: string, value: string }[] {
  return Object.entries(headers).flatMap(([name, value]) => {
    if (typeof value === 'undefined') {
      return []
    }

    if (Array.isArray(value)) {
      return value.map((item) => ({ name, value: item }))
    }

    return [{ name, value }]
  })
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

function fromHeaderEntries (headers?: { name: string, value: string }[]): HttpHeaders | undefined {
  if (!headers) {
    return undefined
  }

  return headers.reduce<HttpHeaders>((memo, header) => {
    memo[header.name] = header.value

    return memo
  }, {})
}

function toBase64 (body: string | Buffer): string {
  if (Buffer.isBuffer(body)) {
    return body.toString('base64')
  }

  return Buffer.from(body).toString('base64')
}

export function createCdpFetchCodec (): TransportCodecPort<CdpFetchTransportRequest, CdpFetchTransportResponse> {
  const inFlightRequests = new Map<string, CdpFetchTransportRequest>()

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
      const transportRequest = inFlightRequests.get(httpRequest.id)!

      transportRequest.url = httpRequest.url
      transportRequest.method = httpRequest.method ?? transportRequest.method
      transportRequest.headers = httpRequest.headers ? toCdpRequestHeaders(httpRequest.headers) : transportRequest.headers
      transportRequest.postData = typeof httpRequest.body === 'undefined' ? transportRequest.postData : httpRequest.body.toString()

      return transportRequest
    },

    getRequest (id: string): CdpFetchTransportRequest {
      return inFlightRequests.get(id)!
    },

    decodeResponse (transportResponse: CdpFetchTransportResponse): HttpResponse {
      inFlightRequests.set(transportResponse.id, transportResponse)

      return {
        id: transportResponse.id,
        url: transportResponse.url,
        statusCode: transportResponse.responseCode,
        headers: fromHeaderEntries(transportResponse.responseHeaders),
      }
    },

    encodeResponse (httpResponse: HttpResponse): CdpFetchTransportResponse {
      const transportResponse = inFlightRequests.get(httpResponse.id)! as CdpFetchTransportResponse

      transportResponse.url = httpResponse.url
      transportResponse.responseCode = httpResponse.statusCode ?? transportResponse.responseCode
      transportResponse.responseHeaders = httpResponse.headers ? toHeaderEntries(httpResponse.headers) : transportResponse.responseHeaders

      if (typeof httpResponse.body !== 'undefined') {
        transportResponse.responseBody = toBase64(httpResponse.body)
      }

      inFlightRequests.delete(httpResponse.id)

      return transportResponse
    },

    releaseRequest (id: string): void {
      inFlightRequests.delete(id)
    },
  }
}
