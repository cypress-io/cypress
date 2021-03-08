import { expect } from 'chai'
import _ from 'lodash'
import sinon from 'sinon'
import { InterceptedRequest } from '../../lib/server/intercepted-request'
import { state as NetStubbingState } from '../../lib/server/state'

describe('InterceptedRequest', () => {
  context('handleSubscriptions', () => {
    it.only('handles subscriptions as expected', async () => {
      const socket = {
        toDriver: sinon.stub(),
      }
      const state = NetStubbingState()
      const interceptedRequest = new InterceptedRequest({
        state,
        socket,
        matchingRoutes: [
          {
            handlerId: '1',
            hasInterceptor: true,
          },
          {
            handlerId: '2',
            hasInterceptor: true,
          },
        ],
      })

      interceptedRequest.addSubscription({
        routeHandlerId: '1',
        eventName: 'before:response',
        await: true,
      })

      const data = { foo: 'bar' }

      socket.toDriver.callsFake((eventName, subEventName, frame) => {
        console.log('handled ', eventName)
        expect(eventName).to.eq('net:event')
        expect(subEventName).to.eq('before:request')
        expect(frame).to.deep.include({
          subscription: {
            eventName: 'before:request',
            await: true,
            routeHandlerId: frame.subscription.routeHandlerId,
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
