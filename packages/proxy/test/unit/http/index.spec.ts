import { describe, expect, it, beforeEach, vi, Mock } from 'vitest'
import { Http, HttpMiddleware, HttpMiddlewareStacks, HttpStages, ServerCtx } from '../../../lib/http'
import { BrowserPreRequest } from '../../../lib'
import type CyServer from '@packages/server'

describe('http', function () {
  describe('Http.handle', function () {
    let config: CyServer.Config & Cypress.Config
    let middleware: HttpMiddlewareStacks
    let incomingRequest: Mock<HttpMiddleware<any>>
    let incomingResponse: Mock<HttpMiddleware<any>>
    let error: Mock
    let httpOpts: ServerCtx & { middleware?: HttpMiddlewareStacks }
    let on: Mock
    let off: Mock

    beforeEach(function () {
      config = {} as CyServer.Config & Cypress.Config
      incomingRequest = vi.fn()
      incomingResponse = vi.fn()
      error = vi.fn()
      on = vi.fn()
      off = vi.fn()

      middleware = {
        [HttpStages.IncomingRequest]: { incomingRequest },
        [HttpStages.IncomingResponse]: { incomingResponse },
        [HttpStages.Error]: { error },
      }

      httpOpts = { config, middleware, request: { rp: vi.fn() } } as ServerCtx & { middleware?: HttpMiddlewareStacks } & { request: { rp: Mock } }
    })

    it('calls IncomingRequest stack, then IncomingResponse stack', async function () {
      incomingRequest.mockImplementation(function () {
        expect(incomingResponse).not.toHaveBeenCalled()
        expect(error).not.toHaveBeenCalled()

        this.incomingRes = {}

        this.end()
      })

      incomingResponse.mockImplementation(function () {
        expect(incomingRequest).toHaveBeenCalledOnce()
        expect(error).not.toHaveBeenCalled()

        this.end()
      })

      // @ts-expect-error
      await new Http(httpOpts).handleHttpRequest({}, { on, off })

      expect(incomingRequest, 'incomingRequest').toHaveBeenCalledOnce()
      expect(incomingResponse, 'incomingResponse').toHaveBeenCalledOnce()
      expect(error).not.toHaveBeenCalled()
      expect(on).toHaveBeenCalledOnce()
      expect(off).toHaveBeenCalledTimes(2)
    })

    it('moves to Error stack if err in IncomingRequest', async function () {
      incomingRequest.mockImplementation(() => {
        throw new Error('oops')
      })

      error.mockImplementation(function () {
        expect(this.error.message).toEqual('Internal error while proxying "GET url" in incomingRequest:\noops')
        this.end()
      })

      // @ts-expect-error
      await new Http(httpOpts).handleHttpRequest({ method: 'GET', proxiedUrl: 'url' }, { on, off })
      expect(incomingRequest).toHaveBeenCalledOnce()
      expect(incomingResponse).not.toHaveBeenCalled()
      expect(error).toHaveBeenCalledOnce()
      expect(on).not.toHaveBeenCalled()
      expect(off).toHaveBeenCalledTimes(3)
    })

    it('creates fake pending browser pre request', async function () {
      incomingRequest.mockImplementation(function () {
        this.req.browserPreRequest = {
          requestId: '1234',
          errorHandled: false,
        }

        this.res.destroyed = false

        throw new Error('oops')
      })

      error.mockImplementation(function () {
        expect(this.error.message).toEqual('Internal error while proxying "GET url" in incomingRequest:\noops')
        this.end()
      })

      const http = new Http(httpOpts)

      http.addPendingBrowserPreRequest = vi.fn()

      // @ts-expect-error
      await http.handleHttpRequest({ method: 'GET', proxiedUrl: 'url' }, { on, off })
      expect(incomingRequest).toHaveBeenCalledOnce()
      expect(incomingResponse).not.toHaveBeenCalled()
      expect(error).toHaveBeenCalledOnce()
      expect(http.addPendingBrowserPreRequest).toHaveBeenCalledExactlyOnceWith({
        requestId: '1234-retry-1',
        errorHandled: false,
      })
    })

    it('ensures not to create fake pending browser pre requests on multiple errors', async function () {
      incomingRequest.mockImplementation(function () {
        this.req.browserPreRequest = {
          errorHandled: true,
        }

        throw new Error('oops')
      })

      error.mockImplementation(function () {
        expect(this.error.message).toEqual('Internal error while proxying "GET url" in incomingRequest:\noops')
        this.end()
      })

      const http = new Http(httpOpts)

      http.addPendingBrowserPreRequest = vi.fn()

      // @ts-expect-error
      await http.handleHttpRequest({ method: 'GET', proxiedUrl: 'url' }, { on, off })
      expect(incomingRequest).toHaveBeenCalledOnce()
      expect(incomingResponse).not.toHaveBeenCalled()
      expect(error).toHaveBeenCalledOnce()
      expect(http.addPendingBrowserPreRequest).not.toHaveBeenCalled()
      expect(on).not.toHaveBeenCalled()
      expect(off).toHaveBeenCalledTimes(3)
    })

    it('does not create fake pending browser pre request when the response is destroyed', async function () {
      incomingRequest.mockImplementation(function () {
        this.req.browserPreRequest = {
          errorHandled: false,
        }

        this.res.destroyed = true

        throw new Error('oops')
      })

      error.mockImplementation(function () {
        expect(this.error.message).toEqual('Internal error while proxying "GET url" in incomingRequest:\noops')
        this.end()
      })

      const http = new Http(httpOpts)

      http.addPendingBrowserPreRequest = vi.fn()

      // @ts-expect-error
      await http.handleHttpRequest({ method: 'GET', proxiedUrl: 'url' }, { on, off })
      expect(incomingRequest).toHaveBeenCalledOnce()
      expect(incomingResponse).not.toHaveBeenCalled()
      expect(error).toHaveBeenCalledOnce()
      expect(http.addPendingBrowserPreRequest).not.toHaveBeenCalled()
      expect(on).not.toHaveBeenCalled()
      expect(off).toHaveBeenCalledTimes(3)
    })

    it('moves to Error stack if err in IncomingResponse', async function () {
      incomingRequest.mockImplementation(function () {
        this.incomingRes = {}
        this.end()
      })

      incomingResponse.mockImplementation(() => {
        throw new Error('oops')
      })

      error.mockImplementation(function () {
        expect(this.error.message).toEqual('Internal error while proxying "GET url" in incomingResponse:\noops')
        this.end()
      })

      // @ts-expect-error
      await new Http(httpOpts).handleHttpRequest({ method: 'GET', proxiedUrl: 'url' }, { on, off })
      expect(incomingRequest).toHaveBeenCalledOnce()
      expect(incomingResponse).toHaveBeenCalledOnce()
      expect(error).toHaveBeenCalledOnce()
      expect(on).toHaveBeenCalledOnce()
      expect(off).toHaveBeenCalledTimes(4)
    })

    it('self can be modified by middleware and passed on', async function () {
      const reqAdded = {}
      const resAdded = {}
      const errorAdded = {}

      let expectedKeys = ['req', 'res', 'config', 'middleware']

      incomingRequest.mockImplementation(function () {
        const keys = Object.keys(this)

        expect(keys).toEqual(expect.arrayContaining(expectedKeys))
        this.reqAdded = reqAdded
        expectedKeys.push('reqAdded')
        this.next()
      })

      const incomingRequest2 = vi.fn().mockImplementation(function () {
        const keys = Object.keys(this)

        expect(keys).toEqual(expect.arrayContaining(expectedKeys))
        expect(this.reqAdded).toEqual(reqAdded)
        this.incomingRes = {}
        expectedKeys.push('incomingRes')
        this.end()
      })

      incomingResponse.mockImplementation(function () {
        const keys = Object.keys(this)

        expect(keys).toEqual(expect.arrayContaining(expectedKeys))
        this.resAdded = resAdded
        expectedKeys.push('resAdded')
        this.next()
      })

      const incomingResponse2 = vi.fn().mockImplementation(function () {
        const keys = Object.keys(this)

        expect(keys).toEqual(expect.arrayContaining(expectedKeys))
        expect(this.resAdded).toEqual(resAdded)
        expectedKeys.push('error')
        throw new Error('goto error stack')
      })

      error.mockImplementation(function () {
        expect(this.error.message).toEqual('Internal error while proxying "GET url" in incomingResponse2:\ngoto error stack')
        const keys = Object.keys(this)

        expect(keys).toEqual(expect.arrayContaining(expectedKeys))
        this.errorAdded = errorAdded
        this.next()
      })

      const error2 = vi.fn().mockImplementation(function () {
        const keys = Object.keys(this)

        expect(keys).toEqual(expect.arrayContaining(expectedKeys))
        expect(this.errorAdded).toEqual(errorAdded)
        this.end()
      })

      middleware[HttpStages.IncomingRequest].incomingRequest2 = incomingRequest2
      middleware[HttpStages.IncomingResponse].incomingResponse2 = incomingResponse2
      middleware[HttpStages.Error].error2 = error2

      // @ts-expect-error
      await new Http(httpOpts).handleHttpRequest({ method: 'GET', proxiedUrl: 'url' }, { on, off })
      const middlewareFunctions = [
        incomingRequest, incomingRequest2,
        incomingResponse, incomingResponse2,
        error, error2,
      ]

      middlewareFunctions.forEach(function (fn) {
        expect(fn).toHaveBeenCalledOnce()
      })

      expect(on).toHaveBeenCalledTimes(2)
      expect(off).toHaveBeenCalledTimes(10)
    })
  })

  describe('Http.reset', function () {
    let httpOpts

    beforeEach(function () {
      httpOpts = { config: {}, middleware: {}, request: { rp: vi.fn() } }
    })

    it('resets preRequests when resetBetweenSpecs is true', function () {
      const http = new Http(httpOpts)

      http.preRequests.reset = vi.fn()

      http.reset({ resetBetweenSpecs: true })

      expect(http.preRequests.reset).toHaveBeenCalledOnce()
    })

    it('does not reset preRequests when resetBetweenSpecs is false', function () {
      const http = new Http(httpOpts)

      http.preRequests.reset = vi.fn()

      http.reset({ resetBetweenSpecs: false })

      expect(http.preRequests.reset).not.toHaveBeenCalled()
    })
  })

  describe('Service Worker', function () {
    let config: CyServer.Config & Cypress.Config
    let middleware: HttpMiddlewareStacks
    let incomingRequest: Mock<HttpMiddleware<any>>
    let incomingResponse: Mock<HttpMiddleware<any>>
    let error: Mock
    let httpOpts: ServerCtx & { middleware?: HttpMiddlewareStacks }

    beforeEach(function () {
      config = {} as CyServer.Config & Cypress.Config
      incomingRequest = vi.fn()
      incomingResponse = vi.fn()
      error = vi.fn()

      middleware = {
        [HttpStages.IncomingRequest]: { incomingRequest },
        [HttpStages.IncomingResponse]: { incomingResponse },
        [HttpStages.Error]: { error },
      }

      httpOpts = { config, middleware, request: { rp: vi.fn() } } as ServerCtx & { middleware?: HttpMiddlewareStacks } & { request: { rp: Mock } }
    })

    it('properly ignores requests that are controlled by a service worker', () => {
      const http = new Http(httpOpts)
      const processBrowserPreRequestStub = vi.spyOn(http.serviceWorkerManager, 'processBrowserPreRequest')
      const addPendingStub = vi.spyOn(http.preRequests, 'addPending')
      const browserPreRequest = {
        requestId: '1234',
        url: 'foo',
        method: 'GET',
        headers: {},
        resourceType: 'xhr',
        originalResourceType: undefined,
        documentURL: 'foo',
        cdpRequestWillBeSentTimestamp: 1,
        cdpRequestWillBeSentReceivedTimestamp: performance.now() + performance.timeOrigin + 10000,
      }

      processBrowserPreRequestStub.mockResolvedValue(true)

      http.addPendingBrowserPreRequest(browserPreRequest as BrowserPreRequest)

      expect(processBrowserPreRequestStub).toHaveBeenCalledWith(browserPreRequest)
      expect(addPendingStub).not.toHaveBeenCalled()
    })

    it('processes service worker registration updated events', () => {
      const http = new Http(httpOpts)
      const updateServiceWorkerRegistrationsStub = vi.spyOn(http.serviceWorkerManager, 'updateServiceWorkerRegistrations')
      const registrations = [{
        registrationId: '1234',
        scopeURL: 'foo',
        isDeleted: false,
      }, {
        registrationId: '1235',
        scopeURL: 'bar',
        isDeleted: true,
      }]

      http.updateServiceWorkerRegistrations({
        registrations,
      })

      expect(updateServiceWorkerRegistrationsStub).toHaveBeenCalledWith({
        registrations,
      })
    })

    it('processes service worker version updated events', () => {
      const http = new Http(httpOpts)
      const updateServiceWorkerVersionsStub = vi.spyOn(http.serviceWorkerManager, 'updateServiceWorkerVersions')
      const versions = [{
        versionId: '1234',
        registrationId: '1234',
        scriptURL: 'foo',
        runningStatus: 'stopped',
        status: 'activating',
      }, {
        versionId: '1235',
        registrationId: '1235',
        scriptURL: 'bar',
        runningStatus: 'running',
        status: 'activated',
      }]

      http.updateServiceWorkerVersions({
        versions,
      } as any)

      expect(updateServiceWorkerVersionsStub).toHaveBeenCalledWith({
        versions,
      })
    })

    it('processes service worker client side registration updated events', () => {
      const http = new Http(httpOpts)
      const addInitiatorToServiceWorkerStub = vi.spyOn(http.serviceWorkerManager, 'addInitiatorToServiceWorker')
      const registration = {
        scriptURL: 'foo',
        initiatorOrigin: 'bar',
      }

      http.updateServiceWorkerClientSideRegistrations(registration)

      expect(addInitiatorToServiceWorkerStub).toHaveBeenCalledWith(registration)
    })

    it('properly ignores service worker prerequests', () => {
      const http = new Http(httpOpts)
      const processBrowserPreRequestStub = vi.spyOn(http.serviceWorkerManager, 'processBrowserPreRequest')

      http.addPendingBrowserPreRequest({
        requestId: '1234',
        url: 'foo',
        method: 'GET',
        headers: {
          'Service-Worker': 'script',
        },
        resourceType: 'xhr',
        originalResourceType: undefined,
        documentURL: 'foo',
        cdpRequestWillBeSentTimestamp: 1,
        cdpRequestWillBeSentReceivedTimestamp: performance.now() + performance.timeOrigin + 10000,
      })

      http.addPendingBrowserPreRequest({
        requestId: '1234',
        url: 'foo',
        method: 'GET',
        headers: {},
        resourceType: 'xhr',
        originalResourceType: undefined,
        documentURL: 'foo',
        cdpRequestWillBeSentTimestamp: 1,
        cdpRequestWillBeSentReceivedTimestamp: performance.now() + performance.timeOrigin + 10000,
      })

      expect(processBrowserPreRequestStub).toHaveBeenCalledOnce()
    })

    it('handles service worker client events', () => {
      const http = new Http(httpOpts)
      const handleServiceWorkerClientEventStub = vi.spyOn(http.serviceWorkerManager, 'handleServiceWorkerClientEvent')

      const event = {
        type: 'fetchRequest' as const,
        payload: {
          url: 'https://www.example.com',
          isControlled: true,
        },
        scope: 'foo',
      }

      http.handleServiceWorkerClientEvent(event)

      expect(handleServiceWorkerClientEventStub).toHaveBeenCalledWith(event)
    })
  })
})
