import { describe, it, expect, vi } from 'vitest'
import _ from 'lodash'
import { InterceptedRequest } from '../../lib/server/intercepted-request'
import { state as NetStubbingState } from '../../lib/server/state'

describe('InterceptedRequest', () => {
  describe('handleSubscriptions', () => {
    it('handles subscriptions as expected', async () => {
      const socket = {
        toDriver: vi.fn(),
      }
      const state = NetStubbingState()
      const interceptedRequest = new InterceptedRequest({
        req: {
          matchingRoutes: [
            // @ts-ignore
            {
              id: '1',
              hasInterceptor: true,
              routeMatcher: {},
            },
            // @ts-ignore
            {
              id: '2',
              hasInterceptor: true,
              routeMatcher: {},
            },
          ],
        },
        state,
        socket,
      })

      interceptedRequest.addDefaultSubscriptions()

      interceptedRequest.addSubscription({
        routeId: '1',
        eventName: 'before:response',
        await: true,
      })

      const data = { foo: 'bar' }

      socket.toDriver.mockImplementation((eventName, subEventName, frame) => {
        expect(eventName).toEqual('net:stubbing:event')
        expect(subEventName).toEqual('before:request')
        expect(frame).toMatchObject({
          subscription: {
            eventName: 'before:request',
            await: true,
            routeId: frame.subscription.routeId,
          },
        })

        state.pendingEventHandlers[frame.eventId](frame.data)
      })

      await interceptedRequest.handleSubscriptions({
        eventName: 'before:request',
        data,
        mergeChanges: _.merge,
      })

      expect(socket.toDriver).toHaveBeenCalledTimes(2)
    })

    it('ignores disabled subscriptions', async () => {
      const socket = {
        toDriver: vi.fn(),
      }
      const state = NetStubbingState()
      const interceptedRequest = new InterceptedRequest({
        req: {
          matchingRoutes: [
            // @ts-ignore
            {
              id: '1',
              hasInterceptor: true,
              routeMatcher: {},
              disabled: true,
            },
            // @ts-ignore
            {
              id: '2',
              hasInterceptor: true,
              routeMatcher: {},
            },
          ],
        },
        state,
        socket,
      })

      interceptedRequest.addDefaultSubscriptions()

      const data = { foo: 'bar' }

      socket.toDriver.mockImplementation((eventName, subEventName, frame) => {
        expect(eventName).toEqual('net:stubbing:event')
        expect(subEventName).toEqual('before:request')
        expect(frame).toMatchObject({
          subscription: {
            eventName: 'before:request',
            await: true,
            routeId: frame.subscription.routeId,
          },
        })

        state.pendingEventHandlers[frame.eventId](frame.data)
      })

      await interceptedRequest.handleSubscriptions({
        eventName: 'before:request',
        data,
        mergeChanges: _.merge,
      })

      expect(socket.toDriver).toHaveBeenCalledOnce()
    })
  })
})
