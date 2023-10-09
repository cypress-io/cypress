import { PreRequests } from '@packages/proxy/lib/http/util/prerequests'
import { BrowserPreRequest, CypressIncomingRequest } from '@packages/proxy'
import { expect } from 'chai'
import sinon from 'sinon'
import { performance } from 'perf_hooks'
import { ProtocolManagerShape } from '@packages/types'

describe('http/util/prerequests', () => {
  let preRequests: PreRequests
  let protocolManager: ProtocolManagerShape

  function expectPendingCounts (pendingRequests: number, pendingPreRequests: number, pendingWithoutPreRequests = 0) {
    expect(preRequests.pendingRequests.length).to.eq(pendingRequests, 'wrong number of pending requests')
    expect(preRequests.pendingPreRequests.length).to.eq(pendingPreRequests, 'wrong number of pending prerequests')
    expect(preRequests.pendingUrlsWithoutPreRequests.length).to.eq(pendingWithoutPreRequests, 'wrong number of pending without prerequests')
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
      cdpRequestWillBeSentTimestamp: 1,
      cdpRequestWillBeSentReceivedTimestamp: 2,
    })

    const secondPreRequest: BrowserPreRequest = {
      requestId: '1234',
      url: 'foo',
      method: 'GET',
      headers: {},
      resourceType: 'xhr',
      originalResourceType: undefined,
      cdpRequestWillBeSentTimestamp: 1,
      cdpRequestWillBeSentReceivedTimestamp: performance.now() + performance.timeOrigin + 10000,
    }

    preRequests.addPending(secondPreRequest)
    preRequests.addPending({
      requestId: '1234',
      url: 'foo',
      method: 'GET',
      headers: {},
      resourceType: 'xhr',
      originalResourceType: undefined,
      cdpRequestWillBeSentTimestamp: 1,
      cdpRequestWillBeSentReceivedTimestamp: 2,
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
    expect(arg.cdpRequestWillBeSentTimestamp).to.eq(secondPreRequest.cdpRequestWillBeSentTimestamp)
    expect(arg.cdpRequestWillBeSentReceivedTimestamp).to.eq(secondPreRequest.cdpRequestWillBeSentReceivedTimestamp)
    expect(arg.proxyRequestReceivedTimestamp).to.be.a('number')
    expect(arg.cdpLagDuration).to.eq(secondPreRequest.cdpRequestWillBeSentReceivedTimestamp - secondPreRequest.cdpRequestWillBeSentTimestamp)
    expect(arg.proxyRequestCorrelationDuration).to.eq(secondPreRequest.cdpRequestWillBeSentReceivedTimestamp - arg.proxyRequestReceivedTimestamp)

    expectPendingCounts(0, 2)
  })

  it('synchronously matches a request without a pre-request that existed at the time of the request', () => {
    // should match in order
    preRequests.addPendingUrlWithoutPreRequest('foo')
    preRequests.addPendingUrlWithoutPreRequest('foo')
    preRequests.addPendingUrlWithoutPreRequest('foo')

    expectPendingCounts(0, 0, 3)

    const cb = sinon.stub()

    preRequests.get({ proxiedUrl: 'foo', method: 'GET' } as CypressIncomingRequest, () => {}, cb)

    const { args } = cb.getCall(0)
    const arg = args[0]

    expect(arg).to.be.undefined

    expectPendingCounts(0, 0, 2)
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

  it('synchronously matches a request without a pre-request added after the request', (done) => {
    const cb = (preRequest) => {
      expect(preRequest).to.be.undefined
      expectPendingCounts(0, 0)
      done()
    }

    preRequests.get({ proxiedUrl: 'foo', method: 'GET' } as CypressIncomingRequest, () => {}, cb)
    preRequests.addPendingUrlWithoutPreRequest('foo')
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
      cdpRequestWillBeSentTimestamp: 1,
      cdpRequestWillBeSentReceivedTimestamp: performance.now() + performance.timeOrigin + 10000,
    }

    preRequests.addPending(browserPreRequest)

    expectPendingCounts(0, 0)

    const arg = (protocolManager.responseStreamTimedOut as any).getCall(0).args[0]

    expect(arg.requestId).to.eq(browserPreRequest.requestId)
    expect(arg.timings.cdpRequestWillBeSentTimestamp).to.eq(browserPreRequest.cdpRequestWillBeSentTimestamp)
    expect(arg.timings.cdpRequestWillBeSentReceivedTimestamp).to.eq(browserPreRequest.cdpRequestWillBeSentReceivedTimestamp)
    expect(arg.timings.proxyRequestReceivedTimestamp).to.be.a('number')
    expect(arg.timings.cdpLagDuration).to.eq(browserPreRequest.cdpRequestWillBeSentReceivedTimestamp - browserPreRequest.cdpRequestWillBeSentTimestamp)
    expect(arg.timings.proxyRequestCorrelationDuration).to.eq(browserPreRequest.cdpRequestWillBeSentReceivedTimestamp - arg.timings.proxyRequestReceivedTimestamp)
  })

  // https://github.com/cypress-io/cypress/issues/17853
  it('eventually discards pre-requests that don\'t match requests', (done) => {
    preRequests = new PreRequests(10, 200)
    preRequests.addPending({ requestId: '1234', url: 'foo', method: 'GET', cdpRequestWillBeSentReceivedTimestamp: performance.now() + performance.timeOrigin } as BrowserPreRequest)
    preRequests.addPendingUrlWithoutPreRequest('bar')

    // preRequests garbage collects pre-requests that never matched up with an incoming request after around
    // 2 * requestTimeout. We verify that it's gone (and therefore not leaking memory) by sending in a request
    // and assuring that the pre-request wasn't there to be matched anymore.
    setTimeout(() => {
      const cb = (preRequest) => {
        expect(preRequest).to.be.undefined
        expectPendingCounts(1, 0, 0)
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
