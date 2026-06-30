import { describe, it, expect, vi } from 'vitest'
import { planSubscriptions } from '../../../lib/core/plan-subscriptions'
import type { BackendRoute } from '@packages/network-interception'

describe('core/plan-subscriptions', () => {
  it('plans default subscriptions for matched routes', () => {
    const routes = [{
      id: 'route-1',
      hasInterceptor: true,
      routeMatcher: {},
      getFixture: async () => {},
      matches: 0,
    }] as BackendRoute[]

    const planned = planSubscriptions({ matchingRoutes: routes })

    expect(planned).toHaveLength(1)
    expect(planned[0].subscriptions.map((s) => s.eventName)).toEqual([
      'before:request',
      'response:callback',
      'after:response',
      'network:error',
    ])

    expect(planned[0].subscriptions[0].await).toBe(true)
  })

  it('skips sync XHR routes with interceptors', () => {
    const onSyncInterceptSkipped = vi.fn()
    const routes = [{
      id: 'route-1',
      hasInterceptor: true,
      routeMatcher: {},
      getFixture: async () => {},
      matches: 0,
    }] as BackendRoute[]

    const planned = planSubscriptions({
      matchingRoutes: routes,
      isSyncRequest: true,
      url: 'http://example.com',
      onSyncInterceptSkipped,
    })

    expect(planned).toHaveLength(0)
    expect(onSyncInterceptSkipped).toHaveBeenCalledWith('http://example.com')
  })
})
