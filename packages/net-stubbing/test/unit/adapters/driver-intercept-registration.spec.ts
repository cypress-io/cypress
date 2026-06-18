import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createDriverAdapter } from '../../../lib/adapters/create-driver-adapter'
import { DriverInterceptionEventsAdapter } from '../../../lib/adapters/driver-interception-events-adapter'
import { onNetStubbingEvent } from '../../../lib/server/driver-events'
import { state as netStubbingState } from '../../../lib/server/state'
import type { InterceptRegistrationRequest } from '@packages/network-interception'

vi.mock('../../../lib/server/driver-events', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../../lib/server/driver-events')>()

  return {
    ...original,
    onNetStubbingEvent: vi.fn(original.onNetStubbingEvent),
  }
})

describe('createDriverAdapter intercept registration', () => {
  const getFixture = vi.fn(async () => '')
  const socket = { toDriver: vi.fn() }
  let state: ReturnType<typeof netStubbingState>
  let driverAdapter: ReturnType<typeof createDriverAdapter>

  beforeEach(() => {
    vi.mocked(onNetStubbingEvent).mockClear()
    state = netStubbingState()
    getFixture.mockClear()

    driverAdapter = createDriverAdapter({
      stubbing: state,
      socket,
    })
  })

  const createRegistration = () => {
    return driverAdapter.createInterceptRegistration({ getFixture })
  }

  it('delegates handleEvent to onNetStubbingEvent with adapter context', async () => {
    const registration = createRegistration()
    const request: InterceptRegistrationRequest = {
      eventName: 'route:added',
      frame: {
        routeId: 'route-1',
        hasInterceptor: false,
        routeMatcher: { url: { type: 'glob', value: '**/api/*' } },
      },
    }

    await registration.handleEvent(request)

    expect(onNetStubbingEvent).toHaveBeenCalledOnce()
    expect(onNetStubbingEvent).toHaveBeenCalledWith({
      eventName: 'route:added',
      frame: request.frame,
      state,
      getFixture,
      cyIntercept: driverAdapter.cyIntercept,
      pendingHandlerResolution: driverAdapter.interceptionEvents,
    })
  })

  it('forwards route:added to net stubbing state', async () => {
    const registration = createRegistration()

    await registration.handleEvent({
      eventName: 'route:added',
      frame: {
        routeId: 'route-1',
        hasInterceptor: true,
        routeMatcher: { url: '*' },
      },
    })

    expect(state.routes).toHaveLength(1)
    expect(state.routes[0].id).toBe('route-1')
  })

  it('fulfills send:static:response while before:request is in flight', async () => {
    let resolveBeforeRequest!: () => void

    vi.spyOn(driverAdapter.interceptionEvents, 'emitAndAwait').mockImplementation(async (eventName) => {
      if (eventName === 'before:request') {
        await new Promise<void>((resolve) => {
          resolveBeforeRequest = resolve
        })
      }

      return {}
    })

    const registration = createRegistration()

    state.routes.push({
      id: 'route-1',
      hasInterceptor: true,
      routeMatcher: { url: 'http://example.com/*' },
      getFixture,
      matches: 0,
    })

    const handlePromise = driverAdapter.httpIntercept.handle({
      inFlightInterceptId: 'intercept-1',
      url: 'http://example.com/foo',
      method: 'GET',
      headers: {},
    }, async () => {
      throw new Error('next should not be called')
    })

    await registration.handleEvent({
      eventName: 'send:static:response',
      frame: {
        requestId: 'intercept-1',
        staticResponse: {
          statusCode: 200,
          body: 'response body',
        },
      },
    })

    resolveBeforeRequest()

    const response = await handlePromise

    expect(response.statusCode).toBe(200)
    expect(response.body).toBe('response body')
  })

  it('forwards event:handler:resolved to pending handlers', async () => {
    const interceptionEvents = new DriverInterceptionEventsAdapter({
      state,
      socket,
    })
    const cyIntercept = driverAdapter.cyIntercept
    const registration = {
      handleEvent (request: InterceptRegistrationRequest): Promise<unknown> {
        return onNetStubbingEvent({
          eventName: request.eventName,
          frame: request.frame as any,
          state,
          getFixture,
          cyIntercept,
          pendingHandlerResolution: interceptionEvents,
        })
      },
    }
    const handler = vi.fn()

    state.pendingEventHandlers['event-1'] = {
      eventName: 'before:request',
      complete: handler,
    }

    await registration.handleEvent({
      eventName: 'event:handler:resolved',
      frame: {
        eventId: 'event-1',
        changedData: {
          url: 'http://example.com',
          method: 'GET',
          headers: {},
          body: '',
          query: {},
          httpVersion: '1.1',
          resourceType: 'other',
        },
        stopPropagation: false,
      },
    })

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith({
      changedData: {
        inFlightInterceptId: '',
        url: 'http://example.com',
        method: 'GET',
        headers: {},
        body: '',
        resourceType: 'other',
      },
      stopPropagation: false,
    })

    expect(state.pendingEventHandlers['event-1']).toBeUndefined()
  })
})
