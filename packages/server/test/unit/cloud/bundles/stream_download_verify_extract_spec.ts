import { proxyquire, sinon } from '../../../spec_helper'
import { mkdtemp, remove } from 'fs-extra'
import os from 'os'
import path from 'path'
import { SystemError } from '../../../../lib/cloud/network/system_error'
import { isRetryableError } from '../../../../lib/cloud/network/is_retryable_error'

describe('streamDownloadVerifyExtract', () => {
  let tmp: string

  beforeEach(async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), 'cy-stream-test-'))
  })

  afterEach(async () => {
    await remove(tmp).catch(() => { /* ignore */ })
  })

  it('wraps fetch timeout (AbortError) as a retryable SystemError so asyncRetry burns the full budget', async () => {
    const abortError = Object.assign(new Error('The user aborted a request.'), { name: 'AbortError' })
    const fetchStub = sinon.stub().rejects(abortError)

    // Pass-through asyncRetry but collapse the linear delay so the test
    // doesn't sit in real setTimeouts for ~1.5s while the budget burns.
    const { asyncRetry } = require('../../../../lib/util/async_retry')

    const { streamDownloadVerifyExtract } = proxyquire('../lib/cloud/bundles/stream_download_verify_extract', {
      'cross-fetch': fetchStub,
      '../../util/async_retry': {
        asyncRetry,
        linearDelay: () => () => 1,
      },
    })

    let caught: any

    try {
      await streamDownloadVerifyExtract({
        url: 'https://cdn.cypress.io/cy-prompt/abc123.tar',
        staging: path.join(tmp, 'staging'),
        kind: 'cy-prompt',
      })
    } catch (err) {
      caught = err
    }

    // Full retry budget consumed (asyncRetry maxAttempts: 3)
    expect(fetchStub.callCount).to.equal(3)

    // Every attempt's error is a retryable SystemError so future tweaks to
    // the retry harness can't silently regress this back to a single attempt.
    const errs: Error[] = caught?.errors ?? [caught]

    expect(errs.length).to.equal(3)
    for (const e of errs) {
      expect(SystemError.isSystemError(e as any), `${e?.message} should be a SystemError`).to.equal(true)
      expect(isRetryableError(e), `${e?.message} should be retryable`).to.equal(true)
      expect((e as SystemError).code).to.equal('ETIMEDOUT')
    }
  })
})
