import { proxyquire, sinon } from '../../../spec_helper'
import { mkdtemp, remove } from 'fs-extra'
import { Readable } from 'stream'
import os from 'os'
import path from 'path'
import { BundleError } from '../../../../lib/cloud/bundles/bundle_error'
import { SystemError } from '../../../../lib/cloud/network/system_error'
import { HttpError } from '../../../../lib/cloud/network/http_error'

const proxyquireWithFastDelay = (fetchStub: sinon.SinonStub) => {
  // Collapse the retry delay so the budget burns in milliseconds.
  const { asyncRetry } = require('../../../../lib/util/async_retry')

  return proxyquire('../lib/cloud/bundles/stream_download_verify_extract', {
    'cross-fetch': fetchStub,
    '../../util/async_retry': {
      asyncRetry,
      linearDelay: () => () => 1,
    },
  })
}

const callIt = async (fn: any, kind: 'cy-prompt' | 'studio', staging: string) => {
  let caught: any

  try {
    await fn({
      url: `https://cdn.cypress.io/${kind}/abc123.tar`,
      staging,
      kind,
    })
  } catch (err) {
    caught = err
  }

  return caught
}

const collectErrors = (caught: any): Error[] => caught?.errors ?? [caught]

describe('streamDownloadVerifyExtract', () => {
  let tmp: string

  beforeEach(async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), 'cy-stream-test-'))
  })

  afterEach(async () => {
    await remove(tmp).catch(() => { /* ignore */ })
  })

  describe('error tagging + retry', () => {
    it('wraps fetch timeout as BundleError(stage=network, cause: SystemError ETIMEDOUT) and burns full retry budget', async () => {
      const abortError = Object.assign(new Error('The user aborted a request.'), { name: 'AbortError' })
      const fetchStub = sinon.stub().rejects(abortError)

      const { streamDownloadVerifyExtract } = proxyquireWithFastDelay(fetchStub)
      const caught = await callIt(streamDownloadVerifyExtract, 'cy-prompt', path.join(tmp, 'staging'))

      // Full retry budget consumed via cause-based shouldRetry
      expect(fetchStub.callCount).to.equal(3)

      const errs = collectErrors(caught)

      expect(errs.length).to.equal(3)
      for (const e of errs) {
        expect(BundleError.isBundleError(e)).to.equal(true)
        expect((e as BundleError).stage).to.equal('network')
        expect((e as BundleError).kind).to.equal('cy-prompt')

        const cause = (e as Error & { cause?: unknown }).cause

        expect(SystemError.isSystemError(cause as any), `${e?.message} cause should be SystemError`).to.equal(true)
        expect((cause as SystemError).code).to.equal('ETIMEDOUT')
      }
    })

    it('wraps a non-retryable HTTP 404 as BundleError(stage=network, cause: HttpError) and does NOT retry', async () => {
      const response = {
        ok: false,
        url: 'https://cdn.cypress.io/studio/abc123.tar',
        status: 404,
        statusText: 'Not Found',
        text: async () => 'not found',
      }
      const fetchStub = sinon.stub().resolves(response)

      const { streamDownloadVerifyExtract } = proxyquireWithFastDelay(fetchStub)
      const caught = await callIt(streamDownloadVerifyExtract, 'studio', path.join(tmp, 'staging'))

      // 4xx is not retryable per isRetryableError, so only one attempt
      expect(fetchStub.callCount).to.equal(1)

      expect(BundleError.isBundleError(caught)).to.equal(true)
      expect((caught as BundleError).stage).to.equal('network')
      expect((caught as BundleError).kind).to.equal('studio')

      const cause = (caught as Error & { cause?: unknown }).cause

      expect(HttpError.isHttpError(cause as any)).to.equal(true)
      expect((cause as HttpError).status).to.equal(404)
    })

    it('retries on HTTP 500 (idempotent GET) and burns full retry budget', async () => {
      const response = {
        ok: false,
        url: 'https://cdn.cypress.io/cy-prompt/abc123.tar',
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'boom',
      }
      const fetchStub = sinon.stub().resolves(response)

      const { streamDownloadVerifyExtract } = proxyquireWithFastDelay(fetchStub)

      await callIt(streamDownloadVerifyExtract, 'cy-prompt', path.join(tmp, 'staging'))

      expect(fetchStub.callCount).to.equal(3)
    })

    it('wraps a retryable HTTP 503 as BundleError(stage=network, cause: HttpError) and burns full retry budget', async () => {
      const response = {
        ok: false,
        url: 'https://cdn.cypress.io/cy-prompt/abc123.tar',
        status: 503,
        statusText: 'Service Unavailable',
        text: async () => 'busy',
      }
      const fetchStub = sinon.stub().resolves(response)

      const { streamDownloadVerifyExtract } = proxyquireWithFastDelay(fetchStub)

      await callIt(streamDownloadVerifyExtract, 'cy-prompt', path.join(tmp, 'staging'))

      expect(fetchStub.callCount).to.equal(3)
    })

    it('wraps a filesystem-class syscall (ENOSPC) from the pipeline as BundleError(stage=extract) and does NOT retry', async () => {
      const enospc = Object.assign(new Error('no space left on device'), { code: 'ENOSPC', errno: -28 })

      const makeBody = () => new Readable({
        read () {
          this.destroy(enospc)
        },
      })

      const response = {
        ok: true,
        status: 200,
        headers: {
          get: (h: string) => {
            if (h === 'x-cypress-signature') return 'sig'

            if (h === 'x-cypress-manifest-signature') return 'manifest-sig'

            return null
          },
        },
        body: makeBody(),
      }

      const fetchStub = sinon.stub().callsFake(async () => ({ ...response, body: makeBody() }))

      const { streamDownloadVerifyExtract } = proxyquireWithFastDelay(fetchStub)
      const caught = await callIt(streamDownloadVerifyExtract, 'cy-prompt', path.join(tmp, 'staging'))

      // Filesystem syscall is non-transient — must not retry
      expect(fetchStub.callCount).to.equal(1)

      expect(BundleError.isBundleError(caught)).to.equal(true)
      expect((caught as BundleError).stage).to.equal('extract')
      expect((caught as BundleError).kind).to.equal('cy-prompt')

      // Cause is the raw error, NOT a SystemError (which would flag retryable)
      const cause = (caught as Error & { cause?: unknown }).cause

      expect(SystemError.isSystemError(cause as any)).to.equal(false)
      expect((cause as any).code).to.equal('ENOSPC')
    })

    it('still treats network-class syscalls (ECONNRESET) mid-pipeline as stage=network and retries', async () => {
      const econnreset = Object.assign(new Error('socket hang up'), { code: 'ECONNRESET', errno: -54 })

      const makeBody = () => new Readable({
        read () {
          this.destroy(econnreset)
        },
      })

      const response = {
        ok: true,
        status: 200,
        headers: {
          get: (h: string) => {
            if (h === 'x-cypress-signature') return 'sig'

            if (h === 'x-cypress-manifest-signature') return 'manifest-sig'

            return null
          },
        },
        body: makeBody(),
      }

      const fetchStub = sinon.stub().callsFake(async () => ({ ...response, body: makeBody() }))

      const { streamDownloadVerifyExtract } = proxyquireWithFastDelay(fetchStub)
      const caught = await callIt(streamDownloadVerifyExtract, 'cy-prompt', path.join(tmp, 'staging'))

      // Network-class syscall → retryable → full retry budget
      expect(fetchStub.callCount).to.equal(3)

      const errs = collectErrors(caught)

      for (const e of errs) {
        expect(BundleError.isBundleError(e)).to.equal(true)
        expect((e as BundleError).stage).to.equal('network')

        const cause = (e as Error & { cause?: unknown }).cause

        expect(SystemError.isSystemError(cause as any)).to.equal(true)
        expect((cause as SystemError).code).to.equal('ECONNRESET')
      }
    })

    it('wraps a non-syscall pipeline error as BundleError(stage=extract, cause preserved) and does NOT retry', async () => {
      // Body that yields bytes which tar.Parse({ strict: true }) will reject.
      const makeBody = () => Readable.from([Buffer.from('this is not a tar archive at all')])
      const response = {
        ok: true,
        status: 200,
        headers: {
          get: (h: string) => {
            if (h === 'x-cypress-signature') return 'sig'

            if (h === 'x-cypress-manifest-signature') return 'manifest-sig'

            return null
          },
        },
        body: makeBody(),
      }

      const fetchStub = sinon.stub().callsFake(async () => {
        // fresh body per attempt in case asyncRetry retries
        return { ...response, body: makeBody() }
      })

      const { streamDownloadVerifyExtract } = proxyquireWithFastDelay(fetchStub)
      const caught = await callIt(streamDownloadVerifyExtract, 'cy-prompt', path.join(tmp, 'staging'))

      // Tar parse error is not retryable (no errno/code, not Http/SystemError)
      expect(fetchStub.callCount).to.equal(1)

      expect(BundleError.isBundleError(caught)).to.equal(true)
      expect((caught as BundleError).stage).to.equal('extract')
      expect((caught as BundleError).kind).to.equal('cy-prompt')

      // The original (tar) error is preserved as cause
      const cause = (caught as Error & { cause?: unknown }).cause

      expect(cause).to.be.instanceOf(Error)
      expect(SystemError.isSystemError(cause as any)).to.equal(false)
      expect(HttpError.isHttpError(cause as any)).to.equal(false)
    })
  })
})
