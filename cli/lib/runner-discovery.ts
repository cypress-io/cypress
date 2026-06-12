import fs from 'fs-extra'
import http from 'http'
import path from 'path'
import Debug from 'debug'

import state from './tasks/state'

const debug = Debug('cypress:cli:runner-discovery')

const RUNNERS_DIRNAME = 'runners'

// Matches `<pid>.json` only — skips the `.tmp` files left by the server's
// atomic writes and anything else that lands in the directory.
const RECORD_FILENAME = /^\d+\.json$/

// Oldest record schema this reader can verify: v3 introduced serverPort and
// instanceId, which the liveness probe depends on.
const MIN_SCHEMA_VERSION = 3

// The probe targets the local machine by construction — records describe
// runners that share this cache directory.
const PROBE_HOST = '127.0.0.1'
const DEFAULT_PROBE_TIMEOUT_MS = 2000

/**
 * Mirror of `@packages/server`'s `RunnerDiscoveryRecord`. The `cypress` CLI is
 * published separately and cannot import server code at runtime, so the shape
 * is duplicated here; it is the cross-process contract.
 */
export interface RunnerDiscoveryRecord {
  schemaVersion: number
  /** Informational/disambiguation only — pids are recycled by the OS, so
   * liveness is established by the instanceId probe, never by this pid. */
  pid: number
  cypressVersion: string
  projectRoot: string
  /** Port of the runner's HTTP server, where the discovery probe route lives. */
  serverPort: number
  /** Random per-process token echoed by the runner's probe route. */
  instanceId: string
  cdpStatus: 'no_browser' | 'ready'
  /** Browser-level CDP WebSocket URL; non-null only while `cdpStatus` is `ready`. */
  cdpBrowserWsUrl: string | null
}

/**
 * A record narrowed to a live CDP connection — cdpBrowserWsUrl is non-null.
 */
export interface ReadyRunnerDiscoveryRecord extends RunnerDiscoveryRecord {
  cdpStatus: 'ready'
  cdpBrowserWsUrl: string
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
  /** Per-record liveness probe timeout. */
  probeTimeoutMs?: number
}

export const getRunnerDiscoveryDir = (): string => {
  return path.join(state.getCacheDir(), RUNNERS_DIRNAME)
}

/**
 * Cheap pid probe via signal `0` — used only as a fast-fail before the real
 * liveness check (a dead pid proves the writer is gone; a live pid proves
 * nothing, since the OS recycles pids):
 *  - resolves        → some process has this pid
 *  - EPERM           → some process has it, owned by another user
 *  - ESRCH (or else) → no such process (record is certainly stale)
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
 * Ask the record's writer itself whether it is alive: GET the discovery probe
 * route on the recorded server port and require it to echo the record's
 * random instanceId. A recycled pid — or even a recycled port — cannot
 * produce a matching echo, so this never reports a crashed runner as live.
 * Any failure (refused, timeout, non-200, junk body, token mismatch) means
 * "not verified"; it never throws.
 */
export const verifyRunnerRecord = (record: RunnerDiscoveryRecord, timeoutMs: number = DEFAULT_PROBE_TIMEOUT_MS): Promise<boolean> => {
  return new Promise((resolve) => {
    const request = http.get({
      host: PROBE_HOST,
      port: record.serverPort,
      path: `/__cypress/runner-discovery/${record.instanceId}`,
      timeout: timeoutMs,
    }, (response) => {
      let body = ''

      response.setEncoding('utf8')
      response.on('data', (chunk) => body += chunk)
      response.on('error', () => resolve(false))
      response.on('end', () => {
        if (response.statusCode !== 200) {
          return resolve(false)
        }

        try {
          resolve(JSON.parse(body).instanceId === record.instanceId)
        } catch (err) {
          resolve(false)
        }
      })
    })

    // Destroying on timeout surfaces as an 'error', resolving false below.
    request.on('timeout', () => request.destroy())
    request.on('error', (err) => {
      debug('liveness probe failed for pid %d on port %d: %o', record.pid, record.serverPort, err)
      resolve(false)
    })
  })
}

// A record this reader can probe. Anything else — older schema, hand-edited
// file, future shape — is unusable, since liveness can't be established.
const isCompatibleRecord = (record: any): record is RunnerDiscoveryRecord => {
  return Boolean(record)
    && typeof record.schemaVersion === 'number'
    && record.schemaVersion >= MIN_SCHEMA_VERSION
    && typeof record.pid === 'number'
    && typeof record.projectRoot === 'string'
    && Number.isInteger(record.serverPort)
    && typeof record.instanceId === 'string'
    && record.instanceId.length > 0
}

/**
 * Read and parse every compatible discovery record in the runners directory.
 * Unparseable, partially-written, or incompatible-schema records are skipped,
 * not thrown on.
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

const matchesProject = (record: RunnerDiscoveryRecord, projectRoot: string): boolean => {
  return path.resolve(record.projectRoot) === path.resolve(projectRoot)
}

/**
 * Find the first verified-live Cypress runner for a project. A record only
 * counts as live when its writer echoes the record's instanceId from the
 * recorded server port — see {@link verifyRunnerRecord}.
 *
 * @throws {RunnerDiscoveryError} `NO_DISCOVERY_FILE` when no record matches the project
 * @throws {RunnerDiscoveryError} `STALE_DISCOVERY_FILE` when records match but none verify as alive
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

  for (const record of matches) {
    // Dead pid means the writer is certainly gone — skip the probe.
    if (!isPidAlive(record.pid)) {
      continue
    }

    if (await verifyRunnerRecord(record, options.probeTimeoutMs)) {
      return record
    }
  }

  throw new RunnerDiscoveryError(
    'STALE_DISCOVERY_FILE',
    `A Cypress discovery record exists for ${projectRoot}, but no running Cypress answered for it. Cypress likely exited uncleanly; restart it and try again.`,
  )
}

/**
 * Like {@link findLiveRunner}, but requires a browser with a live CDP
 * connection and narrows the return type so callers never defend against a
 * null cdpBrowserWsUrl.
 *
 * @throws {RunnerDiscoveryError} `NO_BROWSER_ATTACHED` when the runner is live but no browser is connected
 */
export const findReadyRunner = async (projectRoot: string, options: FindRunnerOptions = {}): Promise<ReadyRunnerDiscoveryRecord> => {
  const record = await findLiveRunner(projectRoot, options)

  if (record.cdpStatus !== 'ready' || !record.cdpBrowserWsUrl) {
    throw new RunnerDiscoveryError(
      'NO_BROWSER_ATTACHED',
      `Cypress is running for ${projectRoot}, but no browser is attached yet. Open a browser in Cypress, then try again.`,
    )
  }

  return record as ReadyRunnerDiscoveryRecord
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
