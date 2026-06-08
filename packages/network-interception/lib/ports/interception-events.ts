import type { NetEvent } from '../types'

export type InterceptionEventAwaitResult<R = unknown> = {
  changedData?: R
  stopPropagation?: boolean
}

/**
 * Driven port: emit intercept handler events to the driver (fire-and-forget or await reply).
 */
export interface ForDriverNotification {
  emitAndAwait<D, R = unknown> (
    eventName: string,
    frame: NetEvent.ToDriver.Event<D>,
  ): Promise<InterceptionEventAwaitResult<R>>

  emit<D> (eventName: string, frame: NetEvent.ToDriver.Event<D>): void
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
