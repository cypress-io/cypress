import { describe, it, expect } from 'vitest'
import type { NetEvent } from '../../lib/types'
import type { BackendRoute } from '../../lib/types/backend-route'

describe('@packages/network-interception types', () => {
  it('exports NetEvent driver protocol types', () => {
    const event: NetEvent.ToServer.AddRoute<unknown> = {
      routeMatcher: { url: { type: 'glob', value: '**/api/*' } },
      hasInterceptor: false,
      routeId: 'route-1',
    }

    expect(event.routeId).toBe('route-1')
  })

  it('accepts subscribe driver events in DriverEvent union', () => {
    const event: NetEvent.ToServer.DriverEvent = {
      requestId: 'req-1',
      subscription: {
        routeId: 'route-1',
        eventName: 'before:request',
        await: true,
      },
    }

    expect(event.requestId).toBe('req-1')
  })

  it('exports BackendRoute as a type', () => {
    const route: BackendRoute = {
      id: 'route-1',
      routeMatcher: { url: '*' },
      hasInterceptor: false,
      getFixture: async () => '',
      matches: 0,
    }

    expect(route.id).toBe('route-1')
  })
})
