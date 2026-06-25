import _ from 'lodash'
import type {
  HttpRequest,
  HttpResponse,
  ResourceType,
} from '@packages/network-interception'
import { SERIALIZABLE_REQ_PROPS, SERIALIZABLE_RES_PROPS } from '@packages/network-interception'

/** Serializable payload sent to the driver over the socket. */
export type DriverInterceptMessage<T = any> = {
  body: T
  headers: { [key: string]: string | string[] }
}

export type DriverInterceptRequest<T = any> = DriverInterceptMessage<T> & {
  method: string
  url: string
  query: Record<string, string | number>
  httpVersion: string
  resourceType: ResourceType
  responseTimeout?: number
  followRedirect?: boolean
  alias?: string
}

export type DriverInterceptResponse<T = any> = DriverInterceptMessage<T> & {
  statusCode: number
  statusMessage: string
  throttleKbps?: number
  delay?: number
}

export type DriverInterceptResponseComplete<T = any> = {
  finalResBody?: DriverInterceptMessage<T>['body']
}

export type DriverInterceptNetworkError = {
  error: any
}

export type PendingEventHandler = {
  eventName: string
  complete: (opts: { changedData?: unknown, stopPropagation: boolean }) => void
}

const RESPONSE_STAGE_EVENTS = new Set([
  'before:response',
  'response:callback',
  'response',
])

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

export function toDriverInterceptEventData (eventName: string, data: unknown): unknown {
  if (eventName === 'before:request') {
    return toDriverInterceptRequest(data as HttpRequest)
  }

  if (RESPONSE_STAGE_EVENTS.has(eventName)) {
    const response = data as HttpResponse & { url?: string }

    return toDriverInterceptResponse(response, response.url ?? '')
  }

  return data
}

export function fromDriverInterceptChangedData (eventName: string, changedData: unknown): unknown {
  if (eventName === 'before:request') {
    return driverInterceptRequestToHttpRequest(changedData as DriverInterceptRequest)
  }

  if (RESPONSE_STAGE_EVENTS.has(eventName)) {
    return driverInterceptResponseToHttpResponse(changedData as DriverInterceptResponse)
  }

  return changedData
}
