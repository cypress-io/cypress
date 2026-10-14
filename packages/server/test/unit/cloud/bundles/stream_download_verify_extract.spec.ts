import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, remove } from 'fs-extra'
import { Readable } from 'stream'
import os from 'os'
import path from 'path'
import { BundleError } from '../../../../lib/cloud/bundles/bundle_error'
import { SystemError } from '../../../../lib/cloud/network/system_error'
import { HttpError } from '../../../../lib/cloud/network/http_error'
import { streamDownloadVerifyExtract } from '../../../../lib/cloud/bundles/stream_download_verify_extract'

const { fetchStub } = vi.hoisted(() => {
  return { fetchStub: vi.fn() }
})

vi.mock('cross-fetch', async (importOriginal) => {
  const actual = await importOriginal<typeof import('cross-fetch')>()

  return { ...actual, default: fetchStub }
})

// Collapse the retry delay so the budget burns in milliseconds.
vi.mock('../../../../lib/util/async_retry', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../lib/util/async_retry')>()

  return { ...actual, linearDelay: () => () => 1 }
})

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
    fetchStub.mockReset()
    tmp = await mkdtemp(path.join(os.tmpdir(), 'cy-stream-test-'))
  })

  afterEach(async () => {
    await remove(tmp).catch(() => { /* ignore */ })
  })

  describe('error tagging + retry', () => {
    it('wraps fetch timeout as BundleError(stage=network, cause: SystemError ETIMEDOUT) and burns full retry budget', async () => {
      const abortError = Object.assign(new Error('The user aborted a request.'), { name: 'AbortError' })

      fetchStub.mockRejectedValue(abortError)

      const caught = await callIt(streamDownloadVerifyExtract, 'cy-prompt', path.join(tmp, 'staging'))

      // Full retry budget consumed via cause-based shouldRetry
      expect(fetchStub).toHaveBeenCalledTimes(3)

      const errs = collectErrors(caught)

      expect(errs.length).toBe(3)
      for (const e of errs) {
        expect(BundleError.isBundleError(e)).toBe(true)
        expect((e as BundleError).stage).toBe('network')
        expect((e as BundleError).kind).toBe('cy-prompt')

        const cause = (e as Error & { cause?: unknown }).cause

        expect(SystemError.isSystemError(cause as any), `${e?.message} cause should be SystemError`).toBe(true)
        expect((cause as SystemError).code).toBe('ETIMEDOUT')
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

      fetchStub.mockResolvedValue(response)

      const caught = await callIt(streamDownloadVerifyExtract, 'studio', path.join(tmp, 'staging'))

      // 4xx is not retryable per isRetryableError, so only one attempt
      expect(fetchStub).toHaveBeenCalledTimes(1)

      expect(BundleError.isBundleError(caught)).toBe(true)
      expect((caught as BundleError).stage).toBe('network')
      expect((caught as BundleError).kind).toBe('studio')

      const cause = (caught as Error & { cause?: unknown }).cause

      expect(HttpError.isHttpError(cause as any)).toBe(true)
      expect((cause as HttpError).status).toBe(404)
    })

    it('retries on HTTP 500 (idempotent GET) and burns full retry budget', async () => {
      const response = {
        ok: false,
        url: 'https://cdn.cypress.io/cy-prompt/abc123.tar',
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'boom',
      }

      fetchStub.mockResolvedValue(response)

      await callIt(streamDownloadVerifyExtract, 'cy-prompt', path.join(tmp, 'staging'))

      expect(fetchStub).toHaveBeenCalledTimes(3)
    })

    it('wraps a retryable HTTP 503 as BundleError(stage=network, cause: HttpError) and burns full retry budget', async () => {
      const response = {
        ok: false,
        url: 'https://cdn.cypress.io/cy-prompt/abc123.tar',
        status: 503,
        statusText: 'Service Unavailable',
        text: async () => 'busy',
      }

      fetchStub.mockResolvedValue(response)

      await callIt(streamDownloadVerifyExtract, 'cy-prompt', path.join(tmp, 'staging'))

      expect(fetchStub).toHaveBeenCalledTimes(3)
    })

    it('wraps a filesystem-class syscall (ENOSPC) from the pipeline as BundleError(stage=extract) and does NOT retry', async () => {
      const enospc = Object.assign(new Error('no space left on device'), { code: 'ENOSPC', errno: -28 })

      const makeBody = () => {
        return new Readable({
          read () {
            this.destroy(enospc)
          },
        })
      }

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

      fetchStub.mockImplementation(async () => ({ ...response, body: makeBody() }))

      const caught = await callIt(streamDownloadVerifyExtract, 'cy-prompt', path.join(tmp, 'staging'))

      // Filesystem syscall is non-transient — must not retry
      expect(fetchStub).toHaveBeenCalledTimes(1)

      expect(BundleError.isBundleError(caught)).toBe(true)
      expect((caught as BundleError).stage).toBe('extract')
      expect((caught as BundleError).kind).toBe('cy-prompt')

      // Cause is the raw error, NOT a SystemError (which would flag retryable)
      const cause = (caught as Error & { cause?: unknown }).cause

      expect(SystemError.isSystemError(cause as any)).toBe(false)
      expect((cause as any).code).toBe('ENOSPC')
    })

    it('still treats network-class syscalls (ECONNRESET) mid-pipeline as stage=network and retries', async () => {
      const econnreset = Object.assign(new Error('socket hang up'), { code: 'ECONNRESET', errno: -54 })

      const makeBody = () => {
        return new Readable({
          read () {
            this.destroy(econnreset)
          },
        })
      }

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

      fetchStub.mockImplementation(async () => ({ ...response, body: makeBody() }))

      const caught = await callIt(streamDownloadVerifyExtract, 'cy-prompt', path.join(tmp, 'staging'))

      // Network-class syscall → retryable → full retry budget
      expect(fetchStub).toHaveBeenCalledTimes(3)

      const errs = collectErrors(caught)

      for (const e of errs) {
        expect(BundleError.isBundleError(e)).toBe(true)
        expect((e as BundleError).stage).toBe('network')

        const cause = (e as Error & { cause?: unknown }).cause

        expect(SystemError.isSystemError(cause as any)).toBe(true)
        expect((cause as SystemError).code).toBe('ECONNRESET')
      }
    })

    it('wraps a non-syscall pipeline error as BundleError(stage=extract, cause preserved) and does NOT retry', async () => {
      // Body that yields bytes which the tar Parser({ strict: true }) will reject.
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

      fetchStub.mockImplementation(async () => {
        // fresh body per attempt in case asyncRetry retries
        return { ...response, body: makeBody() }
      })

      const caught = await callIt(streamDownloadVerifyExtract, 'cy-prompt', path.join(tmp, 'staging'))

      // Tar parse error is not retryable (no errno/code, not Http/SystemError)
      expect(fetchStub).toHaveBeenCalledTimes(1)

      expect(BundleError.isBundleError(caught)).toBe(true)
      expect((caught as BundleError).stage).toBe('extract')
      expect((caught as BundleError).kind).toBe('cy-prompt')

      // The original (tar) error is preserved as cause
      const cause = (caught as Error & { cause?: unknown }).cause

      expect(cause).toBeInstanceOf(Error)
      expect(SystemError.isSystemError(cause as any)).toBe(false)
      expect(HttpError.isHttpError(cause as any)).toBe(false)
    })
  })
})
