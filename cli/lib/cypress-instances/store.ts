import fs from 'fs-extra'
import path from 'path'
import Debug from 'debug'

import state from '../tasks/state'
import { isCompatibleRecord, parseRecordPid, cypressInstancesDir } from './record'
import type { CypressInstance } from './record'
import { isPidAlive, verifyInstanceRecord } from './liveness'

const debug = Debug('cypress:cli:cypress-instances')

export const getInstancesDir = (): string => {
  return cypressInstancesDir(state.getCacheDir())
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

const readCompatibleRecord = async (filePath: string): Promise<CypressInstance | null> => {
  let record: unknown

  try {
    record = await fs.readJson(filePath)
  } catch (err) {
    debug('could not read cypress instances record %s: %o', filePath, err)

    return null
  }

  if (!isCompatibleRecord(record)) {
    debug('incompatible cypress instances record %s', filePath)

    return null
  }

  return record
}

// Reaps a record whose writer process is gone, returning whether it was dead.
// Removal is best-effort: a file we can't delete (permissions, a Windows lock)
// must not abort discovery of the other, live instances, so the failure is
// swallowed and the record is still reported dead.
const reapIfDead = async (file: { path: string, pid: number }): Promise<boolean> => {
  const { path, pid } = file

  if (isPidAlive(pid)) {
    return false
  }

  await fs.remove(path).catch((err) => {
    debug('failed to reap dead cypress instances record %s: %o', path, err)
  })

  return true
}

/**
 * Reads all the current cypress instance records, including dead ones whose writer
 * process has exited. Use `readLiveInstances` when only live records are wanted.
 */
export const readInstanceRecords = async (): Promise<CypressInstance[]> => {
  const files = await listRecordFiles(getInstancesDir())
  const records = await Promise.all(files.map((file) => readCompatibleRecord(file.path)))

  return records.filter((record): record is CypressInstance => record !== null)
}

/**
 * Reads all the current cypress instance records that are still live (i.e. the writer process is still running).
 * Reaps any dead records.
 */
export const readLiveInstances = async (): Promise<CypressInstance[]> => {
  const files = await listRecordFiles(getInstancesDir())

  const records = await Promise.all(files.map(async (file): Promise<CypressInstance | null> => {
    const record = await readCompatibleRecord(file.path)

    if (!record) {
      return null
    }

    if (await reapIfDead(file)) {
      return null
    }

    return record
  }))

  return records.filter((record): record is CypressInstance => record !== null)
}

export const pruneDeadInstanceRecords = async (probeTimeoutMs?: number): Promise<number> => {
  const files = await listRecordFiles(getInstancesDir())

  const pruned = await Promise.all(files.map(async (file): Promise<boolean> => {
    if (await reapIfDead(file)) {
      return true
    }

    const record = await readCompatibleRecord(file.path)

    if (!record) {
      return false
    }

    if (!(await verifyInstanceRecord(record, probeTimeoutMs))) {
      await fs.remove(file.path)

      return true
    }

    return false
  }))

  const removed = pruned.filter(Boolean).length

  debug('pruned %d dead cypress instances record(s)', removed)

  return removed
}
