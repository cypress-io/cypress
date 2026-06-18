import _ from 'lodash'
import type { HttpRequest, HttpResponse } from '@packages/network-interception'
import { SERIALIZABLE_REQ_PROPS, SERIALIZABLE_RES_PROPS } from '@packages/network-interception'
import type { DriverInterceptRequest, DriverInterceptResponse } from './driver-intercept'

export function toDriverInterceptRequest (request: HttpRequest): DriverInterceptRequest {
  return _.extend(_.pick(request, SERIALIZABLE_REQ_PROPS), {
    url: request.url,
    body: request.body ?? '',
    query: {},
    httpVersion: '1.1',
    resourceType: request.resourceType ?? 'other',
  }) as DriverInterceptRequest
}

export function toDriverInterceptResponse (response: HttpResponse, requestUrl: string): DriverInterceptResponse {
  return _.extend(_.pick(response, SERIALIZABLE_RES_PROPS), {
    url: requestUrl,
    body: response.body ?? '',
    statusMessage: response.statusMessage ?? '',
  }) as DriverInterceptResponse
}

export function driverInterceptRequestToHttpRequest (driverRequest: DriverInterceptRequest): HttpRequest {
  return {
    inFlightInterceptId: '',
    url: driverRequest.url,
    method: driverRequest.method,
    headers: driverRequest.headers,
    body: driverRequest.body,
    resourceType: driverRequest.resourceType,
    responseTimeout: driverRequest.responseTimeout,
    followRedirect: driverRequest.followRedirect,
  }
}

export function driverInterceptResponseToHttpResponse (driverResponse: DriverInterceptResponse): HttpResponse {
  return {
    statusCode: driverResponse.statusCode,
    statusMessage: driverResponse.statusMessage,
    headers: driverResponse.headers,
    body: driverResponse.body,
    delay: driverResponse.delay,
    throttleKbps: driverResponse.throttleKbps,
  }
}
