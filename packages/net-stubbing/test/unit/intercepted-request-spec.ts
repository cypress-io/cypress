import { expect } from 'chai'
import _ from 'lodash'
import sinon from 'sinon'
import { InterceptedRequest } from '../../lib/server/intercepted-request'
import { state as NetStubbingState } from '../../lib/server/state'

describe('InterceptedRequest', () => {
  context('handleSubscriptions', () => {
    it('handles subscriptions as expected', async () => {
      const socket = {
        toDriver: sinon.stub(),
      }
      const state = NetStubbingState()
      const interceptedRequest = new InterceptedRequest({
        // @ts-ignore
        req: {},
        state,
        socket,
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
      })

      interceptedRequest.addSubscription({
        routeId: '1',
        eventName: 'before:response',
        await: true,
      })

      const data = { foo: 'bar' }

      socket.toDriver.callsFake((eventName, subEventName, frame) => {
        expect(eventName).to.eq('net:stubbing:event')
        expect(subEventName).to.eq('before:request')
        expect(frame).to.deep.include({
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
    })
  })
})
