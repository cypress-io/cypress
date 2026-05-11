import '../../../spec_helper'
import path from 'path'

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
})
