import { proxyquire, sinon } from '../../../spec_helper'
import path from 'path'
import os from 'os'

describe('getBundleCacheDir', () => {
  const ENV_KEYS = [
    'CYPRESS_CACHE_FOLDER',
    'npm_config_CYPRESS_CACHE_FOLDER',
    'npm_config_cypress_cache_folder',
    'npm_package_config_CYPRESS_CACHE_FOLDER',
  ]
  const snapshot: Record<string, string | undefined> = {}

  beforeEach(() => {
    for (const k of ENV_KEYS) {
      snapshot[k] = process.env[k]
      delete process.env[k]
    }
  })

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (snapshot[k] === undefined) delete process.env[k]
      else process.env[k] = snapshot[k]
    }
  })

  // Bypass require cache so each test sees the current env state.
  const loadCacheRoot = () => {
    delete require.cache[require.resolve('../../../../lib/cloud/bundles/cache_root')]

    return require('../../../../lib/cloud/bundles/cache_root')
  }

  it('honors CYPRESS_CACHE_FOLDER as-is for a clean absolute path', () => {
    process.env.CYPRESS_CACHE_FOLDER = '/tmp/cypress-cache-test'
    const { getBundleCacheDir } = loadCacheRoot()

    expect(getBundleCacheDir('cy-prompt')).to.equal(path.resolve('/tmp/cypress-cache-test/bundles/cy-prompt'))
  })

  it('strips surrounding double quotes (Windows CMD `set FOO="C:\\path"` style)', () => {
    process.env.CYPRESS_CACHE_FOLDER = '"/tmp/cypress-cache-test"'
    const { getBundleCacheDir } = loadCacheRoot()

    expect(getBundleCacheDir('studio')).to.equal(path.resolve('/tmp/cypress-cache-test/bundles/studio'))
  })

  it('trims whitespace around the env var value', () => {
    process.env.CYPRESS_CACHE_FOLDER = '   /tmp/cypress-cache-test   '
    const { getBundleCacheDir } = loadCacheRoot()

    expect(getBundleCacheDir('cy-prompt')).to.equal(path.resolve('/tmp/cypress-cache-test/bundles/cy-prompt'))
  })

  it('falls back to npm_config_CYPRESS_CACHE_FOLDER when the bare var is not set', () => {
    process.env.npm_config_CYPRESS_CACHE_FOLDER = '/tmp/from-npmrc'
    const { getBundleCacheDir } = loadCacheRoot()

    expect(getBundleCacheDir('cy-prompt')).to.equal(path.resolve('/tmp/from-npmrc/bundles/cy-prompt'))
  })

  it('falls back to lowercase npm_config variant', () => {
    process.env.npm_config_cypress_cache_folder = '/tmp/from-npmrc-lower'
    const { getBundleCacheDir } = loadCacheRoot()

    expect(getBundleCacheDir('studio')).to.equal(path.resolve('/tmp/from-npmrc-lower/bundles/studio'))
  })

  it('prefers the bare env var over npm_config_* when both are set', () => {
    process.env.CYPRESS_CACHE_FOLDER = '/tmp/bare'
    process.env.npm_config_CYPRESS_CACHE_FOLDER = '/tmp/npmrc'
    const { getBundleCacheDir } = loadCacheRoot()

    expect(getBundleCacheDir('cy-prompt')).to.equal(path.resolve('/tmp/bare/bundles/cy-prompt'))
  })

  it('treats empty / whitespace-only override as unset and falls back to cachedir()', () => {
    process.env.CYPRESS_CACHE_FOLDER = '   '
    const { getBundleCacheDir } = loadCacheRoot()

    // cachedir('Cypress') varies by OS; just assert the bundles/<kind> tail.
    expect(getBundleCacheDir('studio')).to.match(/[/\\]bundles[/\\]studio$/)
    expect(getBundleCacheDir('studio')).to.not.equal(path.resolve('bundles/studio'))
  })

  describe('ensureWritableBundleCacheDir', () => {
    const EACCES = () => Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' })

    const load = (ensureDirStub: sinon.SinonStub) => {
      return proxyquire('../lib/cloud/bundles/cache_root', {
        'fs-extra': { ensureDir: ensureDirStub, remove: sinon.stub().resolves() },
      })
    }

    it('returns the configured cache dir when it is writable', async () => {
      process.env.CYPRESS_CACHE_FOLDER = '/tmp/cypress-cache-test'
      const ensureDirStub = sinon.stub().resolves()
      const { ensureWritableBundleCacheDir } = load(ensureDirStub)

      const dir = await ensureWritableBundleCacheDir('cy-prompt')

      expect(dir).to.equal(path.resolve('/tmp/cypress-cache-test/bundles/cy-prompt'))
      expect(ensureDirStub).to.be.calledWith(dir)
    })

    it('names the writability probe with the .staging- prefix so it is swept if cleanup fails', async () => {
      process.env.CYPRESS_CACHE_FOLDER = '/tmp/cypress-cache-test'
      const dir = path.resolve('/tmp/cypress-cache-test/bundles/cy-prompt')
      const ensureDirStub = sinon.stub().resolves()
      const { ensureWritableBundleCacheDir } = load(ensureDirStub)

      await ensureWritableBundleCacheDir('cy-prompt')

      const probeCall = ensureDirStub.getCalls().find((c) => c.args[0] !== dir)

      expect(probeCall, 'a probe child was created').to.exist
      expect(path.basename(probeCall!.args[0])).to.match(/^\.staging-probe-/)
      expect(path.dirname(probeCall!.args[0])).to.equal(dir)
    })

    it('falls back to the OS temp dir when the cache dir cannot be created', async () => {
      process.env.CYPRESS_CACHE_FOLDER = '/tmp/cypress-cache-test'
      const primary = path.resolve('/tmp/cypress-cache-test/bundles/studio')
      const fallback = path.join(os.tmpdir(), 'cypress-cache', 'bundles', 'studio')
      const ensureDirStub = sinon.stub().resolves()

      ensureDirStub.withArgs(primary).rejects(EACCES())

      const { ensureWritableBundleCacheDir } = load(ensureDirStub)

      expect(await ensureWritableBundleCacheDir('studio')).to.equal(fallback)
      expect(ensureDirStub).to.be.calledWith(fallback)
    })

    it('falls back when the cache dir exists but is not writable (probe child fails)', async () => {
      process.env.CYPRESS_CACHE_FOLDER = '/tmp/cypress-cache-test'
      const primary = path.resolve('/tmp/cypress-cache-test/bundles/studio')
      const fallback = path.join(os.tmpdir(), 'cypress-cache', 'bundles', 'studio')

      // primary itself exists (ensureDir resolves), but creating any child under
      // it — the writability probe, mirroring the later `.staging-*` mkdir — fails.
      const ensureDirStub = sinon.stub().callsFake(async (dir: string) => {
        if (dir !== primary && dir.startsWith(`${primary}${path.sep}`)) {
          throw EACCES()
        }
      })

      const { ensureWritableBundleCacheDir } = load(ensureDirStub)

      expect(await ensureWritableBundleCacheDir('studio')).to.equal(fallback)
    })

    it('rethrows errors that are not permission related', async () => {
      process.env.CYPRESS_CACHE_FOLDER = '/tmp/cypress-cache-test'
      const ensureDirStub = sinon.stub().rejects(Object.assign(new Error('ENOSPC: no space left'), { code: 'ENOSPC' }))
      const { ensureWritableBundleCacheDir } = load(ensureDirStub)

      let caught: any

      try {
        await ensureWritableBundleCacheDir('cy-prompt')
      } catch (err) {
        caught = err
      }

      expect(caught?.code).to.equal('ENOSPC')
    })
  })
})
