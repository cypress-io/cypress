import { describe, it, expect, vi } from 'vitest'
import { Readable } from 'stream'
import { handleInterceptResponse } from '../../lib/server/handle-intercept-response'
import { InterceptedRequest } from '../../lib/server/intercepted-request'
import { state as NetStubbingState } from '../../lib/server/state'

describe('handleInterceptResponse', () => {
  const originalBody = 'original body'

  function createContext (options: {
    resolveBeforeResponse?: (eventId: string, data: any) => void
  } = {}) {
    const socket = { toDriver: vi.fn() }
    const netStubbingState = NetStubbingState()
    const requestId = 'req-1'
    const interceptedRequest = new InterceptedRequest({
      req: {
        requestId,
        matchingRoutes: [{
          id: 'route-1',
          hasInterceptor: true,
          routeMatcher: {},
        }],
        proxiedUrl: 'http://example.com/',
      } as any,
      res: {} as any,
      continueRequest: vi.fn(),
      onError: vi.fn(),
      onResponse: vi.fn(),
      state: netStubbingState,
      socket,
    })

    interceptedRequest.id = requestId
    interceptedRequest.addDefaultSubscriptions()
    interceptedRequest.addSubscription({
      routeId: 'route-1',
      eventName: 'before:response',
      await: true,
    })

    netStubbingState.requests[requestId] = interceptedRequest

    socket.toDriver.mockImplementation((_channel, eventName, frame) => {
      if (eventName === 'before:response' && options.resolveBeforeResponse) {
        options.resolveBeforeResponse(frame.eventId, frame.data)
      }
    })

    const mw: any = {
      req: {
        requestId,
        proxiedUrl: 'http://example.com/',
        method: 'GET',
      },
      res: {},
      incomingRes: {
        statusCode: 200,
        headers: { 'content-type': 'text/plain' },
      },
      incomingResStream: Readable.from([originalBody]),
      netStubbingState,
      makeResStreamPlainText: vi.fn(),
      next: vi.fn(),
      onError: vi.fn(),
    }

    return { mw, netStubbingState, socket }
  }

  it('sets bodyModified when a response handler rewrites the body', async () => {
    const { mw, netStubbingState } = createContext({
      resolveBeforeResponse: (eventId, data) => {
        netStubbingState.pendingEventHandlers[eventId]({
          changedData: {
            ...data,
            body: 'modified body',
          },
          stopPropagation: false,
        })
      },
    })

    await handleInterceptResponse(mw)

    expect(mw.res.bodyModified).toBe(true)
  })

  it('does not set bodyModified when a response handler leaves the body unchanged', async () => {
    const { mw, netStubbingState } = createContext({
      resolveBeforeResponse: (eventId, data) => {
        netStubbingState.pendingEventHandlers[eventId]({
          changedData: {
            ...data,
            body: originalBody,
          },
          stopPropagation: false,
        })
      },
    })

    await handleInterceptResponse(mw)

    expect(mw.res.bodyModified).toBeUndefined()
  })
})
