import EventEmitter from 'node:events'
import type { Client as WebDriverClient } from 'webdriver'
import { inspect, isDeepStrictEqual } from 'node:util'
import { isEqual, isMatch, toInteger } from 'lodash'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { BidiAutomation } from '../../../lib/browsers/bidi_automation'
import type { NetworkBeforeRequestSentParametersModified } from '../../../lib/browsers/bidi_automation'
import type { Automation } from '../../../lib/automation'
import type { NetworkFetchErrorParameters, NetworkResponseCompletedParameters, NetworkResponseStartedParameters } from 'webdriver/build/bidi/localTypes'
import { AUT_FRAME_NAME_IDENTIFIER } from '@packages/types'

// make sure testing promises resolve before asserting on async function conditions
const flushPromises = () => {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 100)
  })
}

// Helper function to wait for async operations to complete
const waitForAsyncOperation = async (stub: Mock) => {
  if (stub.mock.calls.length) {
    await stub.mock.results[0].value
  }
}

// sinon's calledWith: some call whose leading arguments deep-equal `expected`
const expectCalledWith = (stub: unknown, ...expected: unknown[]) => {
  const { calls } = (stub as Mock).mock
  const matched = calls.some((call) => isDeepStrictEqual(call.slice(0, expected.length), expected))

  expect(matched, `expected a call starting with ${inspect(expected, { depth: null })}, got ${inspect(calls, { depth: null })}`).toBe(true)
}

type ArgsMatcher = (args: unknown[]) => boolean

const withArg = (expected: unknown): ArgsMatcher => (args) => isEqual(args[0], expected)
const withArgMatching = (partial: object): ArgsMatcher => (args) => isMatch(args[0] as object, partial)

// sinon's withArgs routing: the newest matching route answers, unmatched calls return undefined
const routedStub = () => {
  const routes: { matches: ArgsMatcher, respond: () => unknown }[] = []
  const stub = vi.fn((...args: any[]): any => [...routes].reverse().find((route) => route.matches(args))?.respond())

  return Object.assign(stub, {
    route: (matches: ArgsMatcher, respond: () => unknown) => {
      routes.push({ matches, respond })
    },
  })
}

