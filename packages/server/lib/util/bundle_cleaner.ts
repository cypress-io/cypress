import path from 'path'
import Debug from 'debug'
import { fs } from './fs'
import { globAsync as glob } from './glob'

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

const getMaxAgeMs = (): number => {
  const override = Number(process.env.CYPRESS_INTERNAL_BUNDLE_CACHE_MAX_AGE_MS)

  return Number.isFinite(override) && override >= 0 ? override : DEFAULT_MAX_AGE_MS
}

// touch the active project's bundle directory so it is always considered "in
// use" and is never pruned on a subsequent run, regardless of whether the
// bundler overwrote files in place (which would not update the directory mtime)
export const touchProjectBundle = async (projectBundlePath: string): Promise<void> => {
  try {
    const now = new Date()

    await fs.utimesAsync(projectBundlePath, now, now)
  } catch (err) {
    // the directory may not exist yet on the very first run, which is fine: it
    // will be created with a current mtime while the run generates its bundles
    debug('could not touch project bundle %s: %o', projectBundlePath, err)
  }
}

export const removeStaleBundles = async (projectsRoot: string, currentProjectBundlePath: string): Promise<void> => {
  const maxAgeMs = getMaxAgeMs()
  const normalizedCurrent = path.resolve(currentProjectBundlePath)

  let folders: string[]

  try {
    folders = await glob(path.join(projectsRoot, '*'), { absolute: true })
  } catch (err) {
    debug('could not read projects bundle root %s: %o', projectsRoot, err)

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
      debug('could not stat project bundle %s: %o', folder, err)

      return null
    }
  }))

  const stale = staleness.filter((folder): folder is string => folder !== null)

  debug('removing %d stale project bundles of %d total', stale.length, folders.length)

  await Promise.all(stale.map((folder) => {
    debug('removing stale project bundle %s', folder)

    return fs.removeAsync(folder)
  }))

  // keep the current project fresh so it survives the next prune
  await touchProjectBundle(normalizedCurrent)
}
