import { expect } from 'chai'
import sinon from 'sinon'
import { Http, HttpStages } from '../../../lib/http'
import { BrowserPreRequest } from '../../../lib'

describe('http', function () {
  context('Http.handle', function () {
    let config
    let middleware
    let incomingRequest
    let incomingResponse
    let error
    let httpOpts
    let on
    let off

    beforeEach(function () {
      config = {}
      incomingRequest = sinon.stub()
      incomingResponse = sinon.stub()
      error = sinon.stub()
      on = sinon.stub()
      off = sinon.stub()

      middleware = {
        [HttpStages.IncomingRequest]: [incomingRequest],
        [HttpStages.IncomingResponse]: [incomingResponse],
        [HttpStages.Error]: [error],
      }

      httpOpts = { config, middleware }
    })

    it('calls IncomingRequest stack, then IncomingResponse stack', function () {
      incomingRequest.callsFake(function () {
        expect(incomingResponse).to.not.be.called
        expect(error).to.not.be.called

        this.incomingRes = {}

        this.end()
      })

      incomingResponse.callsFake(function () {
        expect(incomingRequest).to.be.calledOnce
        expect(error).to.not.be.called

        this.end()
      })

      return new Http(httpOpts)
      // @ts-ignore
      .handleHttpRequest({}, { on, off })
      .then(function () {
        expect(incomingRequest, 'incomingRequest').to.be.calledOnce
        expect(incomingResponse, 'incomingResponse').to.be.calledOnce
        expect(error).to.not.be.called
        expect(on).to.be.calledOnce
        expect(off).to.be.calledTwice
      })
    })

    it('moves to Error stack if err in IncomingRequest', function () {
      incomingRequest.throws(new Error('oops'))

      error.callsFake(function () {
        expect(this.error.message).to.eq('Internal error while proxying "GET url" in 0:\noops')
        this.end()
      })

      return new Http(httpOpts)
      // @ts-ignore
      .handleHttpRequest({ method: 'GET', proxiedUrl: 'url' }, { on, off })
      .then(function () {
        expect(incomingRequest).to.be.calledOnce
        expect(incomingResponse).to.not.be.called
        expect(error).to.be.calledOnce
        expect(on).to.not.be.called
        expect(off).to.be.calledThrice
      })
    })

    it('creates fake pending browser pre request', function () {
      incomingRequest.callsFake(function () {
        this.req.browserPreRequest = {
          requestId: '1234',
          errorHandled: false,
        }

        this.res.destroyed = false

        throw new Error('oops')
      })

      error.callsFake(function () {
        expect(this.error.message).to.eq('Internal error while proxying "GET url" in 0:\noops')
        this.end()
      })

      const http = new Http(httpOpts)

      http.addPendingBrowserPreRequest = sinon.stub()

      return http
      // @ts-expect-error
      .handleHttpRequest({ method: 'GET', proxiedUrl: 'url' }, { on, off })
      .then(function () {
        expect(incomingRequest).to.be.calledOnce
        expect(incomingResponse).to.not.be.called
        expect(error).to.be.calledOnce
        expect(http.addPendingBrowserPreRequest).to.be.calledOnceWith({
          requestId: '1234-retry-1',
          errorHandled: false,
        })

        expect(on).to.not.be.called
        expect(off).to.be.calledThrice
      })
    })

    it('ensures not to create fake pending browser pre requests on multiple errors', function () {
      incomingRequest.callsFake(function () {
        this.req.browserPreRequest = {
          errorHandled: true,
        }

        throw new Error('oops')
      })

      error.callsFake(function () {
        expect(this.error.message).to.eq('Internal error while proxying "GET url" in 0:\noops')
        this.end()
      })

      const http = new Http(httpOpts)

      http.addPendingBrowserPreRequest = sinon.stub()

      return http
      // @ts-ignore
      .handleHttpRequest({ method: 'GET', proxiedUrl: 'url' }, { on, off })
      .then(function () {
        expect(incomingRequest).to.be.calledOnce
        expect(incomingResponse).to.not.be.called
        expect(http.addPendingBrowserPreRequest).to.not.be.called
        expect(error).to.be.calledOnce
        expect(on).to.not.be.called
        expect(off).to.be.calledThrice
      })
    })

    it('does not create fake pending browser pre request when the response is destroyed', function () {
      incomingRequest.callsFake(function () {
        this.req.browserPreRequest = {
          errorHandled: false,
        }

        this.res.destroyed = true

        throw new Error('oops')
      })

      error.callsFake(function () {
        expect(this.error.message).to.eq('Internal error while proxying "GET url" in 0:\noops')
        this.end()
      })

      const http = new Http(httpOpts)

      http.addPendingBrowserPreRequest = sinon.stub()

      return http
      // @ts-expect-error
      .handleHttpRequest({ method: 'GET', proxiedUrl: 'url' }, { on, off })
      .then(function () {
        expect(incomingRequest).to.be.calledOnce
        expect(incomingResponse).to.not.be.called
        expect(error).to.be.calledOnce
        expect(http.addPendingBrowserPreRequest).to.not.be.called
        expect(on).to.not.be.called
        expect(off).to.be.calledThrice
      })
    })

    it('moves to Error stack if err in IncomingResponse', function () {
      incomingRequest.callsFake(function () {
        this.incomingRes = {}
        this.end()
      })

      incomingResponse.throws(new Error('oops'))

      error.callsFake(function () {
        expect(this.error.message).to.eq('Internal error while proxying "GET url" in 0:\noops')
        this.end()
      })

      return new Http(httpOpts)
      // @ts-ignore
      .handleHttpRequest({ method: 'GET', proxiedUrl: 'url' }, { on, off })
      .then(function () {
        expect(incomingRequest).to.be.calledOnce
        expect(incomingResponse).to.be.calledOnce
        expect(error).to.be.calledOnce
        expect(on).to.be.calledOnce
        expect(off).to.have.callCount(4)
      })
    })

    it('self can be modified by middleware and passed on', function () {
      const reqAdded = {}
      const resAdded = {}
      const errorAdded = {}

      let expectedKeys = ['req', 'res', 'config', 'middleware']

      incomingRequest.callsFake(function () {
        expect(this).to.include.keys(expectedKeys)
        this.reqAdded = reqAdded
        expectedKeys.push('reqAdded')
        this.next()
      })

      const incomingRequest2 = sinon.stub().callsFake(function () {
        expect(this).to.include.keys(expectedKeys)
        expect(this.reqAdded).to.equal(reqAdded)
        this.incomingRes = {}
        expectedKeys.push('incomingRes')
        this.end()
      })

      incomingResponse.callsFake(function () {
        expect(this).to.include.keys(expectedKeys)
        this.resAdded = resAdded
        expectedKeys.push('resAdded')
        this.next()
      })

      const incomingResponse2 = sinon.stub().callsFake(function () {
        expect(this).to.include.keys(expectedKeys)
        expect(this.resAdded).to.equal(resAdded)
        expectedKeys.push('error')
        throw new Error('goto error stack')
      })

      error.callsFake(function () {
        expect(this.error.message).to.eq('Internal error while proxying "GET url" in 1:\ngoto error stack')
        expect(this).to.include.keys(expectedKeys)
        this.errorAdded = errorAdded
        this.next()
      })

      const error2 = sinon.stub().callsFake(function () {
        expect(this).to.include.keys(expectedKeys)
        expect(this.errorAdded).to.equal(errorAdded)
        this.end()
      })

      middleware[HttpStages.IncomingRequest].push(incomingRequest2)
      middleware[HttpStages.IncomingResponse].push(incomingResponse2)
      middleware[HttpStages.Error].push(error2)

      return new Http(httpOpts)
      // @ts-ignore
      .handleHttpRequest({ method: 'GET', proxiedUrl: 'url' }, { on, off })
      .then(function () {
        [
          incomingRequest, incomingRequest2,
          incomingResponse, incomingResponse2,
          error, error2,
        ].forEach(function (fn) {
          expect(fn).to.be.calledOnce
        })

        expect(on).to.be.calledTwice
        expect(off).to.have.callCount(10)
      })
    })
  })

  context('Http.reset', function () {
    let httpOpts

    beforeEach(function () {
      httpOpts = { config: {}, middleware: {} }
    })

    it('resets preRequests when resetBetweenSpecs is true', function () {
      const http = new Http(httpOpts)

      http.preRequests.reset = sinon.stub()

      http.reset({ resetBetweenSpecs: true })

      expect(http.preRequests.reset).to.be.calledOnce
    })

    it('does not reset preRequests when resetBetweenSpecs is false', function () {
      const http = new Http(httpOpts)

      http.preRequests.reset = sinon.stub()

      http.reset({ resetBetweenSpecs: false })

      expect(http.preRequests.reset).to.not.be.called
    })
  })

  context('Service Worker', function () {
    let config
    let middleware
    let incomingRequest
    let incomingResponse
    let error
    let httpOpts

    beforeEach(function () {
      config = {}
      incomingRequest = sinon.stub()
      incomingResponse = sinon.stub()
      error = sinon.stub()

      middleware = {
        [HttpStages.IncomingRequest]: [incomingRequest],
        [HttpStages.IncomingResponse]: [incomingResponse],
        [HttpStages.Error]: [error],
      }

      httpOpts = { config, middleware }
    })

    it('properly ignores requests that are controlled by a service worker', () => {
      const http = new Http(httpOpts)
      const processBrowserPreRequestStub = sinon.stub(http.serviceWorkerManager, 'processBrowserPreRequest')
      const addPendingStub = sinon.stub(http.preRequests, 'addPending')
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

      processBrowserPreRequestStub.resolves(true)

      http.addPendingBrowserPreRequest(browserPreRequest as BrowserPreRequest)

      expect(processBrowserPreRequestStub).to.be.calledWith(browserPreRequest)
      expect(addPendingStub).not.to.be.called
    })

    it('processes service worker registration updated events', () => {
      const http = new Http(httpOpts)
      const updateServiceWorkerRegistrationsStub = sinon.stub(http.serviceWorkerManager, 'updateServiceWorkerRegistrations')
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

      expect(updateServiceWorkerRegistrationsStub).to.be.calledWith({
        registrations,
      })
    })

    it('processes service worker version updated events', () => {
      const http = new Http(httpOpts)
      const updateServiceWorkerVersionsStub = sinon.stub(http.serviceWorkerManager, 'updateServiceWorkerVersions')
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

      expect(updateServiceWorkerVersionsStub).to.be.calledWith({
        versions,
      })
    })

    it('processes service worker client side registration updated events', () => {
      const http = new Http(httpOpts)
      const addInitiatorToServiceWorkerStub = sinon.stub(http.serviceWorkerManager, 'addInitiatorToServiceWorker')
      const registration = {
        scriptURL: 'foo',
        initiatorOrigin: 'bar',
      }

      http.updateServiceWorkerClientSideRegistrations(registration)

      expect(addInitiatorToServiceWorkerStub).to.be.calledWith(registration)
    })

    it('properly ignores service worker prerequests', () => {
      const http = new Http(httpOpts)
      const processBrowserPreRequestStub = sinon.stub(http.serviceWorkerManager, 'processBrowserPreRequest')

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

      expect(processBrowserPreRequestStub).to.be.calledOnce
    })

    it('handles service worker client events', () => {
      const http = new Http(httpOpts)
      const handleServiceWorkerClientEventStub = sinon.stub(http.serviceWorkerManager, 'handleServiceWorkerClientEvent')

      const event = {
        type: 'fetchRequest' as const,
        payload: {
          url: 'foo',
          isControlled: true,
        },
        scope: 'foo',
      }

      http.handleServiceWorkerClientEvent(event)

      expect(handleServiceWorkerClientEventStub).to.be.calledWith(event)
    })
  })
})
