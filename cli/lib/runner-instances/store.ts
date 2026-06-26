import fs from 'fs-extra'
import path from 'path'
import Debug from 'debug'

import state from '../tasks/state'
import { isCompatibleRecord } from './record'
import type { RunnerInstance } from './record'
import { isPidAlive, verifyRunnerRecord } from './liveness'

const debug = Debug('cypress:cli:runner-instances')

// NOTE: This is the consumer side of a cross-process on-disk contract. The
// directory name and the `<pid>.json` record filename are mirrored in the
// producer at packages/server/lib/runner-instances.ts and MUST stay in sync —
// the server writes these records and the CLI reads them.
export const INSTANCES_DIRNAME = 'instances'

const RECORD_EXTENSION = '.json'

export const getRunnerInstancesDir = (): string => {
  return path.join(state.getCacheDir(), INSTANCES_DIRNAME)
}

const parseRecordPid = (entry: string): number | null => {
  if (path.extname(entry) !== RECORD_EXTENSION) {
    return null
  }

  const pid = Number(path.basename(entry, RECORD_EXTENSION))

  return Number.isInteger(pid) ? pid : null
}

interface RecordFile {
  path: string
  pid: number
}

const listRecordFiles = async (dir: string): Promise<RecordFile[]> => {
  let entries: string[]

  try {
    entries = await fs.readdir(dir)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
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

const readCompatibleRecord = async (filePath: string): Promise<RunnerInstance | null> => {
  let record: unknown

  try {
    record = await fs.readJson(filePath)
  } catch (err) {
    debug('could not read runner instances record %s: %o', filePath, err)

    return null
  }

  if (!isCompatibleRecord(record)) {
    debug('incompatible runner instances record %s', filePath)

    return null
  }

  return record
}

export const readRunnerRecords = async (): Promise<RunnerInstance[]> => {
  const files = await listRecordFiles(getRunnerInstancesDir())
  const records = await Promise.all(files.map((file) => readCompatibleRecord(file.path)))

  return records.filter((record): record is RunnerInstance => record !== null)
}

export const pruneDeadDiscoveryRecords = async (probeTimeoutMs?: number): Promise<number> => {
  const files = await listRecordFiles(getRunnerInstancesDir())

  const pruned = await Promise.all(files.map(async (file): Promise<boolean> => {
    if (!isPidAlive(file.pid)) {
      await fs.remove(file.path)

      return true
    }

    const record = await readCompatibleRecord(file.path)

    if (!record) {
      return false
    }

    if (!(await verifyRunnerRecord(record, probeTimeoutMs))) {
      await fs.remove(file.path)

      return true
    }

    return false
  }))

  const removed = pruned.filter(Boolean).length

  debug('pruned %d dead runner instances record(s)', removed)

  return removed
}
