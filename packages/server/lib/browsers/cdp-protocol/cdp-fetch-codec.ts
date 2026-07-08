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

  return {
    decodeRequest (transportRequest: CdpFetchTransportRequest): HttpRequest {
      inFlightRequests.set(transportRequest.id, transportRequest)

      return {
        id: transportRequest.id,
        url: transportRequest.url,
      }
    },

    encodeRequest (httpRequest: HttpRequest): CdpFetchTransportRequest {
      const transportRequest = inFlightRequests.get(httpRequest.id)!

      transportRequest.url = httpRequest.url

      return transportRequest
    },

    decodeResponse (transportResponse: CdpFetchTransportResponse): HttpResponse {
      inFlightRequests.set(transportResponse.id, transportResponse)

      return {
        id: transportResponse.id,
        url: transportResponse.url,
      }
    },

    encodeResponse (httpResponse: HttpResponse): CdpFetchTransportResponse {
      const transportResponse = inFlightRequests.get(httpResponse.id)! as CdpFetchTransportResponse

      transportResponse.url = httpResponse.url
      inFlightRequests.delete(httpResponse.id)

      return transportResponse
    },

    releaseRequest (id: string): void {
      inFlightRequests.delete(id)
    },
  }
}
