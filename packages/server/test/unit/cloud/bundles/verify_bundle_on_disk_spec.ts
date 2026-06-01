import { proxyquire, sinon } from '../../../spec_helper'
import { ensureDir, mkdtemp, remove, writeFile } from 'fs-extra'
import os from 'os'
import path from 'path'
import crypto from 'crypto'

const sha256 = (content: string): string => {
  return crypto.createHash('sha256').update(Buffer.from(content)).digest('hex')
}

describe('verifyBundleOnDisk', () => {
  let tmp: string
  let finalDir: string
  let verifySignatureStub: sinon.SinonStub

  const load = () => {
    verifySignatureStub = sinon.stub().resolves(true)

    const mod = proxyquire('../lib/cloud/bundles/verify_bundle_on_disk', {
      '../encryption': { verifySignature: verifySignatureStub },
    })

    return mod.verifyBundleOnDisk as (dir: string) => Promise<Record<string, string> | null>
  }

  // Writes files + a manifest enumerating each (with real sha256) + sig sidecar.
  const writeBundle = async (
    files: Record<string, string>,
    opts: { manifest?: Record<string, string>, sig?: string | null } = {},
  ): Promise<Record<string, string>> => {
    for (const [rel, content] of Object.entries(files)) {
      const full = path.join(finalDir, rel)

      await ensureDir(path.dirname(full))
      await writeFile(full, content)
    }

    const manifest = opts.manifest ?? Object.fromEntries(
      Object.entries(files).map(([rel, content]) => [rel, sha256(content)]),
    )

    await writeFile(path.join(finalDir, 'manifest.json'), JSON.stringify(manifest))

    if (opts.sig !== null) {
      await writeFile(path.join(finalDir, '.manifest-sig'), opts.sig ?? 'manifest-sig')
    }

    return manifest
  }

  beforeEach(async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), 'cy-verify-bundle-'))
    finalDir = path.join(tmp, 'bundle')
    await ensureDir(finalDir)
  })

  afterEach(async () => {
    await remove(tmp).catch(() => { /* ignore */ })
  })

  it('returns the manifest when signature and every file hash verify', async () => {
    const verifyBundleOnDisk = load()
    const manifest = await writeBundle({
      'server/index.js': '// server entrypoint\n',
      'client/index.js': '// client\n',
    })

    expect(await verifyBundleOnDisk(finalDir)).to.deep.equal(manifest)
    expect(verifySignatureStub).to.be.calledOnce
  })

  it('returns null when manifest.json is absent', async () => {
    const verifyBundleOnDisk = load()

    expect(await verifyBundleOnDisk(finalDir)).to.equal(null)
  })

  it('returns null when the signature sidecar is absent', async () => {
    const verifyBundleOnDisk = load()

    await writeBundle({ 'server/index.js': 'a' }, { sig: null })

    expect(await verifyBundleOnDisk(finalDir)).to.equal(null)
  })

  it('returns null when the manifest signature fails to verify', async () => {
    const verifyBundleOnDisk = load()

    verifySignatureStub.resolves(false)
    await writeBundle({ 'server/index.js': 'a' })

    expect(await verifyBundleOnDisk(finalDir)).to.equal(null)
  })

  it('returns null when a listed file has been modified after the fact', async () => {
    const verifyBundleOnDisk = load()

    await writeBundle({ 'server/index.js': 'original' })
    // Tamper post-publish: same path, different bytes.
    await writeFile(path.join(finalDir, 'server', 'index.js'), 'tampered')

    expect(await verifyBundleOnDisk(finalDir)).to.equal(null)
  })

  it('returns null when a listed file is missing from disk', async () => {
    const verifyBundleOnDisk = load()

    await writeBundle({ 'server/index.js': 'a' }, {
      manifest: { 'server/index.js': sha256('a'), 'lib/extra.js': sha256('b') },
    })

    expect(await verifyBundleOnDisk(finalDir)).to.equal(null)
  })

  it('returns null when an unlisted file exists on disk (strict allowlist)', async () => {
    const verifyBundleOnDisk = load()

    await writeBundle({ 'server/index.js': 'a' })
    // Attacker drops in an extra file not covered by the signed manifest.
    await writeFile(path.join(finalDir, 'evil.js'), 'pwned')

    expect(await verifyBundleOnDisk(finalDir)).to.equal(null)
  })

  it('returns null when a manifest entry escapes finalDir', async () => {
    const verifyBundleOnDisk = load()

    await writeBundle({ 'server/index.js': 'a' }, {
      manifest: { 'server/index.js': sha256('a'), '../escape.js': sha256('a') },
    })

    expect(await verifyBundleOnDisk(finalDir)).to.equal(null)
  })
})
