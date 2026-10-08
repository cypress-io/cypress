import type { Mock } from 'vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ensureDir, mkdtemp, pathExists, readdir, readFile, remove, writeFile } from 'fs-extra'
import os from 'os'
import path from 'path'
import { BundleError } from '../../../../lib/cloud/bundles/bundle_error'
import { ensureSignedBundle as realEnsureSignedBundle } from '../../../../lib/cloud/bundles/ensure_signed_bundle'

const stubs = vi.hoisted(() => {
  return {
    streamDownloadVerifyExtract: vi.fn(),
    verifySignature: vi.fn(),
    verifyBundleOnDisk: undefined as Mock | undefined,
    publishStagingToFinal: undefined as Mock | undefined,
  }
})

vi.mock('../../../../lib/cloud/bundles/stream_download_verify_extract', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../lib/cloud/bundles/stream_download_verify_extract')>()

  return { ...actual, streamDownloadVerifyExtract: stubs.streamDownloadVerifyExtract }
})

vi.mock('../../../../lib/cloud/encryption', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../lib/cloud/encryption')>()

  return { ...actual, verifySignature: stubs.verifySignature }
})

vi.mock('../../../../lib/cloud/bundles/verify_bundle_on_disk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../lib/cloud/bundles/verify_bundle_on_disk')>()

  return {
    ...actual,
    verifyBundleOnDisk: (finalDir: string) => (stubs.verifyBundleOnDisk ?? actual.verifyBundleOnDisk)(finalDir),
  }
})

vi.mock('../../../../lib/cloud/bundles/publish_staging_to_final', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../lib/cloud/bundles/publish_staging_to_final')>()

  return {
    ...actual,
    publishStagingToFinal: (staging: string, finalDir: string) => (stubs.publishStagingToFinal ?? actual.publishStagingToFinal)(staging, finalDir),
  }
})

const { publishStagingToFinal } = await vi.importActual<typeof import('../../../../lib/cloud/bundles/publish_staging_to_final')>('../../../../lib/cloud/bundles/publish_staging_to_final')

const FIXTURE_MANIFEST = { version: 1, entrypoint: 'server/index.js' }
const MANIFEST_TEXT = JSON.stringify(FIXTURE_MANIFEST)

const writeFixtureToStaging = async (staging: string) => {
  await ensureDir(path.join(staging, 'server'))
  await writeFile(path.join(staging, 'manifest.json'), MANIFEST_TEXT)
  await writeFile(path.join(staging, 'server', 'index.js'), '// server entrypoint\n')
}

const permissionError = (code = 'EACCES') => Object.assign(new Error(`${code}: permission denied`), { code })

interface SetupResult {
  ensureSignedBundle: typeof realEnsureSignedBundle
  streamStub: Mock
  verifySignatureStub: Mock
}

