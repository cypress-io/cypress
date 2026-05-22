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

describe('ensureSignedBundle', () => {
  let cacheRoot: string
  let originalCacheFolder: string | undefined

  beforeEach(async () => {
    cacheRoot = await mkdtemp(path.join(os.tmpdir(), 'cy-ensure-bundle-'))
    originalCacheFolder = process.env.CYPRESS_CACHE_FOLDER
    process.env.CYPRESS_CACHE_FOLDER = cacheRoot
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
  }> = {}): SetupResult => {
    const streamStub = sinon.stub().callsFake(async (opts: { staging: string }) => {
      if (overrides.streamImpl) return overrides.streamImpl(opts)

      await writeFixtureToStaging(opts.staging)

      return 'fake-manifest-sig'
    })

    const verifySignatureStub = sinon.stub().resolves(overrides.verifyResult ?? true)

    const ensureSignedBundleModule = proxyquire('../lib/cloud/bundles/ensure_signed_bundle', {
      './stream_download_verify_extract': {
        streamDownloadVerifyExtract: streamStub,
      },
      '../encryption': {
        verifySignature: verifySignatureStub,
      },
    })

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

    const expectedBundleDir = path.join(cacheRoot, 'bundles', 'cy-prompt', 'abc123')

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
    const finalDir = path.join(cacheRoot, 'bundles', 'studio', 'badsig')

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

    const finalDir = path.join(cacheRoot, 'bundles', 'cy-prompt', 'no-manifest')

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

    const finalDir = path.join(cacheRoot, 'bundles', 'studio', 'net-fail')

    expect(await pathExists(path.join(finalDir, 'manifest.json'))).to.equal(false)
  })

  it('cleans up staging dir even when publish fails', async () => {
    const { ensureSignedBundle } = setup()

    // Force publish failure by making finalDir un-renamable: pre-create an immutable
    // file at the target manifest path (we'll simulate by removing write permission
    // only on POSIX; on Windows skip with a comment).
    if (process.platform === 'win32') return // simpler skip than juggling ACLs

    const finalDir = path.join(cacheRoot, 'bundles', 'cy-prompt', 'pubfail')

    await ensureDir(finalDir)

    // Make finalDir read-only so renames inside it fail with EACCES
    const fs = require('fs-extra')

    await fs.chmod(finalDir, 0o500)

    try {
      await ensureSignedBundle({
        url: 'https://cdn.cypress.io/cy-prompt/pubfail.tar',
        kind: 'cy-prompt',
      }).catch(() => { /* expected */ })
    } finally {
      await fs.chmod(finalDir, 0o755)
    }

    const baseDir = path.dirname(finalDir)
    const remaining: string[] = await fs.readdir(baseDir)

    expect(remaining.filter((n: string) => n.startsWith('.staging-'))).to.deep.equal([])
  })
})
