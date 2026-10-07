import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import path from 'path'
import os from 'os'

import { ensureWritableBundleCacheDir, getBundleCacheDir } from '../../../../lib/cloud/bundles/cache_root'

const stubs = vi.hoisted(() => {
  return {
    ensureDir: vi.fn(),
    remove: vi.fn(async () => {}),
  }
})

vi.mock('fs-extra', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs-extra')>()
  const overrides = { ensureDir: stubs.ensureDir, remove: stubs.remove }

  return { ...actual, ...overrides, default: { ...actual, ...overrides } }
})

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

  it('honors CYPRESS_CACHE_FOLDER as-is for a clean absolute path', () => {
    process.env.CYPRESS_CACHE_FOLDER = '/tmp/cypress-cache-test'

    expect(getBundleCacheDir('cy-prompt')).toBe(path.resolve('/tmp/cypress-cache-test/bundles/cy-prompt'))
  })

  it('strips surrounding double quotes (Windows CMD `set FOO="C:\\path"` style)', () => {
    process.env.CYPRESS_CACHE_FOLDER = '"/tmp/cypress-cache-test"'

    expect(getBundleCacheDir('studio')).toBe(path.resolve('/tmp/cypress-cache-test/bundles/studio'))
  })

  it('trims whitespace around the env var value', () => {
    process.env.CYPRESS_CACHE_FOLDER = '   /tmp/cypress-cache-test   '

    expect(getBundleCacheDir('cy-prompt')).toBe(path.resolve('/tmp/cypress-cache-test/bundles/cy-prompt'))
  })

  it('falls back to npm_config_CYPRESS_CACHE_FOLDER when the bare var is not set', () => {
    process.env.npm_config_CYPRESS_CACHE_FOLDER = '/tmp/from-npmrc'

    expect(getBundleCacheDir('cy-prompt')).toBe(path.resolve('/tmp/from-npmrc/bundles/cy-prompt'))
  })

  it('falls back to lowercase npm_config variant', () => {
    process.env.npm_config_cypress_cache_folder = '/tmp/from-npmrc-lower'

    expect(getBundleCacheDir('studio')).toBe(path.resolve('/tmp/from-npmrc-lower/bundles/studio'))
  })

  it('prefers the bare env var over npm_config_* when both are set', () => {
    process.env.CYPRESS_CACHE_FOLDER = '/tmp/bare'
    process.env.npm_config_CYPRESS_CACHE_FOLDER = '/tmp/npmrc'

    expect(getBundleCacheDir('cy-prompt')).toBe(path.resolve('/tmp/bare/bundles/cy-prompt'))
  })

  it('treats empty / whitespace-only override as unset and falls back to cachedir()', () => {
    process.env.CYPRESS_CACHE_FOLDER = '   '

    // cachedir('Cypress') varies by OS; just assert the bundles/<kind> tail.
    expect(getBundleCacheDir('studio')).toMatch(/[/\\]bundles[/\\]studio$/)
    expect(getBundleCacheDir('studio')).not.toBe(path.resolve('bundles/studio'))
  })

  describe('ensureWritableBundleCacheDir', () => {
    const EACCES = () => Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' })

    beforeEach(() => {
      stubs.ensureDir.mockReset()
      stubs.remove.mockClear()
    })

    it('returns the configured cache dir when it is writable', async () => {
      process.env.CYPRESS_CACHE_FOLDER = '/tmp/cypress-cache-test'
      const ensureDirStub = stubs.ensureDir.mockResolvedValue(undefined)

      const dir = await ensureWritableBundleCacheDir('cy-prompt')

      expect(dir).toBe(path.resolve('/tmp/cypress-cache-test/bundles/cy-prompt'))
      expect(ensureDirStub).toHaveBeenCalledWith(dir)
    })

    it('names the writability probe with the .staging- prefix so it is swept if cleanup fails', async () => {
      process.env.CYPRESS_CACHE_FOLDER = '/tmp/cypress-cache-test'
      const dir = path.resolve('/tmp/cypress-cache-test/bundles/cy-prompt')
      const ensureDirStub = stubs.ensureDir.mockResolvedValue(undefined)

      await ensureWritableBundleCacheDir('cy-prompt')

      const probeCall = ensureDirStub.mock.calls.find((args) => args[0] !== dir)

      expect(probeCall, 'a probe child was created').toBeDefined()
      expect(path.basename(probeCall![0])).toMatch(/^\.staging-probe-/)
      expect(path.dirname(probeCall![0])).toBe(dir)
    })

    it('falls back to the OS temp dir when the cache dir cannot be created', async () => {
      process.env.CYPRESS_CACHE_FOLDER = '/tmp/cypress-cache-test'
      const primary = path.resolve('/tmp/cypress-cache-test/bundles/studio')
      const fallback = path.join(os.tmpdir(), 'cypress-cache', 'bundles', 'studio')
      const ensureDirStub = stubs.ensureDir.mockImplementation(async (dir: string) => {
        if (dir === primary) {
          throw EACCES()
        }
      })

      expect(await ensureWritableBundleCacheDir('studio')).toBe(fallback)
      expect(ensureDirStub).toHaveBeenCalledWith(fallback)
    })

    it('falls back when the cache dir exists but is not writable (probe child fails)', async () => {
      process.env.CYPRESS_CACHE_FOLDER = '/tmp/cypress-cache-test'
      const primary = path.resolve('/tmp/cypress-cache-test/bundles/studio')
      const fallback = path.join(os.tmpdir(), 'cypress-cache', 'bundles', 'studio')

      // primary itself exists (ensureDir resolves), but creating any child under
      // it — the writability probe, mirroring the later `.staging-*` mkdir — fails.
      stubs.ensureDir.mockImplementation(async (dir: string) => {
        if (dir !== primary && dir.startsWith(`${primary}${path.sep}`)) {
          throw EACCES()
        }
      })

      expect(await ensureWritableBundleCacheDir('studio')).toBe(fallback)
    })

    it('rethrows errors that are not permission related', async () => {
      process.env.CYPRESS_CACHE_FOLDER = '/tmp/cypress-cache-test'
      stubs.ensureDir.mockRejectedValue(Object.assign(new Error('ENOSPC: no space left'), { code: 'ENOSPC' }))

      let caught: any

      try {
        await ensureWritableBundleCacheDir('cy-prompt')
      } catch (err) {
        caught = err
      }

      expect(caught?.code).toBe('ENOSPC')
    })
  })
})
