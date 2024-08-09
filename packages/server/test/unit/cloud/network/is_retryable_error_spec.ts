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
    expect(isRetryableError(new SystemError(new Error(), url))).to.be.true
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

  it('returns false for other errors', () => {
    expect(isRetryableError(new Error())).to.be.false
  })
})
