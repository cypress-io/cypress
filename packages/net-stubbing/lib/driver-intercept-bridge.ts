import type { HttpRequest, HttpResponse } from '@packages/network-interception'
import type {
  DriverInterceptRequest,
  DriverInterceptResponse,
} from './driver-intercept'
import {
  toDriverInterceptRequest,
  toDriverInterceptResponse,
  driverInterceptRequestToHttpRequest,
  driverInterceptResponseToHttpResponse,
} from './http-handler-conversion'

const RESPONSE_STAGE_EVENTS = new Set([
  'before:response',
  'response:callback',
  'response',
])

export type PendingEventHandler = {
  eventName: string
  complete: (opts: { changedData?: unknown, stopPropagation: boolean }) => void
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
