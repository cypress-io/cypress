import type { NetEvent } from '../types'
import type { HttpRequest, HttpResponse } from './http-interception'

export type InterceptionEventAwaitResult<R = unknown> = {
  changedData?: R
  stopPropagation?: boolean
}

/** In-stack handler payload before socket serialization. */
export type InterceptHandlerResponse = HttpResponse & { url: string }

export type InterceptAfterResponseData = {
  finalResBody?: string | Buffer | ArrayBuffer
}

export type InterceptNetworkErrorData = {
  error: any
}

export type InterceptHandlerEventName =
  | 'before:request'
  | 'before:response'
  | 'response:callback'
  | 'response'
  | 'after:response'
  | 'network:error'

export type InterceptHandlerEventData = {
  'before:request': HttpRequest
  'before:response': InterceptHandlerResponse
  'response:callback': InterceptHandlerResponse
  'response': InterceptHandlerResponse
  'after:response': InterceptAfterResponseData
  'network:error': InterceptNetworkErrorData
}

/**
 * Driven port: emit intercept handler events to the driver (fire-and-forget or await reply).
 */
export interface ForDriverNotification {
  emitAndAwait<K extends InterceptHandlerEventName> (
    eventName: K,
    frame: NetEvent.ToDriver.Event<InterceptHandlerEventData[K]>,
  ): Promise<InterceptionEventAwaitResult<InterceptHandlerEventData[K]>>

  emit<K extends InterceptHandlerEventName> (
    eventName: K,
    frame: NetEvent.ToDriver.Event<InterceptHandlerEventData[K]>,
  ): void
}

/**
 * Driven port: resolve a pending driver handler registered by {@link ForDriverNotification.emitAndAwait}.
 */
export interface ForPendingHandlerResolution {
  resolveEventHandler (options: {
    eventId: string
    changedData?: unknown
    stopPropagation: boolean
  }): void
}

/**
 * Combined driven port for intercept handler round-trips.
 */
export interface ForInterceptionEvents extends ForDriverNotification, ForPendingHandlerResolution {}
