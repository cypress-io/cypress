import _ from 'lodash'
import type {
  HttpRequest,
  HttpResponse,
  InterceptHandlerEventData,
  InterceptHandlerEventName,
  InterceptHandlerResponse,
  ResourceType,
} from '@packages/network-interception'
import { SERIALIZABLE_REQ_PROPS } from '@packages/network-interception'

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
  url: string
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
  eventName: InterceptHandlerEventName
  complete: (opts: { changedData?: unknown, stopPropagation: boolean }) => void
}

export type ToDriverInterceptEventData = {
  'before:request': DriverInterceptRequest
  'before:response': DriverInterceptResponse
  'response:callback': DriverInterceptResponse
  'response': DriverInterceptResponse
  'after:response': DriverInterceptResponseComplete
  'network:error': DriverInterceptNetworkError
}

const RESPONSE_STAGE_EVENTS = new Set<InterceptHandlerEventName>([
  'before:response',
  'response:callback',
  'response',
])

function toDriverInterceptRequest (request: HttpRequest): DriverInterceptRequest {
  const headers = { ...request.headers }

  if (request.browserAcceptEncoding !== undefined) {
    headers['accept-encoding'] = request.browserAcceptEncoding
  }

  return _.extend(_.pick(request, SERIALIZABLE_REQ_PROPS), {
    url: request.url,
    body: request.body ?? '',
    query: {},
    httpVersion: '1.1',
    resourceType: request.resourceType ?? 'other',
    headers,
  }) as DriverInterceptRequest
}

function toDriverInterceptResponse (response: HttpResponse, requestUrl: string): DriverInterceptResponse {
  return {
    url: requestUrl,
    statusCode: response.statusCode,
    statusMessage: response.statusMessage ?? '',
    headers: response.headers,
    body: response.body ?? '',
    delay: response.delay,
    throttleKbps: response.throttleKbps,
  }
}

function driverInterceptRequestToHttpRequest (driverRequest: DriverInterceptRequest): HttpRequest {
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

function driverInterceptResponseToHttpResponse (driverResponse: DriverInterceptResponse): HttpResponse {
  return {
    statusCode: driverResponse.statusCode,
    statusMessage: driverResponse.statusMessage,
    headers: driverResponse.headers,
    body: driverResponse.body,
    delay: driverResponse.delay,
    throttleKbps: driverResponse.throttleKbps,
  }
}

function driverInterceptResponseToHandlerResponse (driverResponse: DriverInterceptResponse): InterceptHandlerResponse {
  return {
    ...driverInterceptResponseToHttpResponse(driverResponse),
    url: driverResponse.url,
  }
}

export function toDriverInterceptEventData<K extends InterceptHandlerEventName> (
  eventName: K,
  data: InterceptHandlerEventData[K],
): ToDriverInterceptEventData[K] {
  if (eventName === 'before:request') {
    return toDriverInterceptRequest(data as HttpRequest) as unknown as ToDriverInterceptEventData[K]
  }

  if (RESPONSE_STAGE_EVENTS.has(eventName)) {
    const response = data as InterceptHandlerResponse

    return toDriverInterceptResponse(response, response.url) as unknown as ToDriverInterceptEventData[K]
  }

  return data as unknown as ToDriverInterceptEventData[K]
}

export function fromDriverInterceptChangedData<K extends InterceptHandlerEventName> (
  eventName: K,
  changedData: ToDriverInterceptEventData[K],
): InterceptHandlerEventData[K] {
  if (eventName === 'before:request') {
    return driverInterceptRequestToHttpRequest(changedData as DriverInterceptRequest) as unknown as InterceptHandlerEventData[K]
  }

  if (RESPONSE_STAGE_EVENTS.has(eventName)) {
    return driverInterceptResponseToHandlerResponse(changedData as DriverInterceptResponse) as unknown as InterceptHandlerEventData[K]
  }

  return changedData as unknown as InterceptHandlerEventData[K]
}
