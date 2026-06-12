import fs from 'fs-extra'
import path from 'path'
import Debug from 'debug'

import state from '../tasks/state'
import { isCompatibleRecord } from './record'
import type { RunnerDiscoveryRecord } from './record'
import { isPidAlive, verifyRunnerRecord } from './liveness'

const debug = Debug('cypress:cli:runner-discovery')

const RUNNERS_DIRNAME = 'runners'

// Matches `<pid>.json` only — skips the `.tmp` files left by the server's
// atomic writes and anything else that lands in the directory.
const RECORD_FILENAME = /^\d+\.json$/

export const getRunnerDiscoveryDir = (): string => {
  return path.join(state.getCacheDir(), RUNNERS_DIRNAME)
}

// List the record filenames in the runners directory. A missing directory
// just means no runner has ever written a record.
const listRecordEntries = async (dir: string): Promise<string[]> => {
  try {
    return (await fs.readdir(dir)).filter((entry) => RECORD_FILENAME.test(entry))
  } catch (err: any) {
    if (err?.code === 'ENOENT') {
      return []
    }

    throw err
  }
}

/**
 * Read and parse every compatible discovery record in the runners directory.
 * Unparseable, partially-written, or incompatible-schema records are skipped,
 * not thrown on.
 */
export const readRunnerRecords = async (): Promise<RunnerDiscoveryRecord[]> => {
  const dir = getRunnerDiscoveryDir()
  const records: RunnerDiscoveryRecord[] = []

  for (const entry of await listRecordEntries(dir)) {
    try {
      const record = await fs.readJson(path.join(dir, entry))

      if (!isCompatibleRecord(record)) {
        debug('skipping incompatible runner discovery record %s (schemaVersion %o)', entry, record?.schemaVersion)
        continue
      }

      records.push(record)
    } catch (err) {
      debug('skipping unreadable runner discovery record %s: %o', entry, err)
    }
  }

  return records
}

/**
 * Remove discovery records whose writer is no longer alive. Backs the GC step
 * in `cypress cache prune`. A record goes when its pid is dead, or when its
 * pid is taken but the liveness probe fails (a recycled pid). Records that
 * are unreadable or too old to probe are kept while their pid is taken —
 * pid liveness is the best remaining signal, and deleting is irreversible.
 * Returns the number of records removed.
 */
export const pruneDeadRecords = async (probeTimeoutMs?: number): Promise<number> => {
  const dir = getRunnerDiscoveryDir()

  let removed = 0

  for (const entry of await listRecordEntries(dir)) {
    const filePath = path.join(dir, entry)
    const pid = Number(path.basename(entry, '.json'))

    if (!isPidAlive(pid)) {
      await fs.remove(filePath)
      removed += 1
      continue
    }

    let record: any

    try {
      record = await fs.readJson(filePath)
    } catch (err) {
      debug('not pruning unreadable record %s with live pid: %o', entry, err)
      continue
    }

    if (!isCompatibleRecord(record)) {
      continue
    }

    if (!(await verifyRunnerRecord(record, probeTimeoutMs))) {
      await fs.remove(filePath)
      removed += 1
    }
  }

  return removed
}
