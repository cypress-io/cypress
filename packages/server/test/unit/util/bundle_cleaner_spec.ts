import '../../spec_helper'
import os from 'os'
import path from 'path'
import { fs } from '../../../lib/util/fs'
import * as globModule from '../../../lib/util/glob'
import * as appData from '../../../lib/util/app_data'
import * as bundleCleaner from '../../../lib/util/bundle_cleaner'

const tmpDir = os.tmpdir()
const projectsRoot = path.join(tmpDir, 'bundle-cleaner-projects')

const DAY_MS = 24 * 60 * 60 * 1000

describe('lib/util/bundle_cleaner', () => {
  const projectPath = (folder: string) => path.join(projectsRoot, folder)
  const bundlesPath = (folder: string) => path.join(projectPath(folder), 'bundles')

  // a real project cache is a `bundles/` subdir; staleness is read from its
  // mtime, so set the age on the bundles dir itself
  const createBundle = async (folder: string, ageMs: number) => {
    const bundlesDir = bundlesPath(folder)

    await fs.ensureDir(bundlesDir)

    const time = new Date(Date.now() - ageMs)

    await fs.utimes(bundlesDir, time, time)
  }

  const bundleExists = (folder: string) => fs.pathExists(bundlesPath(folder))
  const projectExists = (folder: string) => fs.pathExists(projectPath(folder))

  beforeEach(() => {
    return fs.removeAsync(projectsRoot)
    .then(() => fs.ensureDir(projectsRoot))
  })

  afterEach(() => {
    sinon.restore()

    return fs.removeAsync(projectsRoot).catch(() => {})
  })

  describe('.removeStaleBundles', () => {
    it('removes project bundles older than the max age', async () => {
      await createBundle('stale-abc', 30 * DAY_MS)
      await createBundle('fresh-def', 1 * DAY_MS)

      await bundleCleaner.removeStaleBundles(projectsRoot, bundlesPath('current-xyz'))

      expect(await bundleExists('stale-abc'), 'stale bundle removed').to.eq(false)
      expect(await bundleExists('fresh-def'), 'fresh bundle kept').to.eq(true)
    })

    it('removes only the bundles dir, preserving the project saved state', async () => {
      const stateFile = path.join(projectPath('stale-abc'), 'state.json')

      await createBundle('stale-abc', 30 * DAY_MS)
      await fs.writeFile(stateFile, '{}')

      await bundleCleaner.removeStaleBundles(projectsRoot, bundlesPath('current-xyz'))

      expect(await bundleExists('stale-abc'), 'stale bundle removed').to.eq(false)
      expect(await fs.pathExists(stateFile), 'state.json preserved').to.eq(true)
    })

    it('does not remove non-bundle directories like __global__', async () => {
      // __global__ holds global saved state, not a bundle cache (no bundles/ subdir)
      const globalState = path.join(projectPath('__global__'), 'state.json')

      await fs.outputFile(globalState, '{}')

      await createBundle('stale-abc', 30 * DAY_MS)

      await bundleCleaner.removeStaleBundles(projectsRoot, bundlesPath('current-xyz'))

      expect(await fs.pathExists(globalState), 'global state preserved').to.eq(true)
      expect(await bundleExists('stale-abc'), 'stale bundle removed').to.eq(false)
    })

    it('never removes the current project bundle even when stale', async () => {
      await createBundle('current-xyz', 30 * DAY_MS)

      await bundleCleaner.removeStaleBundles(projectsRoot, bundlesPath('current-xyz'))

      expect(await bundleExists('current-xyz')).to.eq(true)
    })

    it('refreshes the current project bundle so it survives the next prune', async () => {
      await createBundle('current-xyz', 30 * DAY_MS)

      await bundleCleaner.removeStaleBundles(projectsRoot, bundlesPath('current-xyz'))

      const stat = await fs.statAsync(bundlesPath('current-xyz'))

      expect(Date.now() - stat.mtimeMs).to.be.lessThan(DAY_MS)
    })

    it('honors the CYPRESS_INTERNAL_BUNDLE_CACHE_MAX_AGE_MS override', async () => {
      process.env.CYPRESS_INTERNAL_BUNDLE_CACHE_MAX_AGE_MS = String(2 * DAY_MS)

      await createBundle('older-abc', 5 * DAY_MS)
      await createBundle('newer-def', 1 * DAY_MS)

      try {
        await bundleCleaner.removeStaleBundles(projectsRoot, bundlesPath('current-xyz'))
      } finally {
        delete process.env.CYPRESS_INTERNAL_BUNDLE_CACHE_MAX_AGE_MS
      }

      expect(await bundleExists('older-abc'), 'older than override removed').to.eq(false)
      expect(await bundleExists('newer-def'), 'newer than override kept').to.eq(true)
    })

    it('does not throw when the projects root does not exist', async () => {
      const missing = path.join(tmpDir, 'bundle-cleaner-missing')

      await fs.removeAsync(missing)

      // should resolve without throwing
      await bundleCleaner.removeStaleBundles(missing, path.join(missing, 'current-xyz', 'bundles'))
    })

    it('swallows errors when glob throws', async () => {
      sinon.stub(globModule, 'globAsync').rejects(new Error('glob error'))

      await createBundle('stale-abc', 30 * DAY_MS)

      await bundleCleaner.removeStaleBundles(projectsRoot, bundlesPath('current-xyz'))

      // glob failed, so nothing was removed
      expect(await bundleExists('stale-abc')).to.eq(true)
    })

    it('caps how many stale bundles are removed per run', async () => {
      process.env.CYPRESS_INTERNAL_BUNDLE_CACHE_MAX_REMOVALS = '2'

      await createBundle('stale-a', 30 * DAY_MS)
      await createBundle('stale-b', 30 * DAY_MS)
      await createBundle('stale-c', 30 * DAY_MS)

      try {
        await bundleCleaner.removeStaleBundles(projectsRoot, bundlesPath('current-xyz'))
      } finally {
        delete process.env.CYPRESS_INTERNAL_BUNDLE_CACHE_MAX_REMOVALS
      }

      const remaining = await globModule.globAsync(path.join(projectsRoot, '*', 'bundles'), { absolute: true })

      // only 2 of the 3 stale bundles are removed this run
      expect(remaining).to.have.length(1)
    })

    it('continues pruning when a bundle cannot be removed', async () => {
      const lockedPath = bundlesPath('locked-abc')
      const actualRemove = fs.removeAsync

      sinon.stub(fs, 'removeAsync').callsFake((target) => {
        if (target === lockedPath) {
          return Promise.reject(Object.assign(new Error('permission denied'), { code: 'EACCES' })) as any
        }

        return actualRemove(target)
      })

      await createBundle('locked-abc', 30 * DAY_MS)
      await createBundle('removable-def', 30 * DAY_MS)

      // does not throw despite the failed removal
      await bundleCleaner.removeStaleBundles(projectsRoot, bundlesPath('current-xyz'))

      expect(await bundleExists('locked-abc'), 'unremovable bundle left in place').to.eq(true)
      expect(await bundleExists('removable-def'), 'removable bundle still pruned').to.eq(false)
    })
  })

  describe('.pruneStaleBundles', () => {
    it('resolves the app data paths for the project and prunes stale bundles', async () => {
      sinon.stub(appData, 'projectsPath').returns(projectsRoot)
      sinon.stub(appData, 'projectBundlePath').returns(bundlesPath('current-xyz'))

      await createBundle('stale-abc', 30 * DAY_MS)
      await createBundle('current-xyz', 30 * DAY_MS)

      await bundleCleaner.pruneStaleBundles('/some/project')

      expect(appData.projectBundlePath).to.be.calledWith('/some/project')
      expect(await bundleExists('stale-abc'), 'stale bundle removed').to.eq(false)
      expect(await bundleExists('current-xyz'), 'current project preserved').to.eq(true)
      expect(await projectExists('stale-abc'), 'stale project dir preserved').to.eq(true)
    })

    it('never throws when pruning fails', async () => {
      sinon.stub(appData, 'projectsPath').throws(new Error('boom'))

      // should resolve without throwing
      await bundleCleaner.pruneStaleBundles('/some/project')
    })
  })
})
