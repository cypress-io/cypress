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

const getMaxAgeMs = (): number => {
  const override = Number(process.env.CYPRESS_INTERNAL_BUNDLE_CACHE_MAX_AGE_MS)

  return Number.isFinite(override) && override >= 0 ? override : DEFAULT_MAX_AGE_MS
}

const getMaxRemovals = (): number => {
  const override = Number(process.env.CYPRESS_INTERNAL_BUNDLE_CACHE_MAX_REMOVALS)

  return Number.isInteger(override) && override >= 0 ? override : DEFAULT_MAX_REMOVALS
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

// touch the active project's bundle directory so it is always considered "in
// use" and is never pruned on a subsequent run, regardless of whether the
// bundler overwrote files in place (which would not update the directory mtime)
export const touchProjectBundle = async (projectBundlePath: string): Promise<void> => {
  try {
    const now = new Date()

    await fs.utimes(projectBundlePath, now, now)
  } catch (err) {
    // the directory may not exist yet on the very first run, which is fine: it
    // will be created with a current mtime while the run generates its bundles
    debug('could not refresh last-used time for project bundle %s: %o', projectBundlePath, err)
  }
}

export const removeStaleBundles = async (projectsRoot: string, currentProjectBundlePath: string): Promise<void> => {
  const maxAgeMs = getMaxAgeMs()
  const normalizedCurrent = path.resolve(currentProjectBundlePath)

  let folders: string[]

  try {
    folders = await glob(path.join(projectsRoot, '*'), { absolute: true })
  } catch (err) {
    debug('skipping project bundle prune; failed to read projects root %s: %o', projectsRoot, err)

    return
  }

  const now = Date.now()

  const staleness = await Promise.all(folders.map(async (folder): Promise<string | null> => {
    // never remove the project we're about to run
    if (path.resolve(folder) === normalizedCurrent) {
      return null
    }

    try {
      const stat = await fs.statAsync(folder)

      if (!stat || !stat.isDirectory()) {
        return null
      }

      return (now - Number(stat.mtimeMs)) > maxAgeMs ? folder : null
    } catch (err) {
      debug('skipping project bundle %s; failed to stat: %o', folder, err)

      return null
    }
  }))

  const stale = staleness.filter((folder): folder is string => folder !== null)
  const maxRemovals = getMaxRemovals()
  const toRemove = stale.slice(0, maxRemovals)

  debug('removing %d of %d stale project bundles (max %d per run)', toRemove.length, stale.length, maxRemovals)

  // remove in bounded batches so a large backlog cannot spike disk I/O or block
  // the run for too long; any remaining stale bundles are removed on later runs
  for (let i = 0; i < toRemove.length; i += REMOVAL_CONCURRENCY) {
    await Promise.all(toRemove.slice(i, i + REMOVAL_CONCURRENCY).map(removeBundle))
  }

  // keep the current project fresh so it survives the next prune
  await touchProjectBundle(normalizedCurrent)
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