describe('ensureSignedBundle', () => {
  let cacheRoot: string
  let tmpRoot: string
  let originalCacheFolder: string | undefined

  beforeEach(async () => {
    cacheRoot = await mkdtemp(path.join(os.tmpdir(), 'cy-ensure-bundle-'))
    originalCacheFolder = process.env.CYPRESS_CACHE_FOLDER
    process.env.CYPRESS_CACHE_FOLDER = path.join(cacheRoot, 'primary')

    // Keep the OS temp dir fallback inside the per-test root so it's cleaned up.
    tmpRoot = path.join(cacheRoot, 'tmp')
    vi.spyOn(os, 'tmpdir').mockReturnValue(tmpRoot)
  })

  afterEach(async () => {
    vi.restoreAllMocks()

    if (originalCacheFolder === undefined) {
      delete process.env.CYPRESS_CACHE_FOLDER
    } else {
      process.env.CYPRESS_CACHE_FOLDER = originalCacheFolder
    }

    await remove(cacheRoot).catch(() => { /* ignore */ })
  })

  const setup = (overrides: Partial<{
    streamImpl: (opts: { staging: string }) => Promise<string>
    verifyResult: boolean
    verifyOnDisk: Mock
    publish: Mock
  }> = {}): SetupResult => {
    const streamStub = stubs.streamDownloadVerifyExtract

    streamStub.mockReset()
    streamStub.mockImplementation(async (opts: { staging: string }) => {
      if (overrides.streamImpl) return overrides.streamImpl(opts)

      await writeFixtureToStaging(opts.staging)

      return 'fake-manifest-sig'
    })

    const verifySignatureStub = stubs.verifySignature

    verifySignatureStub.mockReset()
    verifySignatureStub.mockResolvedValue(overrides.verifyResult ?? true)

    // Only override the on-disk verifier when a test needs a deterministic
    // cache hit/miss; otherwise the real module runs (and a fresh cacheRoot is
    // always a miss).
    stubs.verifyBundleOnDisk = overrides.verifyOnDisk
    stubs.publishStagingToFinal = overrides.publish

    return {
      ensureSignedBundle: realEnsureSignedBundle,
      streamStub,
      verifySignatureStub,
    }
  }

  it('publishes verified bundle into <cache>/bundles/<kind>/<hash>/ and returns the manifest', async () => {
    const { ensureSignedBundle, streamStub, verifySignatureStub } = setup()

    const result = await ensureSignedBundle({
      url: 'https://cdn.cypress.io/cy-prompt/abc123.tar',
      projectId: 'proj-1',
      kind: 'cy-prompt',
    })

    const expectedBundleDir = path.join(cacheRoot, 'primary', 'bundles', 'cy-prompt', 'abc123')

    expect(result.bundleDir).toBe(expectedBundleDir)
    expect(result.manifest).toStrictEqual(FIXTURE_MANIFEST)

    expect(await readFile(path.join(expectedBundleDir, 'manifest.json'), 'utf8')).toBe(MANIFEST_TEXT)
    expect(await readFile(path.join(expectedBundleDir, 'server', 'index.js'), 'utf8')).toBe('// server entrypoint\n')

    expect(streamStub).toHaveBeenCalledOnce()
    expect(verifySignatureStub).toHaveBeenCalledWith(MANIFEST_TEXT, 'fake-manifest-sig')

    // Staging dir is cleaned up
    const baseDir = path.dirname(expectedBundleDir)
    const remaining: string[] = await readdir(baseDir)

    expect(remaining.filter((n: string) => n.startsWith('.staging-'))).toStrictEqual([])
  })

  it('persists the manifest signature sidecar alongside the published bundle', async () => {
    const { ensureSignedBundle } = setup()

    await ensureSignedBundle({
      url: 'https://cdn.cypress.io/cy-prompt/sigfile.tar',
      kind: 'cy-prompt',
    })

    const finalDir = path.join(cacheRoot, 'primary', 'bundles', 'cy-prompt', 'sigfile')

    expect(await readFile(path.join(finalDir, '.manifest-sig'), 'utf8')).toBe('fake-manifest-sig')
  })

  it('reuses a verified on-disk bundle and skips the download entirely', async () => {
    const verifyOnDisk = vi.fn().mockResolvedValue(FIXTURE_MANIFEST)
    const { ensureSignedBundle, streamStub } = setup({ verifyOnDisk })

    const result = await ensureSignedBundle({
      url: 'https://cdn.cypress.io/cy-prompt/cached.tar',
      kind: 'cy-prompt',
    })

    expect(result.bundleDir).toBe(path.join(cacheRoot, 'primary', 'bundles', 'cy-prompt', 'cached'))
    expect(result.manifest).toStrictEqual(FIXTURE_MANIFEST)
    expect(streamStub).not.toHaveBeenCalled()
    expect(verifyOnDisk).toHaveBeenCalledOnce()
  })

  it('falls through to download when the on-disk bundle fails verification', async () => {
    const verifyOnDisk = vi.fn().mockResolvedValue(null)
    const { ensureSignedBundle, streamStub } = setup({ verifyOnDisk })

    await ensureSignedBundle({
      url: 'https://cdn.cypress.io/cy-prompt/invalid-cache.tar',
      kind: 'cy-prompt',
    })

    expect(streamStub).toHaveBeenCalledOnce()
  })

  it('throws BundleError(stage=manifest) when the manifest signature fails to verify', async () => {
    const { ensureSignedBundle } = setup({ verifyResult: false })

    let caught: unknown

    try {
      await ensureSignedBundle({
        url: 'https://cdn.cypress.io/studio/badsig.tar',
        kind: 'studio',
      })
    } catch (err) {
      caught = err
    }

    expect(BundleError.isBundleError(caught)).toBe(true)
    expect((caught as BundleError).stage).toBe('manifest')
    expect((caught as BundleError).kind).toBe('studio')

    // finalDir was created (empty) but no files published
    const finalDir = path.join(cacheRoot, 'primary', 'bundles', 'studio', 'badsig')

    expect(await pathExists(path.join(finalDir, 'manifest.json'))).toBe(false)
    expect(await pathExists(path.join(finalDir, 'server', 'index.js'))).toBe(false)
  })

  it('throws BundleError(stage=manifest) when manifest.json is missing from staging', async () => {
    const { ensureSignedBundle } = setup({
      streamImpl: async ({ staging }) => {
        // populate everything except manifest.json
        await ensureDir(path.join(staging, 'server'))
        await writeFile(path.join(staging, 'server', 'index.js'), '// orphan\n')

        return 'sig'
      },
    })

    let caught: unknown

    try {
      await ensureSignedBundle({
        url: 'https://cdn.cypress.io/cy-prompt/no-manifest.tar',
        kind: 'cy-prompt',
      })
    } catch (err) {
      caught = err
    }

    expect(BundleError.isBundleError(caught)).toBe(true)
    expect((caught as BundleError).stage).toBe('manifest')

    const finalDir = path.join(cacheRoot, 'primary', 'bundles', 'cy-prompt', 'no-manifest')

    expect(await pathExists(path.join(finalDir, 'server', 'index.js'))).toBe(false)
  })

  it('propagates network errors raised by streamDownloadVerifyExtract without touching finalDir', async () => {
    const networkError = Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' })
    const { ensureSignedBundle } = setup({
      streamImpl: async () => {
        throw networkError
      },
    })

    let caught: unknown

    try {
      await ensureSignedBundle({
        url: 'https://cdn.cypress.io/studio/net-fail.tar',
        kind: 'studio',
      })
    } catch (err) {
      caught = err
    }

    expect(caught).toBe(networkError)

    const finalDir = path.join(cacheRoot, 'primary', 'bundles', 'studio', 'net-fail')

    expect(await pathExists(path.join(finalDir, 'manifest.json'))).toBe(false)
  })

  describe('OS temp dir fallback', () => {
    const fallbackBase = () => path.join(tmpRoot, 'cypress-cache', 'bundles', 'cy-prompt')

    it('republishes into the OS temp dir when publishing into the cache dir hits a permission error', async () => {
      const finalDir = path.join(cacheRoot, 'primary', 'bundles', 'cy-prompt', 'pubfail')

      // Fail the publish itself rather than chmod-ing finalDir, which root (as in
      // CI containers) can still write into.
      const publish = vi.fn(async (staging: string, dst: string) => {
        if (dst === finalDir) throw permissionError()

        return publishStagingToFinal(staging, dst)
      })
      const { ensureSignedBundle, streamStub } = setup({ publish })

      const result = await ensureSignedBundle({
        url: 'https://cdn.cypress.io/cy-prompt/pubfail.tar',
        kind: 'cy-prompt',
      })

      const fallbackDir = path.join(fallbackBase(), 'pubfail')

      expect(result.bundleDir).toBe(fallbackDir)
      expect(result.manifest).toStrictEqual(FIXTURE_MANIFEST)
      expect(await readFile(path.join(fallbackDir, 'manifest.json'), 'utf8')).toBe(MANIFEST_TEXT)
      expect(await readFile(path.join(fallbackDir, '.manifest-sig'), 'utf8')).toBe('fake-manifest-sig')
      expect(publish).toHaveBeenCalledTimes(2)
      expect(streamStub).toHaveBeenCalledTimes(2)
      expect(path.dirname(streamStub.mock.calls[1][0].staging)).toBe(fallbackBase())

      for (const baseDir of [path.dirname(finalDir), fallbackBase()]) {
        const remaining: string[] = await readdir(baseDir)

        expect(remaining.filter((n: string) => n.startsWith('.staging-')), baseDir).toStrictEqual([])
      }
    })

    for (const code of ['EACCES', 'EPERM', 'EROFS', 'EBUSY']) {
      it(`retries once in the OS temp dir on ${code} from a downstream write`, async () => {
        let calls = 0
        const { ensureSignedBundle, streamStub } = setup({
          streamImpl: async ({ staging }) => {
            if (calls++ === 0) throw permissionError(code)

            await writeFixtureToStaging(staging)

            return 'fake-manifest-sig'
          },
        })

        const result = await ensureSignedBundle({
          url: 'https://cdn.cypress.io/cy-prompt/denied.tar',
          kind: 'cy-prompt',
        })

        expect(result.bundleDir).toBe(path.join(fallbackBase(), 'denied'))
        expect(streamStub).toHaveBeenCalledTimes(2)
        expect(path.dirname(streamStub.mock.calls[0][0].staging)).toBe(path.join(cacheRoot, 'primary', 'bundles', 'cy-prompt'))
      })
    }

    it('falls back on a BundleError that mirrors a permission error code', async () => {
      let calls = 0
      const { ensureSignedBundle, streamStub } = setup({
        streamImpl: async ({ staging }) => {
          if (calls++ === 0) {
            throw new BundleError({ kind: 'cy-prompt', stage: 'extract', message: 'extract failed', cause: permissionError() })
          }

          await writeFixtureToStaging(staging)

          return 'fake-manifest-sig'
        },
      })

      const result = await ensureSignedBundle({
        url: 'https://cdn.cypress.io/cy-prompt/wrapped.tar',
        kind: 'cy-prompt',
      })

      expect(result.bundleDir).toBe(path.join(fallbackBase(), 'wrapped'))
      expect(streamStub).toHaveBeenCalledTimes(2)
    })

    it('does not fall back on errors that are not permission related', async () => {
      const enospc = Object.assign(new Error('ENOSPC: no space left'), { code: 'ENOSPC' })
      const { ensureSignedBundle, streamStub } = setup({
        streamImpl: async () => {
          throw enospc
        },
      })

      let caught: unknown

      try {
        await ensureSignedBundle({ url: 'https://cdn.cypress.io/cy-prompt/full.tar', kind: 'cy-prompt' })
      } catch (err) {
        caught = err
      }

      expect(caught).toBe(enospc)
      expect(streamStub).toHaveBeenCalledOnce()
    })

    it('surfaces the fallback attempt\'s error when it also fails, without retrying again', async () => {
      const second = permissionError('EPERM')
      let calls = 0
      const { ensureSignedBundle, streamStub } = setup({
        streamImpl: async () => {
          throw calls++ === 0 ? permissionError() : second
        },
      })

      let caught: unknown

      try {
        await ensureSignedBundle({ url: 'https://cdn.cypress.io/cy-prompt/both.tar', kind: 'cy-prompt' })
      } catch (err) {
        caught = err
      }

      expect(caught).toBe(second)
      expect(streamStub).toHaveBeenCalledTimes(2)
    })

    it('does not retry when the cache dir already is the OS temp dir fallback', async () => {
      process.env.CYPRESS_CACHE_FOLDER = path.join(tmpRoot, 'cypress-cache')

      const denied = permissionError()
      const { ensureSignedBundle, streamStub } = setup({
        streamImpl: async () => {
          throw denied
        },
      })

      let caught: unknown

      try {
        await ensureSignedBundle({ url: 'https://cdn.cypress.io/cy-prompt/already.tar', kind: 'cy-prompt' })
      } catch (err) {
        caught = err
      }

      expect(caught).toBe(denied)
      expect(streamStub).toHaveBeenCalledOnce()
    })
  })
})
