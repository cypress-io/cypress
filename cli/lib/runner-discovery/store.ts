import fs from 'fs-extra'
import path from 'path'
import Debug from 'debug'

import state from '../tasks/state'
import { isCompatibleRecord } from './record'
import type { RunnerDiscoveryRecord } from './record'
import { isPidAlive, verifyRunnerRecord } from './liveness'

const debug = Debug('cypress:cli:runner-discovery')

const RUNNERS_DIRNAME = 'runners'
const RECORD_EXTENSION = '.json'

export const getRunnerDiscoveryDir = (): string => {
  return path.join(state.getCacheDir(), RUNNERS_DIRNAME)
}

const isErrnoException = (err: unknown): err is NodeJS.ErrnoException => {
  return err instanceof Error
}

/**
 * A discovery record is written by the server as `<pid>.json`. Parse the pid
 * back out of a directory entry, returning null for anything that is not a
 * record file.
 */
const parseRecordPid = (entry: string): number | null => {
  if (path.extname(entry) !== RECORD_EXTENSION) {
    return null
  }

  const pid = Number(path.basename(entry, RECORD_EXTENSION))

  return Number.isInteger(pid) ? pid : null
}

interface RecordFile {
  /** Absolute path to the record on disk. */
  path: string
  /** The writer's pid, taken from the `<pid>.json` filename. */
  pid: number
}

/**
 * List the discovery record files in the runners directory, each paired with
 * the pid encoded in its filename. A missing directory just means no runner
 * has ever written a record.
 */
const listRecordFiles = async (dir: string): Promise<RecordFile[]> => {
  let entries: string[]

  try {
    entries = await fs.readdir(dir)
  } catch (err: unknown) {
    if (isErrnoException(err) && err.code === 'ENOENT') {
      return []
    }

    throw err
  }

  const files: RecordFile[] = []

  for (const entry of entries) {
    const pid = parseRecordPid(entry)

    if (pid !== null) {
      files.push({ path: path.join(dir, entry), pid })
    }
  }

  return files
}

/**
 * Read and validate one discovery record. Resolves null for a record that is
 * unreadable (missing, partially written, not JSON) or whose schema this
 * reader cannot probe — both are unusable, never fatal.
 */
const readCompatibleRecord = async (filePath: string): Promise<RunnerDiscoveryRecord | null> => {
  let record: unknown

  try {
    record = await fs.readJson(filePath)
  } catch (err) {
    debug('skipping unreadable runner discovery record %s: %o', filePath, err)

    return null
  }

  if (!isCompatibleRecord(record)) {
    debug('skipping incompatible runner discovery record %s', filePath)

    return null
  }

  return record
}

/**
 * Read and parse every compatible discovery record in the runners directory.
 * Unparseable, partially-written, or incompatible-schema records are skipped,
 * not thrown on.
 */
export const readRunnerRecords = async (): Promise<RunnerDiscoveryRecord[]> => {
  const records: RunnerDiscoveryRecord[] = []

  for (const file of await listRecordFiles(getRunnerDiscoveryDir())) {
    const record = await readCompatibleRecord(file.path)

    if (record) {
      records.push(record)
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
export const pruneDeadDiscoveryRecords = async (probeTimeoutMs?: number): Promise<number> => {
  let removed = 0

  for (const file of await listRecordFiles(getRunnerDiscoveryDir())) {
    // A dead pid proves the writer is gone — remove without reading or probing.
    if (!isPidAlive(file.pid)) {
      await fs.remove(file.path)
      removed += 1
      continue
    }

    // Unreadable or incompatible records are kept while the pid is taken:
    // pid liveness is the best remaining signal and deletion is irreversible.
    const record = await readCompatibleRecord(file.path)

    if (!record) {
      continue
    }

    if (!(await verifyRunnerRecord(record, probeTimeoutMs))) {
      await fs.remove(file.path)
      removed += 1
    }
  }

  debug('pruned %d dead runner discovery record(s)', removed)

  return removed
}
