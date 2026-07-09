import type {
  HttpRequest,
  HttpResponse,
  TransportCodecPort,
} from '@packages/network-interception'
import type {
  CdpFetchTransportRequest,
  CdpFetchTransportResponse,
} from './cdp-fetch-transport'

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
      }
    },

    encodeRequest (httpRequest: HttpRequest): CdpFetchTransportRequest {
      const transportRequest = requireRequest(httpRequest.id)

      transportRequest.url = httpRequest.url

      return transportRequest
    },

    decodeResponse (transportResponse: CdpFetchTransportResponse): HttpResponse {
      inFlightResponses.set(transportResponse.id, transportResponse)

      return {
        id: transportResponse.id,
        url: transportResponse.url,
      }
    },

    encodeResponse (httpResponse: HttpResponse): CdpFetchTransportResponse {
      const transportResponse = requireResponse(httpResponse.id)

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
