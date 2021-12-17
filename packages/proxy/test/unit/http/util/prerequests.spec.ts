import { PreRequests } from '@packages/proxy/lib/http/util/prerequests'
import { BrowserPreRequest, CypressIncomingRequest } from '@packages/proxy'
import { expect } from 'chai'
import sinon from 'sinon'

describe('http/util/prerequests', () => {
  let preRequests: PreRequests

  beforeEach(() => {
    preRequests = new PreRequests()
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
})
