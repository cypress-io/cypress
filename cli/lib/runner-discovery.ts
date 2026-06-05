import fs from 'fs-extra'
import path from 'path'
import Debug from 'debug'

import state from './tasks/state'

const debug = Debug('cypress:cli:runner-discovery')

const RUNNERS_DIRNAME = 'runners'

// Matches `<pid>.json` only — skips the `.tmp` files left by the server's
// atomic writes and anything else that lands in the directory.
const RECORD_FILENAME = /^\d+\.json$/

/**
 * Mirror of `@packages/server`'s `RunnerDiscoveryRecord`. The `cypress` CLI is
 * published separately and cannot import server code at runtime, so the shape
 * is duplicated here; it is the cross-process contract.
 */
export interface RunnerDiscoveryRecord {
  schemaVersion: number
  pid: number
  cypressVersion: string
  projectRoot: string
  runnerOrigin: string
  cdpStatus: 'no_browser' | 'ready'
  cdpHost: string | null
  cdpPort: number | null
  createdAt: number
}

/** A record narrowed to a live CDP connection — cdpHost/cdpPort are non-null. */
export interface ReadyRunnerDiscoveryRecord extends RunnerDiscoveryRecord {
  cdpStatus: 'ready'
  cdpHost: string
  cdpPort: number
}

export type RunnerDiscoveryErrorCode =
  | 'NO_DISCOVERY_FILE'
  | 'STALE_DISCOVERY_FILE'
  | 'NO_BROWSER_ATTACHED'

export class RunnerDiscoveryError extends Error {
  code: RunnerDiscoveryErrorCode

  constructor (code: RunnerDiscoveryErrorCode, message: string) {
    super(message)
    this.name = 'RunnerDiscoveryError'
    this.code = code
  }
}

export interface FindRunnerOptions {
  /**
   * Target a specific instance by server PID. Disambiguates when multiple
   * Cypress instances are running against the same project root.
   */
  instance?: number
}

export const getRunnerDiscoveryDir = (): string => {
  return path.join(state.getCacheDir(), RUNNERS_DIRNAME)
}

/**
 * Liveness via signal `0` — a permission/existence probe that sends no signal:
 *  - resolves        → process is alive
 *  - EPERM           → alive but owned by another user (treat as live)
 *  - ESRCH (or else) → no such process (stale record)
 */
export const isPidAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0)

    return true
  } catch (err: any) {
    return err?.code === 'EPERM'
  }
}

/**
 * Read and parse every discovery record in the runners directory. Unparseable
 * or partially-written records are skipped, not thrown on.
 */
export const readRunnerRecords = async (): Promise<RunnerDiscoveryRecord[]> => {
  const dir = getRunnerDiscoveryDir()

  let entries: string[]

  try {
    entries = await fs.readdir(dir)
  } catch (err: any) {
    if (err?.code === 'ENOENT') {
      return []
    }

    throw err
  }

  const records: RunnerDiscoveryRecord[] = []

  for (const entry of entries) {
    if (!RECORD_FILENAME.test(entry)) {
      continue
    }

    try {
      records.push(await fs.readJson(path.join(dir, entry)))
    } catch (err) {
      debug('skipping unreadable runner discovery record %s: %o', entry, err)
    }
  }

  return records
}

const matchesProject = (record: RunnerDiscoveryRecord, projectRoot: string): boolean => {
  return path.resolve(record.projectRoot) === path.resolve(projectRoot)
}

/**
 * Find the first live Cypress runner for a project.
 *
 * @throws {RunnerDiscoveryError} `NO_DISCOVERY_FILE` when no record matches the project
 * @throws {RunnerDiscoveryError} `STALE_DISCOVERY_FILE` when a record matches but its process is gone
 */
export const findLiveRunner = async (projectRoot: string, options: FindRunnerOptions = {}): Promise<RunnerDiscoveryRecord> => {
  const records = await readRunnerRecords()

  let matches = records.filter((record) => matchesProject(record, projectRoot))

  if (options.instance !== undefined) {
    matches = matches.filter((record) => record.pid === options.instance)
  }

  if (matches.length === 0) {
    throw new RunnerDiscoveryError(
      'NO_DISCOVERY_FILE',
      `No running Cypress was found for ${projectRoot}. Start Cypress, then try again.`,
    )
  }

  const live = matches.find((record) => isPidAlive(record.pid))

  if (!live) {
    throw new RunnerDiscoveryError(
      'STALE_DISCOVERY_FILE',
      `A Cypress discovery record exists for ${projectRoot}, but its process is no longer running. Cypress likely exited uncleanly; restart it and try again.`,
    )
  }

  return live
}

/**
 * Like {@link findLiveRunner}, but requires a browser with a live CDP
 * connection and narrows the return type so callers never defend against null
 * cdpHost/cdpPort.
 *
 * @throws {RunnerDiscoveryError} `NO_BROWSER_ATTACHED` when the runner is live but no browser is connected
 */
export const findReadyRunner = async (projectRoot: string, options: FindRunnerOptions = {}): Promise<ReadyRunnerDiscoveryRecord> => {
  const record = await findLiveRunner(projectRoot, options)

  if (record.cdpStatus !== 'ready' || record.cdpHost === null || record.cdpPort === null) {
    throw new RunnerDiscoveryError(
      'NO_BROWSER_ATTACHED',
      `Cypress is running for ${projectRoot}, but no browser is attached yet. Open a browser in Cypress, then try again.`,
    )
  }

  return record as ReadyRunnerDiscoveryRecord
}

/**
 * Remove discovery records whose process is no longer alive. Backs the GC step
 * in `cypress cache prune`. Returns the number of records removed.
 */
export const pruneDeadRecords = async (): Promise<number> => {
  const dir = getRunnerDiscoveryDir()

  let entries: string[]

  try {
    entries = await fs.readdir(dir)
  } catch (err: any) {
    if (err?.code === 'ENOENT') {
      return 0
    }

    throw err
  }

  let removed = 0

  for (const entry of entries) {
    if (!RECORD_FILENAME.test(entry)) {
      continue
    }

    const pid = Number(path.basename(entry, '.json'))

    if (!isPidAlive(pid)) {
      await fs.remove(path.join(dir, entry))
      removed += 1
    }
  }

  return removed
}
