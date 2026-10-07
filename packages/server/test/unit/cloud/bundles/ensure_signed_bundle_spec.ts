import { proxyquire, sinon } from '../../../spec_helper'
import { ensureDir, mkdtemp, pathExists, readFile, remove, writeFile } from 'fs-extra'
import os from 'os'
import path from 'path'
import { BundleError } from '../../../../lib/cloud/bundles/bundle_error'

const FIXTURE_MANIFEST = { version: 1, entrypoint: 'server/index.js' }
const MANIFEST_TEXT = JSON.stringify(FIXTURE_MANIFEST)

const writeFixtureToStaging = async (staging: string) => {
  await ensureDir(path.join(staging, 'server'))
  await writeFile(path.join(staging, 'manifest.json'), MANIFEST_TEXT)
  await writeFile(path.join(staging, 'server', 'index.js'), '// server entrypoint\n')
}

interface SetupResult {
  ensureSignedBundle: typeof import('../../../../lib/cloud/bundles/ensure_signed_bundle').ensureSignedBundle
  streamStub: sinon.SinonStub
  verifySignatureStub: sinon.SinonStub
}

const permissionError = (code = 'EACCES') => Object.assign(new Error(`${code}: permission denied`), { code })

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
    sinon.stub(os, 'tmpdir').returns(tmpRoot)
  })

  afterEach(async () => {
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
    verifyOnDisk: sinon.SinonStub
  }> = {}): SetupResult => {
    const streamStub = sinon.stub().callsFake(async (opts: { staging: string }) => {
      if (overrides.streamImpl) return overrides.streamImpl(opts)

      await writeFixtureToStaging(opts.staging)

      return 'fake-manifest-sig'
    })

    const verifySignatureStub = sinon.stub().resolves(overrides.verifyResult ?? true)

    const stubs: Record<string, unknown> = {
      './stream_download_verify_extract': {
        streamDownloadVerifyExtract: streamStub,
      },
      '../encryption': {
        verifySignature: verifySignatureStub,
      },
    }

    // Only override the on-disk verifier when a test needs a deterministic
    // cache hit/miss; otherwise the real module runs (and a fresh cacheRoot is
    // always a miss).
    if (overrides.verifyOnDisk) {
      stubs['./verify_bundle_on_disk'] = { verifyBundleOnDisk: overrides.verifyOnDisk }
    }

    const ensureSignedBundleModule = proxyquire('../lib/cloud/bundles/ensure_signed_bundle', stubs)

    return {
      ensureSignedBundle: ensureSignedBundleModule.ensureSignedBundle,
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

    expect(result.bundleDir).to.equal(expectedBundleDir)
    expect(result.manifest).to.deep.equal(FIXTURE_MANIFEST)

    expect(await readFile(path.join(expectedBundleDir, 'manifest.json'), 'utf8')).to.equal(MANIFEST_TEXT)
    expect(await readFile(path.join(expectedBundleDir, 'server', 'index.js'), 'utf8')).to.equal('// server entrypoint\n')

    expect(streamStub).to.be.calledOnce
    expect(verifySignatureStub).to.be.calledWith(MANIFEST_TEXT, 'fake-manifest-sig')

    // Staging dir is cleaned up
    const baseDir = path.dirname(expectedBundleDir)
    const fs = require('fs-extra')
    const remaining: string[] = await fs.readdir(baseDir)

    expect(remaining.filter((n: string) => n.startsWith('.staging-'))).to.deep.equal([])
  })

  it('persists the manifest signature sidecar alongside the published bundle', async () => {
    const { ensureSignedBundle } = setup()

    await ensureSignedBundle({
      url: 'https://cdn.cypress.io/cy-prompt/sigfile.tar',
      kind: 'cy-prompt',
    })

    const finalDir = path.join(cacheRoot, 'primary', 'bundles', 'cy-prompt', 'sigfile')

    expect(await readFile(path.join(finalDir, '.manifest-sig'), 'utf8')).to.equal('fake-manifest-sig')
  })

  it('reuses a verified on-disk bundle and skips the download entirely', async () => {
    const verifyOnDisk = sinon.stub().resolves(FIXTURE_MANIFEST)
    const { ensureSignedBundle, streamStub } = setup({ verifyOnDisk })

    const result = await ensureSignedBundle({
      url: 'https://cdn.cypress.io/cy-prompt/cached.tar',
      kind: 'cy-prompt',
    })

    expect(result.bundleDir).to.equal(path.join(cacheRoot, 'primary', 'bundles', 'cy-prompt', 'cached'))
    expect(result.manifest).to.deep.equal(FIXTURE_MANIFEST)
    expect(streamStub).not.to.be.called
    expect(verifyOnDisk).to.be.calledOnce
  })

  it('falls through to download when the on-disk bundle fails verification', async () => {
    const verifyOnDisk = sinon.stub().resolves(null)
    const { ensureSignedBundle, streamStub } = setup({ verifyOnDisk })

    await ensureSignedBundle({
      url: 'https://cdn.cypress.io/cy-prompt/invalid-cache.tar',
      kind: 'cy-prompt',
    })

    expect(streamStub).to.be.calledOnce
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

    expect(BundleError.isBundleError(caught)).to.equal(true)
    expect((caught as BundleError).stage).to.equal('manifest')
    expect((caught as BundleError).kind).to.equal('studio')

    // finalDir was created (empty) but no files published
    const finalDir = path.join(cacheRoot, 'primary', 'bundles', 'studio', 'badsig')

    expect(await pathExists(path.join(finalDir, 'manifest.json'))).to.equal(false)
    expect(await pathExists(path.join(finalDir, 'server', 'index.js'))).to.equal(false)
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

    expect(BundleError.isBundleError(caught)).to.equal(true)
    expect((caught as BundleError).stage).to.equal('manifest')

    const finalDir = path.join(cacheRoot, 'primary', 'bundles', 'cy-prompt', 'no-manifest')

    expect(await pathExists(path.join(finalDir, 'server', 'index.js'))).to.equal(false)
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

    expect(caught).to.equal(networkError)

    const finalDir = path.join(cacheRoot, 'primary', 'bundles', 'studio', 'net-fail')

    expect(await pathExists(path.join(finalDir, 'manifest.json'))).to.equal(false)
  })

  describe('OS temp dir fallback', () => {
    const fallbackBase = () => path.join(tmpRoot, 'cypress-cache', 'bundles', 'cy-prompt')

    it('republishes into the OS temp dir when publishing into the cache dir hits a permission error', async () => {
      if (process.platform === 'win32') return // simpler skip than juggling ACLs

      const { ensureSignedBundle, streamStub } = setup()
      const finalDir = path.join(cacheRoot, 'primary', 'bundles', 'cy-prompt', 'pubfail')

      await ensureDir(finalDir)

      // Make finalDir read-only so renames into it fail with EACCES
      const fs = require('fs-extra')

      await fs.chmod(finalDir, 0o500)

      let result: Awaited<ReturnType<typeof ensureSignedBundle>>

      try {
        result = await ensureSignedBundle({
          url: 'https://cdn.cypress.io/cy-prompt/pubfail.tar',
          kind: 'cy-prompt',
        })
      } finally {
        await fs.chmod(finalDir, 0o755)
      }

      const fallbackDir = path.join(fallbackBase(), 'pubfail')

      expect(result.bundleDir).to.equal(fallbackDir)
      expect(result.manifest).to.deep.equal(FIXTURE_MANIFEST)
      expect(await readFile(path.join(fallbackDir, 'manifest.json'), 'utf8')).to.equal(MANIFEST_TEXT)
      expect(await readFile(path.join(fallbackDir, '.manifest-sig'), 'utf8')).to.equal('fake-manifest-sig')
      expect(streamStub).to.be.calledTwice
      expect(path.dirname(streamStub.secondCall.args[0].staging)).to.equal(fallbackBase())

      for (const baseDir of [path.dirname(finalDir), fallbackBase()]) {
        const remaining: string[] = await fs.readdir(baseDir)

        expect(remaining.filter((n: string) => n.startsWith('.staging-')), baseDir).to.deep.equal([])
      }
    })

    for (const code of ['EACCES', 'EPERM', 'EROFS']) {
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

        expect(result.bundleDir).to.equal(path.join(fallbackBase(), 'denied'))
        expect(streamStub).to.be.calledTwice
        expect(path.dirname(streamStub.firstCall.args[0].staging)).to.equal(path.join(cacheRoot, 'primary', 'bundles', 'cy-prompt'))
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

      expect(result.bundleDir).to.equal(path.join(fallbackBase(), 'wrapped'))
      expect(streamStub).to.be.calledTwice
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

      expect(caught).to.equal(enospc)
      expect(streamStub).to.be.calledOnce
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

      expect(caught).to.equal(second)
      expect(streamStub).to.be.calledTwice
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

      expect(caught).to.equal(denied)
      expect(streamStub).to.be.calledOnce
    })
  })
})
