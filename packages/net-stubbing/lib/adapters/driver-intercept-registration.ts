import type { ForInterceptRegistration, InterceptRegistrationRequest } from '@packages/network-interception'
import type { SocketBroadcaster } from '@packages/socket'
import type { GetFixtureFn, NetStubbingState } from '../server/types'
import { onNetStubbingEvent } from '../server/driver-events'
import type { OnNetStubbingEventFrame } from '../server/driver-events'

type DriverInterceptRegistrationAdapterOptions = {
  state: NetStubbingState
  socket: SocketBroadcaster
  getFixture: GetFixtureFn
}

/**
 * {@link ForInterceptRegistration} adapter — delegates to legacy `onNetStubbingEvent`.
 */
export class DriverInterceptRegistrationAdapter implements ForInterceptRegistration {
  constructor (private readonly options: DriverInterceptRegistrationAdapterOptions) {}

  handleEvent (request: InterceptRegistrationRequest): Promise<unknown> {
    return onNetStubbingEvent({
      eventName: request.eventName,
      frame: request.frame as OnNetStubbingEventFrame,
      state: this.options.state,
      socket: this.options.socket,
      getFixture: this.options.getFixture,
      args: [request.eventName, request.frame],
    })
  }
}
