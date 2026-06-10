import { describe, it, expect, vi } from 'vitest'
import { state as NetStubbingState } from '../../lib/server/state'
import { InterceptedRequest } from '../../lib/server/intercepted-request'
import type { NetStubbingState as NetStubbingStateType } from '../../lib/server/types'

function addPendingRequest (state: NetStubbingStateType, { hasInterceptor }: { hasInterceptor: boolean }) {
  const res = {
    destroy: vi.fn(),
    removeAllListeners: vi.fn(),
    on: vi.fn(),
  }

  const request = new InterceptedRequest({
    req: {
      // @ts-ignore - only the fields read by `reset` are needed here
      matchingRoutes: [{ id: '1', hasInterceptor, routeMatcher: {} }],
    },
    // @ts-ignore - a minimal response stub is sufficient for `reset`
    res,
    state,
    // @ts-ignore
    socket: { toDriver: vi.fn() },
  })

  state.requests[request.id] = request

  return { request, res }
}

describe('NetStubbingState', () => {
  describe('reset', () => {
    // https://github.com/cypress-io/cypress/issues/20397
    it('destroys pending requests that depend on an interceptor callback', () => {
      const state = NetStubbingState()
      const { res } = addPendingRequest(state, { hasInterceptor: true })

      state.reset()

      expect(res.destroy).toHaveBeenCalledOnce()
      expect(state.requests).toEqual({})
    })

    // Destroying these aborts the in-flight response, which causes the browser
    // to retry the request and bleed it into the next test.
    // https://github.com/cypress-io/cypress/issues/20397
    it('does not destroy pending requests that resolve without a callback', () => {
      const state = NetStubbingState()
      const { res } = addPendingRequest(state, { hasInterceptor: false })

      state.reset()

      expect(res.destroy).not.toHaveBeenCalled()
      expect(state.requests).toEqual({})
    })

    it('clears routes and pending event handlers', () => {
      const state = NetStubbingState()

      // @ts-ignore - minimal route shape for the reset assertion
      state.routes.push({ id: '1', hasInterceptor: false, routeMatcher: {}, matches: 0 })
      state.pendingEventHandlers['event1'] = vi.fn()

      state.reset()

      expect(state.routes).toEqual([])
      expect(state.pendingEventHandlers).toEqual({})
    })
  })
})
