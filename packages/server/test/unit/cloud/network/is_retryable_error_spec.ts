import { isRetryableError } from '../../../../lib/cloud/network/is_retryable_error'
import { SystemError } from '../../../../lib/cloud/network/system_error'
import { HttpError } from '../../../../lib/cloud/network/http_error'

import sinon from 'sinon'
import chai, { expect } from 'chai'
import sinonChai from 'sinon-chai'

chai.use(sinonChai)

describe('isRetryableError', () => {
  const url = 'http://some/url'

  it('returns true with a NetworkError', () => {
    expect(isRetryableError(new SystemError(new Error(), url, 'ECONNRESET', 100))).to.be.true
  })

  it('returns true with retryable http errors', () => {
    [408, 429, 502, 503, 504].forEach((status) => {
      const err = new HttpError('some error', url, status, 'status text', 'response_body', sinon.createStubInstance(Response))

      expect(isRetryableError(err)).to.be.true
    })
  })

  it('returns false with non-retryable http errors', () => {
    [400, 401, 402, 403, 404, 405, 406, 407, 409, 410, 411, 412, 413, 414, 416, 417, 418, 421, 422, 423, 424, 425, 426, 428, 431, 451, 500, 501, 505, 507, 508, 510, 511].forEach((status) => {
      const err = new HttpError('some error', url, status, 'status text', 'response_body', sinon.createStubInstance(Response))

      expect(isRetryableError(err)).to.be.false
    })
  })

  it('returns false with non-retryable cert errors', () => {
    const err1 = new SystemError(new Error(), url, 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 100)
    const err2 = new SystemError(new Error(), url, 'DEPTH_ZERO_SELF_SIGNED_CERT', 100)
    const err3 = new SystemError(new Error(), url, 'SELF_SIGNED_CERT_IN_CHAIN', 100)
    const err4 = new SystemError(new Error(), url, 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY', 100)

    expect(isRetryableError(err1)).to.be.false
    expect(isRetryableError(err2)).to.be.false
    expect(isRetryableError(err3)).to.be.false
    expect(isRetryableError(err4)).to.be.false
  })

  it('returns false for other errors', () => {
    expect(isRetryableError(new Error())).to.be.false
  })

  describe('with HTTP method', () => {
    const httpError = (status: number) => new HttpError('some error', url, status, 'status text', '', sinon.createStubInstance(Response))

    it('also retries 500 for idempotent methods', () => {
      ['GET', 'HEAD', 'PUT', 'DELETE', 'OPTIONS'].forEach((method) => {
        expect(isRetryableError(httpError(500), method), `${method} 500`).to.be.true
      })
    })

    it('is case-insensitive for the method argument', () => {
      expect(isRetryableError(httpError(500), 'put')).to.be.true
      expect(isRetryableError(httpError(500), 'Get')).to.be.true
    })

    it('does not retry 500 for non-idempotent methods', () => {
      ['POST', 'PATCH'].forEach((method) => {
        expect(isRetryableError(httpError(500), method), `${method} 500`).to.be.false
      })
    })

    it('still retries the always-retryable statuses regardless of method', () => {
      ['GET', 'POST', 'PATCH', 'DELETE'].forEach((method) => {
        [408, 429, 502, 503, 504].forEach((status) => {
          expect(isRetryableError(httpError(status), method), `${method} ${status}`).to.be.true
        })
      })
    })

    it('does not retry other non-retryable statuses for idempotent methods', () => {
      [400, 404, 501].forEach((status) => {
        expect(isRetryableError(httpError(status), 'GET'), `GET ${status}`).to.be.false
      })
    })
  })
})
