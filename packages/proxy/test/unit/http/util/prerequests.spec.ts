import { PreRequests } from '@packages/proxy/lib/http/util/prerequests'
import { BrowserPreRequest, CypressIncomingRequest } from '@packages/proxy'
import { expect } from 'chai'
import sinon from 'sinon'
import { performance } from 'perf_hooks'
import { ProtocolManagerShape } from '@packages/types'

describe('http/util/prerequests', () => {
  let preRequests: PreRequests
  let protocolManager: ProtocolManagerShape

  function expectPendingCounts (pendingRequests: number, pendingPreRequests: number) {
    expect(preRequests.pendingRequests.length).to.eq(pendingRequests, 'wrong number of pending requests')
    expect(preRequests.pendingPreRequests.length).to.eq(pendingPreRequests, 'wrong number of pending prerequests')
  }

  beforeEach(() => {
    preRequests = new PreRequests(10)
    protocolManager = {
      responseStreamTimedOut: sinon.stub(),
    } as any

    preRequests.setProtocolManager(protocolManager)
  })

  afterEach(() => {
    clearInterval(preRequests.sweepInterval)
  })

  it('synchronously matches a pre-request that existed at the time of the request', () => {
    // should match in order
    preRequests.addPending({
      requestId: '1234',
      url: 'foo',
      method: 'WRONGMETHOD',
      headers: {},
      resourceType: 'xhr',
      originalResourceType: undefined,
      cdpClientSideEventTime: 1,
      cdpServerSideEventReceivedTime: 2,
    })

    const secondPreRequest: BrowserPreRequest = {
      requestId: '1234',
      url: 'foo',
      method: 'GET',
      headers: {},
      resourceType: 'xhr',
      originalResourceType: undefined,
      cdpClientSideEventTime: 1,
      cdpServerSideEventReceivedTime: performance.now() + performance.timeOrigin + 10000,
    }

    preRequests.addPending(secondPreRequest)
    preRequests.addPending({
      requestId: '1234',
      url: 'foo',
      method: 'GET',
      headers: {},
      resourceType: 'xhr',
      originalResourceType: undefined,
      cdpClientSideEventTime: 1,
      cdpServerSideEventReceivedTime: 2,
    })

    expectPendingCounts(0, 3)

    const cb = sinon.stub()

    preRequests.get({ proxiedUrl: 'foo', method: 'GET' } as CypressIncomingRequest, () => {}, cb)

    const { args } = cb.getCall(0)
    const arg = args[0]

    expect(arg.requestId).to.eq(secondPreRequest.requestId)
    expect(arg.url).to.eq(secondPreRequest.url)
    expect(arg.method).to.eq(secondPreRequest.method)
    expect(arg.headers).to.deep.eq(secondPreRequest.headers)
    expect(arg.resourceType).to.eq(secondPreRequest.resourceType)
    expect(arg.originalResourceType).to.eq(secondPreRequest.originalResourceType)
    expect(arg.cdpClientSideEventTime).to.eq(secondPreRequest.cdpClientSideEventTime)
    expect(arg.cdpServerSideEventReceivedTime).to.eq(secondPreRequest.cdpServerSideEventReceivedTime)
    expect(arg.proxyReceivedTime).to.be.a('number')
    expect(arg.cdpLagTime).to.eq(secondPreRequest.cdpServerSideEventReceivedTime - secondPreRequest.cdpClientSideEventTime)
    expect(arg.correlationTime).to.eq(secondPreRequest.cdpServerSideEventReceivedTime - arg.proxyReceivedTime)

    expectPendingCounts(0, 2)
  })

  it('synchronously matches a pre-request added after the request', (done) => {
    const cb = (preRequest) => {
      expect(preRequest).to.include({ requestId: '1234', url: 'foo', method: 'GET' })
      expectPendingCounts(0, 0)
      done()
    }

    preRequests.get({ proxiedUrl: 'foo', method: 'GET' } as CypressIncomingRequest, () => {}, cb)
    preRequests.addPending({ requestId: '1234', url: 'foo', method: 'GET' } as BrowserPreRequest)
  })

  it('invokes a request callback after a timeout if no pre-request occurs', async () => {
    let cb
    const cbPromise = new Promise<void>((resolve) => {
      cb = (preRequest) => {
        expect(preRequest).to.be.undefined

        // we should have keep the pending request to eventually be correlated later, but don't block the body in the meantime
        expectPendingCounts(1, 0)

        resolve()
      }
    })

    preRequests.get({ proxiedUrl: 'foo', method: 'GET' } as CypressIncomingRequest, () => {}, cb)

    await cbPromise

    const browserPreRequest: BrowserPreRequest = {
      requestId: '1234',
      url: 'foo',
      method: 'GET',
      headers: {},
      resourceType: 'xhr',
      originalResourceType: undefined,
      cdpClientSideEventTime: 1,
      cdpServerSideEventReceivedTime: performance.now() + performance.timeOrigin + 10000,
    }

    preRequests.addPending(browserPreRequest)

    expectPendingCounts(0, 0)

    const arg = (protocolManager.responseStreamTimedOut as any).getCall(0).args[0]

    expect(arg.requestId).to.eq(browserPreRequest.requestId)
    expect(arg.timings.cdpClientSideEventTime).to.eq(browserPreRequest.cdpClientSideEventTime)
    expect(arg.timings.cdpServerSideEventReceivedTime).to.eq(browserPreRequest.cdpServerSideEventReceivedTime)
    expect(arg.timings.proxyReceivedTime).to.be.a('number')
    expect(arg.timings.cdpLagTime).to.eq(browserPreRequest.cdpServerSideEventReceivedTime - browserPreRequest.cdpClientSideEventTime)
    expect(arg.timings.correlationTime).to.eq(browserPreRequest.cdpServerSideEventReceivedTime - arg.timings.proxyReceivedTime)
  })

  // https://github.com/cypress-io/cypress/issues/17853
  it('eventually discards pre-requests that don\'t match requests', (done) => {
    preRequests = new PreRequests(10, 200)
    preRequests.addPending({ requestId: '1234', url: 'foo', method: 'GET', cdpServerSideEventReceivedTime: performance.now() + performance.timeOrigin } as BrowserPreRequest)

    // preRequests garbage collects pre-requests that never matched up with an incoming request after around
    // 2 * requestTimeout. We verify that it's gone (and therefore not leaking memory) by sending in a request
    // and assuring that the pre-request wasn't there to be matched anymore.
    setTimeout(() => {
      const cb = (preRequest) => {
        expect(preRequest).to.be.undefined
        expectPendingCounts(1, 0)
        done()
      }

      preRequests.get({ proxiedUrl: 'foo', method: 'GET' } as CypressIncomingRequest, () => {}, cb)
    }, 1200)
  })

  it('removes a pre-request with a matching requestId', () => {
    preRequests.addPending({ requestId: '1234', url: 'foo', method: 'GET' } as BrowserPreRequest)
    preRequests.addPending({ requestId: '1235', url: 'foo', method: 'GET' } as BrowserPreRequest)
    preRequests.addPending({ requestId: '1236', url: 'foo', method: 'GET' } as BrowserPreRequest)

    expectPendingCounts(0, 3)

    preRequests.removePending('1235')

    expectPendingCounts(0, 2)
  })

  it('removes a pre-request with a matching requestId with retries', () => {
    preRequests.addPending({ requestId: '1234', url: 'foo', method: 'GET' } as BrowserPreRequest)
    preRequests.addPending({ requestId: '1235', url: 'foo', method: 'GET' } as BrowserPreRequest)
    preRequests.addPending({ requestId: '1235-retry-1', url: 'foo', method: 'GET' } as BrowserPreRequest)
    preRequests.addPending({ requestId: '1235-retry-2', url: 'foo', method: 'GET' } as BrowserPreRequest)
    preRequests.addPending({ requestId: '1235-retry-3', url: 'foo', method: 'GET' } as BrowserPreRequest)
    preRequests.addPending({ requestId: '1236', url: 'foo', method: 'GET' } as BrowserPreRequest)

    expectPendingCounts(0, 6)

    preRequests.removePending('1235')

    expectPendingCounts(0, 2)
  })
})
