import type { ForHttpIntercept, ForInterceptRegistration, ForInterceptionEvents, ForStubbing, InterceptRegistrationRequest } from '@packages/network-interception'
import { HttpIntercept } from '@packages/network-interception'
import type { SocketBroadcaster } from '@packages/socket'
import type { GetFixtureFn } from '../server/types'
import { createCyInterceptIntercepter } from '../intercepters/cy-intercept-intercepter'
import type { CyInterceptIntercepter } from '../intercepters/cy-intercept-intercepter'
import { DriverInterceptionEventsAdapter } from './driver-interception-events-adapter'
import { onNetStubbingEvent } from '../server/driver-events'
import type { OnNetStubbingEventFrame } from '../server/driver-events'

export type DriverAdapter = {
  interceptionEvents: ForInterceptionEvents
  cyIntercept: CyInterceptIntercepter
  httpIntercept: ForHttpIntercept
  createInterceptRegistration (options: { getFixture: GetFixtureFn }): ForInterceptRegistration
}

export type CreateDriverAdapterOptions = {
  stubbing: ForStubbing
  socket: SocketBroadcaster
  httpIntercept?: ForHttpIntercept
  onSyncInterceptSkipped?: (url: string) => void
}

/**
 * Wires driver socket adapters and registers the cy.intercept intercepter on {@link HttpIntercept}.
 */
export function createDriverAdapter (options: CreateDriverAdapterOptions): DriverAdapter {
  const interceptionEvents = new DriverInterceptionEventsAdapter({
    state: options.stubbing,
    socket: options.socket,
  })

  const cyIntercept = createCyInterceptIntercepter({
    stubbing: options.stubbing,
    interceptionEvents,
    onSyncInterceptSkipped: options.onSyncInterceptSkipped,
  })

  const httpIntercept: ForHttpIntercept = options.httpIntercept ?? new HttpIntercept()

  httpIntercept.use(cyIntercept.intercepter)

  const createInterceptRegistration = ({ getFixture }: { getFixture: GetFixtureFn }): ForInterceptRegistration => {
    return {
      handleEvent (request: InterceptRegistrationRequest): Promise<unknown> {
        return onNetStubbingEvent({
          eventName: request.eventName,
          frame: request.frame as OnNetStubbingEventFrame,
          state: options.stubbing,
          getFixture,
          cyIntercept,
          pendingHandlerResolution: interceptionEvents,
        })
      },
    }
  }

  return {
    interceptionEvents,
    cyIntercept,
    httpIntercept,
    createInterceptRegistration,
  }
}
