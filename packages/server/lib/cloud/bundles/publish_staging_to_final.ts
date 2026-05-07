import { readdir, stat, ensureDir } from 'fs-extra'
import path from 'path'
import { renameAtomicWithRetry } from '../extract_atomic'

const MANIFEST_REL = 'manifest.json'

const walkFiles = async (root: string, currentRel: string = ''): Promise<string[]> => {
  const fullDir = path.join(root, currentRel)
  const entries = await readdir(fullDir)
  const results: string[] = []

  await Promise.all(entries.map(async (entry) => {
    const entryRel = path.join(currentRel, entry)
    const entryFull = path.join(root, entryRel)
    const entryStat = await stat(entryFull)

    if (entryStat.isDirectory()) {
      results.push(...await walkFiles(root, entryRel))
    } else if (entryStat.isFile()) {
      results.push(entryRel)
    }
  }))

  return results
}

const publishOne = async (staging: string, finalDir: string, rel: string): Promise<void> => {
  const src = path.join(staging, rel)
  const dst = path.join(finalDir, rel)

  await ensureDir(path.dirname(dst))
  await renameAtomicWithRetry(src, dst)
}

// Publishes every file from `staging` into `finalDir` via per-file atomic
// rename. `manifest.json` is always renamed last so that a concurrent reader
// that observes the manifest is guaranteed to see every other file in its
// new-version state.
//
// Per-file rename (vs directory rename) preserves the cross-process safety
// property from PR #33034: a reader in another process always sees a
// complete prior-version or new-version of any single file, never absent.
export const publishStagingToFinal = async (staging: string, finalDir: string): Promise<void> => {
  const allFiles = await walkFiles(staging)
  const others = allFiles.filter((rel) => rel !== MANIFEST_REL)
  const hasManifest = allFiles.includes(MANIFEST_REL)

  // Promise.all rejects on the first failure but leaves siblings running.
  // Drain them with allSettled before throwing so the caller's `finally` can
  // safely rm the staging dir without producing unhandled rejections from
  // in-flight renames whose `src` path disappears mid-flight.
  const otherPromises = others.map((rel) => publishOne(staging, finalDir, rel))

  try {
    await Promise.all(otherPromises)
  } catch (err) {
    await Promise.allSettled(otherPromises)
    throw err
  }

  if (hasManifest) {
    await publishOne(staging, finalDir, MANIFEST_REL)
  }
}
