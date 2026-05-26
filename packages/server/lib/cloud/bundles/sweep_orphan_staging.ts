import { readdir, stat, remove } from 'fs-extra'
import path from 'path'
import Debug from 'debug'

const debug = Debug('cypress:server:cloud:bundles:sweep-orphan-staging')

const STAGING_PREFIX = '.staging-'

export const sweepOrphanStaging = async (baseDir: string, olderThanMs: number): Promise<number> => {
  let entries: string[]

  try {
    entries = await readdir(baseDir)
  } catch (err) {
    debug('readdir failed for %s: %o', baseDir, err)

    return 0
  }

  const now = Date.now()

  const results = await Promise.all(entries.map(async (entry): Promise<boolean> => {
    if (!entry.startsWith(STAGING_PREFIX)) return false

    const fullPath = path.join(baseDir, entry)

    try {
      const stats = await stat(fullPath)
      const age = now - stats.mtimeMs

      if (age < olderThanMs) return false

      await remove(fullPath)
      debug('removed orphan staging dir %s (age %dms)', fullPath, age)

      return true
    } catch (err) {
      debug('failed to sweep %s: %o', fullPath, err)

      return false
    }
  }))

  return results.filter(Boolean).length
}
