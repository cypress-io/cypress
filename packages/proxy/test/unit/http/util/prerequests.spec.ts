import { PreRequests } from '@packages/proxy/lib/http/util/prerequests'
import { BrowserPreRequest, CypressIncomingRequest } from '@packages/proxy'
import { expect } from 'chai'
import sinon from 'sinon'

describe('http/util/prerequests', () => {
  let preRequests: PreRequests

  beforeEach(() => {
    preRequests = new PreRequests(10)
  })

  afterEach(() => {
    clearInterval(preRequests.sweepInterval)
  })

  it('synchronously matches a pre-request that existed at the time of the request', () => {
    // should match in reverse order
    preRequests.addPending({ requestId: '1234', url: 'foo', method: 'WRONGMETHOD' } as BrowserPreRequest)
    preRequests.addPending({ requestId: '1234', url: 'foo', method: 'GET' } as BrowserPreRequest)

    const cb = sinon.stub()

    preRequests.get({ proxiedUrl: 'foo', method: 'GET' } as CypressIncomingRequest, () => {}, cb)

    const { args } = cb.getCall(0)

    expect(args[0]).to.include({ requestId: '1234', url: 'foo', method: 'GET' })
  })

  it('synchronously matches a pre-request added after the request', (done) => {
    const cb = (preRequest) => {
      expect(preRequest).to.include({ requestId: '1234', url: 'foo', method: 'GET' })
      done()
    }

    preRequests.get({ proxiedUrl: 'foo', method: 'GET' } as CypressIncomingRequest, () => {}, cb)
    preRequests.addPending({ requestId: '1234', url: 'foo', method: 'GET' } as BrowserPreRequest)
  })

  it('invokes a request callback after a timeout if no pre-request occurs', (done) => {
    const cb = (preRequest) => {
      expect(preRequest).to.be.undefined
      done()
    }

    preRequests.get({ proxiedUrl: 'foo', method: 'GET' } as CypressIncomingRequest, () => {}, cb)
  })

  // https://github.com/cypress-io/cypress/issues/17853
  it('eventually discards pre-requests that don\'t match requests', (done) => {
    preRequests.addPending({ requestId: '1234', url: 'foo', method: 'GET' } as BrowserPreRequest)

    // preRequests garbage collects pre-requests that never matched up with an incoming request after around
    // 2 * requestTimeout. We verify that it's gone (and therefore not leaking memory) by sending in a request
    // and assuring that the pre-request wasn't there to be matched anymore.
    setTimeout(() => {
      const cb = (preRequest) => {
        expect(preRequest).to.be.undefined
        done()
      }

      preRequests.get({ proxiedUrl: 'foo', method: 'GET' } as CypressIncomingRequest, () => {}, cb)
    }, 50)
  })
})
