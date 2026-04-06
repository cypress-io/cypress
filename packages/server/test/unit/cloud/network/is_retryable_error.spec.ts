import { Response } from 'cross-fetch'
import { describe, expect, it } from 'vitest'

import { isRetryableError } from '../../../../lib/cloud/network/is_retryable_error'
import { HttpError } from '../../../../lib/cloud/network/http_error'
import { SystemError } from '../../../../lib/cloud/network/system_error'

describe('isRetryableError', () => {
  const url = 'http://some/url'

  it('returns true with a NetworkError', () => {
    expect(isRetryableError(new SystemError(new Error(), url, 'ECONNRESET', 100))).toBe(true)
  })

  it('returns true with retryable http errors', () => {
    [408, 429, 502, 503, 504].forEach((status) => {
      const err = new HttpError('some error', url, status, 'status text', 'response_body', new Response())

      expect(isRetryableError(err)).toBe(true)
    })
  })

  it('returns false with non-retryable http errors', () => {
    [400, 401, 402, 403, 404, 405, 406, 407, 409, 410, 411, 412, 413, 414, 416, 417, 418, 421, 422, 423, 424, 425, 426, 428, 431, 451, 500, 501, 505, 507, 508, 510, 511].forEach((status) => {
      const err = new HttpError('some error', url, status, 'status text', 'response_body', new Response())

      expect(isRetryableError(err)).toBe(false)
    })
  })

  it('returns false with non-retryable cert errors', () => {
    const err1 = new SystemError(new Error(), url, 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 100)
    const err2 = new SystemError(new Error(), url, 'DEPTH_ZERO_SELF_SIGNED_CERT', 100)
    const err3 = new SystemError(new Error(), url, 'SELF_SIGNED_CERT_IN_CHAIN', 100)
    const err4 = new SystemError(new Error(), url, 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY', 100)

    expect(isRetryableError(err1)).toBe(false)
    expect(isRetryableError(err2)).toBe(false)
    expect(isRetryableError(err3)).toBe(false)
    expect(isRetryableError(err4)).toBe(false)
  })

  it('returns false for other errors', () => {
    expect(isRetryableError(new Error())).toBe(false)
  })
})
