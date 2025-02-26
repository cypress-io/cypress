import EventEmitter from 'node:events'
import { BidiAutomation } from '../../../lib/browsers/bidi_automation'

import type { Client as WebDriverClient } from 'webdriver'
import type { NetworkBeforeRequestSentParametersModified } from '../../../lib/browsers/bidi_automation'
import type { Automation } from '../../../lib/automation'
import type { NetworkFetchErrorParameters, NetworkResponseCompletedParameters, NetworkResponseStartedParameters } from 'webdriver/build/bidi/localTypes'

// make sure testing promises resolve before asserting on async function conditions
const flushPromises = () => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve()
    }, 10)
  })
}

describe('lib/browsers/bidi_automation', () => {
  context('BidiAutomation', () => {
    let mockWebdriverClient: WebDriverClient
    let mockAutomationClient: Automation

    beforeEach(() => {
      mockWebdriverClient = new EventEmitter() as WebDriverClient
      mockAutomationClient = {
        onRequestEvent: sinon.stub(),
        onBrowserPreRequest: sinon.stub().resolves(),
        onRemoveBrowserPreRequest: sinon.stub().resolves(),
      } as unknown as Automation
    })

    it('binds BIDI_EVENTS when a new instance is created', () => {
      mockWebdriverClient.on = sinon.stub()

      BidiAutomation.create(mockWebdriverClient, mockAutomationClient)

      expect(mockWebdriverClient.on).to.have.been.calledWith('network.beforeRequestSent')
      expect(mockWebdriverClient.on).to.have.been.calledWith('network.responseStarted')
      expect(mockWebdriverClient.on).to.have.been.calledWith('network.responseCompleted')
      expect(mockWebdriverClient.on).to.have.been.calledWith('network.fetchError')
      expect(mockWebdriverClient.on).to.have.been.calledWith('browsingContext.contextCreated')
      expect(mockWebdriverClient.on).to.have.been.calledWith('browsingContext.contextDestroyed')
    })

    it('unbinds BIDI_EVENTS when close() is called', () => {
      mockWebdriverClient.off = sinon.stub()

      const bidiAutomationInstance = BidiAutomation.create(mockWebdriverClient, mockAutomationClient)

      bidiAutomationInstance.close()

      expect(mockWebdriverClient.off).to.have.been.calledWith('network.beforeRequestSent')
      expect(mockWebdriverClient.off).to.have.been.calledWith('network.responseStarted')
      expect(mockWebdriverClient.off).to.have.been.calledWith('network.responseCompleted')
      expect(mockWebdriverClient.off).to.have.been.calledWith('network.fetchError')
      expect(mockWebdriverClient.off).to.have.been.calledWith('browsingContext.contextCreated')
      expect(mockWebdriverClient.off).to.have.been.calledWith('browsingContext.contextDestroyed')
    })

    describe('BrowsingContext', () => {
      describe('contextCreated / contextDestroyed', () => {
        beforeEach(() => {
          mockWebdriverClient.networkAddIntercept = sinon.stub().resolves({ intercept: 'mockInterceptId' })
          mockWebdriverClient.networkRemoveIntercept = sinon.stub().resolves()
        })

        it('does nothing if parent context is not initially assigned', async () => {
          const bidiAutomationInstance = BidiAutomation.create(mockWebdriverClient, mockAutomationClient)

          mockWebdriverClient.emit('browsingContext.contextCreated', {
            parent: '123',
            context: '456',
            url: 'www.foobar.com',
            userContext: '',
            children: [],
          })

          await flushPromises()

          // @ts-expect-error
          expect(bidiAutomationInstance.autContextId).to.be.undefined
          // @ts-expect-error
          expect(bidiAutomationInstance.interceptId).to.be.undefined
          expect(mockWebdriverClient.networkAddIntercept).not.to.have.been.called

          mockWebdriverClient.emit('browsingContext.contextDestroyed', {
            parent: '123',
            context: '456',
            url: 'www.foobar.com',
            userContext: '',
            children: [],
          })

          await flushPromises()

          expect(mockWebdriverClient.networkRemoveIntercept).not.to.have.been.called
        })

        describe('correctly sets the AUT frame and intercepts requests from the frame when the top frame is set.', () => {
          it('Additionally, tears down the AUT when the contexts are destroyed', async () => {
            const bidiAutomationInstance = BidiAutomation.create(mockWebdriverClient, mockAutomationClient)

            // manually set the top level context which happens outside the scope of the bidi_automation class
            bidiAutomationInstance.setTopLevelContextId('123')

            // mock the creation of the AUT context
            mockWebdriverClient.emit('browsingContext.contextCreated', {
              parent: '123',
              context: '456',
              url: 'www.foobar.com',
              userContext: '',
              children: [],
            })

            await flushPromises()

            // @ts-expect-error
            expect(bidiAutomationInstance.autContextId).to.equal('456')
            // @ts-expect-error
            expect(bidiAutomationInstance.interceptId).to.equal('mockInterceptId')
            expect(mockWebdriverClient.networkAddIntercept).to.have.been.calledWith({ phases: ['beforeRequestSent'], contexts: ['123'] })

            // mock the destruction of the AUT context
            mockWebdriverClient.emit('browsingContext.contextDestroyed', {
              parent: '123',
              context: '456',
              url: 'www.foobar.com',
              userContext: '',
              children: [],
            })

            await flushPromises()

            // @ts-expect-error
            expect(bidiAutomationInstance.autContextId).to.equal(undefined)

            expect(mockWebdriverClient.networkRemoveIntercept).not.to.have.been.called
            // @ts-expect-error
            expect(bidiAutomationInstance.topLevelContextId).to.equal('123')
          })

          it('Additionally, tears down top frame when the contexts are destroyed', async () => {
            const bidiAutomationInstance = BidiAutomation.create(mockWebdriverClient, mockAutomationClient)

            // manually set the top level context which happens outside the scope of the bidi_automation class
            bidiAutomationInstance.setTopLevelContextId('123')

            // mock the creation of the AUT context
            mockWebdriverClient.emit('browsingContext.contextCreated', {
              parent: '123',
              context: '456',
              url: 'www.foobar.com',
              userContext: '',
              children: [],
            })

            await flushPromises()

            // @ts-expect-error
            expect(bidiAutomationInstance.autContextId).to.equal('456')
            // @ts-expect-error
            expect(bidiAutomationInstance.interceptId).to.equal('mockInterceptId')
            expect(mockWebdriverClient.networkAddIntercept).to.have.been.calledWith({ phases: ['beforeRequestSent'], contexts: ['123'] })

            // Then, mock the destruction of the tab
            mockWebdriverClient.emit('browsingContext.contextDestroyed', {
              parent: null,
              context: '123',
              url: 'www.foobar.com',
              userContext: '',
              children: ['456'],
            })

            await flushPromises()

            expect(mockWebdriverClient.networkRemoveIntercept).to.have.been.calledWith({
              intercept: 'mockInterceptId',
            })

            // @ts-expect-error
            expect(bidiAutomationInstance.topLevelContextId).to.be.undefined
            // @ts-expect-error
            expect(bidiAutomationInstance.interceptId).to.be.undefined
            // @ts-expect-error
            expect(bidiAutomationInstance.autContextId).to.equal(undefined)
          })
        })
      })
    })

    describe('Network', () => {
      describe('beforeRequestSent', () => {
        let mockRequest: NetworkBeforeRequestSentParametersModified

        beforeEach(() => {
          mockWebdriverClient.networkAddIntercept = sinon.stub().resolves({ intercept: 'mockInterceptId' })
          mockWebdriverClient.networkContinueRequest = sinon.stub().resolves()

          mockRequest = {
            context: '123',
            isBlocked: true,
            navigation: 'foo',
            redirectCount: 0,
            request: {
              request: 'request1',
              url: 'https://www.foobar.com',
              method: 'GET',
              headers: [
                {
                  name: 'foo',
                  value: {
                    type: 'string',
                    value: 'bar',
                  },
                },
              ],
              cookies: [
                {
                  name: 'baz',
                  value: {
                    type: 'string',
                    value: 'bar',
                  },
                  domain: '.foobar.com',
                  path: '/',
                  size: 3,
                  httpOnly: true,
                  secure: true,
                  sameSite: 'lax',
                  expiry: 12345,
                },
              ],
              headersSize: 5,
              bodySize: 10,
              timings: null,
              destination: 'script',
              initiatorType: 'xmlhttprequest',
            },
            timestamp: 1234567,
            intercepts: ['mockIntercept'],
            initiator: {
              type: 'preflight',
            },
          }
        })

        it('correctly pauses the AUT frame to add the X-Cypress-Is-AUT-Frame header (which is later stripped out in the middleware)', async () => {
          const bidiAutomationInstance = BidiAutomation.create(mockWebdriverClient, mockAutomationClient)

          // manually set the top level context which happens outside the scope of the bidi_automation class
          bidiAutomationInstance.setTopLevelContextId('123')

          // mock the creation of the AUT context
          mockWebdriverClient.emit('browsingContext.contextCreated', {
            parent: '123',
            context: '456',
            url: 'www.foobar.com',
            userContext: '',
            children: [],
          })

          await flushPromises()

          mockRequest.request.headers = []
          mockRequest.request.cookies = []
          mockRequest.context = '456'
          mockRequest.request.destination = 'iframe'
          mockRequest.request.initiatorType = 'iframe'
          mockRequest.initiator.type = 'other'

          mockWebdriverClient.emit('network.beforeRequestSent', mockRequest)

          await flushPromises()

          expect(mockAutomationClient.onBrowserPreRequest).to.have.been.calledWith({
            requestId: 'request1',
            method: 'GET',
            url: 'https://www.foobar.com',
            resourceType: 'document',
            originalResourceType: 'iframe',
            initiator: {
              type: 'other',
            },
            headers: {},
            cdpRequestWillBeSentTimestamp: -1,
            cdpRequestWillBeSentReceivedTimestamp: -1,
          })

          expect(mockWebdriverClient.networkContinueRequest).to.have.been.calledWith({
            request: 'request1',
            headers: [
              {
                name: 'X-Cypress-Is-WebDriver-BiDi',
                value: {
                  type: 'string',
                  value: 'true',
                },
              },
              {
                name: 'X-Cypress-Is-AUT-Frame',
                value: {
                  type: 'string',
                  value: 'true',
                },
              },
            ],
            cookies: [],
          })
        })

        it('correctly calculates the browser pre-request for the middleware', async () => {
          BidiAutomation.create(mockWebdriverClient, mockAutomationClient)

          mockWebdriverClient.emit('network.beforeRequestSent', mockRequest)

          await flushPromises()

          expect(mockAutomationClient.onBrowserPreRequest).to.have.been.calledWith({
            requestId: 'request1',
            method: 'GET',
            url: 'https://www.foobar.com',
            resourceType: 'xhr',
            originalResourceType: 'xmlhttprequest',
            initiator: {
              type: 'preflight',
            },
            headers: {
              foo: 'bar',
            },
            cdpRequestWillBeSentTimestamp: -1,
            cdpRequestWillBeSentReceivedTimestamp: -1,
          })

          expect(mockWebdriverClient.networkContinueRequest).to.have.been.calledWith({
            request: 'request1',
            headers: [
              {
                name: 'foo',
                value: {
                  type: 'string',
                  value: 'bar',
                },
              },
              {
                name: 'X-Cypress-Is-WebDriver-BiDi',
                value: {
                  type: 'string',
                  value: 'true',
                },
              },
            ],
            cookies: [
              {
                name: 'baz',
                value: {
                  type: 'string',
                  value: 'bar',
                },
                domain: '.foobar.com',
                path: '/',
                size: 3,
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                expiry: 12345,
              },
            ],
          })
        })

        it('swallows "no such request" messages if thrown via killing the Cypress app', () => {
          BidiAutomation.create(mockWebdriverClient, mockAutomationClient)

          mockWebdriverClient.networkContinueRequest = sinon.stub().throws('no such request')

          expect(() => {
            mockWebdriverClient.emit('network.beforeRequestSent', mockRequest)
          }).not.to.throw()
        })
      })

      describe('responseStarted / responseCompleted', () => {
        let mockRequest: NetworkResponseStartedParameters & NetworkResponseCompletedParameters

        beforeEach(() => {
          mockRequest = {
            context: '123',
            isBlocked: true,
            navigation: 'foo',
            redirectCount: 0,
            request: {
              request: 'request123',
              url: 'https://www.foobar.com',
              method: 'GET',
              headers: [
                {
                  name: 'foo',
                  value: {
                    type: 'string',
                    value: 'bar',
                  },
                },
              ],
              cookies: [
                {
                  name: 'baz',
                  value: {
                    type: 'string',
                    value: 'bar',
                  },
                  domain: '.foobar.com',
                  path: '/',
                  size: 3,
                  httpOnly: true,
                  secure: true,
                  sameSite: 'lax',
                  expiry: 12345,
                },
              ],
              headersSize: 5,
              bodySize: 10,
              timings: null,
            },
            timestamp: 1234567,
            intercepts: ['mockIntercept'],
            response: {
              url: 'https://www.foobar.com',
              protocol: 'tcp',
              status: 200,
              statusText: 'OK',
              fromCache: true,
              headers: [],
              mimeType: 'application/json',
              bytesReceived: 47,
              headersSize: 6,
              bodySize: 20,
              content: {
                size: 60,
              },
            },
          }
        })

        const CACHE_EVENTS = ['network.responseStarted', 'network.responseCompleted']

        CACHE_EVENTS.forEach((CACHE_EVENT) => {
          it(`removes browser pre-request if served from cache (${CACHE_EVENT})`, async () => {
            BidiAutomation.create(mockWebdriverClient, mockAutomationClient)

            mockWebdriverClient.emit(CACHE_EVENT, mockRequest)

            await flushPromises()

            expect(mockAutomationClient.onRemoveBrowserPreRequest).to.have.been.calledWith('request123')
          })
        })

        it('calls onRequestEvent "response:received" when a response is completed', async () => {
          BidiAutomation.create(mockWebdriverClient, mockAutomationClient)

          mockRequest.response.fromCache = false

          mockWebdriverClient.emit('network.responseCompleted', mockRequest)

          await flushPromises()

          expect(mockAutomationClient.onRequestEvent).to.have.been.calledWith('response:received', {
            requestId: 'request123',
            status: 200,
            headers: {},
          })
        })
      })

      describe('fetchError', () => {
        let mockRequest: NetworkFetchErrorParameters

        beforeEach(() => {
          mockRequest = {
            context: '123',
            isBlocked: true,
            navigation: 'foo',
            redirectCount: 0,
            request: {
              request: 'request123',
              url: 'https://www.foobar.com',
              method: 'GET',
              headers: [
                {
                  name: 'foo',
                  value: {
                    type: 'string',
                    value: 'bar',
                  },
                },
              ],
              cookies: [
                {
                  name: 'baz',
                  value: {
                    type: 'string',
                    value: 'bar',
                  },
                  domain: '.foobar.com',
                  path: '/',
                  size: 3,
                  httpOnly: true,
                  secure: true,
                  sameSite: 'lax',
                  expiry: 12345,
                },
              ],
              headersSize: 5,
              bodySize: 10,
              timings: null,
            },
            timestamp: 1234567,
            intercepts: ['mockIntercept'],
            errorText: 'the request could not be completed!',
          }
        })

        it('calls onRemoveBrowserPreRequest when a request errors', async () => {
          BidiAutomation.create(mockWebdriverClient, mockAutomationClient)

          mockWebdriverClient.emit('network.fetchError', mockRequest)

          await flushPromises()

          expect(mockAutomationClient.onRemoveBrowserPreRequest).to.have.been.calledWith('request123')
        })
      })
    })
  })
})
