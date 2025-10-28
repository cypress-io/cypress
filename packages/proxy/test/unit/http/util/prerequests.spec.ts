import { describe, expect, it, vi } from 'vitest'
import { CorrelationInformation, PreRequests } from '@packages/proxy/lib/http/util/prerequests'
import { BrowserPreRequest, CypressIncomingRequest } from '@packages/proxy'
import { performance } from 'perf_hooks'
import { ProtocolManagerShape } from '@packages/types'

describe('http/util/prerequests', () => {
  let preRequests: PreRequests
  let protocolManager: ProtocolManagerShape

  function expectPendingCounts (pendingRequests: number, pendingPreRequests: number, pendingWithoutPreRequests = 0, pendingPreRequestsToRemove = 0) {
    expect(preRequests.pendingRequests.length, 'wrong number of pending requests').toEqual(pendingRequests)
    expect(preRequests.pendingPreRequests.length, 'wrong number of pending prerequests').toEqual(pendingPreRequests)
    expect(preRequests.pendingUrlsWithoutPreRequests.length, 'wrong number of pending without prerequests').toEqual(pendingWithoutPreRequests)
    expect(preRequests.pendingPreRequestsToRemove.size, 'wrong number of pending prerequests to remove').toEqual(pendingPreRequestsToRemove)
  }

  beforeEach(() => {
    vi.resetAllMocks()
    preRequests = new PreRequests(10)
    protocolManager = {
      responseStreamTimedOut: vi.fn(),
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
      documentURL: 'foo',
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
      documentURL: 'foo',
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
      documentURL: 'foo',
      cdpRequestWillBeSentTimestamp: 1,
      cdpRequestWillBeSentReceivedTimestamp: 2,
    })

    expectPendingCounts(0, 3)

    const cb = vi.fn()

    preRequests.get({ proxiedUrl: 'foo', method: 'GET', headers: {} } as CypressIncomingRequest, () => {}, cb)

    const { browserPreRequest, noPreRequestExpected } = cb.mock.calls[0][0]

    expect(browserPreRequest.requestId).toEqual(secondPreRequest.requestId)
    expect(browserPreRequest.url).toEqual(secondPreRequest.url)
    expect(browserPreRequest.method).toEqual(secondPreRequest.method)
    expect(browserPreRequest.headers).toEqual(secondPreRequest.headers)
    expect(browserPreRequest.resourceType).toEqual(secondPreRequest.resourceType)
    expect(browserPreRequest.originalResourceType).toEqual(secondPreRequest.originalResourceType)
    expect(browserPreRequest.cdpRequestWillBeSentTimestamp).toEqual(secondPreRequest.cdpRequestWillBeSentTimestamp)
    expect(browserPreRequest.cdpRequestWillBeSentReceivedTimestamp).toEqual(secondPreRequest.cdpRequestWillBeSentReceivedTimestamp)
    expect(browserPreRequest.proxyRequestReceivedTimestamp).toBeTypeOf('number')
    expect(browserPreRequest.cdpLagDuration).toEqual(secondPreRequest.cdpRequestWillBeSentReceivedTimestamp - secondPreRequest.cdpRequestWillBeSentTimestamp)
    expect(browserPreRequest.proxyRequestCorrelationDuration).toEqual(secondPreRequest.cdpRequestWillBeSentReceivedTimestamp - browserPreRequest.proxyRequestReceivedTimestamp)

    expect(noPreRequestExpected).toBe(false)

    expectPendingCounts(0, 2)
  })

  it('synchronously matches a request without a pre-request that existed at the time of the request', () => {
    // should match in order
    preRequests.addPendingUrlWithoutPreRequest('foo')
    preRequests.addPendingUrlWithoutPreRequest('foo')
    preRequests.addPendingUrlWithoutPreRequest('foo')

    expectPendingCounts(0, 0, 3)

    const cb = vi.fn()

    preRequests.get({ proxiedUrl: 'foo', method: 'GET', headers: {} } as CypressIncomingRequest, () => {}, cb)

    const { preRequest, noPreRequestExpected } = cb.mock.calls[0][0]

    expect(preRequest).toBeUndefined()
    expect(noPreRequestExpected).toBe(true)

    expectPendingCounts(0, 0, 2)
  })

  it('synchronously matches a pre-request added after the request', () => {
    return new Promise<void>((resolve) => {
      preRequests.get({ proxiedUrl: 'foo', method: 'GET', headers: {} } as CypressIncomingRequest, () => {}, ({ browserPreRequest, noPreRequestExpected }: CorrelationInformation) => {
        expect(browserPreRequest).toEqual(expect.objectContaining({ requestId: '1234', url: 'foo', method: 'GET' }))
        expect(noPreRequestExpected).toBe(false)
        expectPendingCounts(0, 0)
        resolve()
      })

      preRequests.addPending({ requestId: '1234', url: 'foo', method: 'GET' } as BrowserPreRequest)
    })
  })

  it('synchronously matches a request without a pre-request added after the request', () => {
    return new Promise<void>((resolve) => {
      preRequests.get({ proxiedUrl: 'foo', method: 'GET', headers: {} } as CypressIncomingRequest, () => {}, ({ browserPreRequest, noPreRequestExpected }: CorrelationInformation) => {
        expect(browserPreRequest).toBeUndefined()
        expect(noPreRequestExpected).toBe(true)
        expectPendingCounts(0, 0)
        resolve()
      })

      preRequests.addPendingUrlWithoutPreRequest('foo')
    })
  })

  it('invokes a request callback after a timeout if no pre-request occurs', async () => {
    let cb
    const cbPromise = new Promise<void>((resolve) => {
      cb = ({ browserPreRequest, noPreRequestExpected }: CorrelationInformation) => {
        expect(browserPreRequest).toBeUndefined()
        expect(noPreRequestExpected).toBe(false)

        // we should have keep the pending request to eventually be correlated later, but don't block the body in the meantime
        expectPendingCounts(1, 0)

        resolve()
      }
    })

    preRequests.get({ proxiedUrl: 'foo', method: 'GET', headers: {} } as CypressIncomingRequest, () => {}, cb)

    await cbPromise

    const browserPreRequest: BrowserPreRequest = {
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

    preRequests.addPending(browserPreRequest)

    expectPendingCounts(0, 0)

    const { requestId, timings } = vi.mocked(protocolManager.responseStreamTimedOut).mock.calls[0][0]

    expect(requestId).toEqual(browserPreRequest.requestId)
    expect(timings.cdpRequestWillBeSentTimestamp).toEqual(browserPreRequest.cdpRequestWillBeSentTimestamp)
    expect(timings.cdpRequestWillBeSentReceivedTimestamp).toEqual(browserPreRequest.cdpRequestWillBeSentReceivedTimestamp)
    expect(timings.proxyRequestReceivedTimestamp).toBeTypeOf('number')
    expect(timings.cdpLagDuration).toEqual(browserPreRequest.cdpRequestWillBeSentReceivedTimestamp - browserPreRequest.cdpRequestWillBeSentTimestamp)
    expect(timings.proxyRequestCorrelationDuration).toEqual(browserPreRequest.cdpRequestWillBeSentReceivedTimestamp - timings.proxyRequestReceivedTimestamp)
  })

  // https://github.com/cypress-io/cypress/issues/17853
  it('eventually discards pre-requests that don\'t match requests', () => {
    preRequests = new PreRequests(10, 200)
    preRequests.addPending({ requestId: '1234', url: 'foo', method: 'GET', cdpRequestWillBeSentReceivedTimestamp: performance.now() + performance.timeOrigin } as BrowserPreRequest)
    preRequests.addPendingUrlWithoutPreRequest('bar')
    preRequests.removePendingPreRequest('12345')

    expectPendingCounts(0, 1, 1, 1)

    // preRequests garbage collects pre-requests that never matched up with an incoming request after around
    // 2 * requestTimeout. We verify that it's gone (and therefore not leaking memory) by sending in a request
    // and assuring that the pre-request wasn't there to be matched anymore.
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const cb = ({ browserPreRequest, noPreRequestExpected }: CorrelationInformation) => {
          expect(browserPreRequest).toBeUndefined()
          expect(noPreRequestExpected).toBe(false)
          expectPendingCounts(1, 0, 0)
          resolve()
        }

        preRequests.get({ proxiedUrl: 'foo', method: 'GET', headers: {} } as CypressIncomingRequest, () => {}, cb)
      }, 1200)
    })
  })

  it('removes a pre-request with a matching requestId', () => {
    preRequests.addPending({ requestId: '1234', url: 'foo', method: 'GET' } as BrowserPreRequest)
    preRequests.addPending({ requestId: '1235', url: 'foo', method: 'GET' } as BrowserPreRequest)
    preRequests.addPending({ requestId: '1236', url: 'foo', method: 'GET' } as BrowserPreRequest)

    expectPendingCounts(0, 3)

    preRequests.removePendingPreRequest('1235')

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

    preRequests.removePendingPreRequest('1235')

    expectPendingCounts(0, 2)
  })

  it('adds to pending pre-requests to remove if the pre-request is not found', () => {
    expectPendingCounts(0, 0)

    // remove a pre-request that doesn't exist yet
    preRequests.removePendingPreRequest('1235')

    expectPendingCounts(0, 0, 0, 1)

    // add a pre-request that matches the pending removal
    preRequests.addPending({ requestId: '1235', url: 'foo', method: 'GET' } as BrowserPreRequest)

    expectPendingCounts(0, 0)
  })

  it('removes a pending request', () => {
    const cb = vi.fn()

    const firstPreRequest = preRequests.get({ proxiedUrl: 'foo', method: 'GET', headers: {} } as CypressIncomingRequest, () => {}, cb)
    const secondPreRequest = preRequests.get({ proxiedUrl: 'foo', method: 'GET', headers: {} } as CypressIncomingRequest, () => {}, cb)

    expectPendingCounts(2, 0)

    preRequests.removePendingRequest(firstPreRequest!)

    expectPendingCounts(1, 0)

    preRequests.removePendingRequest(firstPreRequest!)

    expectPendingCounts(1, 0)

    preRequests.removePendingRequest(secondPreRequest!)

    expectPendingCounts(0, 0)
  })

  it('resets the queues and service worker manager', () => {
    let callbackCalled = false

    preRequests.addPending({ requestId: '1234', url: 'bar', method: 'GET' } as BrowserPreRequest)
    preRequests.get({ proxiedUrl: 'foo', method: 'GET', headers: {} } as CypressIncomingRequest, () => {}, () => {
      callbackCalled = true
    })

    preRequests.addPendingUrlWithoutPreRequest('baz')

    expectPendingCounts(1, 1, 1)

    preRequests.reset()

    expectPendingCounts(0, 0, 0)

    expect(callbackCalled).toBe(true)
  })

  it('decodes the proxied url', () => {
    preRequests.get({ proxiedUrl: 'foo%7Cbar', method: 'GET', headers: {} } as CypressIncomingRequest, () => {}, () => {})

    expect(preRequests.pendingRequests.length).toEqual(1)
    expect(preRequests.pendingRequests.shift('GET-foo|bar')).toBeDefined()
  })

  it('decodes the pending url without pre-request', () => {
    preRequests.addPendingUrlWithoutPreRequest('foo%7Cbar')

    expect(preRequests.pendingUrlsWithoutPreRequests.length).toEqual(1)
    expect(preRequests.pendingUrlsWithoutPreRequests.shift('GET-foo|bar')).toBeDefined()
  })

  it('decodes pending url', () => {
    preRequests.addPending({ requestId: '1234', url: 'foo%7Cbar', method: 'GET' } as BrowserPreRequest)

    expect(preRequests.pendingPreRequests.length).toEqual(1)
    expect(preRequests.pendingPreRequests.shift('GET-foo|bar')).toBeDefined()
  })

  it('does not remove pre-requests when sweeping if cdpRequestWillBeSentReceivedTimestamp is 0', async () => {
    // set the current time to 1000 ms
    vi.spyOn(Date, 'now').mockReturnValue(1000)

    // set a sweeper timer of 10 ms
    preRequests = new PreRequests(10, 10)
    preRequests.setProtocolManager(protocolManager)

    preRequests.addPending({ requestId: '1234', url: 'foo', method: 'GET', cdpRequestWillBeSentReceivedTimestamp: 0 } as BrowserPreRequest)

    // give the sweeper plenty of time to run. Iur request should still not be removed
    await new Promise((resolve) => setTimeout(resolve, 1000))

    expect(preRequests.pendingPreRequests.length).toEqual(1)
  })
})
