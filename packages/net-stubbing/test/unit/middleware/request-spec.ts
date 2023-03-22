import { expect } from 'chai'
import sinon from 'sinon'
import { InterceptRequest } from '../../../lib/server/middleware/request'
import { state as NetStubbingState } from '../../../lib/server/state'

describe('request', () => {
  context('InterceptedRequest', () => {
    // @see https://github.com/cypress-io/cypress/issues/24407
    it('does not set the content-length header if the header was not there to begin with on the original request', async () => {
      const socket = {
        toDriver: sinon.stub(),
      }
      const state = NetStubbingState()

      const beforeRequestData = {
        body: 'stubbed_body',
        proxiedUrl: 'https://foobar.com',
        url: 'https://foobar.com',
      }

      const afterRequestData = {
        ...beforeRequestData,
        body: '',
        headers: {},
      }

      // using a ES6 proxy to intercept the promise assignment on pendingEventHandlers.
      // this way, we can resolve the event immediately
      const pendingEventProxy = new Proxy(state.pendingEventHandlers, {
        get (target, prop, receiver) {
          // @ts-expect-error
          return Reflect.get(...arguments)
        },
        set (obj, prop, value) {
          // @ts-expect-error
          const setProp = Reflect.set(...arguments)

          // invoke the promise function immediately
          if (typeof value === 'function') {
            value({
              changedData: afterRequestData,
              stopPropagation: false,
            })
          }

          return setProp
        },
      })

      state.pendingEventHandlers = pendingEventProxy

      const request = {
        req: {
          ...beforeRequestData,
          headers: {},
          matchingRoutes: [
            {
              id: '1',
              hasInterceptor: true,
              routeMatcher: {},
            },
          ],
          pipe: sinon.stub(),
        },
        res: {
          once: sinon.stub(),
        },
        socket,
        debug: sinon.stub(),
        netStubbingState: state,
        next: sinon.stub(),
        onError: sinon.stub(),
        onResponse: sinon.stub(),
      }

      await InterceptRequest.call(request)
      expect(request.req.headers['content-length']).to.be.undefined
    })
  })
})
