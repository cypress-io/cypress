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

  const createBundle = (folder: string, ageMs: number) => {
    const dir = projectPath(folder)

    return fs.ensureDir(dir)
    .then(() => {
      const time = new Date(Date.now() - ageMs)

      return fs.utimes(dir, time, time)
    })
  }

  const exists = (folder: string) => fs.pathExists(projectPath(folder))

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

      await bundleCleaner.removeStaleBundles(projectsRoot, projectPath('current-xyz'))

      expect(await exists('stale-abc'), 'stale bundle removed').to.eq(false)
      expect(await exists('fresh-def'), 'fresh bundle kept').to.eq(true)
    })

    it('never removes the current project bundle even when stale', async () => {
      await createBundle('current-xyz', 30 * DAY_MS)

      await bundleCleaner.removeStaleBundles(projectsRoot, projectPath('current-xyz'))

      expect(await exists('current-xyz')).to.eq(true)
    })

    it('refreshes the current project bundle so it survives the next prune', async () => {
      await createBundle('current-xyz', 30 * DAY_MS)

      await bundleCleaner.removeStaleBundles(projectsRoot, projectPath('current-xyz'))

      const stat = await fs.statAsync(projectPath('current-xyz'))

      expect(Date.now() - stat.mtimeMs).to.be.lessThan(DAY_MS)
    })

    it('honors the CYPRESS_INTERNAL_BUNDLE_CACHE_MAX_AGE_MS override', async () => {
      process.env.CYPRESS_INTERNAL_BUNDLE_CACHE_MAX_AGE_MS = String(2 * DAY_MS)

      await createBundle('older-abc', 5 * DAY_MS)
      await createBundle('newer-def', 1 * DAY_MS)

      try {
        await bundleCleaner.removeStaleBundles(projectsRoot, projectPath('current-xyz'))
      } finally {
        delete process.env.CYPRESS_INTERNAL_BUNDLE_CACHE_MAX_AGE_MS
      }

      expect(await exists('older-abc'), 'older than override removed').to.eq(false)
      expect(await exists('newer-def'), 'newer than override kept').to.eq(true)
    })

    it('does not throw when the projects root does not exist', async () => {
      const missing = path.join(tmpDir, 'bundle-cleaner-missing')

      await fs.removeAsync(missing)

      // should resolve without throwing
      await bundleCleaner.removeStaleBundles(missing, path.join(missing, 'current-xyz'))
    })

    it('swallows errors when glob throws', async () => {
      sinon.stub(globModule, 'globAsync').rejects(new Error('glob error'))

      await createBundle('stale-abc', 30 * DAY_MS)

      await bundleCleaner.removeStaleBundles(projectsRoot, projectPath('current-xyz'))

      // glob failed, so nothing was removed
      expect(await exists('stale-abc')).to.eq(true)
    })

    it('caps how many stale bundles are removed per run', async () => {
      process.env.CYPRESS_INTERNAL_BUNDLE_CACHE_MAX_REMOVALS = '2'

      await createBundle('stale-a', 30 * DAY_MS)
      await createBundle('stale-b', 30 * DAY_MS)
      await createBundle('stale-c', 30 * DAY_MS)

      try {
        await bundleCleaner.removeStaleBundles(projectsRoot, projectPath('current-xyz'))
      } finally {
        delete process.env.CYPRESS_INTERNAL_BUNDLE_CACHE_MAX_REMOVALS
      }

      const remaining = await fs.readdir(projectsRoot)

      // only 2 of the 3 stale bundles are removed this run
      expect(remaining).to.have.length(1)
    })

    it('continues pruning when a bundle cannot be removed', async () => {
      const lockedPath = projectPath('locked-abc')
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
      await bundleCleaner.removeStaleBundles(projectsRoot, projectPath('current-xyz'))

      expect(await exists('locked-abc'), 'unremovable bundle left in place').to.eq(true)
      expect(await exists('removable-def'), 'removable bundle still pruned').to.eq(false)
    })
  })

  describe('.pruneStaleBundles', () => {
    it('resolves the app data paths for the project and prunes stale bundles', async () => {
      sinon.stub(appData, 'projectsPath').returns(projectsRoot)
      sinon.stub(appData, 'projectBundlePath').returns(projectPath('current-xyz'))

      await createBundle('stale-abc', 30 * DAY_MS)
      await createBundle('current-xyz', 30 * DAY_MS)

      await bundleCleaner.pruneStaleBundles('/some/project')

      expect(appData.projectBundlePath).to.be.calledWith('/some/project')
      expect(await exists('stale-abc'), 'stale bundle removed').to.eq(false)
      expect(await exists('current-xyz'), 'current project preserved').to.eq(true)
    })

    it('never throws when pruning fails', async () => {
      sinon.stub(appData, 'projectsPath').throws(new Error('boom'))

      // should resolve without throwing
      await bundleCleaner.pruneStaleBundles('/some/project')
    })
  })
})
