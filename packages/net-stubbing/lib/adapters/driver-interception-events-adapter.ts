import type { ForInterceptionEvents, ForStubbing, NetEvent } from '@packages/network-interception'
import type { NetStubbingState } from '../server/types'
import { emit } from '../server/util'
import type { SocketBroadcaster } from '@packages/socket'
import {
  fromDriverInterceptChangedData,
  toDriverInterceptEventData,
} from '../driver-intercept-bridge'
import type { PendingEventHandler } from '../driver-intercept-bridge'

type DriverInterceptionEventsAdapterOptions = {
  state: ForStubbing
  socket: SocketBroadcaster
}

/**
 * {@link ForInterceptionEvents} adapter — socket bridge for intercept handler round-trips.
 *
 * {@link HttpIntercept} passes domain {@link HttpRequest}/{@link HttpResponse} payloads;
 * this adapter converts to/from driver intercept payloads at the socket edge.
 */
export class DriverInterceptionEventsAdapter implements ForInterceptionEvents {
  private readonly stubbingState: NetStubbingState
  private readonly socket: SocketBroadcaster

  constructor (options: DriverInterceptionEventsAdapterOptions) {
    this.stubbingState = options.state as NetStubbingState
    this.socket = options.socket
  }

  emitAndAwait<D, R = unknown> (
    eventName: string,
    frame: NetEvent.ToDriver.Event<D>,
  ): Promise<{ changedData?: R, stopPropagation?: boolean }> {
    return new Promise((resolve) => {
      const pending: PendingEventHandler = {
        eventName,
        complete: ({ changedData, stopPropagation }) => {
          resolve({
            changedData: changedData as R,
            stopPropagation,
          })
        },
      }

      this.stubbingState.pendingEventHandlers[frame.eventId] = pending
      emit(this.socket, eventName, {
        ...frame,
        data: toDriverInterceptEventData(eventName, frame.data),
      })
    })
  }

  emit<D> (eventName: string, frame: NetEvent.ToDriver.Event<D>): void {
    emit(this.socket, eventName, {
      ...frame,
      data: toDriverInterceptEventData(eventName, frame.data),
    })
  }

  resolveEventHandler (options: {
    eventId: string
    changedData?: unknown
    stopPropagation: boolean
  }): void {
    const pending = this.stubbingState.pendingEventHandlers[options.eventId]

    if (!pending) {
      return
    }

    delete this.stubbingState.pendingEventHandlers[options.eventId]

    pending.complete({
      changedData: options.changedData === undefined
        ? undefined
        : fromDriverInterceptChangedData(pending.eventName, options.changedData),
      stopPropagation: options.stopPropagation,
    })
  }
}
