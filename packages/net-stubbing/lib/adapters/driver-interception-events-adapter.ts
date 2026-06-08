import type { ForInterceptionEvents } from '@packages/network-interception'
import type { NetEvent } from '../types'
import type { NetStubbingState } from './types'
import { emit } from '../server/util'
import type { SocketBroadcaster } from '@packages/socket'

type DriverInterceptionEventsAdapterOptions = {
  state: NetStubbingState
  socket: SocketBroadcaster
}

/**
 * {@link ForInterceptionEvents} adapter — wraps socket emit and pending handler resolution.
 */
export class DriverInterceptionEventsAdapter implements ForInterceptionEvents {
  constructor (private readonly options: DriverInterceptionEventsAdapterOptions) {}

  emitAndAwait<D, R = unknown> (
    eventName: string,
    frame: NetEvent.ToDriver.Event<D>,
  ): Promise<{ changedData?: R, stopPropagation?: boolean }> {
    return new Promise((resolve) => {
      this.options.state.pendingEventHandlers[frame.eventId] = resolve
      emit(this.options.socket, eventName, frame)
    })
  }

  emit<D> (eventName: string, frame: NetEvent.ToDriver.Event<D>): void {
    emit(this.options.socket, eventName, frame)
  }

  resolveEventHandler (options: {
    eventId: string
    changedData?: unknown
    stopPropagation: boolean
  }): void {
    const pendingEventHandler = this.options.state.pendingEventHandlers[options.eventId]

    if (!pendingEventHandler) {
      return
    }

    delete this.options.state.pendingEventHandlers[options.eventId]

    pendingEventHandler(options)
  }
}
