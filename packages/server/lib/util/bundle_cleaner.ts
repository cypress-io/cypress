import path from 'path'
import Debug from 'debug'
import { fs } from './fs'
import { globAsync as glob } from './glob'
import * as appData from './app_data'

const debug = Debug('cypress:server:bundlecleaner')

// A project's spec bundles are regenerated on every run and are never reused
// across separate `cypress run` processes, so on long-lived machines (especially
// CI agents) the per-project bundle directories under `cy/<env>/projects`
// accumulate indefinitely. This is most painful for setups that produce a fresh
// project directory on every build (e.g. Nx-style apps with a unique name per
// build), where every run leaves behind a bundle directory that is never read
// again and can grow to many gigabytes.
// @see https://github.com/cypress-io/cypress/issues/20435

// remove project bundle directories that have not been used in 7 days by default
const DEFAULT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

// cap how many stale bundles are removed per invocation so a large first-run
// backlog (potentially many GB) cannot block the run for too long; whatever is
// left over is removed on subsequent runs
const DEFAULT_MAX_REMOVALS = 25

// remove a handful of bundles at a time to avoid spiking disk I/O or exhausting
// file handles when clearing a large backlog
const REMOVAL_CONCURRENCY = 5

// stat is cheap, but still bound it so a backlog of thousands of bundle dirs
// cannot spawn thousands of concurrent stat calls on the startup critical path
const SCAN_CONCURRENCY = 32

const envNumber = (name: string, fallback: number): number => {
  const value = Number(process.env[name])

  return Number.isFinite(value) && value >= 0 ? value : fallback
}

// run `fn` over `items` in bounded batches so neither phase floods the event
// loop with unbounded concurrent fs operations
const mapWithConcurrency = async <T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> => {
  const results: R[] = []

  for (let i = 0; i < items.length; i += limit) {
    results.push(...await Promise.all(items.slice(i, i + limit).map(fn)))
  }

  return results
}

const removeBundle = async (folder: string): Promise<void> => {
  try {
    debug('removing stale project bundle %s', folder)

    await fs.removeAsync(folder)
  } catch (err: any) {
    // leave the directory for a future run rather than failing the prune
    if (err?.code === 'EACCES' || err?.code === 'EPERM') {
      debug('skipping project bundle %s; no permission to remove: %o', folder, err)
    } else {
      debug('skipping project bundle %s; failed to remove: %o', folder, err)
    }
  }
}

// touch a project's bundles dir so it is considered "in use" and is never pruned
// on a subsequent run, regardless of whether the bundler overwrote files in place
// (which would not update the directory mtime)
const touchBundleDir = async (bundleDir: string): Promise<void> => {
  try {
    const now = new Date()

    await fs.utimes(bundleDir, now, now)
  } catch (err) {
    // the directory may not exist yet on the very first run, which is fine: it
    // will be created with a current mtime while the run generates its bundles
    debug('could not refresh last-used time for project bundle %s: %o', bundleDir, err)
  }
}

// refresh a project's bundle cache mtime so a concurrent prune for another
// project does not treat an actively-used cache as stale. never throws.
export const touchProjectBundle = async (projectRoot: string): Promise<void> => {
  await touchBundleDir(appData.projectBundlePath(projectRoot))
}

export const removeStaleBundles = async (projectsRoot: string, currentProjectBundlePath: string): Promise<void> => {
  const maxAgeMs = envNumber('CYPRESS_INTERNAL_BUNDLE_CACHE_MAX_AGE_MS', DEFAULT_MAX_AGE_MS)
  const normalizedCurrent = path.resolve(currentProjectBundlePath)

  let bundleDirs: string[]

  try {
    // target only the per-project `bundles/` caches. This never removes the
    // parent project dir (which also holds `state.json` saved UI state) and
    // skips non-bundle dirs like `__global__` (no `bundles/` subdir)
    bundleDirs = await glob(path.join(projectsRoot, '*', 'bundles'), { absolute: true })
  } catch (err) {
    debug('skipping project bundle prune; failed to read projects root %s: %o', projectsRoot, err)

    return
  }

  const now = Date.now()

  const staleness = await mapWithConcurrency(bundleDirs, SCAN_CONCURRENCY, async (bundleDir): Promise<string | null> => {
    // never remove the bundles for the project we're about to run
    if (path.resolve(bundleDir) === normalizedCurrent) {
      return null
    }

    try {
      const stat = await fs.statAsync(bundleDir)

      if (!stat || !stat.isDirectory()) {
        return null
      }

      return (now - Number(stat.mtimeMs)) > maxAgeMs ? bundleDir : null
    } catch (err) {
      debug('skipping project bundle %s; failed to stat: %o', bundleDir, err)

      return null
    }
  })

  const stale = staleness.filter((dir): dir is string => dir !== null)
  const maxRemovals = envNumber('CYPRESS_INTERNAL_BUNDLE_CACHE_MAX_REMOVALS', DEFAULT_MAX_REMOVALS)
  const toRemove = stale.slice(0, maxRemovals)

  debug('removing %d of %d stale project bundles (max %d per run)', toRemove.length, stale.length, maxRemovals)

  // remove in bounded batches so a large backlog cannot spike disk I/O or block
  // the run for too long; any remaining stale bundles are removed on later runs
  await mapWithConcurrency(toRemove, REMOVAL_CONCURRENCY, removeBundle)

  // keep the current project fresh so it survives the next prune
  await touchBundleDir(normalizedCurrent)
}

// resolve the app data paths for the given project and prune its stale sibling
// bundles. never throws, so it is safe to call at run start or when opening a
// project without it breaking a run or blocking the project from opening.
export const pruneStaleBundles = async (projectRoot: string): Promise<void> => {
  try {
    await removeStaleBundles(appData.projectsPath(), appData.projectBundlePath(projectRoot))
  } catch (err) {
    debug('skipping project bundle prune: %o', err)
  }
}
