import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DriverInterceptRegistrationAdapter } from '../../../lib/adapters/driver-intercept-registration'
import { onNetStubbingEvent } from '../../../lib/server/driver-events'
import { state as netStubbingState } from '../../../lib/server/state'
import { InterceptedRequest } from '../../../lib/server/intercepted-request'
import type { InterceptRegistrationRequest } from '@packages/network-interception'

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

  beforeEach(() => {
    vi.mocked(onNetStubbingEvent).mockClear()
    state = netStubbingState()
    getFixture.mockClear()
  })

  const createAdapter = () => {
    return new DriverInterceptRegistrationAdapter({
      state,
      socket,
      getFixture,
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

  it('forwards subscribe to the matching intercepted request', async () => {
    const adapter = createAdapter()
    const interceptedRequest = new InterceptedRequest({
      req: {
        matchingRoutes: [{
          id: 'route-1',
          hasInterceptor: true,
          routeMatcher: {},
        }],
      } as any,
      res: {} as any,
      continueRequest: vi.fn(),
      onError: vi.fn(),
      onResponse: vi.fn(),
      state,
      socket,
    })

    interceptedRequest.id = 'req-1'
    interceptedRequest.addDefaultSubscriptions()
    state.requests[interceptedRequest.id] = interceptedRequest

    const addSubscription = vi.spyOn(interceptedRequest, 'addSubscription')

    await adapter.handleEvent({
      eventName: 'subscribe',
      frame: {
        requestId: 'req-1',
        subscription: {
          routeId: 'route-1',
          eventName: 'before:request',
          await: true,
        },
      },
    })

    expect(addSubscription).toHaveBeenCalledTimes(1)
  })

  it('forwards event:handler:resolved to pending handlers', async () => {
    const adapter = createAdapter()
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

  it('forwards send:static:response to the matching intercepted request', async () => {
    const adapter = createAdapter()
    const onResponse = vi.fn()
    const interceptedRequest = new InterceptedRequest({
      req: {
        matchingRoutes: [{
          id: 'route-1',
          hasInterceptor: true,
          routeMatcher: {},
        }],
      } as any,
      res: {} as any,
      continueRequest: vi.fn(),
      onError: vi.fn(),
      onResponse,
      state,
      socket,
    })

    interceptedRequest.id = 'req-1'
    state.requests[interceptedRequest.id] = interceptedRequest

    await adapter.handleEvent({
      eventName: 'send:static:response',
      frame: {
        requestId: 'req-1',
        staticResponse: {
          statusCode: 200,
          body: 'response body',
        },
      },
    })

    expect(onResponse).toHaveBeenCalledTimes(1)
    expect(interceptedRequest.res.body).toBe('response body')
  })
})
