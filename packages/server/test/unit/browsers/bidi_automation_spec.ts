import EventEmitter from 'node:events'
import type { Client as WebDriverClient } from 'webdriver'
import { expect } from 'chai'
import sinon from 'sinon'
import { toInteger } from 'lodash'
import { BidiAutomation } from '../../../lib/browsers/bidi_automation'
import type { NetworkBeforeRequestSentParametersModified } from '../../../lib/browsers/bidi_automation'
import type { Automation } from '../../../lib/automation'
import type { NetworkFetchErrorParameters, NetworkResponseCompletedParameters, NetworkResponseStartedParameters } from 'webdriver/build/bidi/localTypes'

// make sure testing promises resolve before asserting on async function conditions
const flushPromises = () => {
  return new Promise<void>((resolve) => {
    setTimeout(resolve)
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
        use: sinon.stub(),
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
            cdpRequestWillBeSentTimestamp: 0,
            cdpRequestWillBeSentReceivedTimestamp: 0,
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
            cdpRequestWillBeSentTimestamp: 0,
            cdpRequestWillBeSentReceivedTimestamp: 0,
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

        it('swallows "no such request" messages if thrown via killing the Cypress app and removes the related prerequest', async () => {
          BidiAutomation.create(mockWebdriverClient, mockAutomationClient)

          mockWebdriverClient.networkContinueRequest = sinon.stub().throws('no such request')

          expect(() => {
            mockWebdriverClient.emit('network.beforeRequestSent', mockRequest)
          }).not.to.throw()

          await flushPromises()

          expect(mockAutomationClient.onRemoveBrowserPreRequest).to.have.been.calledWith('request1')
        })

        it('strips hashes out of the url when adding the prerequest', async () => {
          BidiAutomation.create(mockWebdriverClient, mockAutomationClient)

          mockRequest.request.url = 'https://www.foobar.com?foo=bar#hash'

          mockWebdriverClient.emit('network.beforeRequestSent', mockRequest)

          await flushPromises()

          expect(mockAutomationClient.onBrowserPreRequest).to.have.been.calledWith({
            requestId: 'request1',
            method: 'GET',
            url: 'https://www.foobar.com?foo=bar',
            resourceType: 'xhr',
            originalResourceType: 'xmlhttprequest',
            initiator: {
              type: 'preflight',
            },
            headers: {
              foo: 'bar',
            },
            cdpRequestWillBeSentTimestamp: 0,
            cdpRequestWillBeSentReceivedTimestamp: 0,
          })
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

    describe('onRequest', () => {
      let bidiAutomationInstance: BidiAutomation

      beforeEach(() => {
        bidiAutomationInstance = BidiAutomation.create(mockWebdriverClient, mockAutomationClient)
      })

      describe('Cookies', () => {
      // important to note that the filter that gets passed into the onRequest for get:cookies is actually
        // a cookie-like object
        describe('get:cookies', () => {
          describe('returns cookies that match filter via', () => {
            it('data.url / domain', async () => {
              mockWebdriverClient.storageGetCookies = sinon.stub().resolves({
                cookies: [{
                  domain: '.www.foobar.com',
                  expiry: 123456789,
                  httpOnly: false,
                  name: 'key1',
                  path: '/',
                  sameSite: 'lax',
                  secure: false,
                  size: 10,
                  value: {
                    type: 'string',
                    value: 'value1',
                  },
                }, {
                // this cookie should be filtered out
                  domain: '.www.barbaz.com',
                  expiry: 123456789,
                  httpOnly: false,
                  name: 'key2',
                  path: '/',
                  sameSite: 'lax',
                  secure: false,
                  size: 10,
                  value: {
                    type: 'string',
                    value: 'value2',
                  },
                }],
              })

              const cookies = await bidiAutomationInstance.automationMiddleware.onRequest('get:cookies', {
                url: 'http://www.foobar.com:3500/index.html',
              })

              expect(cookies).to.deep.equal([{
                domain: '.www.foobar.com',
                expirationDate: 123456789,
                httpOnly: false,
                hostOnly: false,
                name: 'key1',
                path: '/',
                sameSite: 'lax',
                secure: false,
                value: 'value1',
              }])

              expect(mockWebdriverClient.storageGetCookies).to.have.been.calledWith({ filter: {
                // this would filter out secure cookies and prevent sending them in a secure context
                secure: false,
              } })
            })

            it('data.url / path', async () => {
              mockWebdriverClient.storageGetCookies = sinon.stub().resolves({
                cookies: [{
                  domain: '.www.foobar.com',
                  expiry: 123456789,
                  httpOnly: false,
                  name: 'key1',
                  path: '/',
                  sameSite: 'lax',
                  secure: false,
                  size: 10,
                  value: {
                    type: 'string',
                    value: 'value1',
                  },
                }, {
                  domain: '.app.www.foobar.com',
                  expiry: 123456789,
                  httpOnly: false,
                  name: 'key2',
                  path: '/foo',
                  sameSite: 'lax',
                  secure: false,
                  size: 10,
                  value: {
                    type: 'string',
                    value: 'value2',
                  },
                },
                {
                  domain: '.foobar.com',
                  expiry: 123456789,
                  httpOnly: false,
                  name: 'key3',
                  path: '/foo/bar',
                  sameSite: 'lax',
                  secure: false,
                  size: 10,
                  value: {
                    type: 'string',
                    value: 'value3',
                  },
                },
                {
                  // this cookie should be filtered out
                  domain: 'www.foobar.com',
                  expiry: 123456789,
                  httpOnly: false,
                  name: 'key4',
                  path: '/baz',
                  sameSite: 'lax',
                  secure: false,
                  size: 10,
                  value: {
                    type: 'string',
                    value: 'value4',
                  },
                }],
              })

              const cookies = await bidiAutomationInstance.automationMiddleware.onRequest('get:cookies', {
                url: 'http://app.www.foobar.com:3500/foo/bar/index.html',
              })

              expect(cookies).to.deep.equal([{
                domain: '.www.foobar.com',
                expirationDate: 123456789,
                httpOnly: false,
                hostOnly: false,
                name: 'key1',
                path: '/',
                sameSite: 'lax',
                secure: false,
                value: 'value1',
              }, {
                domain: '.app.www.foobar.com',
                expirationDate: 123456789,
                httpOnly: false,
                hostOnly: false,
                name: 'key2',
                path: '/foo',
                sameSite: 'lax',
                secure: false,
                value: 'value2',
              }, {
                domain: '.foobar.com',
                expirationDate: 123456789,
                httpOnly: false,
                hostOnly: false,
                name: 'key3',
                path: '/foo/bar',
                sameSite: 'lax',
                secure: false,
                value: 'value3',
              }])

              expect(mockWebdriverClient.storageGetCookies).to.have.been.calledWith({ filter: {
                // this would filter out secure cookies and prevent sending them in a secure context
                secure: false,
              } })
            })

            it('cookie name', async () => {
              mockWebdriverClient.storageGetCookies = sinon.stub().resolves({
                cookies: [{
                  domain: '.www.foobar.com',
                  expiry: 123456789,
                  httpOnly: false,
                  name: 'key1',
                  path: '/',
                  sameSite: 'lax',
                  secure: false,
                  size: 10,
                  value: {
                    type: 'string',
                    value: 'value1',
                  },
                }, {
                  domain: '.www.barbaz.com',
                  expiry: 123456789,
                  httpOnly: false,
                  name: 'key1',
                  path: '/',
                  sameSite: 'lax',
                  secure: false,
                  size: 10,
                  value: {
                    type: 'string',
                    value: 'value1',
                  },
                }],
              })

              const cookies = await bidiAutomationInstance.automationMiddleware.onRequest('get:cookies', {
                name: 'key1',
              })

              expect(cookies).to.deep.equal([{
                domain: '.www.foobar.com',
                expirationDate: 123456789,
                httpOnly: false,
                hostOnly: false,
                name: 'key1',
                path: '/',
                sameSite: 'lax',
                secure: false,
                value: 'value1',
              }, {
                domain: '.www.barbaz.com',
                expirationDate: 123456789,
                httpOnly: false,
                hostOnly: false,
                name: 'key1',
                path: '/',
                sameSite: 'lax',
                secure: false,
                value: 'value1',
              }])

              expect(mockWebdriverClient.storageGetCookies).to.have.been.calledWith({
                filter: {
                  name: 'key1',
                },
              })
            })

            it('cookie path', async () => {
              mockWebdriverClient.storageGetCookies = sinon.stub().resolves({
                cookies: [{
                  domain: '.www.foobar.com',
                  expiry: 123456789,
                  httpOnly: false,
                  name: 'key1',
                  path: '/',
                  sameSite: 'lax',
                  secure: false,
                  size: 10,
                  value: {
                    type: 'string',
                    value: 'value1',
                  },
                }, {
                  domain: '.www.barbaz.com',
                  expiry: 123456789,
                  httpOnly: false,
                  name: 'key1',
                  path: '/',
                  sameSite: 'lax',
                  secure: false,
                  size: 10,
                  value: {
                    type: 'string',
                    value: 'value1',
                  },
                }],
              })

              const cookies = await bidiAutomationInstance.automationMiddleware.onRequest('get:cookies', {
                path: '/',
              })

              expect(cookies).to.deep.equal([{
                domain: '.www.foobar.com',
                expirationDate: 123456789,
                httpOnly: false,
                hostOnly: false,
                name: 'key1',
                path: '/',
                sameSite: 'lax',
                secure: false,
                value: 'value1',
              }, {
                domain: '.www.barbaz.com',
                expirationDate: 123456789,
                httpOnly: false,
                hostOnly: false,
                name: 'key1',
                path: '/',
                sameSite: 'lax',
                secure: false,
                value: 'value1',
              }])

              expect(mockWebdriverClient.storageGetCookies).to.have.been.calledWith({ filter: {} })
            })
          })

          describe('domain hierarchy', () => {
            it('returns superdomain related cookies (ex: foobar.com is a super domain of www.foobar.com', async () => {
              mockWebdriverClient.storageGetCookies = sinon.stub().resolves({
                cookies: [{
                  domain: '.www.foobar.com',
                  expiry: 123456789,
                  httpOnly: false,
                  name: 'key1',
                  path: '/',
                  sameSite: 'lax',
                  secure: false,
                  size: 10,
                  value: {
                    type: 'string',
                    value: 'value1',
                  },
                }, {
                  domain: '.foobar.com',
                  expiry: 123456789,
                  httpOnly: false,
                  name: 'key2',
                  path: '/',
                  sameSite: 'lax',
                  secure: false,
                  size: 10,
                  value: {
                    type: 'string',
                    value: 'value2',
                  },
                }],
              })

              const cookies = await bidiAutomationInstance.automationMiddleware.onRequest('get:cookies', {
                url: 'https://www.foobar.com',
              })

              expect(cookies).to.deep.equal([{
                domain: '.www.foobar.com',
                expirationDate: 123456789,
                httpOnly: false,
                hostOnly: false,
                name: 'key1',
                path: '/',
                sameSite: 'lax',
                secure: false,
                value: 'value1',
              }, {
                domain: '.foobar.com',
                expirationDate: 123456789,
                httpOnly: false,
                hostOnly: false,
                name: 'key2',
                path: '/',
                sameSite: 'lax',
                secure: false,
                value: 'value2',
              }])

              expect(mockWebdriverClient.storageGetCookies).to.have.been.calledWith({ filter: {} })
            })

            it('does NOT return subdomain cookies (ex: www.foobar.com is a sub domain of foobar.com', async () => {
              mockWebdriverClient.storageGetCookies = sinon.stub().resolves({
                cookies: [{
                // this cookie should be filtered out
                  domain: '.www.foobar.com',
                  expiry: 123456789,
                  httpOnly: false,
                  name: 'key1',
                  path: '/',
                  sameSite: 'lax',
                  secure: false,
                  size: 10,
                  value: {
                    type: 'string',
                    value: 'value1',
                  },
                }, {
                  domain: '.foobar.com',
                  expiry: 123456789,
                  httpOnly: false,
                  name: 'key2',
                  path: '/',
                  sameSite: 'lax',
                  secure: false,
                  size: 10,
                  value: {
                    type: 'string',
                    value: 'value2',
                  },
                }],
              })

              const cookies = await bidiAutomationInstance.automationMiddleware.onRequest('get:cookies', {
                url: 'https://foobar.com',
              })

              expect(cookies).to.deep.equal([{
                domain: '.foobar.com',
                expirationDate: 123456789,
                httpOnly: false,
                hostOnly: false,
                name: 'key2',
                path: '/',
                sameSite: 'lax',
                secure: false,
                value: 'value2',
              }])

              expect(mockWebdriverClient.storageGetCookies).to.have.been.calledWith({ filter: {} })
            })
          })

          it('returns no cookies if no match on the filter', async () => {
            mockWebdriverClient.storageGetCookies = sinon.stub().resolves({
              cookies: [],
            })

            const cookies = await bidiAutomationInstance.automationMiddleware.onRequest('get:cookies', undefined)

            expect(cookies).to.deep.equal([])
            expect(mockWebdriverClient.storageGetCookies).to.have.been.calledWith({ filter: {} })
          })

          it('returns all cookies if there is no filter', async () => {
            mockWebdriverClient.storageGetCookies = sinon.stub().resolves({
              cookies: [{
                domain: '.www.foobar.com',
                expiry: 123456789,
                httpOnly: false,
                name: 'key1',
                path: '/',
                sameSite: 'lax',
                secure: false,
                size: 10,
                value: {
                  type: 'string',
                  value: 'value1',
                },
              }, {
                domain: '.www.barbaz.com',
                expiry: 123456789,
                httpOnly: false,
                name: 'key2',
                path: '/foo',
                sameSite: 'strict',
                secure: false,
                size: 10,
                value: {
                  type: 'string',
                  value: 'value2',
                },
              }],
            })

            const cookies = await bidiAutomationInstance.automationMiddleware.onRequest('get:cookies', {})

            expect(cookies).to.deep.equal([{
              domain: '.www.foobar.com',
              expirationDate: 123456789,
              httpOnly: false,
              hostOnly: false,
              name: 'key1',
              path: '/',
              sameSite: 'lax',
              secure: false,
              value: 'value1',
            }, {
              domain: '.www.barbaz.com',
              expirationDate: 123456789,
              httpOnly: false,
              hostOnly: false,
              name: 'key2',
              path: '/foo',
              sameSite: 'strict',
              secure: false,
              value: 'value2',
            }])

            expect(mockWebdriverClient.storageGetCookies).to.have.been.calledWith({ filter: {} })
          })

          // TODO: do we try/catch this and return an empty array and log the error?
          it('Throws error if for some reason fetching cookies fails', async () => {
            const mockError = new Error('fetching cookies failed!')

            mockWebdriverClient.storageGetCookies = sinon.stub().rejects(mockError)

            expect(bidiAutomationInstance.automationMiddleware.onRequest('get:cookies', {})).to.be.rejectedWith(mockError)
          })
        })

        describe('get:cookie', () => {
          describe('returns cookies that match filter via', () => {
            it('cookie name', async () => {
              mockWebdriverClient.storageGetCookies = sinon.stub().resolves({
                cookies: [{
                  domain: '.www.foobar.com',
                  expiry: 123456789,
                  httpOnly: false,
                  name: 'key1',
                  path: '/',
                  sameSite: 'lax',
                  secure: false,
                  size: 10,
                  value: {
                    type: 'string',
                    value: 'value1',
                  },
                }],
              })

              const cookie = await bidiAutomationInstance.automationMiddleware.onRequest('get:cookie', {
                name: 'key1',
              })

              expect(cookie).to.deep.equal({
                domain: '.www.foobar.com',
                expirationDate: 123456789,
                httpOnly: false,
                hostOnly: false,
                name: 'key1',
                path: '/',
                sameSite: 'lax',
                secure: false,
                value: 'value1',
              })

              expect(mockWebdriverClient.storageGetCookies).to.have.been.calledWith({
                filter: {
                  name: 'key1',
                },
              })
            })

            it('cookie path', async () => {
              mockWebdriverClient.storageGetCookies = sinon.stub().resolves({
                cookies: [{
                  domain: '.www.foobar.com',
                  expiry: 123456789,
                  httpOnly: false,
                  name: 'key1',
                  path: '/foobar',
                  sameSite: 'lax',
                  secure: false,
                  size: 10,
                  value: {
                    type: 'string',
                    value: 'value1',
                  },
                }],
              })

              const cookie = await bidiAutomationInstance.automationMiddleware.onRequest('get:cookie', {
                path: '/foobar',
              })

              expect(cookie).to.deep.equal({
                domain: '.www.foobar.com',
                expirationDate: 123456789,
                httpOnly: false,
                hostOnly: false,
                name: 'key1',
                path: '/foobar',
                sameSite: 'lax',
                secure: false,
                value: 'value1',
              })

              expect(mockWebdriverClient.storageGetCookies).to.have.been.calledWith({ filter: {} })
            })
          })

          it('returns the first matching cookie', async () => {
            mockWebdriverClient.storageGetCookies = sinon.stub().resolves({
              cookies: [{
                domain: '.www.foobar.com',
                expiry: 123456789,
                httpOnly: false,
                name: 'key1',
                path: '/foobar',
                sameSite: 'lax',
                secure: false,
                size: 10,
                value: {
                  type: 'string',
                  value: 'value1',
                },
              }, {
                domain: '.www.foobar.com',
                expiry: 123456789,
                httpOnly: false,
                name: 'key2',
                path: '/foobar',
                sameSite: 'strict',
                secure: false,
                size: 10,
                value: {
                  type: 'string',
                  value: 'value2',
                },
              }],
            })

            const cookie = await bidiAutomationInstance.automationMiddleware.onRequest('get:cookie', {
              path: '/foobar',
            })

            expect(cookie).to.deep.equal({
              domain: '.www.foobar.com',
              expirationDate: 123456789,
              httpOnly: false,
              hostOnly: false,
              name: 'key1',
              path: '/foobar',
              sameSite: 'lax',
              secure: false,
              value: 'value1',
            })

            expect(mockWebdriverClient.storageGetCookies).to.have.been.calledWith({ filter: {} })
          })

          it('returns null if no cookie is found', async () => {
            mockWebdriverClient.storageGetCookies = sinon.stub().resolves({
              cookies: [],
            })

            const cookies = await bidiAutomationInstance.automationMiddleware.onRequest('get:cookie', {})

            expect(cookies).to.equal(null)

            expect(mockWebdriverClient.storageGetCookies).to.have.been.calledWith({ filter: {} })
          })

          // TODO: do we try/catch this and return an empty array and log the error?
          it('Throws error if for some reason fetching cookies fails', async () => {
            const mockError = new Error('fetching cookies failed!')

            mockWebdriverClient.storageGetCookies = sinon.stub().rejects(mockError)

            expect(bidiAutomationInstance.automationMiddleware.onRequest('get:cookie', {})).to.be.rejectedWith(mockError)
          })
        })

        describe('set:cookie', () => {
          it('sets a single cookie', async () => {
            const cyCookie = {
              name: 'testCookie',
              value: 'testValue',
              domain: '.foobar.com',
              path: '/',
              secure: true,
              httpOnly: true,
              sameSite: 'lax',
              expirationDate: 1234567890.123,
            }

            mockWebdriverClient.storageSetCookie = sinon.stub().resolves()

            mockWebdriverClient.storageGetCookies = sinon.stub().resolves({
              cookies: [{
                domain: '.foobar.com',
                expiry: 1234567890,
                httpOnly: true,
                name: 'testCookie',
                path: '/',
                sameSite: 'lax',
                secure: true,
                size: 10,
                value: {
                  type: 'string',
                  value: 'testValue',
                },
              }],
            })

            const cookie = await bidiAutomationInstance.automationMiddleware.onRequest('set:cookie', cyCookie)

            expect(mockWebdriverClient.storageSetCookie).to.have.been.calledWith({
              cookie: {
                name: 'testCookie',
                value: { type: 'string', value: 'testValue' },
                domain: '.foobar.com',
                path: '/',
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                expiry: 1234567890,
              },
            })

            expect(cookie).to.deep.equal({
              name: 'testCookie',
              value: 'testValue',
              domain: '.foobar.com',
              path: '/',
              secure: true,
              httpOnly: true,
              hostOnly: false,
              sameSite: 'lax',
              expirationDate: 1234567890,
            })
          })

          it('throws an error if setting a cookie fails', async () => {
            const cookie = {
              name: 'testCookie',
              value: 'testValue',
              domain: '.foobar.com',
              path: '/',
              secure: true,
              httpOnly: true,
              sameSite: 'lax',
              expirationDate: 1234567890,
            }

            const mockError = new Error('setting cookie failed!')

            mockWebdriverClient.storageSetCookie = sinon.stub().rejects(mockError)

            expect(bidiAutomationInstance.automationMiddleware.onRequest('set:cookie', cookie)).to.be.rejectedWith(mockError)
          })

          describe('parsing', () => {
            // NOTE: unique to Firefox. Chromium defaults to 'lax'
            it('defaults sameSite to "none"', async () => {
              const cyCookie = {
                name: 'testCookie',
                value: 'testValue',
                domain: '.foobar.com',
                path: '/',
                secure: true,
                httpOnly: true,
              }

              mockWebdriverClient.storageSetCookie = sinon.stub().resolves()

              mockWebdriverClient.storageGetCookies = sinon.stub().resolves({
                cookies: [{
                  domain: '.foobar.com',
                  httpOnly: true,
                  expiry: undefined,
                  name: 'testCookie',
                  path: '/',
                  sameSite: 'none',
                  secure: true,
                  size: 10,
                  value: {
                    type: 'string',
                    value: 'testValue',
                  },
                }],
              })

              const cookie = await bidiAutomationInstance.automationMiddleware.onRequest('set:cookie', cyCookie)

              expect(mockWebdriverClient.storageSetCookie).to.have.been.calledWith({
                cookie: {
                  name: 'testCookie',
                  value: { type: 'string', value: 'testValue' },
                  domain: '.foobar.com',
                  path: '/',
                  httpOnly: true,
                  secure: true,
                  sameSite: 'none',
                  expiry: undefined,
                },
              })

              expect(cookie).to.deep.equal({
                name: 'testCookie',
                value: 'testValue',
                domain: '.foobar.com',
                path: '/',
                secure: true,
                httpOnly: true,
                hostOnly: false,
                sameSite: 'no_restriction',
                expirationDate: undefined,
              })
            })

            it('parses a -Infinity expiry as 0', async () => {
              const cyCookie = {
                name: 'testCookie',
                value: 'testValue',
                domain: '.foobar.com',
                path: '/',
                secure: true,
                sameSite: 'strict',
                httpOnly: true,
                expirationDate: -Infinity,
              }

              mockWebdriverClient.storageSetCookie = sinon.stub().resolves()

              mockWebdriverClient.storageGetCookies = sinon.stub().resolves({
                cookies: [{
                  domain: '.foobar.com',
                  httpOnly: true,
                  expiry: 0,
                  name: 'testCookie',
                  path: '/',
                  sameSite: 'strict',
                  secure: true,
                  size: 10,
                  value: {
                    type: 'string',
                    value: 'testValue',
                  },
                }],
              })

              const cookie = await bidiAutomationInstance.automationMiddleware.onRequest('set:cookie', cyCookie)

              expect(mockWebdriverClient.storageSetCookie).to.have.been.calledWith({
                cookie: {
                  name: 'testCookie',
                  value: { type: 'string', value: 'testValue' },
                  domain: '.foobar.com',
                  path: '/',
                  httpOnly: true,
                  secure: true,
                  sameSite: 'strict',
                  expiry: 0,
                },
              })

              expect(cookie).to.deep.equal({
                name: 'testCookie',
                value: 'testValue',
                domain: '.foobar.com',
                path: '/',
                secure: true,
                httpOnly: true,
                hostOnly: false,
                sameSite: 'strict',
                expirationDate: 0,
              })
            })

            it('parses a float expiry to an integer', async () => {
              const cyCookie = {
                name: 'testCookie',
                value: 'testValue',
                domain: '.foobar.com',
                path: '/',
                secure: true,
                sameSite: 'strict',
                httpOnly: true,
                expirationDate: 12345.67894,
              }

              mockWebdriverClient.storageSetCookie = sinon.stub().resolves()

              mockWebdriverClient.storageGetCookies = sinon.stub().resolves({
                cookies: [{
                  domain: '.foobar.com',
                  httpOnly: true,
                  expiry: 12345,
                  name: 'testCookie',
                  path: '/',
                  sameSite: 'strict',
                  secure: true,
                  size: 10,
                  value: {
                    type: 'string',
                    value: 'testValue',
                  },
                }],
              })

              const cookie = await bidiAutomationInstance.automationMiddleware.onRequest('set:cookie', cyCookie)

              expect(mockWebdriverClient.storageSetCookie).to.have.been.calledWith({
                cookie: {
                  name: 'testCookie',
                  value: { type: 'string', value: 'testValue' },
                  domain: '.foobar.com',
                  path: '/',
                  httpOnly: true,
                  secure: true,
                  sameSite: 'strict',
                  expiry: 12345,
                },
              })

              expect(cookie).to.deep.equal({
                name: 'testCookie',
                value: 'testValue',
                domain: '.foobar.com',
                path: '/',
                secure: true,
                httpOnly: true,
                hostOnly: false,
                sameSite: 'strict',
                expirationDate: 12345,
              })
            })

            it('parses an Infinity expiry as undefined', async () => {
              const cyCookie = {
                name: 'testCookie',
                value: 'testValue',
                domain: '.foobar.com',
                path: '/',
                secure: true,
                sameSite: 'strict',
                httpOnly: true,
                expirationDate: Infinity,
              }

              mockWebdriverClient.storageSetCookie = sinon.stub().resolves()

              mockWebdriverClient.storageGetCookies = sinon.stub().resolves({
                cookies: [{
                  domain: '.foobar.com',
                  httpOnly: true,
                  expiry: toInteger(Infinity),
                  name: 'testCookie',
                  path: '/',
                  sameSite: 'strict',
                  secure: true,
                  size: 10,
                  value: {
                    type: 'string',
                    value: 'testValue',
                  },
                }],
              })

              const cookie = await bidiAutomationInstance.automationMiddleware.onRequest('set:cookie', cyCookie)

              expect(mockWebdriverClient.storageSetCookie).to.have.been.calledWith({
                cookie: {
                  name: 'testCookie',
                  value: { type: 'string', value: 'testValue' },
                  domain: '.foobar.com',
                  path: '/',
                  httpOnly: true,
                  secure: true,
                  sameSite: 'strict',
                  expiry: toInteger(Infinity),
                },
              })

              expect(cookie).to.deep.equal({
                name: 'testCookie',
                value: 'testValue',
                domain: '.foobar.com',
                path: '/',
                secure: true,
                httpOnly: true,
                hostOnly: false,
                sameSite: 'strict',
                expirationDate: toInteger(Infinity),
              })
            })

            it('parses other expiry as undefined', async () => {
              const cyCookie = {
                name: 'testCookie',
                value: 'testValue',
                domain: '.foobar.com',
                path: '/',
                secure: true,
                sameSite: 'strict',
                httpOnly: true,
                expirationDate: null,
              }

              mockWebdriverClient.storageSetCookie = sinon.stub().resolves()

              mockWebdriverClient.storageGetCookies = sinon.stub().resolves({
                cookies: [{
                  domain: '.foobar.com',
                  httpOnly: true,
                  expiry: undefined,
                  name: 'testCookie',
                  path: '/',
                  sameSite: 'strict',
                  secure: true,
                  size: 10,
                  value: {
                    type: 'string',
                    value: 'testValue',
                  },
                }],
              })

              const cookie = await bidiAutomationInstance.automationMiddleware.onRequest('set:cookie', cyCookie)

              expect(mockWebdriverClient.storageSetCookie).to.have.been.calledWith({
                cookie: {
                  name: 'testCookie',
                  value: { type: 'string', value: 'testValue' },
                  domain: '.foobar.com',
                  path: '/',
                  httpOnly: true,
                  secure: true,
                  sameSite: 'strict',
                  expiry: undefined,
                },
              })

              expect(cookie).to.deep.equal({
                name: 'testCookie',
                value: 'testValue',
                domain: '.foobar.com',
                path: '/',
                secure: true,
                httpOnly: true,
                hostOnly: false,
                sameSite: 'strict',
                expirationDate: undefined,
              })
            })

            it('sets a single cookie', async () => {
              const cyCookie = {
                name: 'testCookie',
                value: 'testValue',
                domain: '.foobar.com',
                path: '/',
                secure: true,
                httpOnly: true,
                sameSite: 'lax',
                expirationDate: 1234567890.123,
              }

              mockWebdriverClient.storageSetCookie = sinon.stub().resolves()

              mockWebdriverClient.storageGetCookies = sinon.stub().resolves({
                cookies: [{
                  domain: '.foobar.com',
                  expiry: 1234567890,
                  httpOnly: true,
                  name: 'testCookie',
                  path: '/',
                  sameSite: 'lax',
                  secure: true,
                  size: 10,
                  value: {
                    type: 'string',
                    value: 'testValue',
                  },
                }],
              })

              const cookie = await bidiAutomationInstance.automationMiddleware.onRequest('set:cookie', cyCookie)

              expect(mockWebdriverClient.storageSetCookie).to.have.been.calledWith({
                cookie: {
                  name: 'testCookie',
                  value: { type: 'string', value: 'testValue' },
                  domain: '.foobar.com',
                  path: '/',
                  httpOnly: true,
                  secure: true,
                  sameSite: 'lax',
                  expiry: 1234567890,
                },
              })

              expect(cookie).to.deep.equal({
                name: 'testCookie',
                value: 'testValue',
                domain: '.foobar.com',
                path: '/',
                secure: true,
                httpOnly: true,
                hostOnly: false,
                sameSite: 'lax',
                expirationDate: 1234567890,
              })
            })
          })
        })

        describe('add:cookies', () => {
          it('adds multiple cookies', async () => {
            const cookies = [
              {
                name: 'testCookie1',
                value: 'testValue1',
                domain: '.foobar.com',
                path: '/',
                secure: true,
                httpOnly: true,
                sameSite: 'lax',
                expirationDate: 1234567890,
              },
              {
                name: 'testCookie2',
                value: 'testValue2',
                domain: '.foobar.com',
                path: '/',
                secure: true,
                httpOnly: true,
                sameSite: 'strict',
                expirationDate: 1234567891,
              },
            ]

            mockWebdriverClient.storageSetCookie = sinon.stub().resolves()

            const returnValue = await bidiAutomationInstance.automationMiddleware.onRequest('add:cookies', cookies)

            expect(returnValue).to.be.undefined

            expect(mockWebdriverClient.storageSetCookie).to.have.been.calledWith({
              cookie: {
                name: 'testCookie1',
                value: { type: 'string', value: 'testValue1' },
                domain: '.foobar.com',
                path: '/',
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                expiry: 1234567890,
              },
            })

            expect(mockWebdriverClient.storageSetCookie).to.have.been.calledWith({
              cookie: {
                name: 'testCookie2',
                value: { type: 'string', value: 'testValue2' },
                domain: '.foobar.com',
                path: '/',
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                expiry: 1234567891,
              },
            })
          })

          it('throws an error if setting any cookie fails', async () => {
            const cookies = [
              {
                name: 'testCookie1',
                value: 'testValue1',
                domain: '.foobar.com',
                path: '/',
                secure: true,
                httpOnly: true,
                sameSite: 'lax',
                expirationDate: 1234567890,
              },
              {
                name: 'testCookie2',
                value: 'testValue2',
                domain: '.foobar.com',
                path: '/',
                secure: true,
                httpOnly: true,
                sameSite: 'strict',
                expirationDate: 1234567891,
              },
            ]

            const mockError = new Error('adding cookies failed!')

            mockWebdriverClient.storageSetCookie = sinon.stub().rejects(mockError)

            expect(bidiAutomationInstance.automationMiddleware.onRequest('add:cookies', cookies)).to.be.rejectedWith(mockError)
          })
        })

        describe('set:cookies', () => {
          it('sets multiple cookies', async () => {
            const cookies = [
              {
                name: 'testCookie1',
                value: 'testValue1',
                domain: '.foobar.com',
                path: '/',
                secure: true,
                httpOnly: true,
                sameSite: 'lax',
                expirationDate: 1234567890,
              },
              {
                name: 'testCookie2',
                value: 'testValue2',
                domain: '.foobar.com',
                path: '/',
                secure: true,
                httpOnly: true,
                sameSite: 'strict',
                expirationDate: 1234567891,
              },
            ]

            mockWebdriverClient.storageDeleteCookies = sinon.stub().resolves()

            mockWebdriverClient.storageSetCookie = sinon.stub().resolves()

            const returnValue = await bidiAutomationInstance.automationMiddleware.onRequest('set:cookies', cookies)

            expect(returnValue).to.be.undefined

            expect(mockWebdriverClient.storageSetCookie).to.have.been.calledWith({
              cookie: {
                name: 'testCookie1',
                value: { type: 'string', value: 'testValue1' },
                domain: '.foobar.com',
                path: '/',
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                expiry: 1234567890,
              },
            })

            expect(mockWebdriverClient.storageSetCookie).to.have.been.calledWith({
              cookie: {
                name: 'testCookie2',
                value: { type: 'string', value: 'testValue2' },
                domain: '.foobar.com',
                path: '/',
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                expiry: 1234567891,
              },
            })

            // deletes all cookies before adding new ones, which is the main difference between set:cookies and add:cookies
            expect(mockWebdriverClient.storageDeleteCookies).to.have.been.calledWith({})
          })

          it('throws an error if setting any cookie fails', async () => {
            const cookies = [
              {
                name: 'testCookie1',
                value: 'testValue1',
                domain: '.foobar.com',
                path: '/',
                secure: true,
                httpOnly: true,
                sameSite: 'lax',
                expirationDate: 1234567890,
              },
              {
                name: 'testCookie2',
                value: 'testValue2',
                domain: '.foobar.com',
                path: '/',
                secure: true,
                httpOnly: true,
                sameSite: 'strict',
                expirationDate: 1234567891,
              },
            ]

            const mockError = new Error('setting cookie failed!')

            mockWebdriverClient.storageDeleteCookies = sinon.stub().resolves()

            mockWebdriverClient.storageSetCookie = sinon.stub().rejects(mockError)

            expect(bidiAutomationInstance.automationMiddleware.onRequest('set:cookies', cookies)).to.be.rejectedWith(mockError)

            expect(mockWebdriverClient.storageDeleteCookies).to.have.been.calledWith({})
          })
        })

        describe('clear:cookie', () => {
          it('clears a single cookie and returns it\s value', async () => {
            const cookieToClear = {
              name: 'testCookie',
              value: 'testValue',
              domain: '.foobar.com',
              path: '/',
              httpOnly: false,
              secure: false,
              sameSite: 'no_restriction',
            }

            mockWebdriverClient.storageGetCookies = sinon.stub().resolves({
              cookies: [{
                name: 'testCookie',
                value: {
                  type: 'string',
                  value: 'testValue',
                },
                expiry: 1234567890,
                domain: '.foobar.com',
                path: '/',
                httpOnly: false,
                secure: false,
                sameSite: 'none',
              }],
            })

            mockWebdriverClient.storageDeleteCookies = sinon.stub().resolves()

            const clearedCookie = await bidiAutomationInstance.automationMiddleware.onRequest('clear:cookie', cookieToClear)

            expect(mockWebdriverClient.storageDeleteCookies).to.have.been.calledWith({
              filter: {
                name: 'testCookie',
                value: {
                  type: 'string',
                  value: 'testValue',
                },
                domain: '.foobar.com',
                path: '/',
                httpOnly: false,
                secure: false,
                sameSite: 'none',
              },
            })

            expect(clearedCookie).to.deep.equal({
              name: 'testCookie',
              value: 'testValue',
              domain: '.foobar.com',
              expirationDate: 1234567890,
              path: '/',
              httpOnly: false,
              hostOnly: false,
              secure: false,
              sameSite: 'no_restriction',
            })
          })

          it('returns undefined if the cookie does not exist', async () => {
            const cookie = {
              name: 'testCookie',
              value: 'testValue',
              domain: '.foobar.com',
              path: '/',
              httpOnly: false,
              secure: false,
              sameSite: 'no_restriction',
            }

            mockWebdriverClient.storageGetCookies = sinon.stub().resolves({
              cookies: [],
            })

            const result = await bidiAutomationInstance.automationMiddleware.onRequest('clear:cookie', cookie)

            expect(result).to.be.undefined
          })

          it('throws an error if clearing a cookie fails', async () => {
            const cookie = {
              name: 'testCookie',
              value: 'testValue',
              domain: '.foobar.com',
              path: '/',
              httpOnly: false,
              secure: false,
              sameSite: 'no_restriction',
            }

            const mockError = new Error('clearing cookie failed!')

            mockWebdriverClient.storageGetCookies = sinon.stub().rejects(mockError)

            expect(bidiAutomationInstance.automationMiddleware.onRequest('clear:cookie', cookie)).to.be.rejectedWith(mockError)
          })
        })

        describe('clear:cookies', () => {
          it('clears a single cookie and returns it\s value', async () => {
            const cookiesToClear = [{
              name: 'testCookie',
              value: 'testValue',
              domain: '.foobar.com',
              path: '/',
              httpOnly: false,
              secure: false,
              sameSite: 'no_restriction',
            }, {
              name: 'testCookie2',
              value: 'testValue2',
              domain: '.foobar.com',
              path: '/',
              httpOnly: false,
              secure: false,
              sameSite: 'lax',
            }]

            mockWebdriverClient.storageGetCookies = sinon.stub().resolves({
              cookies: [{
                name: 'testCookie',
                value: {
                  type: 'string',
                  value: 'testValue',
                },
                expiry: 1234567890,
                domain: '.foobar.com',
                path: '/',
                httpOnly: false,
                secure: false,
                sameSite: 'none',
              }, {
                name: 'testCookie2',
                value: {
                  type: 'string',
                  value: 'testValue2',
                },
                expiry: 1234567890,
                domain: '.foobar.com',
                path: '/',
                httpOnly: false,
                secure: false,
                sameSite: 'lax',
              }],
            })

            mockWebdriverClient.storageDeleteCookies = sinon.stub().resolves()

            const clearedCookie = await bidiAutomationInstance.automationMiddleware.onRequest('clear:cookies', cookiesToClear)

            expect(mockWebdriverClient.storageDeleteCookies).to.have.been.calledWith({
              filter: {
                name: 'testCookie',
                value: {
                  type: 'string',
                  value: 'testValue',
                },
                domain: '.foobar.com',
                path: '/',
                httpOnly: false,
                secure: false,
                sameSite: 'none',
              },
            })

            expect(mockWebdriverClient.storageDeleteCookies).to.have.been.calledWith({
              filter: {

                name: 'testCookie2',
                value: {
                  type: 'string',
                  value: 'testValue2',
                },
                domain: '.foobar.com',
                path: '/',
                httpOnly: false,
                secure: false,
                sameSite: 'lax',

              },
            })

            expect(clearedCookie).to.deep.equal([{
              name: 'testCookie',
              value: 'testValue',
              domain: '.foobar.com',
              expirationDate: 1234567890,
              path: '/',
              httpOnly: false,
              hostOnly: false,
              secure: false,
              sameSite: 'no_restriction',
            },
            {
              name: 'testCookie2',
              value: 'testValue2',
              domain: '.foobar.com',
              expirationDate: 1234567890,
              path: '/',
              httpOnly: false,
              hostOnly: false,
              secure: false,
              sameSite: 'lax',
            }])
          })

          it('returns undefined if the cookie does not exist', async () => {
            const cookies = [{
              name: 'testCookie',
              value: 'testValue',
              domain: '.foobar.com',
              path: '/',
              httpOnly: false,
              secure: false,
              sameSite: 'no_restriction',
            }]

            mockWebdriverClient.storageGetCookies = sinon.stub().resolves({
              cookies: [],
            })

            const result = await bidiAutomationInstance.automationMiddleware.onRequest('clear:cookies', cookies)

            expect(result).to.deep.equal([])
          })

          it('throws an error if clearing a cookie fails', async () => {
            const cookies = [{
              name: 'testCookie',
              value: 'testValue',
              domain: '.foobar.com',
              path: '/',
              httpOnly: false,
              secure: false,
              sameSite: 'no_restriction',
            }]

            const mockError = new Error('clearing cookies failed!')

            mockWebdriverClient.storageGetCookies = sinon.stub().rejects(mockError)

            expect(bidiAutomationInstance.automationMiddleware.onRequest('clear:cookies', cookies)).to.be.rejectedWith(mockError)
          })
        })
      })

      it('returns "true" when "is:automation:client:connected"', async () => {
        const isAutomationClientConnected = await bidiAutomationInstance.automationMiddleware.onRequest('is:automation:client:connected', undefined)

        expect(isAutomationClientConnected).to.be.true
      })

      describe('take:screenshot', () => {
        it('successfully takes a screenshot', async () => {
          mockWebdriverClient.browsingContextGetTree = sinon.stub().resolves({
            contexts: [{ context: '123' }],
          })

          mockWebdriverClient.browsingContextActivate = sinon.stub().resolves()
          mockWebdriverClient.browsingContextCaptureScreenshot = sinon.stub().resolves({
            data: 'iVBORw0KGgoAAAANSUhEUgAAAAUA',
          })

          const screenshot = await bidiAutomationInstance.automationMiddleware.onRequest('take:screenshot', {})

          expect(screenshot).to.equal('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA')
          expect(mockWebdriverClient.browsingContextGetTree).to.have.been.calledWith({})
          expect(mockWebdriverClient.browsingContextActivate).to.have.been.calledWith({
            context: '123',
          })

          expect(mockWebdriverClient.browsingContextCaptureScreenshot).to.have.been.calledWith({
            context: '123',
            format: {
              type: 'png',
            } })
        })

        it('throws an error if taking a screenshot fails', async () => {
          const mockError = new Error('taking screenshot failed!')

          mockWebdriverClient.browsingContextGetTree = sinon.stub().resolves({
            contexts: [{ context: '123' }],
          })

          mockWebdriverClient.browsingContextActivate = sinon.stub().resolves()
          mockWebdriverClient.browsingContextCaptureScreenshot = sinon.stub().rejects(mockError)

          expect(bidiAutomationInstance.automationMiddleware.onRequest('take:screenshot', {})).to.be.rejectedWith(mockError)
        })
      })

      it('throws a AutomationNotImplemented error when "reset:browser:state" is emitted to inform the default automation client (web extension) to handle it', async () => {
        expect(bidiAutomationInstance.automationMiddleware.onRequest('reset:browser:state')).to.be.rejectedWith(`Automation command 'reset:browser:state' not implemented by BiDiAutomation`)
      })

      describe('reset:browser:tabs:for:next:spec', () => {
        it('successfully recreates the test tab (shouldKeepTabOpen=true) closes all other tabs', async () => {
          mockWebdriverClient.browsingContextGetTree = sinon.stub().resolves({
            contexts: [{ context: '123' }],
          })

          mockWebdriverClient.browsingContextCreate = sinon.stub().resolves({
            context: '456',
          })

          mockWebdriverClient.browsingContextClose = sinon.stub().resolves()

          const returnValue = await bidiAutomationInstance.automationMiddleware.onRequest('reset:browser:tabs:for:next:spec', {
            shouldKeepTabOpen: true,
          })

          expect(returnValue).to.be.undefined
          expect(mockWebdriverClient.browsingContextGetTree).to.have.been.calledWith({})
          expect(mockWebdriverClient.browsingContextCreate).to.have.been.calledWith({
            type: 'tab',
          })

          expect(mockWebdriverClient.browsingContextClose).to.have.been.calledWith({
            context: '123',
          })
        })

        it('successfully closes all tabs (shouldKeepTabOpen=false)', async () => {
          mockWebdriverClient.browsingContextGetTree = sinon.stub().resolves({
            contexts: [{ context: '123' }],
          })

          mockWebdriverClient.browsingContextCreate = sinon.stub().resolves()

          mockWebdriverClient.browsingContextClose = sinon.stub().resolves()

          const returnValue = await bidiAutomationInstance.automationMiddleware.onRequest('reset:browser:tabs:for:next:spec', {
            shouldKeepTabOpen: false,
          })

          expect(returnValue).to.be.undefined
          expect(mockWebdriverClient.browsingContextGetTree).to.have.been.calledWith({})
          expect(mockWebdriverClient.browsingContextCreate).to.have.not.been.called

          expect(mockWebdriverClient.browsingContextClose).to.have.been.calledWith({
            context: '123',
          })
        })
      })

      describe('focus:browser:window', () => {
        // TODO: might need to rewrite this test and just pass in the AUT context id that exists in the class
        it('focuses the browser window (AUT should be first window)', async () => {
          mockWebdriverClient.browsingContextGetTree = sinon.stub().resolves({
            contexts: [{ context: '123' }],
          })

          mockWebdriverClient.browsingContextActivate = sinon.stub().resolves()

          const returnValue = await bidiAutomationInstance.automationMiddleware.onRequest('focus:browser:window', {})

          expect(returnValue).to.be.undefined
          expect(mockWebdriverClient.browsingContextGetTree).to.have.been.calledWith({})
          expect(mockWebdriverClient.browsingContextActivate).to.have.been.calledWith({
            context: '123',
          })
        })
      })

      describe('get:aut:url', () => {
        it('gets the application url', async () => {
          mockWebdriverClient.browsingContextGetTree = sinon.stub().resolves({
            contexts: [{ context: '123', url: 'http://localhost:3500/fixtures/dom.html' }],
          })

          //@ts-expect-error
          bidiAutomationInstance.autContextId = '123'

          const url = await bidiAutomationInstance.automationMiddleware.onRequest('get:aut:url', undefined)

          expect(mockWebdriverClient.browsingContextGetTree).to.have.been.calledWith({
            root: '123',
          })

          expect(url).to.equal('http://localhost:3500/fixtures/dom.html')
        })

        it('fails gracefully if no AUT context is initialized', async () => {
          //@ts-expect-error
          bidiAutomationInstance.autContextId = undefined

          expect(bidiAutomationInstance.automationMiddleware.onRequest('get:aut:url', undefined)).to.be.rejectedWith('Cannot get AUT url: no AUT context initialized')
        })
      })

      describe('reload:aut:frame', () => {
        it('uses scriptEvaluate to reload the AUT window', async () => {
          mockWebdriverClient.scriptEvaluate = sinon.stub().resolves()

          //@ts-expect-error
          bidiAutomationInstance.autContextId = '123'

          await bidiAutomationInstance.automationMiddleware.onRequest('reload:aut:frame', { forceReload: false })

          expect(mockWebdriverClient.scriptEvaluate).to.have.been.calledWith({
            expression: `window.location.reload(false)`,
            target: {
              context: '123',
            },
            awaitPromise: false,
          })
        })

        it('uses scriptEvaluate to reload the AUT window with the force option', async () => {
          mockWebdriverClient.scriptEvaluate = sinon.stub().resolves()

          //@ts-expect-error
          bidiAutomationInstance.autContextId = '123'

          await bidiAutomationInstance.automationMiddleware.onRequest('reload:aut:frame', { forceReload: true })

          expect(mockWebdriverClient.scriptEvaluate).to.have.been.calledWith({
            expression: `window.location.reload(true)`,
            target: {
              context: '123',
            },
            awaitPromise: false,
          })
        })

        it('fails gracefully if no AUT context is initialized', async () => {
          //@ts-expect-error
          bidiAutomationInstance.autContextId = undefined

          expect(bidiAutomationInstance.automationMiddleware.onRequest('reload:aut:frame', undefined)).to.be.rejectedWith('Cannot reload AUT frame: no AUT context initialized')
        })
      })

      describe('navigate:aut:history', () => {
        it('uses scriptEvaluate to navigate the AUT window history', async () => {
          mockWebdriverClient.scriptEvaluate = sinon.stub().resolves()

          //@ts-expect-error
          bidiAutomationInstance.autContextId = '123'

          await bidiAutomationInstance.automationMiddleware.onRequest('navigate:aut:history', { historyNumber: -1 })

          expect(mockWebdriverClient.scriptEvaluate).to.have.been.calledWith({
            expression: `window.history.go(-1)`,
            target: {
              context: '123',
            },
            awaitPromise: false,
          })
        })

        it('fails gracefully if no AUT context is initialized', async () => {
          //@ts-expect-error
          bidiAutomationInstance.autContextId = undefined

          expect(bidiAutomationInstance.automationMiddleware.onRequest('navigate:aut:history', undefined)).to.be.rejectedWith('Cannot navigate AUT frame history: no AUT context initialized')
        })
      })

      describe('get:aut:title', () => {
        it('uses scriptEvaluate to get the AUT title', async () => {
          mockWebdriverClient.scriptEvaluate = sinon.stub().resolves({
            result: {
              value: 'test title',
            },
          })

          //@ts-expect-error
          bidiAutomationInstance.autContextId = '123'

          const title = await bidiAutomationInstance.automationMiddleware.onRequest('get:aut:title', undefined)

          expect(mockWebdriverClient.scriptEvaluate).to.have.been.calledWith({
            expression: `window.document.title`,
            target: {
              context: '123',
            },
            awaitPromise: false,
          })

          expect(title).to.equal('test title')
        })

        it('fails gracefully if no AUT context is initialized', async () => {
          //@ts-expect-error
          bidiAutomationInstance.autContextId = undefined

          expect(bidiAutomationInstance.automationMiddleware.onRequest('get:aut:title', undefined)).to.be.rejectedWith('Cannot get AUT title no AUT context initialized')
        })
      })

      it('throws an error if an event passed in does not exist', () => {
        // @ts-expect-error
        expect(bidiAutomationInstance.automationMiddleware.onRequest('foo:bar:baz', {})).to.be.rejectedWith('Automation command \'foo:bar:baz\' not implemented by BiDiAutomation')
      })
    })
  })
})
