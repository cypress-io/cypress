import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DriverInterceptRegistrationAdapter } from '../../../lib/adapters/driver-intercept-registration'
import { DriverInterceptionEventsAdapter } from '../../../lib/adapters/driver-interception-events-adapter'
import { onNetStubbingEvent } from '../../../lib/server/driver-events'
import { state as netStubbingState } from '../../../lib/server/state'
import { HttpInterception, type ForInterceptionEvents, type InterceptRegistrationRequest } from '@packages/network-interception'
import { applyInterceptWireRequestToHttpRequest, toInterceptWireRequest, toInterceptWireResponse } from '@packages/net-stubbing'

vi.mock('../../../lib/server/driver-events', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../../lib/server/driver-events')>()

  return {
    ...original,
    onNetStubbingEvent: vi.fn(original.onNetStubbingEvent),
  }
})

describe('DriverInterceptRegistrationAdapter', () => {
  const getFixture = vi.fn(async () => '')
  const socket = { toDriver: vi.fn() }
  let state: ReturnType<typeof netStubbingState>
  let httpInterception: HttpInterception
  let interceptionEvents: ForInterceptionEvents

  beforeEach(() => {
    vi.mocked(onNetStubbingEvent).mockClear()
    state = netStubbingState()
    getFixture.mockClear()

    interceptionEvents = {
      emitAndAwait: vi.fn(async () => ({})),
      emit: vi.fn(),
      resolveEventHandler: vi.fn(),
    }

    httpInterception = new HttpInterception({
      getRoutes: () => state.routes,
      interceptionEvents,
      wireMessages: {
        toWireRequest: toInterceptWireRequest,
        toWireResponse: toInterceptWireResponse,
        applyWireRequestToHttpRequest: applyInterceptWireRequestToHttpRequest,
      },
    })
  })

  const createAdapter = () => {
    return new DriverInterceptRegistrationAdapter({
      state,
      socket,
      getFixture,
      httpInterception,
      interceptionEvents,
    })
  }

  it('delegates handleEvent to onNetStubbingEvent with adapter context', async () => {
    const adapter = createAdapter()
    const request: InterceptRegistrationRequest = {
      eventName: 'route:added',
      frame: {
        routeId: 'route-1',
        hasInterceptor: false,
        routeMatcher: { url: { type: 'glob', value: '**/api/*' } },
      },
    }

    await adapter.handleEvent(request)

    expect(onNetStubbingEvent).toHaveBeenCalledOnce()
    expect(onNetStubbingEvent).toHaveBeenCalledWith({
      eventName: 'route:added',
      frame: request.frame,
      state,
      socket,
      getFixture,
      httpInterception,
      pendingHandlerResolution: interceptionEvents,
      args: ['route:added', request.frame],
    })
  })

  it('forwards route:added to net stubbing state', async () => {
    const adapter = createAdapter()

    await adapter.handleEvent({
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

  it('forwards route:added to net stubbing state', async () => {
    let resolveBeforeRequest!: () => void

    interceptionEvents = {
      emitAndAwait: vi.fn(async (eventName) => {
        if (eventName === 'before:request') {
          await new Promise<void>((resolve) => {
            resolveBeforeRequest = resolve
          })
        }

        return {}
      }),
      emit: vi.fn(),
      resolveEventHandler: vi.fn(),
    }

    httpInterception = new HttpInterception({
      getRoutes: () => state.routes,
      interceptionEvents,
      wireMessages: {
        toWireRequest: toInterceptWireRequest,
        toWireResponse: toInterceptWireResponse,
        applyWireRequestToHttpRequest: applyInterceptWireRequestToHttpRequest,
      },
    })

    const adapter = createAdapter()

    state.routes.push({
      id: 'route-1',
      hasInterceptor: true,
      routeMatcher: { url: 'http://example.com/*' },
      getFixture,
      matches: 0,
    })

    const handlePromise = httpInterception.handle({
      inFlightInterceptId: 'intercept-1',
      url: 'http://example.com/foo',
      method: 'GET',
      headers: {},
    }, async () => {
      throw new Error('next should not be called')
    })

    await adapter.handleEvent({
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
    const interceptionEventsAdapter = new DriverInterceptionEventsAdapter({
      state,
      socket,
    })
    const adapter = new DriverInterceptRegistrationAdapter({
      state,
      socket,
      getFixture,
      httpInterception,
      interceptionEvents: interceptionEventsAdapter,
    })
    const handler = vi.fn()

    state.pendingEventHandlers['event-1'] = handler

    await adapter.handleEvent({
      eventName: 'event:handler:resolved',
      frame: {
        eventId: 'event-1',
        changedData: { url: 'http://example.com' },
        stopPropagation: false,
      },
    })

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith({
      eventId: 'event-1',
      changedData: { url: 'http://example.com' },
      stopPropagation: false,
    })

    expect(state.pendingEventHandlers['event-1']).toBeUndefined()
  })
})