describe('lib/browsers/bidi_automation', () => {
  describe('BidiAutomation', () => {
    let mockWebdriverClient: WebDriverClient
    let mockAutomationClient: Automation

    beforeEach(() => {
      mockWebdriverClient = new EventEmitter() as WebDriverClient
      mockAutomationClient = {
        onRequestEvent: vi.fn(),
        onBrowserPreRequest: vi.fn().mockResolvedValue(undefined),
        onRemoveBrowserPreRequest: vi.fn().mockResolvedValue(undefined),
        use: vi.fn(),
      } as unknown as Automation
    })

    it('binds BIDI_EVENTS when a new instance is created', () => {
      mockWebdriverClient.on = vi.fn()

      BidiAutomation.create(mockWebdriverClient, mockAutomationClient)

      expectCalledWith(mockWebdriverClient.on, 'network.beforeRequestSent')
      expectCalledWith(mockWebdriverClient.on, 'network.responseStarted')
      expectCalledWith(mockWebdriverClient.on, 'network.responseCompleted')
      expectCalledWith(mockWebdriverClient.on, 'network.fetchError')
      expectCalledWith(mockWebdriverClient.on, 'browsingContext.contextCreated')
      expectCalledWith(mockWebdriverClient.on, 'browsingContext.contextDestroyed')
    })

    it('unbinds BIDI_EVENTS when close() is called', () => {
      mockWebdriverClient.off = vi.fn()

      const bidiAutomationInstance = BidiAutomation.create(mockWebdriverClient, mockAutomationClient)

      bidiAutomationInstance.close()

      expectCalledWith(mockWebdriverClient.off, 'network.beforeRequestSent')
      expectCalledWith(mockWebdriverClient.off, 'network.responseStarted')
      expectCalledWith(mockWebdriverClient.off, 'network.responseCompleted')
      expectCalledWith(mockWebdriverClient.off, 'network.fetchError')
      expectCalledWith(mockWebdriverClient.off, 'browsingContext.contextCreated')
      expectCalledWith(mockWebdriverClient.off, 'browsingContext.contextDestroyed')
    })

    describe('BrowsingContext', () => {
      describe('contextCreated / contextDestroyed', () => {
        beforeEach(() => {
          mockWebdriverClient.networkAddIntercept = vi.fn().mockResolvedValue({ intercept: 'mockInterceptId' })
          mockWebdriverClient.networkRemoveIntercept = vi.fn().mockResolvedValue(undefined)
          // the AUT is identified by its window.name, seeded with AUT_FRAME_NAME_IDENTIFIER
          mockWebdriverClient.scriptEvaluate = vi.fn().mockResolvedValue({ result: { value: `${AUT_FRAME_NAME_IDENTIFIER} 'foobar'` } })
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
          expect(bidiAutomationInstance.autContextId).toBeUndefined()
          // @ts-expect-error
          expect(bidiAutomationInstance.interceptId).toBeUndefined()
          expect(mockWebdriverClient.networkAddIntercept).not.toHaveBeenCalled()

          mockWebdriverClient.emit('browsingContext.contextDestroyed', {
            parent: '123',
            context: '456',
            url: 'www.foobar.com',
            userContext: '',
            children: [],
          })

          await flushPromises()

          expect(mockWebdriverClient.networkRemoveIntercept).not.toHaveBeenCalled()
        })

        it('does not set the AUT context for a non-AUT child frame (e.g. the reporter iframe)', async () => {
          // the reporter iframe is also a direct child of the top-level context, but its
          // window.name does not carry the AUT identifier, so it must be ignored
          mockWebdriverClient.scriptEvaluate = vi.fn().mockResolvedValue({ result: { value: 'Cypress Reporter' } })

          const bidiAutomationInstance = BidiAutomation.create(mockWebdriverClient, mockAutomationClient)

          bidiAutomationInstance.setTopLevelContextId('123')

          mockWebdriverClient.emit('browsingContext.contextCreated', {
            parent: '123',
            context: '456',
            url: 'www.foobar.com',
            userContext: '',
            children: [],
          })

          await flushPromises()

          // @ts-expect-error
          expect(bidiAutomationInstance.autContextId).toBeUndefined()
          // @ts-expect-error
          expect(bidiAutomationInstance.interceptId).toBeUndefined()
          expect(mockWebdriverClient.networkAddIntercept).not.toHaveBeenCalled()
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

            // Wait for the networkAddIntercept Promise to resolve if it was called
            await waitForAsyncOperation(mockWebdriverClient.networkAddIntercept as Mock)

            // @ts-expect-error
            expect(bidiAutomationInstance.autContextId).toBe('456')
            // @ts-expect-error
            expect(bidiAutomationInstance.interceptId).toBe('mockInterceptId')
            expectCalledWith(mockWebdriverClient.networkAddIntercept, { phases: ['beforeRequestSent'], contexts: ['123'] })

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
            expect(bidiAutomationInstance.autContextId).toBe(undefined)

            expect(mockWebdriverClient.networkRemoveIntercept).not.toHaveBeenCalled()
            // @ts-expect-error
            expect(bidiAutomationInstance.topLevelContextId).toBe('123')
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

            // Wait for the networkAddIntercept Promise to resolve if it was called
            await waitForAsyncOperation(mockWebdriverClient.networkAddIntercept as Mock)

            // @ts-expect-error
            expect(bidiAutomationInstance.autContextId).toBe('456')
            // @ts-expect-error
            expect(bidiAutomationInstance.interceptId).toBe('mockInterceptId')
            expectCalledWith(mockWebdriverClient.networkAddIntercept, { phases: ['beforeRequestSent'], contexts: ['123'] })

            // Then, mock the destruction of the tab
            mockWebdriverClient.emit('browsingContext.contextDestroyed', {
              parent: null,
              context: '123',
              url: 'www.foobar.com',
              userContext: '',
              children: ['456'],
            })

            await flushPromises()

            expectCalledWith(mockWebdriverClient.networkRemoveIntercept, {
              intercept: 'mockInterceptId',
            })

            // @ts-expect-error
            expect(bidiAutomationInstance.topLevelContextId).toBeUndefined()
            // @ts-expect-error
            expect(bidiAutomationInstance.interceptId).toBeUndefined()
            // @ts-expect-error
            expect(bidiAutomationInstance.autContextId).toBe(undefined)
          })
        })
      })
    })

    describe('Network', () => {
      describe('beforeRequestSent', () => {
        let mockRequest: NetworkBeforeRequestSentParametersModified

        beforeEach(() => {
          mockWebdriverClient.networkAddIntercept = vi.fn().mockResolvedValue({ intercept: 'mockInterceptId' })
          mockWebdriverClient.networkContinueRequest = vi.fn().mockResolvedValue(undefined)
          // the AUT is identified by its window.name, seeded with AUT_FRAME_NAME_IDENTIFIER
          mockWebdriverClient.scriptEvaluate = vi.fn().mockResolvedValue({ result: { value: `${AUT_FRAME_NAME_IDENTIFIER} 'foobar'` } })

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

          expectCalledWith(mockAutomationClient.onBrowserPreRequest, {
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

          expectCalledWith(mockWebdriverClient.networkContinueRequest, {
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

          expectCalledWith(mockAutomationClient.onBrowserPreRequest, {
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

          expectCalledWith(mockWebdriverClient.networkContinueRequest, {
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

          mockWebdriverClient.networkContinueRequest = vi.fn(() => {
            throw new Error('no such request')
          })

          expect(() => {
            mockWebdriverClient.emit('network.beforeRequestSent', mockRequest)
          }).not.toThrow()

          await flushPromises()

          expectCalledWith(mockAutomationClient.onRemoveBrowserPreRequest, 'request1')
        })

        it('strips hashes out of the url when adding the prerequest', async () => {
          BidiAutomation.create(mockWebdriverClient, mockAutomationClient)

          mockRequest.request.url = 'https://www.foobar.com?foo=bar#hash'

          mockWebdriverClient.emit('network.beforeRequestSent', mockRequest)

          await flushPromises()

          expectCalledWith(mockAutomationClient.onBrowserPreRequest, {
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

            expectCalledWith(mockAutomationClient.onRemoveBrowserPreRequest, 'request123')
          })
        })

        it('calls onRequestEvent "response:received" when a response is completed', async () => {
          BidiAutomation.create(mockWebdriverClient, mockAutomationClient)

          mockRequest.response.fromCache = false

          mockWebdriverClient.emit('network.responseCompleted', mockRequest)

          await flushPromises()

          expectCalledWith(mockAutomationClient.onRequestEvent, 'response:received', {
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

          expectCalledWith(mockAutomationClient.onRemoveBrowserPreRequest, 'request123')
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
              mockWebdriverClient.storageGetCookies = vi.fn().mockResolvedValue({
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

              expect(cookies).toStrictEqual([{
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

              expectCalledWith(mockWebdriverClient.storageGetCookies, { filter: {
                // this would filter out secure cookies and prevent sending them in a secure context
                secure: false,
              } })
            })

            // localhost and the loopback range are "potentially trustworthy" origins, so they are
            // treated as secure contexts and secure cookies are still sent over http for those hosts.
            // @see https://bugzilla.mozilla.org/show_bug.cgi?id=1618113
            // @see https://bugzilla.mozilla.org/show_bug.cgi?id=1648993
            it('data.url / loopback host does not filter out secure cookies', async () => {
              mockWebdriverClient.storageGetCookies = vi.fn().mockResolvedValue({
                cookies: [{
                  domain: 'localhost',
                  expiry: 123456789,
                  httpOnly: false,
                  name: 'secureKey',
                  path: '/',
                  sameSite: 'lax',
                  secure: true,
                  size: 10,
                  value: {
                    type: 'string',
                    value: 'secureValue',
                  },
                }, {
                  domain: 'localhost',
                  expiry: 123456789,
                  httpOnly: false,
                  name: 'insecureKey',
                  path: '/',
                  sameSite: 'lax',
                  secure: false,
                  size: 10,
                  value: {
                    type: 'string',
                    value: 'insecureValue',
                  },
                }],
              })

              const cookies = await bidiAutomationInstance.automationMiddleware.onRequest('get:cookies', {
                url: 'http://localhost:3500/index.html',
              })

              // the secure cookie is returned even though this is an http url
              expect(cookies).toStrictEqual([{
                domain: 'localhost',
                expirationDate: 123456789,
                httpOnly: false,
                hostOnly: false,
                name: 'secureKey',
                path: '/',
                sameSite: 'lax',
                secure: true,
                value: 'secureValue',
              }, {
                domain: 'localhost',
                expirationDate: 123456789,
                httpOnly: false,
                hostOnly: false,
                name: 'insecureKey',
                path: '/',
                sameSite: 'lax',
                secure: false,
                value: 'insecureValue',
              }])

              // the secure filter is NOT applied for loopback hosts
              expectCalledWith(mockWebdriverClient.storageGetCookies, { filter: {} })
            })

            it('data.url / path', async () => {
              mockWebdriverClient.storageGetCookies = vi.fn().mockResolvedValue({
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

              expect(cookies).toStrictEqual([{
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

              expectCalledWith(mockWebdriverClient.storageGetCookies, { filter: {
                // this would filter out secure cookies and prevent sending them in a secure context
                secure: false,
              } })
            })

            it('cookie name', async () => {
              mockWebdriverClient.storageGetCookies = vi.fn().mockResolvedValue({
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

              expect(cookies).toStrictEqual([{
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

              expectCalledWith(mockWebdriverClient.storageGetCookies, {
                filter: {
                  name: 'key1',
                },
              })
            })

            it('cookie path', async () => {
              mockWebdriverClient.storageGetCookies = vi.fn().mockResolvedValue({
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

              expect(cookies).toStrictEqual([{
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

              expectCalledWith(mockWebdriverClient.storageGetCookies, { filter: {} })
            })
          })

          describe('domain hierarchy', () => {
            it('returns superdomain related cookies (ex: foobar.com is a super domain of www.foobar.com', async () => {
              mockWebdriverClient.storageGetCookies = vi.fn().mockResolvedValue({
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

              expect(cookies).toStrictEqual([{
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

              expectCalledWith(mockWebdriverClient.storageGetCookies, { filter: {} })
            })

            it('does NOT return subdomain cookies (ex: www.foobar.com is a sub domain of foobar.com', async () => {
              mockWebdriverClient.storageGetCookies = vi.fn().mockResolvedValue({
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

              expect(cookies).toStrictEqual([{
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

              expectCalledWith(mockWebdriverClient.storageGetCookies, { filter: {} })
            })
          })

          it('returns no cookies if no match on the filter', async () => {
            mockWebdriverClient.storageGetCookies = vi.fn().mockResolvedValue({
              cookies: [],
            })

            const cookies = await bidiAutomationInstance.automationMiddleware.onRequest('get:cookies', undefined)

            expect(cookies).toStrictEqual([])
            expectCalledWith(mockWebdriverClient.storageGetCookies, { filter: {} })
          })

          it('returns all cookies if there is no filter', async () => {
            mockWebdriverClient.storageGetCookies = vi.fn().mockResolvedValue({
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

            expect(cookies).toStrictEqual([{
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

            expectCalledWith(mockWebdriverClient.storageGetCookies, { filter: {} })
          })

          // TODO: do we try/catch this and return an empty array and log the error?
          it('Throws error if for some reason fetching cookies fails', async () => {
            const mockError = new Error('fetching cookies failed!')

            mockWebdriverClient.storageGetCookies = vi.fn().mockRejectedValue(mockError)

            await expect(bidiAutomationInstance.automationMiddleware.onRequest('get:cookies', {})).rejects.toBe(mockError)
          })
        })

        describe('get:cookie', () => {
          describe('returns cookies that match filter via', () => {
            it('cookie name', async () => {
              mockWebdriverClient.storageGetCookies = vi.fn().mockResolvedValue({
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

              expect(cookie).toStrictEqual({
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

              expectCalledWith(mockWebdriverClient.storageGetCookies, {
                filter: {
                  name: 'key1',
                },
              })
            })

            it('cookie path', async () => {
              mockWebdriverClient.storageGetCookies = vi.fn().mockResolvedValue({
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

              expect(cookie).toStrictEqual({
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

              expectCalledWith(mockWebdriverClient.storageGetCookies, { filter: {} })
            })
          })

          it('returns the first matching cookie', async () => {
            mockWebdriverClient.storageGetCookies = vi.fn().mockResolvedValue({
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

            expect(cookie).toStrictEqual({
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

            expectCalledWith(mockWebdriverClient.storageGetCookies, { filter: {} })
          })

          it('returns null if no cookie is found', async () => {
            mockWebdriverClient.storageGetCookies = vi.fn().mockResolvedValue({
              cookies: [],
            })

            const cookies = await bidiAutomationInstance.automationMiddleware.onRequest('get:cookie', {})

            expect(cookies).toBe(null)

            expectCalledWith(mockWebdriverClient.storageGetCookies, { filter: {} })
          })

          // TODO: do we try/catch this and return an empty array and log the error?
          it('Throws error if for some reason fetching cookies fails', async () => {
            const mockError = new Error('fetching cookies failed!')

            mockWebdriverClient.storageGetCookies = vi.fn().mockRejectedValue(mockError)

            await expect(bidiAutomationInstance.automationMiddleware.onRequest('get:cookie', {})).rejects.toBe(mockError)
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

            mockWebdriverClient.storageSetCookie = vi.fn().mockResolvedValue(undefined)

            mockWebdriverClient.storageGetCookies = vi.fn().mockResolvedValue({
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

            expectCalledWith(mockWebdriverClient.storageSetCookie, {
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

            expect(cookie).toStrictEqual({
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

            mockWebdriverClient.storageSetCookie = vi.fn().mockRejectedValue(mockError)

            await expect(bidiAutomationInstance.automationMiddleware.onRequest('set:cookie', cookie)).rejects.toBe(mockError)
          })

          describe('parsing', () => {
            // NOTE: unique to Firefox. Chromium defaults to 'lax'
            it('defaults sameSite to "default"', async () => {
              const cyCookie = {
                name: 'testCookie',
                value: 'testValue',
                domain: '.foobar.com',
                path: '/',
                secure: true,
                httpOnly: true,
              }

              mockWebdriverClient.storageSetCookie = vi.fn().mockResolvedValue(undefined)

              mockWebdriverClient.storageGetCookies = vi.fn().mockResolvedValue({
                cookies: [{
                  domain: '.foobar.com',
                  httpOnly: true,
                  expiry: undefined,
                  name: 'testCookie',
                  path: '/',
                  sameSite: 'default',
                  secure: true,
                  size: 10,
                  value: {
                    type: 'string',
                    value: 'testValue',
                  },
                }],
              })

              const cookie = await bidiAutomationInstance.automationMiddleware.onRequest('set:cookie', cyCookie)

              expectCalledWith(mockWebdriverClient.storageSetCookie, {
                cookie: {
                  name: 'testCookie',
                  value: { type: 'string', value: 'testValue' },
                  domain: '.foobar.com',
                  path: '/',
                  httpOnly: true,
                  secure: true,
                  sameSite: 'default',
                  expiry: undefined,
                },
              })

              expect(cookie).toStrictEqual({
                name: 'testCookie',
                value: 'testValue',
                domain: '.foobar.com',
                path: '/',
                secure: true,
                httpOnly: true,
                hostOnly: false,
                sameSite: 'unspecified',
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

              mockWebdriverClient.storageSetCookie = vi.fn().mockResolvedValue(undefined)

              mockWebdriverClient.storageGetCookies = vi.fn().mockResolvedValue({
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

              expectCalledWith(mockWebdriverClient.storageSetCookie, {
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

              expect(cookie).toStrictEqual({
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

              mockWebdriverClient.storageSetCookie = vi.fn().mockResolvedValue(undefined)

              mockWebdriverClient.storageGetCookies = vi.fn().mockResolvedValue({
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

              expectCalledWith(mockWebdriverClient.storageSetCookie, {
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

              expect(cookie).toStrictEqual({
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

              mockWebdriverClient.storageSetCookie = vi.fn().mockResolvedValue(undefined)

              mockWebdriverClient.storageGetCookies = vi.fn().mockResolvedValue({
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

              expectCalledWith(mockWebdriverClient.storageSetCookie, {
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

              expect(cookie).toStrictEqual({
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

              mockWebdriverClient.storageSetCookie = vi.fn().mockResolvedValue(undefined)

              mockWebdriverClient.storageGetCookies = vi.fn().mockResolvedValue({
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

              expectCalledWith(mockWebdriverClient.storageSetCookie, {
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

              expect(cookie).toStrictEqual({
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

              mockWebdriverClient.storageSetCookie = vi.fn().mockResolvedValue(undefined)

              mockWebdriverClient.storageGetCookies = vi.fn().mockResolvedValue({
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

              expectCalledWith(mockWebdriverClient.storageSetCookie, {
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

              expect(cookie).toStrictEqual({
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

            mockWebdriverClient.storageSetCookie = vi.fn().mockResolvedValue(undefined)

            const returnValue = await bidiAutomationInstance.automationMiddleware.onRequest('add:cookies', cookies)

            expect(returnValue).toBeUndefined()

            expectCalledWith(mockWebdriverClient.storageSetCookie, {
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

            expectCalledWith(mockWebdriverClient.storageSetCookie, {
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

            mockWebdriverClient.storageSetCookie = vi.fn().mockRejectedValue(mockError)

            await expect(bidiAutomationInstance.automationMiddleware.onRequest('add:cookies', cookies)).rejects.toBe(mockError)
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

            mockWebdriverClient.storageDeleteCookies = vi.fn().mockResolvedValue(undefined)

            mockWebdriverClient.storageSetCookie = vi.fn().mockResolvedValue(undefined)

            const returnValue = await bidiAutomationInstance.automationMiddleware.onRequest('set:cookies', cookies)

            expect(returnValue).toBeUndefined()

            expectCalledWith(mockWebdriverClient.storageSetCookie, {
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

            expectCalledWith(mockWebdriverClient.storageSetCookie, {
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
            expectCalledWith(mockWebdriverClient.storageDeleteCookies, {})
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

            mockWebdriverClient.storageDeleteCookies = vi.fn().mockResolvedValue(undefined)

            mockWebdriverClient.storageSetCookie = vi.fn().mockRejectedValue(mockError)

            await expect(bidiAutomationInstance.automationMiddleware.onRequest('set:cookies', cookies)).rejects.toBe(mockError)

            expectCalledWith(mockWebdriverClient.storageDeleteCookies, {})
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

            mockWebdriverClient.storageGetCookies = vi.fn().mockResolvedValue({
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

            mockWebdriverClient.storageDeleteCookies = vi.fn().mockResolvedValue(undefined)

            const clearedCookie = await bidiAutomationInstance.automationMiddleware.onRequest('clear:cookie', cookieToClear)

            expectCalledWith(mockWebdriverClient.storageDeleteCookies, {
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

            expect(clearedCookie).toStrictEqual({
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

            mockWebdriverClient.storageGetCookies = vi.fn().mockResolvedValue({
              cookies: [],
            })

            const result = await bidiAutomationInstance.automationMiddleware.onRequest('clear:cookie', cookie)

            expect(result).toBeUndefined()
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

            mockWebdriverClient.storageGetCookies = vi.fn().mockRejectedValue(mockError)

            await expect(bidiAutomationInstance.automationMiddleware.onRequest('clear:cookie', cookie)).rejects.toBe(mockError)
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

            mockWebdriverClient.storageGetCookies = vi.fn().mockResolvedValue({
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

            mockWebdriverClient.storageDeleteCookies = vi.fn().mockResolvedValue(undefined)

            const clearedCookie = await bidiAutomationInstance.automationMiddleware.onRequest('clear:cookies', cookiesToClear)

            expectCalledWith(mockWebdriverClient.storageDeleteCookies, {
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

            expectCalledWith(mockWebdriverClient.storageDeleteCookies, {
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

            expect(clearedCookie).toStrictEqual([{
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

            mockWebdriverClient.storageGetCookies = vi.fn().mockResolvedValue({
              cookies: [],
            })

            const result = await bidiAutomationInstance.automationMiddleware.onRequest('clear:cookies', cookies)

            expect(result).toStrictEqual([])
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

            mockWebdriverClient.storageGetCookies = vi.fn().mockRejectedValue(mockError)

            await expect(bidiAutomationInstance.automationMiddleware.onRequest('clear:cookies', cookies)).rejects.toBe(mockError)
          })
        })
      })

      it('returns "true" when "is:automation:client:connected"', async () => {
        const isAutomationClientConnected = await bidiAutomationInstance.automationMiddleware.onRequest('is:automation:client:connected', undefined)

        expect(isAutomationClientConnected).toBe(true)
      })

      describe('take:screenshot', () => {
        it('successfully takes a screenshot', async () => {
          mockWebdriverClient.browsingContextGetTree = vi.fn().mockResolvedValue({
            contexts: [{ context: '123' }],
          })

          mockWebdriverClient.browsingContextActivate = vi.fn().mockResolvedValue(undefined)
          mockWebdriverClient.browsingContextCaptureScreenshot = vi.fn().mockResolvedValue({
            data: 'iVBORw0KGgoAAAANSUhEUgAAAAUA',
          })

          const screenshot = await bidiAutomationInstance.automationMiddleware.onRequest('take:screenshot', {})

          expect(screenshot).toBe('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA')
          expectCalledWith(mockWebdriverClient.browsingContextGetTree, {})
          expectCalledWith(mockWebdriverClient.browsingContextActivate, {
            context: '123',
          })

          expectCalledWith(mockWebdriverClient.browsingContextCaptureScreenshot, {
            context: '123',
            format: {
              type: 'png',
            } })
        })

        it('throws an error if taking a screenshot fails', async () => {
          const mockError = new Error('taking screenshot failed!')

          mockWebdriverClient.browsingContextGetTree = vi.fn().mockResolvedValue({
            contexts: [{ context: '123' }],
          })

          mockWebdriverClient.browsingContextActivate = vi.fn().mockResolvedValue(undefined)
          mockWebdriverClient.browsingContextCaptureScreenshot = vi.fn().mockRejectedValue(mockError)

          await expect(bidiAutomationInstance.automationMiddleware.onRequest('take:screenshot', {})).rejects.toBe(mockError)
        })
      })

      it('throws a AutomationNotImplemented error when "reset:browser:state" is emitted to inform the default automation client (web extension) to handle it', async () => {
        await expect(bidiAutomationInstance.automationMiddleware.onRequest('reset:browser:state', {})).rejects.toThrow(`Automation command 'reset:browser:state' not implemented by BiDiAutomation`)
      })

      describe('reset:browser:tabs:for:next:spec', () => {
        it('successfully recreates the test tab (shouldKeepTabOpen=true) closes all other tabs', async () => {
          mockWebdriverClient.browsingContextGetTree = vi.fn().mockResolvedValue({
            contexts: [{ context: '123' }],
          })

          mockWebdriverClient.browsingContextCreate = vi.fn().mockResolvedValue({
            context: '456',
          })

          mockWebdriverClient.browsingContextClose = vi.fn().mockResolvedValue(undefined)

          const returnValue = await bidiAutomationInstance.automationMiddleware.onRequest('reset:browser:tabs:for:next:spec', {
            shouldKeepTabOpen: true,
          })

          expect(returnValue).toBeUndefined()
          expectCalledWith(mockWebdriverClient.browsingContextGetTree, {})
          expectCalledWith(mockWebdriverClient.browsingContextCreate, {
            type: 'tab',
          })

          expectCalledWith(mockWebdriverClient.browsingContextClose, {
            context: '123',
          })
        })

        it('successfully closes all tabs (shouldKeepTabOpen=false)', async () => {
          mockWebdriverClient.browsingContextGetTree = vi.fn().mockResolvedValue({
            contexts: [{ context: '123' }],
          })

          mockWebdriverClient.browsingContextCreate = vi.fn().mockResolvedValue(undefined)

          mockWebdriverClient.browsingContextClose = vi.fn().mockResolvedValue(undefined)

          const returnValue = await bidiAutomationInstance.automationMiddleware.onRequest('reset:browser:tabs:for:next:spec', {
            shouldKeepTabOpen: false,
          })

          expect(returnValue).toBeUndefined()
          expectCalledWith(mockWebdriverClient.browsingContextGetTree, {})
          expect(mockWebdriverClient.browsingContextCreate).not.toHaveBeenCalled()

          expectCalledWith(mockWebdriverClient.browsingContextClose, {
            context: '123',
          })
        })
      })

      describe('focus:browser:window', () => {
        // TODO: might need to rewrite this test and just pass in the AUT context id that exists in the class
        it('focuses the browser window (AUT should be first window)', async () => {
          mockWebdriverClient.browsingContextGetTree = vi.fn().mockResolvedValue({
            contexts: [{ context: '123' }],
          })

          mockWebdriverClient.browsingContextActivate = vi.fn().mockResolvedValue(undefined)

          const returnValue = await bidiAutomationInstance.automationMiddleware.onRequest('focus:browser:window', {})

          expect(returnValue).toBeUndefined()
          expectCalledWith(mockWebdriverClient.browsingContextGetTree, {})
          expectCalledWith(mockWebdriverClient.browsingContextActivate, {
            context: '123',
          })
        })
      })

      describe('perform:user:gesture', () => {
        it('synthesizes a trusted pointer click in the top-level context to grant transient activation', async () => {
          mockWebdriverClient.inputPerformActions = vi.fn().mockResolvedValue(undefined)
          mockWebdriverClient.inputReleaseActions = vi.fn().mockResolvedValue(undefined)

          bidiAutomationInstance.setTopLevelContextId('123')

          const returnValue = await bidiAutomationInstance.automationMiddleware.onRequest('perform:user:gesture', {})

          expect(returnValue).toBeUndefined()
          expect(mockWebdriverClient.inputPerformActions).toHaveBeenCalledOnce()

          // the `id` is non-deterministic (timestamped) so assert on the meaningful shape directly
          const performArgs = (mockWebdriverClient.inputPerformActions as Mock).mock.calls[0][0]

          expect(performArgs.context).toBe('123')
          expect(performArgs.actions).toHaveLength(1)
          expect(performArgs.actions[0]).toMatchObject({
            type: 'pointer',
          })

          expect(performArgs.actions[0].parameters).toStrictEqual({ pointerType: 'mouse' })
          expect(performArgs.actions[0].actions).toStrictEqual([
            { type: 'pointerMove', x: 0, y: 0 },
            { type: 'pointerDown', button: 0 },
            { type: 'pointerUp', button: 0 },
          ])

          expectCalledWith(mockWebdriverClient.inputReleaseActions, {
            context: '123',
          })
        })

        it('fails gracefully if no top-level context is initialized', async () => {
          bidiAutomationInstance.setTopLevelContextId(undefined)

          await expect(bidiAutomationInstance.automationMiddleware.onRequest('perform:user:gesture', {})).rejects.toThrow('Cannot perform user gesture: no top-level context initialized')
        })
      })

      describe('get:aut:url', () => {
        it('gets the application url', async () => {
          mockWebdriverClient.browsingContextGetTree = vi.fn().mockResolvedValue({
            contexts: [{ context: '123', url: 'http://localhost:3500/fixtures/dom.html' }],
          })

          //@ts-expect-error
          bidiAutomationInstance.autContextId = '123'

          const url = await bidiAutomationInstance.automationMiddleware.onRequest('get:aut:url', undefined)

          expectCalledWith(mockWebdriverClient.browsingContextGetTree, {
            root: '123',
          })

          expect(url).toBe('http://localhost:3500/fixtures/dom.html')
        })

        it('fails gracefully if no AUT context is initialized', async () => {
          //@ts-expect-error
          bidiAutomationInstance.autContextId = undefined

          await expect(bidiAutomationInstance.automationMiddleware.onRequest('get:aut:url', undefined)).rejects.toThrow('Cannot get AUT url: no AUT context initialized')
        })
      })

      describe('reload:aut:frame', () => {
        it('uses scriptEvaluate to reload the AUT window', async () => {
          mockWebdriverClient.scriptEvaluate = vi.fn().mockResolvedValue(undefined)

          //@ts-expect-error
          bidiAutomationInstance.autContextId = '123'

          await bidiAutomationInstance.automationMiddleware.onRequest('reload:aut:frame', { forceReload: false })

          expectCalledWith(mockWebdriverClient.scriptEvaluate, {
            expression: `window.location.reload(false)`,
            target: {
              context: '123',
            },
            awaitPromise: false,
          })
        })

        it('uses scriptEvaluate to reload the AUT window with the force option', async () => {
          mockWebdriverClient.scriptEvaluate = vi.fn().mockResolvedValue(undefined)

          //@ts-expect-error
          bidiAutomationInstance.autContextId = '123'

          await bidiAutomationInstance.automationMiddleware.onRequest('reload:aut:frame', { forceReload: true })

          expectCalledWith(mockWebdriverClient.scriptEvaluate, {
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

          await expect(bidiAutomationInstance.automationMiddleware.onRequest('reload:aut:frame', undefined)).rejects.toThrow('Cannot reload AUT frame: no AUT context initialized')
        })
      })

      describe('navigate:aut:history', () => {
        it('uses scriptEvaluate to navigate the AUT window history', async () => {
          mockWebdriverClient.scriptEvaluate = vi.fn().mockResolvedValue(undefined)

          //@ts-expect-error
          bidiAutomationInstance.autContextId = '123'

          await bidiAutomationInstance.automationMiddleware.onRequest('navigate:aut:history', { historyNumber: -1 })

          expectCalledWith(mockWebdriverClient.scriptEvaluate, {
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

          await expect(bidiAutomationInstance.automationMiddleware.onRequest('navigate:aut:history', undefined)).rejects.toThrow('Cannot navigate AUT frame history: no AUT context initialized')
        })
      })

      describe('get:aut:title', () => {
        it('uses scriptEvaluate to get the AUT title', async () => {
          mockWebdriverClient.scriptEvaluate = vi.fn().mockResolvedValue({
            result: {
              value: 'test title',
            },
          })

          //@ts-expect-error
          bidiAutomationInstance.autContextId = '123'

          const title = await bidiAutomationInstance.automationMiddleware.onRequest('get:aut:title', undefined)

          expectCalledWith(mockWebdriverClient.scriptEvaluate, {
            expression: `window.document.title`,
            target: {
              context: '123',
            },
            awaitPromise: false,
          })

          expect(title).toBe('test title')
        })

        it('fails gracefully if no AUT context is initialized', async () => {
          //@ts-expect-error
          bidiAutomationInstance.autContextId = undefined

          await expect(bidiAutomationInstance.automationMiddleware.onRequest('get:aut:title', undefined)).rejects.toThrow('Cannot get AUT title no AUT context initialized')
        })
      })

      it('throws an error if an event passed in does not exist', async () => {
        // @ts-expect-error
        await expect(bidiAutomationInstance.automationMiddleware.onRequest('foo:bar:baz', {})).rejects.toThrow('Automation command \'foo:bar:baz\' not implemented by BiDiAutomation')
      })

      describe('AUT context resolution', () => {
        const AUT_NAME = `${AUT_FRAME_NAME_IDENTIFIER}-spec`

        beforeEach(() => {
          bidiAutomationInstance.setTopLevelContextId('top')
          //@ts-expect-error
          bidiAutomationInstance.autContextResolveTimeoutMs = 500
          //@ts-expect-error
          bidiAutomationInstance.autContextPollIntervalMs = 20
        })

        it('waits for the AUT context to be identified instead of failing during the identification window', async () => {
          const getTree = routedStub()

          getTree.route(withArg({ root: 'top' }), async () => ({ contexts: [{ context: 'top', children: [] }] }))
          getTree.route(withArg({ root: 'aut' }), async () => ({ contexts: [{ context: 'aut', url: 'http://localhost:3500/index.html' }] }))
          mockWebdriverClient.browsingContextGetTree = getTree
          mockWebdriverClient.scriptEvaluate = vi.fn().mockResolvedValue({ result: { value: AUT_NAME } })
          mockWebdriverClient.networkAddIntercept = vi.fn().mockResolvedValue({ intercept: 'intercept-1' })

          const request = bidiAutomationInstance.automationMiddleware.onRequest('get:aut:url', undefined)

          setTimeout(() => {
            mockWebdriverClient.emit('browsingContext.contextCreated', { context: 'aut', parent: 'top' })
          }, 50)

          expect(await request).toBe('http://localhost:3500/index.html')
        })

        it('heals a missed contextCreated by re-deriving the AUT from the browsing context tree', async () => {
          const getTree = routedStub()

          getTree.route(withArg({ root: 'top' }), async () => ({ contexts: [{ context: 'top', children: [{ context: 'reporter' }, { context: 'aut' }] }] }))
          getTree.route(withArg({ root: 'aut' }), async () => ({ contexts: [{ context: 'aut', url: 'http://localhost:3500/healed.html' }] }))
          mockWebdriverClient.browsingContextGetTree = getTree

          const scriptEvaluate = routedStub()

          scriptEvaluate.route(withArgMatching({ target: { context: 'reporter' } }), async () => ({ result: { value: 'reporter-frame' } }))
          scriptEvaluate.route(withArgMatching({ target: { context: 'aut' } }), async () => ({ result: { value: AUT_NAME } }))
          mockWebdriverClient.scriptEvaluate = scriptEvaluate
          mockWebdriverClient.networkAddIntercept = vi.fn().mockResolvedValue({ intercept: 'intercept-1' })

          const url = await bidiAutomationInstance.automationMiddleware.onRequest('get:aut:url', undefined)

          expect(url).toBe('http://localhost:3500/healed.html')
          // the healed AUT still needs the top-level request intercept
          expectCalledWith(mockWebdriverClient.networkAddIntercept, { phases: ['beforeRequestSent'], contexts: ['top'] })
        })

        it('resolves a request issued in the gap between the AUT context being destroyed and recreated', async () => {
          //@ts-expect-error
          bidiAutomationInstance.autContextId = 'old-aut'

          mockWebdriverClient.browsingContextGetTree = vi.fn().mockResolvedValue({ contexts: [{ context: 'top', children: [] }] })

          const scriptEvaluate = routedStub()

          scriptEvaluate.route(withArgMatching({ expression: 'window.name' }), async () => ({ result: { value: AUT_NAME } }))
          scriptEvaluate.route(withArgMatching({ expression: 'window.location.reload(false)' }), async () => undefined)
          mockWebdriverClient.scriptEvaluate = scriptEvaluate
          mockWebdriverClient.networkAddIntercept = vi.fn().mockResolvedValue({ intercept: 'intercept-1' })

          mockWebdriverClient.emit('browsingContext.contextDestroyed', { context: 'old-aut', parent: 'top' })

          const request = bidiAutomationInstance.automationMiddleware.onRequest('reload:aut:frame', { forceReload: false })

          setTimeout(() => {
            mockWebdriverClient.emit('browsingContext.contextCreated', { context: 'new-aut', parent: 'top' })
          }, 50)

          await request

          expectCalledWith(scriptEvaluate, {
            expression: 'window.location.reload(false)',
            target: {
              context: 'new-aut',
            },
            awaitPromise: false,
          })
        })

        it('fails with the original error when the AUT context never resolves within the bounded wait', async () => {
          mockWebdriverClient.browsingContextGetTree = vi.fn().mockResolvedValue({ contexts: [{ context: 'top', children: [] }] })

          await expect(bidiAutomationInstance.automationMiddleware.onRequest('get:aut:url', undefined)).rejects.toThrow('Cannot get AUT url: no AUT context initialized')
        })

        it('stays bounded by the timeout when the tree query hangs', async () => {
          mockWebdriverClient.browsingContextGetTree = vi.fn().mockReturnValue(new Promise(() => {}))

          const start = Date.now()

          await expect(bidiAutomationInstance.automationMiddleware.onRequest('get:aut:url', undefined)).rejects.toThrow('Cannot get AUT url: no AUT context initialized')
          expect(Date.now() - start).toBeLessThan(1000)
        })

        it('discards an identification that lands after the top-level context was destroyed', async () => {
          let resolveName!: (value: unknown) => void

          mockWebdriverClient.browsingContextGetTree = vi.fn().mockResolvedValue({ contexts: [{ context: 'top', children: [{ context: 'aut' }] }] })
          mockWebdriverClient.scriptEvaluate = vi.fn().mockReturnValue(new Promise((res) => {
            resolveName = res
          }))

          mockWebdriverClient.networkAddIntercept = vi.fn().mockResolvedValue({ intercept: 'intercept-1' })

          const request = bidiAutomationInstance.automationMiddleware.onRequest('get:aut:url', undefined)

          setTimeout(() => {
            mockWebdriverClient.emit('browsingContext.contextDestroyed', { context: 'top' })
            resolveName({ result: { value: AUT_NAME } })
          }, 30)

          await expect(request).rejects.toThrow('Cannot get AUT url: no AUT context initialized')

          //@ts-expect-error
          expect(bidiAutomationInstance.autContextId).toBeUndefined()
          expect(mockWebdriverClient.networkAddIntercept).not.toHaveBeenCalled()
        })

        it('discards an identification whose candidate frame was destroyed during the window.name read and identifies the recreated frame', async () => {
          let resolveName!: (value: unknown) => void

          const getTree = routedStub()

          getTree.route(withArg({ root: 'top' }), async () => ({ contexts: [{ context: 'top', children: [{ context: 'aut' }] }] }))
          getTree.route(withArg({ root: 'new-aut' }), async () => ({ contexts: [{ context: 'new-aut', url: 'http://localhost:3500/recreated.html' }] }))
          mockWebdriverClient.browsingContextGetTree = getTree

          const scriptEvaluate = routedStub()

          const pendingName = new Promise((res) => {
            resolveName = res
          })

          scriptEvaluate.route(withArgMatching({ target: { context: 'aut' } }), () => pendingName)

          scriptEvaluate.route(withArgMatching({ target: { context: 'new-aut' } }), async () => ({ result: { value: AUT_NAME } }))
          mockWebdriverClient.scriptEvaluate = scriptEvaluate
          mockWebdriverClient.networkAddIntercept = vi.fn().mockResolvedValue({ intercept: 'intercept-1' })

          const request = bidiAutomationInstance.automationMiddleware.onRequest('get:aut:url', undefined)

          setTimeout(() => {
            // the frame is torn down while its window.name read is in flight;
            // the read still resolving with the AUT name must not record it
            mockWebdriverClient.emit('browsingContext.contextDestroyed', { context: 'aut', parent: 'top' })
            getTree.route(withArg({ root: 'top' }), async () => ({ contexts: [{ context: 'top', children: [] }] }))
            resolveName({ result: { value: AUT_NAME } })
          }, 30)

          setTimeout(() => {
            mockWebdriverClient.emit('browsingContext.contextCreated', { context: 'new-aut', parent: 'top' })
          }, 60)

          expect(await request).toBe('http://localhost:3500/recreated.html')
          //@ts-expect-error
          expect(bidiAutomationInstance.autContextId).toBe('new-aut')
        })

        it('fails a waiting request when the top-level context is destroyed instead of waiting out the timeout', async () => {
          mockWebdriverClient.browsingContextGetTree = vi.fn().mockResolvedValue({ contexts: [{ context: 'top', children: [] }] })

          const start = Date.now()
          const request = bidiAutomationInstance.automationMiddleware.onRequest('get:aut:url', undefined)

          setTimeout(() => {
            mockWebdriverClient.emit('browsingContext.contextDestroyed', { context: 'top' })
          }, 30)

          await expect(request).rejects.toThrow('Cannot get AUT url: no AUT context initialized')
          expect(Date.now() - start).toBeLessThan(400)
        })

        it('fails immediately when there is no top-level context to recover from', async () => {
          bidiAutomationInstance.setTopLevelContextId(undefined)

          const start = Date.now()

          await expect(bidiAutomationInstance.automationMiddleware.onRequest('get:aut:url', undefined)).rejects.toThrow('Cannot get AUT url: no AUT context initialized')
          expect(Date.now() - start).toBeLessThan(100)
        })
      })
    })
  })
})
