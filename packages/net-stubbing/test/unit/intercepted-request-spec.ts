import chai, { expect } from 'chai'
import _ from 'lodash'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { InterceptedRequest } from '../../lib/server/intercepted-request'
import { state as NetStubbingState } from '../../lib/server/state'

chai.use(sinonChai)

describe('InterceptedRequest', () => {
  context('handleSubscriptions', () => {
    it('handles subscriptions as expected', async () => {
      const socket = {
        toDriver: sinon.stub(),
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

      expect(socket.toDriver).to.be.calledTwice
    })

    it('ignores disabled subscriptions', async () => {
      const socket = {
        toDriver: sinon.stub(),
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

      expect(socket.toDriver).to.be.calledOnce
    })
  })
})
