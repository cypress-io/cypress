import { describe, it, expect, vi } from 'vitest'
import { InterceptedRequest } from '../../lib/server/intercepted-request'
import { state as NetStubbingState } from '../../lib/server/state'
import { mergeWithPreservedBuffers } from '../../lib/server/util'

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
        mergeChanges: (before, after) => mergeWithPreservedBuffers(before, after),
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
        mergeChanges: (before, after) => mergeWithPreservedBuffers(before, after),
      })

      expect(socket.toDriver).toHaveBeenCalledOnce()
    })

    it('merges nested objects and preserves arrays in mergeChanges', async () => {
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
          ],
        },
        state,
        socket,
      })

      interceptedRequest.addDefaultSubscriptions()

      const data = {
        headers: {
          'content-type': 'text/html',
          'set-cookie': ['a=1', 'b=2'],
          nested: { deep: 'value', keep: 'this' },
        },
        body: 'original',
      }

      socket.toDriver.mockImplementation((_eventName, _subEventName, frame) => {
        // simulate the driver returning modified data via changedData
        state.pendingEventHandlers[frame.eventId]({
          changedData: {
            headers: {
              'set-cookie': ['c=3'],
              nested: { deep: 'changed', extra: 'new' },
            },
          },
        })
      })

      await interceptedRequest.handleSubscriptions({
        eventName: 'before:request',
        data,
        mergeChanges: (before, after) => mergeWithPreservedBuffers(before, after),
      })

      // arrays are replaced wholesale
      expect(data.headers['set-cookie']).toEqual(['c=3'])
      // nested object is deep-merged: existing key updated, new key added, untouched key preserved
      expect(data.headers.nested).toEqual({ deep: 'changed', keep: 'this', extra: 'new' })
      // top-level header preserved when not in after
      expect(data.headers['content-type']).toEqual('text/html')
      // body unchanged since not in the handler response
      expect(data.body).toEqual('original')
    })
  })
})
