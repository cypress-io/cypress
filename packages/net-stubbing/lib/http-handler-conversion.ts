import _ from 'lodash'
import type { HttpRequest, HttpResponse, InterceptWireRequest, InterceptWireResponse } from '@packages/network-interception'
import { SERIALIZABLE_REQ_PROPS, SERIALIZABLE_RES_PROPS } from '@packages/network-interception'

export function toInterceptWireRequest (request: HttpRequest): InterceptWireRequest {
  return _.extend(_.pick(request, SERIALIZABLE_REQ_PROPS), {
    url: request.url,
    body: request.body ?? '',
  }) as InterceptWireRequest
}

export function toInterceptWireResponse (response: HttpResponse, requestUrl: string): InterceptWireResponse {
  return _.extend(_.pick(response, SERIALIZABLE_RES_PROPS), {
    url: requestUrl,
    body: response.body ?? '',
  }) as InterceptWireResponse
}

export function applyInterceptWireRequestToHttpRequest (
  httpRequest: HttpRequest,
  wireRequest: InterceptWireRequest,
  resolvedUrl: string,
): void {
  httpRequest.url = resolvedUrl
  httpRequest.method = wireRequest.method
  httpRequest.headers = wireRequest.headers
  httpRequest.body = wireRequest.body
  httpRequest.responseTimeout = wireRequest.responseTimeout
  httpRequest.followRedirect = wireRequest.followRedirect
}

/** @deprecated Use {@link toInterceptWireRequest} */
export const toHandlerRequest = toInterceptWireRequest

/** @deprecated Use {@link toInterceptWireRequest} */
export const toIncomingRequest = toInterceptWireRequest

/** @deprecated Use {@link toInterceptWireResponse} */
export const toHandlerResponse = toInterceptWireResponse

/** @deprecated Use {@link toInterceptWireResponse} */
export const toIncomingResponse = toInterceptWireResponse

/** @deprecated Use {@link applyInterceptWireRequestToHttpRequest} */
export const applyHandlerRequestToHttpRequest = applyInterceptWireRequestToHttpRequest
